"""
Product Image Harvest  --  one-shot build script, never imported at runtime
═══════════════════════════════════════════════════════════════════════════

    cd backend && python -m app.services.image_harvest --build

Produces a bank of locally-served, CLIP-verified product photos that the
catalog factory (Part 3) consumes.  The catalog is generated *from* this
manifest, so a product never has to hunt for a photo -- it is written to
describe a photo we already hold and have already verified.

Five stages
───────────
 1. SEARCH   Wikimedia Commons (keyless API) for every `image_queries`
             phrasing in taxonomy.py, plus DummyJSON's sample catalog for
             clean studio packshots.  Raw results are cached to disk so a
             re-run never re-hits the network.
 2. RULE     Cheap metadata filters: mime, minimum dimensions, aspect ratio,
     FILTER  the title must actually contain one of the subcategory's nouns,
             and a blocklist for the categories of noise Commons search
             leaks (diagrams, brand badges, shop interiors, landfill photos).
 3. CLIP     `clip-ViT-B-32` scores the downloaded pixels against the
     VERIFY  subcategory's positive prompt and a set of negative prompts.
             An image is kept only if the positive prompt wins the softmax
             *and* clears an absolute cosine floor.  This is the concrete
             mechanism behind "photos that actually describe the product":
             a number per image, recorded in the manifest, auditable later.
 4. WRITE    Pillow normalises to 500x625 WebP q80, letterboxed on white,
             written atomically (temp file + rename) so an interrupted run
             cannot leave a truncated image behind.
 5. MANIFEST `app/services/data/image_manifest.json` records every kept
             image with its colour family, CLIP score, licence attribution
             and multi-angle group id.

Idempotency
───────────
The manifest is the source of truth.  On a re-run every subcategory that
already holds `--target` images whose files still exist on disk is skipped
entirely -- no API calls, no downloads, no CLIP.  Delete an image file and
only that subcategory tops itself back up.

Attribution
───────────
Commons content is CC-BY-SA / CC-BY / PD.  Attribution is a licence
obligation, so `attribution` is carried through to the Product row and must
be rendered in the UI.  Do not strip it to tidy the layout.
"""

from __future__ import annotations

# ── Environment hygiene ──────────────────────────────────────────────────────
# app/__init__.py already pins the backend flags, but this module is also
# runnable in isolation, and they must land before `transformers` is imported
# anywhere in the process.
import os
from pathlib import Path

os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

# CLIP is a 605 MB build-time-only dependency; the runtime only ever needs
# MiniLM.  Park it in a project-local cache rather than ~/.cache/huggingface so
# it lands on the drive with the repo (this machine's C: has ~1 GB free) and so
# deleting it is one obvious directory.  An explicit HF_HOME still wins.
_REPO_ROOT = Path(__file__).resolve().parents[3]
os.environ.setdefault("HF_HOME", str(_REPO_ROOT / ".model_cache"))
# Windows refuses symlink creation without Developer Mode or elevation, and
# hf_hub's symlinked cache layout then throws WinError 1314 mid-download.
# Copy-mode costs nothing here (one model, fetched once) and always works.
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")

import argparse
import io
import json
import re
import sys
import time
from collections import Counter, OrderedDict, defaultdict
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import httpx
from PIL import Image, ImageOps

from .taxonomy import BY_KEY, DEPARTMENTS, SUBCATEGORIES

Image.MAX_IMAGE_PIXELS = 200_000_000  # Commons hosts some enormous originals


# ═══════════════════════════════════════════════════════════════════════════
# Paths
# ═══════════════════════════════════════════════════════════════════════════

_SERVICES_DIR = Path(__file__).resolve().parent          # backend/app/services
_BACKEND_DIR = _SERVICES_DIR.parent.parent               # backend
DATA_DIR = _SERVICES_DIR / "data"
STATIC_PRODUCTS_DIR = _BACKEND_DIR / "static" / "products"

MANIFEST_PATH = DATA_DIR / "image_manifest.json"
CANDIDATES_PATH = DATA_DIR / "image_candidates.json"
REJECTS_PATH = DATA_DIR / "image_rejects.json"

# The URL prefix FastAPI serves STATIC_PRODUCTS_DIR under (see main.py).
STATIC_URL_PREFIX = "/static/products"


# ═══════════════════════════════════════════════════════════════════════════
# Tunables
# ═══════════════════════════════════════════════════════════════════════════

TARGET_PER_SUBCAT = 60      # verified images we aim to hold per subcategory
MIN_PER_SUBCAT = 12         # image_audit treats anything below this as a build error
MAX_ATTEMPTS_FACTOR = 4     # give up after target * this many download attempts

SEARCH_PAGES_PER_QUERY = 3  # Commons returns 50 per page
SEARCH_PAGE_SIZE = 50
SEARCH_SLEEP = 0.10         # polite pause between API calls

DOWNLOAD_WORKERS = 8
DOWNLOAD_TIMEOUT = 30.0
CLIP_BATCH = 32

OUT_W, OUT_H = 500, 625
WEBP_QUALITY = 80
MIN_OUT_BYTES = 3 * 1024    # anything smaller is a broken/blank image

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
COMMONS_FILE_PAGE = "https://commons.wikimedia.org/wiki/File:"
DUMMYJSON_API = "https://dummyjson.com/products"

# Wikimedia's API policy asks for a descriptive User-Agent identifying the tool.
USER_AGENT = (
    "RazorCartAI-ImageHarvest/1.0 "
    "(hackathon demo catalog builder; +https://github.com/Sujit224/RazorCartAI)"
)

# ── Rule filter ──────────────────────────────────────────────────────────────

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MIN_SOURCE_DIM = 600
MIN_ASPECT, MAX_ASPECT = 0.60, 1.70
MAX_SOURCE_BYTES = 40 * 1024 * 1024

