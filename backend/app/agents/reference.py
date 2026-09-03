"""
Conversational reference resolution -- the machinery behind "the 2nd one".

Why this module exists
---------------------
Every phrase in a real shopping conversation is elliptical:

    > What are my past orders
    > Put the 2nd one in cart again          <- "the 2nd one" of WHAT?
    > Increase the quantity                  <- of WHICH item?
    > Open the first one                     <- first of the list you just showed

None of that can be answered from the user's message alone.  It can only be
answered against *what the agent last displayed*, so the agent has to remember
the list it rendered and the ordinals the user can see next to it.  That list is
the "focus frame" below.

Two design rules, both taken from the project's bar that every money action be
explainable, bounded and gated:

  * **Never guess a referent.**  If "the second one" cannot be resolved
    unambiguously, `resolve()` returns `ambiguous=True` and the caller asks a
    clarifying question.  Silently picking a product and charging for it is the
    exact failure mode this design exists to prevent.
  * **Every resolution carries its reason.**  `Resolution.reason` is a
    human-readable sentence ("ordinal 2 of the 3 orders shown") that goes
    straight into the audit ledger, so the trail explains not just what was
    added to the cart but why the agent believed that was what was meant.

Storage is deliberately process-local and bounded (`_MAX_SESSIONS`, `_TTL`).
Conversation focus is ephemeral UI context, not a business record -- it must not
outlive the conversation, and a restart losing it is correct behaviour, not a
bug.  The durable facts (cart rows, orders, audit entries) are all in SQL.
"""

from __future__ import annotations

import re
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

# ── Focus frame ─────────────────────────────────────────────────────────────

#: Kinds of thing an ordinal can point at.  The kind matters as much as the id:
#: "put the 2nd one in the cart" means *add a product* when a product list is in
#: focus and *reorder* when an order list is, and that difference is the whole
#: reason this is stored rather than inferred from the verb.
KIND_PRODUCT = "product"
KIND_CART_ITEM = "cart_item"
KIND_ORDER = "order"


@dataclass
class FocusItem:
    """One numbered thing the user can currently see."""

    ordinal: int                              # 1-based, as displayed
    kind: str                                 # KIND_PRODUCT | KIND_CART_ITEM | KIND_ORDER
    ref_id: int                               # product.id / cart_item.id / order.id
    label: str                                # for name matching + audit prose
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ordinal": self.ordinal,
            "kind": self.kind,
            "ref_id": self.ref_id,
            "label": self.label,
            **({"extra": self.extra} if self.extra else {}),
        }


@dataclass
class Resolution:
    """Outcome of resolving a referring expression."""

    item: Optional[FocusItem] = None
    reason: str = ""
    ambiguous: bool = False
    candidates: List[FocusItem] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.item is not None and not self.ambiguous


# ── Session store ───────────────────────────────────────────────────────────

_TTL_SECONDS = 2 * 60 * 60
_MAX_SESSIONS = 500

_lock = threading.RLock()
_sessions: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()


def _now() -> float:
    return time.time()


def _evict_locked() -> None:
    """Drop expired sessions, then the oldest, until under the cap."""
    cutoff = _now() - _TTL_SECONDS
    for key in [k for k, v in _sessions.items() if v["touched_at"] < cutoff]:
        _sessions.pop(key, None)
    while len(_sessions) > _MAX_SESSIONS:
        _sessions.popitem(last=False)


def _session_locked(session_id: str) -> Dict[str, Any]:
    sess = _sessions.get(session_id)
    if sess is None:
        sess = {"focus": [], "focus_kind": None, "last_ref": None, "pending": None,
                "touched_at": _now()}
        _sessions[session_id] = sess
    sess["touched_at"] = _now()
    _sessions.move_to_end(session_id)
    return sess


def set_focus(session_id: str, items: List[FocusItem]) -> None:
    """
    Record the list the agent just displayed.

    Call this from *every* node that shows the user a numbered list, or the next
    "the 2nd one" resolves against a stale frame -- which is worse than failing,
    because it silently acts on the wrong product.
    """
    with _lock:
        sess = _session_locked(session_id)
        sess["focus"] = list(items)
        sess["focus_kind"] = items[0].kind if items else None
        _evict_locked()


def get_focus(session_id: str) -> List[FocusItem]:
    with _lock:
        return list(_session_locked(session_id)["focus"])


def set_last_ref(session_id: str, item: Optional[FocusItem]) -> None:
    """Remember the single thing just acted on, for bare "increase the quantity"."""
    with _lock:
        _session_locked(session_id)["last_ref"] = item


def get_last_ref(session_id: str) -> Optional[FocusItem]:
    with _lock:
        return _session_locked(session_id)["last_ref"]