# Phrase blocklist against the normalised file title.  Deliberately moderate:
# CLIP is the real gate, so this only needs to cut the obvious waste before we
# spend a download on it.  Any phrase a subcategory itself asked for is
# automatically exempted (see `_blocklist_for`), so `dog_food` can still match
# "dog" and `fiction` can still match "book cover".
BLOCK_PHRASES: Tuple[str, ...] = (
    # not photographs of objects
    "diagram", "schematic", "blueprint", "technical drawing", "line drawing",
    "sketch", "illustration", "cartoon", "comic strip", "clipart", "clip art",
    "icon", "pictogram", "logo", "wordmark", "nameplate", "emblem", "crest",
    "coat of arms", "trademark", "chart", "graph", "infographic", "map of",
    "engraving", "woodcut", "lithograph", "etching", "painting", "watercolour",
    "watercolor", "mosaic", "tapestry", "statue", "sculpture", "monument",
    "memorial", "mural", "graffiti", "render", "3d model", "wireframe",
    # documents and text
    "screenshot", "manuscript", "certificate", "patent", "invoice", "receipt",
    "leaflet", "brochure", "catalogue page", "catalog page", "advertisement",
    "advert", "poster", "billboard", "newspaper", "magazine cover", "postage",
    "banknote", "coin", "ticket", "signage", "street sign", "road sign",
    "price list", "barcode", "qr code", "title page", "table of contents",
    # people-dominant scenes
    "portrait", "selfie", "crowd", "protest", "parade", "wedding", "festival",
    "team photo", "group photo", "press conference", "interview", "ceremony",
    "workers", "soldiers", "volunteers", "audience", "spectators",
    # places rather than products
    "facade", "storefront", "shop front", "supermarket", "hypermarket",
    "warehouse", "factory", "assembly line", "production line", "museum",
    "exhibition", "trade fair", "aisle", "shelves", "market stall",
    "restaurant", "cafe", "hotel", "airport", "railway", "harbour", "harbor",
    "landscape", "skyline", "panorama", "aerial view", "satellite",
    # condition and disposal
    "broken", "damaged", "cracked", "rusty", "rusted", "corroded", "burnt",
    "burned", "melted", "dented", "scrap", "scrapyard", "junkyard",
    "landfill", "dumpster", "garbage", "trash", "waste", "recycling",
    "abandoned", "derelict", "ruins", "decayed", "rotten", "mouldy", "moldy",
    "litter", "discarded",
    # internals and dissection
    "cutaway", "cross section", "cross-section", "exploded view", "teardown",
    "disassembled", "dismantled", "x-ray", "x ray", "micrograph",
    "circuit board", "motherboard", "wiring", "schematics",
    # misc noise
    "collage", "montage", "comparison of", "size comparison", "test setup",
    "experiment", "cosplay", "reenactment", "stamp of", "seal of",
)

# ── CLIP ─────────────────────────────────────────────────────────────────────

CLIP_MODEL_NAME = "clip-ViT-B-32"
CLIP_LOGIT_SCALE = 100.0
CLIP_MIN_POS_PROB = 0.55    # positives must win the softmax against the negatives
CLIP_MIN_POS_COS = 0.20     # absolute floor: beating the negatives is not enough

# ── Why the negatives are templated on the subcategory noun ──────────────────
# The obvious design -- one positive naming the object and generic negatives
# naming a *style* ("a diagram", "a scanned document") -- does not work.  In
# CLIP's text embedding, object content dominates style, so a CAD line drawing
# of a fridge still scores higher against "a product photo of a refrigerator"
# than against "a diagram", and a printed notice reading "DO NOT LEAVE FOOD IN
# THE REFRIGERATOR" beats it too.  Both were measured passing a generic-negative
# gate at 0.26-0.31, inside the range of the genuinely good images.
#
# Naming the object on BOTH sides cancels the content term out and leaves style
# as the only thing being compared, which is the actual question: not "is there
# a fridge in this picture" but "is this a photograph of a fridge for sale".
NEG_TEMPLATES: Tuple[str, ...] = (
    "a diagram or line drawing of a {noun}",
    "a brand logo or nameplate for a {noun}",
    "a scanned document or a printed notice about a {noun}",
    "an old broken {noun} discarded on the street",
    "a dirty, rusty or damaged second-hand {noun}",
    "the inside of a {noun} crammed with food and bottles",
    "an old black and white historical photograph of a {noun}",
    "an extreme close-up of one small part of a {noun}",
    "a close-up of a hand touching a {noun}",
    "many {noun} items stacked together on a shop shelf",
    "a cluttered junk room that happens to contain a {noun}",
    "a photograph in which the {noun} is barely visible in the background",
    "a person standing next to a {noun}",
)

# "The product is in frame but the picture is not *of* the product" -- the same
# failure as the templates above, except the giveaway is the setting rather than
# the framing.  Exempted for the subcategories where these settings are the
# correct one (a bicycle belongs outdoors, a socket set belongs in a garage).
NEG_SETTING_TEMPLATES: Tuple[str, ...] = (
    "a {noun} photographed outdoors in a garden or a yard",
    "a {noun} in a garage, a basement or a storage room",
)
SETTING_OK_SUBCATS = {"cycling", "bike_accessories", "football", "cricket",
                      "racquet_sports", "car_accessories", "car_care",
                      "power_tools", "hand_tools", "safety_security",
                      "gym_equipment"}

# Object-free negatives, for candidates that do not depict the product at all.
NEG_ABSOLUTE: Tuple[str, ...] = (
    "a photograph of a completely unrelated subject",
    "a page of text",
    "an outdoor landscape with trees and sky",
)

# Positives.  The second names the catalog aesthetic explicitly; an image only
# has to satisfy one of them, so a good in-situ photo is not penalised for not
# being a studio packshot.
POS_EXTRA_TEMPLATE = "a clean product catalogue photograph of a {noun} on a plain background"

# A model wearing the garment is the *best* photo for apparel, so "a person
# standing next to a {noun}" has to go for those -- the "barely visible"
# template already covers the case where the product is incidental.
PERSON_OK_DEPARTMENTS = {"Fashion", "Sports & Fitness"}
PERSON_OK_SUBCATS = {"baby_gear", "baby_care", "diapers_wipes", "cycling",
                     "bike_accessories", "mens_grooming", "makeup", "jewellery",
                     "watches", "sunglasses", "bags"}

_NEG_PERSON = "a person standing next to a {noun}"
_NEG_HAND = "a close-up of a hand touching a {noun}"
_NEG_FACE = "a close-up portrait of a human face"


def _prompts_for(sub: dict) -> Tuple[List[str], int]:
    """
    (prompts, n_positives) for one subcategory -- positives first.

    Note there is no interior/in-situ special case any more: because every
    negative names the object, "a cluttered junk room containing a sofa" and
    "a staged living room with a sofa" are separated by the word *cluttered*
    rather than by the word *room*, so furniture and fridges need no exemption.
    """
    noun = sub["noun"].lower()
    positives = [sub["clip_prompt"], POS_EXTRA_TEMPLATE.format(noun=noun)]

    templates = list(NEG_TEMPLATES)
    person_ok = (sub["department"] in PERSON_OK_DEPARTMENTS
                 or sub["key"] in PERSON_OK_SUBCATS)
    if person_ok:
        templates.remove(_NEG_PERSON)
        # A hand modelling a watch or holding a lipstick is the standard shot.
        templates.remove(_NEG_HAND)
    if sub["key"] not in SETTING_OK_SUBCATS:
        templates += list(NEG_SETTING_TEMPLATES)

    negatives = [t.format(noun=noun) for t in templates] + list(NEG_ABSOLUTE)
    if person_ok:
        negatives.append(_NEG_FACE)

    return positives + negatives, len(positives)


# ═══════════════════════════════════════════════════════════════════════════
# Colour families
# ═══════════════════════════════════════════════════════════════════════════
# The catalog factory matches a product's colour name ("Midnight Black") to a
# photo whose dominant subject colour is in the same family, so a dark product
# never lands on a photo of a white one.

COLOUR_FAMILY_RGB: Dict[str, Tuple[int, int, int]] = {
    "black":  (26, 26, 28),
    "grey":   (128, 128, 132),
    "silver": (196, 198, 202),
    "white":  (244, 244, 244),
    "beige":  (222, 205, 170),
    "brown":  (120, 78, 45),
    "red":    (200, 40, 40),
    "maroon": (110, 26, 36),
    "orange": (232, 122, 32),
    "yellow": (234, 205, 46),
    "gold":   (198, 160, 60),
    "olive":  (110, 118, 55),
    "green":  (54, 150, 76),
    "teal":   (40, 140, 146),
    "blue":   (46, 90, 200),
    "navy":   (28, 42, 96),
    "purple": (120, 60, 166),
    "pink":   (232, 145, 170),
}

_FAMILY_ITEMS = list(COLOUR_FAMILY_RGB.items())
_family_memo: Dict[int, str] = {}


def _nearest_family(rgb: Tuple[int, int, int]) -> str:
    """Nearest palette entry, memoised on the 5-bit-quantised colour."""
    key = ((rgb[0] >> 3) << 10) | ((rgb[1] >> 3) << 5) | (rgb[2] >> 3)
    hit = _family_memo.get(key)
    if hit is not None:
        return hit
    r, g, b = rgb
    best, best_d = "grey", 1 << 30
    for name, (pr, pg, pb) in _FAMILY_ITEMS:
        # Weighted RGB distance -- cheap stand-in for perceptual distance.
        d = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2
        if d < best_d:
            best, best_d = name, d
    _family_memo[key] = best
    return best


def colour_family(img: Image.Image) -> str:
    """
    Dominant colour family of the image *subject*.

    Product photos centre the subject, so we look at the middle 60% and drop
    near-white pixels as probable studio background -- unless dropping them
    leaves almost nothing, in which case the product really is white.

    Must be given an already-flattened RGB image (see `normalise`).  Calling
    this on a raw RGBA packshot reads the transparent background as pure black
    and votes "black" for every product.
    """
    w, h = img.size
    crop = img.crop((int(w * 0.20), int(h * 0.20), int(w * 0.80), int(h * 0.80)))
    crop = crop.convert("RGB").resize((48, 48), Image.BILINEAR)
    raw = crop.tobytes()            # tobytes() over getdata(): no per-pixel objects
    pixels = [(raw[i], raw[i + 1], raw[i + 2]) for i in range(0, len(raw), 3)]
    subject = [p for p in pixels if not (p[0] > 232 and p[1] > 232 and p[2] > 232)]
    if len(subject) < len(pixels) * 0.12:
        subject = pixels
    return Counter(_nearest_family(p) for p in subject).most_common(1)[0][0]


# ═══════════════════════════════════════════════════════════════════════════
# Small helpers
# ═══════════════════════════════════════════════════════════════════════════

_WS = re.compile(r"\s+")
_TAG = re.compile(r"<[^>]+>")
_NON_ALNUM = re.compile(r"[^a-z0-9]+")


def _log(msg: str) -> None:
    # ASCII only -- the Windows console defaults to cp1252.
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def _slug(text: str) -> str:
    return _NON_ALNUM.sub("", text.lower())


def _normalise_title(title: str) -> str:
    """Lowercase, punctuation-to-space form used by every title-based rule."""
    t = title.lower()
    if t.startswith("file:"):
        t = t[5:]
    t = re.sub(r"\.(jpg|jpeg|png|webp|gif|tif|tiff|svg)$", "", t)
    return _WS.sub(" ", _NON_ALNUM.sub(" ", t)).strip()


def _strip_html(value: str) -> str:
    return _WS.sub(" ", _TAG.sub(" ", value or "")).strip()


def group_key(title: str) -> str:
    """
    Collapse near-identical Commons titles onto one group.

    'Panasonic NN-GM333W.jpg' and 'Panasonic NN-GM333W (2).jpg' are two angles
    of the same oven -- worth a real gallery.  Two unrelated ovens are not, and
    faking a gallery from them is exactly what we are avoiding.
    """
    t = title.lower()
    if t.startswith("file:"):
        t = t[5:]
    t = re.sub(r"\.(jpg|jpeg|png|webp|gif|tif|tiff)$", "", t)
    t = re.sub(r"[\(\[]\s*\d{1,3}\s*[\)\]]\s*$", "", t)   # trailing "(2)" / "[3]"
    t = re.sub(r"[-_\s]+\d{1,3}$", "", t)                  # trailing "-02" / "_3"
    return _NON_ALNUM.sub("_", t).strip("_") or _slug(title)


def _noun_regex(nouns: Sequence[str]) -> re.Pattern:
    """Word-boundary matcher over a subcategory's nouns, tolerating plurals."""
    alts = sorted(
        {re.escape(n.strip().lower()) for n in nouns if n.strip()},
        key=len,
        reverse=True,
    )
    return re.compile(r"\b(?:" + "|".join(alts) + r")(?:es|s)?\b")


def _blocklist_for(sub: dict) -> Tuple[str, ...]:
    """
    Blocklist minus anything the subcategory itself asked for.

    Without this, `dog_food` would veto every "dog ..." title and `fiction`
    would veto "book cover".  Never let the blocklist override an explicit
    query.
    """
    asked = " ".join(
        [sub["noun"].lower(), sub["category"].lower()]
        + [q.lower() for q in sub["image_queries"]]
        + [n.lower() for n in sub["image_nouns"]]
    )
    return tuple(p for p in BLOCK_PHRASES if p not in asked)


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        _log("  [warn] could not read %s (%s) -- starting fresh" % (path.name, exc))
        return default


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False, sort_keys=False)
    tmp.replace(path)