def set_pending(session_id: str, pending: Optional[Dict[str, Any]]) -> None:
    """
    Park an action awaiting an explicit yes/no.

    This is the gate on spend: a reorder that would charge real money is stored
    here and only executed once the user confirms in the next turn.
    """
    with _lock:
        _session_locked(session_id)["pending"] = pending


def get_pending(session_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        return _session_locked(session_id)["pending"]


def clear_session(session_id: str) -> None:
    with _lock:
        _sessions.pop(session_id, None)


# ── Referring-expression grammar ────────────────────────────────────────────

# True ordinals only.  The cardinals ("one", "two", ...) are deliberately absent:
# in English "the Nike one" and "the red one" use "one" as a *noun*, not a
# position, so mapping it to 1 makes "remove the Nike one" delete whatever
# happens to be at the top of the list.  Cardinals are still accepted behind an
# explicit cue -- see `_CUED_CARDINAL_RE`.
_ORDINAL_WORDS = {
    "first": 1, "1st": 1,
    "second": 2, "2nd": 2,
    "third": 3, "3rd": 3,
    "fourth": 4, "4th": 4,
    "fifth": 5, "5th": 5,
    "sixth": 6, "6th": 6,
    "seventh": 7, "7th": 7,
    "eighth": 8, "8th": 8,
    "ninth": 9, "9th": 9,
    "tenth": 10, "10th": 10,
}

_CARDINAL_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}

# "the 2nd one", "the second item", "#2", "number 2", "option 2".
# The bare-numeral forms require a cue word ("#", "number", "option", "item")
# so that "shoes under 2000" and "add 2 more" are not read as ordinals -- a
# price and a quantity are numbers too, and misreading one as a position is
# how an agent ends up adding the wrong product to a cart.
_ORDINAL_WORD_RE = re.compile(
    r"\b(?:the\s+)?(" + "|".join(sorted(_ORDINAL_WORDS, key=len, reverse=True)) + r")\b"
    r"(?:\s+(?:one|item|product|order|result|option|thing))?",
    re.I,
)
_ORDINAL_NUM_RE = re.compile(r"(?:#|\bno\.?\s*|\bnumber\s+|\boption\s+|\bitem\s+)(\d{1,2})\b", re.I)
#: "number two", "option three" -- a cardinal is a position only behind a cue.
_CUED_CARDINAL_RE = re.compile(
    r"\b(?:number|option|item|no\.?)\s+("
    + "|".join(sorted(_CARDINAL_WORDS, key=len, reverse=True)) + r")\b", re.I)
_LAST_RE = re.compile(r"\b(?:the\s+)?(last|final|bottom)\b(?:\s+one)?", re.I)
_ALL_RE = re.compile(r"\b(all|everything|every\s+(?:one|item)|both)\b", re.I)
_PRONOUN_RE = re.compile(r"\b(?:that|this|it|the)\s+(?:one|item|product|order)\b|\b(?:that|it)\b", re.I)

#: "the Nike one", "the black leather one" -- a *description* standing in for a
#: position.  Detected separately because a description that matches nothing on
#: screen has to fail loudly: the user named something specific, so quietly
#: falling back to "whatever we touched last" would act on the wrong item.
_DESCRIPTIVE_RE = re.compile(
    r"\bthe\s+((?!last\b|final\b|first\b|second\b|third\b|fourth\b|fifth\b)"
    r"[\w'-]+(?:\s+[\w'-]+)?)\s+(?:one|ones|item)\b", re.I)

_STOPWORDS = {
    "the", "a", "an", "one", "item", "product", "order", "this", "that", "it",
    "add", "put", "into", "in", "to", "my", "cart", "bag", "basket", "again",
    "please", "and", "of", "for", "with", "show", "open", "view", "remove",
    "delete", "increase", "decrease", "quantity", "qty", "more", "less",
}


def _by_ordinal(focus: List[FocusItem], n: int) -> Resolution:
    for item in focus:
        if item.ordinal == n:
            return Resolution(
                item=item,
                reason="ordinal %d of the %d %s%s shown"
                       % (n, len(focus), focus[0].kind.replace("_", " "),
                          "" if len(focus) == 1 else "s"),
            )
    return Resolution(
        reason="asked for #%d but only %d %s%s were shown"
               % (n, len(focus), focus[0].kind.replace("_", " ") if focus else "item",
                  "" if len(focus) == 1 else "s"),
        candidates=focus,
    )