# ═══════════════════════════════════════════════════════════════════════════
# Stage 1 -- search
# ═══════════════════════════════════════════════════════════════════════════

def _new_client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept-Encoding": "gzip"},
        timeout=DOWNLOAD_TIMEOUT,
        follow_redirects=True,
        transport=httpx.HTTPTransport(retries=2),
    )


def _commons_search(client: httpx.Client, query: str, pages: int) -> List[dict]:
    """
    One Commons search, paginated.  Returns raw candidate dicts.

    `generator=search` with `gsrnamespace=6` searches file pages only, and
    `prop=imageinfo&iiurlwidth=500` hands back a pre-rendered 500px thumbnail
    URL -- so a single download serves both CLIP verification and the final
    catalog image.
    """
    out: List[dict] = []
    offset = 0

    for _ in range(max(1, pages)):
        params = {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",
            "gsrlimit": str(SEARCH_PAGE_SIZE),
            "gsroffset": str(offset),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiurlwidth": str(OUT_W),
            "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|Credit|ImageDescription",
        }
        try:
            resp = client.get(COMMONS_API, params=params)
            resp.raise_for_status()
            payload = resp.json()
        except (httpx.HTTPError, json.JSONDecodeError) as exc:
            _log("    [warn] commons search failed for %r (%s)" % (query, exc))
            break

        pagelist = (payload.get("query") or {}).get("pages") or []
        for page in pagelist:
            info = (page.get("imageinfo") or [None])[0]
            if not info:
                continue
            meta = info.get("extmetadata") or {}
            out.append({
                "source": "commons",
                "title": page.get("title", ""),
                "thumb_url": info.get("thumburl") or info.get("url", ""),
                "descriptionurl": info.get("descriptionurl", ""),
                "mime": (info.get("mime") or "").lower(),
                "width": int(info.get("width") or 0),
                "height": int(info.get("height") or 0),
                "size": int(info.get("size") or 0),
                "artist": _strip_html((meta.get("Artist") or {}).get("value", "")),
                "license": _strip_html((meta.get("LicenseShortName") or {}).get("value", "")),
                "license_url": _strip_html((meta.get("LicenseUrl") or {}).get("value", "")),
                "credit": _strip_html((meta.get("Credit") or {}).get("value", "")),
            })

        cont = payload.get("continue") or {}
        if "gsroffset" not in cont:
            break
        offset = int(cont["gsroffset"])
        time.sleep(SEARCH_SLEEP)

    return out


# DummyJSON category -> our subcategory key.  Its packshots are clean studio
# shots on white, which is exactly the aesthetic we normalise everything else
# towards, so they are worth ingesting even though there are only ~474.
DUMMYJSON_CATEGORY_MAP: Dict[str, str] = {
    "beauty": "makeup",
    "fragrances": "fragrances",
    "furniture": "furniture",
    "home-decoration": "home_decor",
    "kitchen-accessories": "cookware",
    "laptops": "laptops",
    "mens-shirts": "topwear",
    "mens-shoes": "footwear",
    "mens-watches": "watches",
    "mobile-accessories": "power_charging",
    "skin-care": "skincare",
    "smartphones": "smartphones",
    "sunglasses": "sunglasses",
    "tablets": "tablets",
    "tops": "topwear",
    "womens-bags": "bags",
    "womens-dresses": "dresses",
    "womens-jewellery": "jewellery",
    "womens-shoes": "footwear",
    "womens-watches": "watches",
    # 'groceries', 'sports-accessories', 'motorcycle' and 'vehicle' are too
    # heterogeneous to map wholesale -- routed by title below instead.
}

# Title keyword -> subcategory key, for the heterogeneous DummyJSON categories.
DUMMYJSON_TITLE_MAP: Tuple[Tuple[str, str], ...] = (
    ("cricket", "cricket"),
    ("football", "football"),
    ("basketball", "football"),
    ("volleyball", "football"),
    ("baseball", "football"),
    ("golf", "football"),
    ("tennis racket", "racquet_sports"),
    ("tennis ball", "racquet_sports"),
    ("dumbbell", "gym_equipment"),
    ("kettlebell", "gym_equipment"),
    ("skipping rope", "gym_equipment"),
    ("dog food", "dog_food"),
    ("cat food", "cat_food"),
    ("protein powder", "sports_nutrition"),
    ("cooking oil", "oils_ghee"),
    ("olive oil", "oils_ghee"),
    ("rice", "staples"),
    ("flour", "staples"),
    ("honey", "breakfast"),
    ("juice", "beverages"),
    ("soft drink", "beverages"),
    ("water", "beverages"),
    ("chocolate", "chocolates"),
    ("helmet", "bike_accessories"),
    ("motorcycle glove", "bike_accessories"),
)


def _dummyjson_candidates(client: httpx.Client) -> Dict[str, List[dict]]:
    """Fetch the DummyJSON sample catalog, bucketed by our subcategory key."""
    buckets: Dict[str, List[dict]] = defaultdict(list)
    try:
        resp = client.get(
            DUMMYJSON_API,
            params={"limit": "0", "select": "id,title,category,brand,images,thumbnail"},
        )
        resp.raise_for_status()
        products = resp.json().get("products") or []
    except (httpx.HTTPError, json.JSONDecodeError) as exc:
        _log("  [warn] dummyjson fetch failed (%s) -- continuing with commons only" % exc)
        return {}

    for prod in products:
        cat = (prod.get("category") or "").lower()
        title = (prod.get("title") or "").strip()
        key = DUMMYJSON_CATEGORY_MAP.get(cat)
        if key is None:
            low = title.lower()
            key = next((k for kw, k in DUMMYJSON_TITLE_MAP if kw in low), None)
        if key is None or key not in BY_KEY:
            continue

        urls = [u for u in (prod.get("images") or []) if u]
        if not urls and prod.get("thumbnail"):
            urls = [prod["thumbnail"]]

        for n, url in enumerate(urls, start=1):
            buckets[key].append({
                "source": "dummyjson",
                "title": "%s (%d)" % (title, n) if len(urls) > 1 else title,
                "thumb_url": url,
                "descriptionurl": "%s/%s" % (DUMMYJSON_API, prod.get("id")),
                "mime": "image/png" if url.lower().endswith(".png") else "image/jpeg",
                # DummyJSON does not publish dimensions; the rule filter treats
                # 0 as "unknown" and lets Pillow decide after download.
                "width": 0, "height": 0, "size": 0,
                "artist": "DummyJSON sample catalog",
                "license": "DummyJSON free test data",
                "license_url": "https://dummyjson.com/",
                "credit": "dummyjson.com",
                "group_hint": "dummyjson:%s" % prod.get("id"),
            })

    return dict(buckets)


def build_candidates(
    subcats: List[dict],
    pages: int,
    refresh: bool,
) -> Dict[str, List[dict]]:
    """
    Stage 1.  Search results per subcategory key, cached on disk.

    The cache is what makes stage 3 crash-safe: a CLIP failure half way
    through costs no API calls to recover from.
    """
    cached: Dict[str, List[dict]] = {} if refresh else _read_json(CANDIDATES_PATH, {})
    wanted = [s for s in subcats if s["key"] not in cached]

    if not wanted:
        _log("Stage 1  search      : cache hit for all %d subcategories" % len(subcats))
        return {s["key"]: cached.get(s["key"], []) for s in subcats}

    _log("Stage 1  search      : %d subcategories to fetch (%d cached)"
         % (len(wanted), len(subcats) - len(wanted)))

    with _new_client() as client:
        dummy = _dummyjson_candidates(client)
        if dummy:
            _log("  dummyjson: %d images across %d subcategories"
                 % (sum(len(v) for v in dummy.values()), len(dummy)))

        for i, sub in enumerate(wanted, start=1):
            seen_titles: set = set()
            rows: List[dict] = []

            # DummyJSON first -- clean packshots deserve to be tried first.
            for row in dummy.get(sub["key"], []):
                if row["title"] not in seen_titles:
                    seen_titles.add(row["title"])
                    rows.append(row)

            for query in sub["image_queries"]:
                for row in _commons_search(client, query, pages):
                    if row["title"] in seen_titles:
                        continue
                    seen_titles.add(row["title"])
                    row["query"] = query
                    rows.append(row)
                time.sleep(SEARCH_SLEEP)

            cached[sub["key"]] = rows
            _log("  [%2d/%2d] %-20s %4d candidates" % (i, len(wanted), sub["key"], len(rows)))

            # Persist every iteration: an interrupted search keeps its progress.
            _write_json(CANDIDATES_PATH, cached)

    return {s["key"]: cached.get(s["key"], []) for s in subcats}


# ═══════════════════════════════════════════════════════════════════════════
# Stage 2 -- rule filter
# ═══════════════════════════════════════════════════════════════════════════

def rule_filter(sub: dict, candidates: List[dict]) -> Tuple[List[dict], Counter]:
    """
    Cheap metadata rejection, plus interleaving by group.

    The ordering matters as much as the filtering: Commons relevance order
    puts every angle of one popular model together, so taking the first 60
    would give us six photos of the same fridge.  Round-robin across groups
    gives breadth first and only reuses a group once breadth runs out.
    """
    noun_re = _noun_regex(sub["image_nouns"])
    blocked = _blocklist_for(sub)
    reasons: Counter = Counter()
    groups: "OrderedDict[str, List[dict]]" = OrderedDict()

    for row in candidates:
        if not row.get("thumb_url"):
            reasons["no_thumbnail"] += 1
            continue
        if row.get("mime") and row["mime"] not in ALLOWED_MIME:
            reasons["mime"] += 1
            continue
        if row.get("size") and row["size"] > MAX_SOURCE_BYTES:
            reasons["too_large"] += 1
            continue

        w, h = row.get("width") or 0, row.get("height") or 0
        if w and h:  # 0 means the source did not publish dimensions
            if w < MIN_SOURCE_DIM or h < MIN_SOURCE_DIM:
                reasons["too_small"] += 1
                continue
            if not (MIN_ASPECT <= w / h <= MAX_ASPECT):
                reasons["aspect"] += 1
                continue

        norm = _normalise_title(row["title"])

        # DummyJSON titles are product names ("Essence Mascara Lash Princess")
        # and carry no category noun, so the noun requirement is Commons-only.
        if row["source"] == "commons":
            if not noun_re.search(norm):
                reasons["noun_absent"] += 1
                continue
            hit = next((p for p in blocked if p in norm), None)
            if hit:
                reasons["blocked:" + hit] += 1
                continue

        row["_norm_title"] = norm
        gkey = row.get("group_hint") or ("commons:" + group_key(row["title"]))
        groups.setdefault(gkey, []).append(row)

    # Round-robin across groups.
    ordered: List[dict] = []
    depth = 0
    while True:
        added = False
        for gkey, members in groups.items():
            if depth < len(members):
                row = members[depth]
                row["_group_id"] = gkey
                ordered.append(row)
                added = True
        if not added:
            break
        depth += 1

    reasons["kept"] = len(ordered)
    reasons["groups"] = len(groups)
    return ordered, reasons


# ═══════════════════════════════════════════════════════════════════════════
# Stage 3 -- CLIP verification
# ═══════════════════════════════════════════════════════════════════════════

CLIP_HF_REPO = "sentence-transformers/clip-ViT-B-32"

# `SentenceTransformer("clip-ViT-B-32")` snapshots the whole 0_CLIPModel folder,
# which carries model.safetensors *and* pytorch_model.bin -- 1.21 GB of download
# for a 605 MB model.  Fetch only the safetensors and hand the local directory
# to the module directly.
_CLIP_ALLOW_PATTERNS = [
    "modules.json",
    "config_sentence_transformers.json",
    "0_CLIPModel/*.json",
    "0_CLIPModel/*.txt",
    "0_CLIPModel/model.safetensors",
]


def _load_clip():
    """Return a SentenceTransformer wrapping clip-ViT-B-32, safetensors only."""
    from sentence_transformers import SentenceTransformer, models

    try:
        from huggingface_hub import snapshot_download

        repo = Path(snapshot_download(CLIP_HF_REPO, allow_patterns=_CLIP_ALLOW_PATTERNS))
        return SentenceTransformer(modules=[models.CLIPModel(str(repo / "0_CLIPModel"))])
    except Exception as exc:  # noqa: BLE001 - any failure falls back to the slow path
        _log("  [warn] safetensors-only CLIP load failed (%s); using the full snapshot" % exc)
        return SentenceTransformer(CLIP_MODEL_NAME)