def _by_name(text: str, focus: List[FocusItem]) -> Resolution:
    """Match "the Nike one" / "the black sneakers" against the visible labels."""
    words = [w for w in re.findall(r"[a-z0-9]+", text.lower())
             if w not in _STOPWORDS and len(w) > 2]
    if not words:
        return Resolution()

    hits: List[tuple] = []
    for item in focus:
        label = item.label.lower()
        score = sum(1 for w in words if w in label)
        if score:
            hits.append((score, item))
    if not hits:
        return Resolution()

    hits.sort(key=lambda t: -t[0])
    best = hits[0][0]
    tied = [it for sc, it in hits if sc == best]
    if len(tied) > 1:
        return Resolution(
            ambiguous=True,
            reason="%d of the shown items match that description equally well" % len(tied),
            candidates=tied,
        )
    matched = [w for w in words if w in tied[0].label.lower()]
    return Resolution(
        item=tied[0],
        reason="name match on %s in \"%s\"" % (", ".join(matched), tied[0].label),
    )


def wants_all(text: str) -> bool:
    """True for "add all of them" / "remove everything"."""
    return bool(_ALL_RE.search(text or ""))


def resolve(
    text: str,
    session_id: str,
    *,
    kind: Optional[str] = None,
    allow_implicit: bool = True,
) -> Resolution:
    """
    Resolve a referring expression in `text` against the session's focus frame.

    `kind` restricts resolution to one kind of referent -- pass it when the verb
    only makes sense for one ("increase the quantity" can only mean a cart item),
    so an ordinal is never resolved against a list of the wrong type.

    `allow_implicit=True` lets a bare command with no referring expression at all
    ("increase the quantity") fall back to the last thing acted on, and then to
    the sole member of a one-item focus list.  Both are unambiguous by
    construction; anything less certain returns `ambiguous=True`.
    """
    text = text or ""
    focus = get_focus(session_id)
    if kind:
        focus = [f for f in focus if f.kind == kind]
        # Renumber so "the 2nd one" counts within the filtered view the user saw.
        focus = [FocusItem(i + 1, f.kind, f.ref_id, f.label, f.extra)
                 for i, f in enumerate(focus)]

    # 1. Explicit position -- "#2", "number 2", "item 3", "number two".
    m = _ORDINAL_NUM_RE.search(text)
    if m and focus:
        return _by_ordinal(focus, int(m.group(1)))
    m = _CUED_CARDINAL_RE.search(text)
    if m and focus:
        return _by_ordinal(focus, _CARDINAL_WORDS[m.group(1).lower()])

    # 2. "last" / "final".
    if _LAST_RE.search(text) and focus:
        return Resolution(item=focus[-1],
                          reason="last of the %d shown" % len(focus))

    # 3. Ordinal words -- "the second one".
    m = _ORDINAL_WORD_RE.search(text)
    if m and focus:
        return _by_ordinal(focus, _ORDINAL_WORDS[m.group(1).lower()])

    # 4. Descriptive -- "the Nike one".
    if focus:
        named = _by_name(text, focus)
        if named.item or named.ambiguous:
            return named

    # An explicit description that matched nothing is a dead end, not an
    # invitation to guess.  Falling through to the implicit referent here would
    # mean "remove the Nike one" deleting a Puma because that is what the
    # previous turn happened to touch.
    described = _DESCRIPTIVE_RE.search(text)
    if described:
        return Resolution(
            reason="nothing currently shown matches \"%s\"" % described.group(1).strip(),
            candidates=focus,
        )

    if not allow_implicit:
        return Resolution(reason="no referring expression found in the message")

    # 5. Bare pronoun, or no referent at all: fall back to the last thing acted
    #    on, then to a single-item focus list.
    last = get_last_ref(session_id)
    if last is not None and (kind is None or last.kind == kind):
        return Resolution(item=last,
                          reason="continuing with %s from the previous turn" % last.label)

    if len(focus) == 1:
        return Resolution(item=focus[0],
                          reason="only one %s was shown" % focus[0].kind.replace("_", " "))

    if focus:
        return Resolution(
            ambiguous=True,
            reason="%d %ss are in view and the message does not say which"
                   % (len(focus), focus[0].kind.replace("_", " ")),
            candidates=focus,
        )
    return Resolution(reason="nothing has been shown yet in this conversation")


# ── Confirmation reading ────────────────────────────────────────────────────

_YES_RE = re.compile(
    r"^\s*(?:yes|yeah|yep|yup|ya|sure|ok|okay|okey|confirm(?:ed)?|do\s+it|go\s+ahead"
    r"|proceed|please\s+do|affirmative|correct|right|absolutely|definitely)\b",
    re.I,
)
_NO_RE = re.compile(
    r"^\s*(?:no|nope|nah|don'?t|do\s+not|cancel|stop|abort|never\s*mind|nevermind"
    r"|leave\s+it|forget\s+it)\b",
    re.I,
)


def read_confirmation(text: str) -> Optional[bool]:
    """True / False for an explicit yes or no, None when the reply is neither.

    None is important: an unrelated follow-up must abandon the pending action
    rather than be read as consent.
    """
    text = (text or "").strip()
    if _YES_RE.match(text):
        return True
    if _NO_RE.match(text):
        return False
    return None