class ClipVerifier:
    """
    Zero-shot image/text gate around `clip-ViT-B-32`.

    Two conditions, both required:
      * the positives beat the negatives in a softmax over cosine similarities
        (temperature = CLIP's own logit scale of 100), and
      * the best positive cosine clears an absolute floor.

    The softmax alone is not enough: a photo of a glass of water in front of a
    fridge beats every negative comfortably while still not being a photo of a
    fridge.  The floor is what rejects it.  Conversely the floor alone is not
    enough either -- junk sits at 0.24-0.31 and good images at 0.29-0.34, an
    overlap no single threshold can separate -- which is why both gates exist
    and why the negatives are object-templated (see NEG_TEMPLATES).
    """

    def __init__(self, enabled: bool = True):
        self.enabled = enabled
        self._model: Any = None
        self._np: Any = None
        self._text_cache: Dict[str, Tuple[Any, int]] = {}

    def _load(self) -> None:
        if self._model is not None or not self.enabled:
            return
        import numpy as np

        self._np = np
        _log("Stage 3  clip        : loading %s (cache: %s)"
             % (CLIP_MODEL_NAME, os.environ.get("HF_HOME", "default")))
        t0 = time.time()
        self._model = _load_clip()
        _log("Stage 3  clip        : ready in %.1fs" % (time.time() - t0))

    def prompt_matrix(self, sub: dict) -> Tuple[Any, int]:
        """(text embeddings, n_positives) for one subcategory, positives first."""
        self._load()
        hit = self._text_cache.get(sub["key"])
        if hit is not None:
            return hit
        prompts, n_pos = _prompts_for(sub)
        emb = self._model.encode(
            prompts, convert_to_numpy=True, normalize_embeddings=True,
            batch_size=len(prompts), show_progress_bar=False,
        )
        self._text_cache[sub["key"]] = (emb, n_pos)
        return emb, n_pos

    def score(self, sub: dict, images: List[Image.Image]) -> List[Tuple[float, float]]:
        """[(best_positive_cosine, total_positive_softmax_probability), ...]"""
        if not self.enabled or not images:
            return [(1.0, 1.0)] * len(images)

        self._load()
        np = self._np
        text, n_pos = self.prompt_matrix(sub)

        img_emb = self._model.encode(
            images, convert_to_numpy=True, normalize_embeddings=True,
            batch_size=CLIP_BATCH, show_progress_bar=False,
        )
        sims = img_emb @ text.T                      # (n_images, n_pos + n_neg)
        logits = sims * CLIP_LOGIT_SCALE
        logits -= logits.max(axis=1, keepdims=True)  # stabilise before exp
        probs = np.exp(logits)
        probs /= probs.sum(axis=1, keepdims=True)

        # An image only has to satisfy ONE positive (studio packshot or clean
        # in-situ shot), so take the max cosine but the summed probability --
        # the positives are alternatives, not independent requirements.
        pos_cos = sims[:, :n_pos].max(axis=1)
        pos_prob = probs[:, :n_pos].sum(axis=1)
        return [(float(pos_cos[i]), float(pos_prob[i])) for i in range(len(images))]

    @staticmethod
    def passes(pos_cos: float, pos_prob: float) -> bool:
        return pos_cos >= CLIP_MIN_POS_COS and pos_prob >= CLIP_MIN_POS_PROB


# ═══════════════════════════════════════════════════════════════════════════
# Stage 4 -- download and normalise
# ═══════════════════════════════════════════════════════════════════════════

def _fetch(client: httpx.Client, row: dict) -> Optional[Image.Image]:
    """Download one thumbnail and decode it.  None on any failure."""
    try:
        resp = client.get(row["thumb_url"])
        resp.raise_for_status()
        img = Image.open(io.BytesIO(resp.content))
        img.load()
        return img
    except (httpx.HTTPError, OSError, ValueError, Image.DecompressionBombError):
        return None


def normalise(img: Image.Image) -> Image.Image:
    """
    500x625 RGB, letterboxed on white -- the product-catalogue aesthetic.

    Aspect ratio is preserved (no distortion); the padding is what makes a
    wall of mixed-provenance photos read as one grid.
    """
    img = ImageOps.exif_transpose(img)

    if img.mode in ("RGBA", "LA", "P", "PA"):
        img = img.convert("RGBA")
        flat = Image.new("RGB", img.size, (255, 255, 255))
        flat.paste(img, mask=img.split()[-1])
        img = flat
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail((OUT_W, OUT_H), Image.LANCZOS)
    canvas = Image.new("RGB", (OUT_W, OUT_H), (255, 255, 255))
    canvas.paste(img, ((OUT_W - img.width) // 2, (OUT_H - img.height) // 2))
    return canvas


def _save_atomic(img: Image.Image, dest: Path) -> int:
    """Write WebP via temp file + rename so a kill cannot truncate an image."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(".webp.tmp")
    img.save(tmp, format="WEBP", quality=WEBP_QUALITY, method=4)
    size = tmp.stat().st_size
    if size < MIN_OUT_BYTES:
        tmp.unlink(missing_ok=True)
        return 0
    tmp.replace(dest)
    return size


def _attribution(row: dict) -> dict:
    if row["source"] == "commons":
        source_url = row.get("descriptionurl") or (
            COMMONS_FILE_PAGE + row["title"].replace("File:", "").replace(" ", "_")
        )
    else:
        source_url = row.get("descriptionurl", "")
    return {
        "source": row["source"],
        "title": row["title"],
        "artist": (row.get("artist") or "Unknown")[:200],
        "license": (row.get("license") or "See source")[:80],
        "license_url": (row.get("license_url") or "")[:300],
        "source_url": source_url[:300],
    }


# ═══════════════════════════════════════════════════════════════════════════
# Orchestration
# ═══════════════════════════════════════════════════════════════════════════

def _existing_entries(manifest: dict, key: str) -> List[dict]:
    """Manifest rows for one subcategory whose files are still on disk."""
    kept = []
    for entry in (manifest.get("images") or {}).get(key, []):
        path = STATIC_PRODUCTS_DIR / entry["file"]
        if path.exists() and path.stat().st_size >= MIN_OUT_BYTES:
            kept.append(entry)
    return kept


def harvest_subcategory(
    sub: dict,
    candidates: List[dict],
    existing: List[dict],
    verifier: ClipVerifier,
    client: httpx.Client,
    pool: ThreadPoolExecutor,
    target: int,
) -> Tuple[List[dict], Counter]:
    """
    Top one subcategory up to `target` verified images.

    Downloads in batches, CLIP-scores the batch, keeps the passers.  Batching
    is what makes CLIP affordable: the model is loaded once and each forward
    pass covers 32 images.
    """
    entries = list(existing)
    stats: Counter = Counter()
    if len(entries) >= target:
        stats["already_had"] = len(entries)
        return entries, stats

    have_files = {e["file"] for e in entries}
    have_groups = Counter(e.get("group_id", "") for e in entries)
    seq = max(
        (int(m.group(1)) for e in entries
         for m in [re.search(r"_(\d{4})\.webp$", e["file"])] if m),
        default=0,
    )

    dept_slug = _slug(sub["department"])
    attempts = 0
    max_attempts = target * MAX_ATTEMPTS_FACTOR
    cursor = 0

    while len(entries) < target and cursor < len(candidates) and attempts < max_attempts:
        batch_rows = candidates[cursor:cursor + CLIP_BATCH]
        cursor += len(batch_rows)
        if not batch_rows:
            break

        fetched = list(pool.map(lambda r: (r, _fetch(client, r)), batch_rows))
        attempts += len(batch_rows)

        ok_rows, ok_imgs = [], []
        for row, img in fetched:
            if img is None:
                stats["download_failed"] += 1
                continue
            # Post-download dimension check catches sources that publish none.
            w, h = img.size
            if w < 200 or h < 200:
                stats["too_small_actual"] += 1
                continue
            if not (MIN_ASPECT <= w / h <= MAX_ASPECT) and row["source"] == "commons":
                stats["aspect_actual"] += 1
                continue
            ok_rows.append(row)
            ok_imgs.append(img)

        if not ok_imgs:
            continue

        for row, img, (pos_cos, pos_prob) in zip(
            ok_rows, ok_imgs, verifier.score(sub, ok_imgs)
        ):
            if len(entries) >= target:
                break
            if not verifier.passes(pos_cos, pos_prob):
                stats["clip_rejected"] += 1
                continue

            # Cap how many angles of one product we keep while breadth remains.
            gid = row.get("_group_id", "")
            if have_groups[gid] >= 3:
                stats["group_capped"] += 1
                continue

            # Flatten first: colour_family() on a raw RGBA packshot reads the
            # transparent background as black and votes black for everything.
            flat = normalise(img)
            family = colour_family(flat)

            seq += 1
            fname = "%s_%s_%04d.webp" % (dept_slug, sub["key"], seq)
            while fname in have_files:
                seq += 1
                fname = "%s_%s_%04d.webp" % (dept_slug, sub["key"], seq)

            written = _save_atomic(flat, STATIC_PRODUCTS_DIR / fname)
            if not written:
                stats["write_too_small"] += 1
                continue

            have_files.add(fname)
            have_groups[gid] += 1
            entries.append({
                "file": fname,
                "url": "%s/%s" % (STATIC_URL_PREFIX, fname),
                "width": OUT_W,
                "height": OUT_H,
                "bytes": written,
                "colour_family": family,
                "clip_score": round(pos_cos, 4),
                "clip_prob": round(pos_prob, 4),
                "group_id": gid,
                "source": row["source"],
                "attribution": _attribution(row),
            })
            stats["kept"] += 1

    stats["attempts"] = attempts
    stats["exhausted_candidates"] = int(cursor >= len(candidates) and len(entries) < target)
    return entries, stats


def build(
    target: int = TARGET_PER_SUBCAT,
    only: Optional[List[str]] = None,
    pages: int = SEARCH_PAGES_PER_QUERY,
    refresh_candidates: bool = False,
    use_clip: bool = True,
    workers: int = DOWNLOAD_WORKERS,
    dry_run: bool = False,
) -> dict:
    """Run the full pipeline and write the manifest.  Returns the manifest."""
    t_start = time.time()
    subcats = _select(only)
    STATIC_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    manifest = _read_json(MANIFEST_PATH, {})
    images: Dict[str, List[dict]] = dict(manifest.get("images") or {})

    _log("=" * 74)
    _log("RazorCartAI image harvest")
    _log("  subcategories : %d" % len(subcats))
    _log("  target/subcat : %d      output: %dx%d WebP q%d"
         % (target, OUT_W, OUT_H, WEBP_QUALITY))
    _log("  clip gate     : %s" % ("on (pos_cos>=%.2f, pos_prob>=%.2f)"
                                   % (CLIP_MIN_POS_COS, CLIP_MIN_POS_PROB)
                                   if use_clip else "OFF (--no-clip)"))
    _log("  static dir    : %s" % STATIC_PRODUCTS_DIR)
    _log("=" * 74)

    # Nothing to do?  Say so and stop before touching the network.
    pending = [s for s in subcats if len(_existing_entries(manifest, s["key"])) < target]
    if not pending:
        _log("All %d subcategories already hold %d verified images -- nothing to do."
             % (len(subcats), target))
        _print_stats(manifest)
        return manifest

    candidates = build_candidates(pending, pages, refresh_candidates)

    # Stage 2
    _log("")
    _log("Stage 2  rule filter :")
    filtered: Dict[str, List[dict]] = {}
    reject_report: Dict[str, dict] = {}
    for sub in pending:
        rows, reasons = rule_filter(sub, candidates.get(sub["key"], []))
        filtered[sub["key"]] = rows
        reject_report[sub["key"]] = dict(reasons)
        top = ", ".join("%s=%d" % (k.replace("blocked:", "!"), v)
                        for k, v in reasons.most_common(4)
                        if k not in ("kept", "groups"))
        _log("  %-20s %4d kept / %4d groups   %s"
             % (sub["key"], reasons["kept"], reasons["groups"], top))
    _write_json(REJECTS_PATH, reject_report)

    if dry_run:
        _log("")
        _log("--dry-run: stopping before download.  %d candidates survived filtering."
             % sum(len(v) for v in filtered.values()))
        return manifest

    # Stages 3 + 4
    _log("")
    verifier = ClipVerifier(enabled=use_clip)
    totals: Counter = Counter()

    with _new_client() as client, ThreadPoolExecutor(max_workers=workers) as pool:
        for i, sub in enumerate(pending, start=1):
            key = sub["key"]
            existing = _existing_entries(manifest, key)
            entries, stats = harvest_subcategory(
                sub, filtered.get(key, []), existing, verifier, client, pool, target,
            )
            images[key] = entries
            totals.update({k: v for k, v in stats.items() if not k.startswith("_")})

            _log("  [%2d/%2d] %-20s %3d images  (+%d new, %d clip-rejected, "
                 "%d dl-failed, %d attempts)%s"
                 % (i, len(pending), key, len(entries), stats.get("kept", 0),
                    stats.get("clip_rejected", 0), stats.get("download_failed", 0),
                    stats.get("attempts", 0),
                    "  <-- THIN" if len(entries) < MIN_PER_SUBCAT else ""))

            # Checkpoint after every subcategory: a crash never loses work.
            manifest = _assemble(images, target, use_clip)
            _write_json(MANIFEST_PATH, manifest)

    manifest = _assemble(images, target, use_clip)
    _write_json(MANIFEST_PATH, manifest)

    _log("")
    _log("Downloaded/verified in %.1f min.  kept=%d clip_rejected=%d dl_failed=%d"
         % ((time.time() - t_start) / 60.0, totals.get("kept", 0),
            totals.get("clip_rejected", 0), totals.get("download_failed", 0)))
    _print_stats(manifest)
    return manifest


def _assemble(images: Dict[str, List[dict]], target: int, use_clip: bool) -> dict:
    """Build the manifest document from the per-subcategory image lists."""
    total = sum(len(v) for v in images.values())
    scores = [e["clip_score"] for v in images.values() for e in v]
    return {
        "version": 1,
        "build": {
            "clip_model": CLIP_MODEL_NAME if use_clip else None,
            "clip_min_pos_cos": CLIP_MIN_POS_COS,
            "clip_min_pos_prob": CLIP_MIN_POS_PROB,
            "output": {"width": OUT_W, "height": OUT_H,
                       "format": "webp", "quality": WEBP_QUALITY},
            "static_url_prefix": STATIC_URL_PREFIX,
            "target_per_subcategory": target,
            "min_per_subcategory": MIN_PER_SUBCAT,
        },
        "stats": {
            "subcategories": len(images),
            "total_images": total,
            "thin_subcategories": sorted(
                k for k, v in images.items() if len(v) < MIN_PER_SUBCAT
            ),
            "clip_score_mean": round(sum(scores) / len(scores), 4) if scores else 0.0,
            "clip_score_min": round(min(scores), 4) if scores else 0.0,
        },
        "images": {k: images[k] for k in sorted(images)},
    }


def _print_stats(manifest: dict) -> None:
    images: Dict[str, List[dict]] = manifest.get("images") or {}
    if not images:
        _log("Manifest is empty.")
        return

    by_dept: Dict[str, List[int]] = defaultdict(list)
    for key, entries in images.items():
        sub = BY_KEY.get(key)
        if sub:
            by_dept[sub["department"]].append(len(entries))

    total = sum(len(v) for v in images.values())
    _log("")
    _log("-" * 74)
    _log("Manifest summary")
    _log("-" * 74)
    for dept in DEPARTMENTS:
        counts = by_dept.get(dept, [])
        if not counts:
            continue
        _log("  %-24s %5d images across %2d subcategories (min %d)"
             % (dept, sum(counts), len(counts), min(counts)))
    _log("-" * 74)
    _log("  TOTAL                    %5d images across %2d subcategories"
         % (total, len(images)))

    thin = (manifest.get("stats") or {}).get("thin_subcategories") or []
    if thin:
        _log("  THIN (< %d): %s" % (MIN_PER_SUBCAT, ", ".join(thin)))
    scores = [e["clip_score"] for v in images.values() for e in v]
    if scores:
        scores.sort()
        _log("  clip_score  min=%.3f  p10=%.3f  median=%.3f  max=%.3f"
             % (scores[0], scores[len(scores) // 10], scores[len(scores) // 2], scores[-1]))
    sources = Counter(e["source"] for v in images.values() for e in v)
    _log("  sources: %s" % ", ".join("%s=%d" % kv for kv in sources.most_common()))
    _log("-" * 74)


def _select(only: Optional[List[str]]) -> List[dict]:
    """Resolve --only tokens (subcategory keys or department names)."""
    if not only:
        return list(SUBCATEGORIES)
    wanted = {t.strip().lower() for t in only if t.strip()}
    picked = [
        s for s in SUBCATEGORIES
        if s["key"].lower() in wanted
        or s["department"].lower() in wanted
        or _slug(s["department"]) in wanted
    ]
    if not picked:
        raise SystemExit("No subcategory or department matched --only %s" % ",".join(only))
    return picked


# ═══════════════════════════════════════════════════════════════════════════
# Public read API -- what catalog_factory.py and image_audit.py consume
# ═══════════════════════════════════════════════════════════════════════════

def load_manifest() -> dict:
    """Read the committed manifest.  Raises if the harvest has not been run."""
    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(
            "image_manifest.json not found at %s -- run "
            "`python -m app.services.image_harvest --build` first." % MANIFEST_PATH
        )
    with MANIFEST_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def images_for(manifest: dict, subcat_key: str) -> List[dict]:
    return (manifest.get("images") or {}).get(subcat_key, [])


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def main(argv: Optional[Sequence[str]] = None) -> int:
    ap = argparse.ArgumentParser(
        prog="python -m app.services.image_harvest",
        description="Harvest and CLIP-verify product photos into backend/static/products/.",
    )
    ap.add_argument("--build", action="store_true", help="run the harvest")
    ap.add_argument("--stats", action="store_true", help="print manifest summary and exit")
    ap.add_argument("--target", type=int, default=TARGET_PER_SUBCAT,
                    help="verified images per subcategory (default %d)" % TARGET_PER_SUBCAT)
    ap.add_argument("--only", default="",
                    help="comma-separated subcategory keys or department names")
    ap.add_argument("--pages", type=int, default=SEARCH_PAGES_PER_QUERY,
                    help="Commons search pages per query, 50 results each (default %d)"
                         % SEARCH_PAGES_PER_QUERY)
    ap.add_argument("--workers", type=int, default=DOWNLOAD_WORKERS,
                    help="download threads (default %d)" % DOWNLOAD_WORKERS)
    ap.add_argument("--refresh-candidates", action="store_true",
                    help="ignore the cached search results and re-query the APIs")
    ap.add_argument("--no-clip", action="store_true",
                    help="skip CLIP verification (fast smoke run; do not ship)")
    ap.add_argument("--dry-run", action="store_true",
                    help="search and rule-filter only, no downloads")
    args = ap.parse_args(argv)

    if args.stats:
        _print_stats(_read_json(MANIFEST_PATH, {}))
        return 0

    if not (args.build or args.dry_run):
        ap.print_help()
        return 1

    build(
        target=args.target,
        only=[t for t in args.only.split(",") if t.strip()],
        pages=args.pages,
        refresh_candidates=args.refresh_candidates,
        use_clip=not args.no_clip,
        workers=args.workers,
        dry_run=args.dry_run,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
