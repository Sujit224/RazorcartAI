"""
RazorCartAI 10,000-Product Catalog Generator
───────────────────────────────────────────────────────────────────────────────
Synthesizes a 10,000-product e-commerce catalog across all 12 departments
and 95+ subcategories defined in app.services.taxonomy.

Features:
- Every single product is linked to a verified Merchant (from 60+ merchants).
- Every product includes multi-paragraph, rich, detailed descriptions and specs.
- Accurate Unsplash imagery, dynamic pricing, FBT pairings, and BM25/TF-IDF search tags.
"""

import json
import random
from typing import List, Dict, Any

from .taxonomy import SUBCATEGORIES, DEPARTMENTS, CITIES, policy_for
from .seed_data import SEED_PRODUCTS
from .merchants_data import get_merchant_for_product, MERCHANTS

# ── Curated Unsplash Photo IDs by Subcategory Key ───────────────────────────
SUBCATEGORY_UNSPLASH_POOLS: Dict[str, List[str]] = {
    # Electronics
    "smartphones": [
        "1511707171634-5f897ff02aa9", "1598327105666-5b89351aff97", "1580910051074-3eb694886505",
        "1565849904461-04a58ad377e0", "1592750475338-74b7b21085ab", "1546054454-aa26e2b734c7",
        "1574944985070-8f3ebc6b79d2", "1601784551446-20c9e07cdbdb", "1585060544812-6b45742d762f",
        "1567581935884-3349723552ca", "1512499617640-c74ae3a79d37", "1570891836654-d4961a7b6929",
        "1591337676887-a217a6970a8a", "1616348436168-de43ad0db179", "1510557880182-3d4d3cba35a5",
        "1584006682522-dc17d6c0d9ac"
    ],
    "laptops": [
        "1588872657578-7efd1f1555ed", "1517336714731-489689fd1ca8", "1593642632823-8f785ba67e45",
        "1603302576837-37561b2e2302", "1525547719571-a2d4ac8945e2", "1496181133206-80ce9b88a853",
        "1541807084-5c52b6b3adef"
    ],
    "tablets": [
        "1544244015-0df4b3ffc6b0", "1561154464-82e9adf32764", "1585792180666-f75c7c302c17",
        "1589739900243-4b52cd9b104e"
    ],
    "phone_cases": [
        "1601593346740-925612772716", "1586953208448-b95a79798f07", "1541872703-74c5e44368f9", "1584006682522-dc17d6c0d9ac"
    ],
    "screen_protectors": [
        "1601784551446-20c9e07cdbdb", "1580910051074-3eb694886505", "1565849904461-04a58ad377e0", "1511707171634-5f897ff02aa9", "1592750475338-74b7b21085ab"
    ],
    "phone_stands": [
        "1586105251261-72a756497a11", "1584438784894-089d6a62b8fa", "1581291518633-83b4ebd1d83e"
    ],
    "headphones": [
        "1505740420928-5e560c06d30e", "1583394838336-acd977736f90", "1590658268037-6bf12165a8df",
        "1600294037681-c80b4cb5b434", "1546435770-a3e426bf472b"
    ],
    "smartwatches": [
        "1546868871-7041f2a55e12", "1508685096489-7aacd43bd3b1", "1523275335684-37898b6baf30",
        "1579586337278-3befd40fd17a"
    ],
    "cameras": [
        "1526170375885-4d8ecf77b99f", "1516035069371-29a1b244cc32", "1502920917128-1aa500764cbd",
        "1512790182412-b19e6d62bc39"
    ],
    "speakers": [
        "1609081219090-a6d81d3085bf", "1545454675-3531b543be5d", "1543512214-318c7553f230"
    ],
    "gaming": [
        "1563770660941-20978e870e26", "1612287233207-619e0785023a", "1587829741301-dc798b83add3",
        "1615663245857-ac93bb7c39e7"
    ],
    "power_charging": [
        "1609592424364-500b73c242e2", "1583863788434-e58a36330cf0", "1622445262464-84b1b0904450"
    ],
    "monitors": [
        "1527443224154-c4a3942d3acf", "1585792180666-f75c7c302c17", "1547082299-de196ea013d6"
    ],
    # Fashion
    "footwear": [
        "1542291026-7eec264c27ff", "1584735935682-2f2b69dff9d2", "1600185365926-3a2ce3cdb9eb",
        "1552346154-21d32810aba3", "1595950653106-6c9ebd614d3a", "1608231387042-66d1773070a5",
        "1587563871167-1ee9c731aefb", "1491553895911-0055eca6402d", "1516478177764-9fe5bd7e9717"
    ],
    "topwear": [
        "1521572267360-ee0c2909d518", "1583743814966-8936f5b7be1a", "1562157873-818bc0726f68",
        "1591047139829-d91aecb6caea", "1578587018452-892bacefd3d2", "1519241486490-b98b8c5e70de"
    ],
    "bottomwear": [
        "1541099649105-f69ad21f3246", "1624378439575-d8705ad7ae80", "1584370848010-d7fe6bc767ec",
        "1591195853828-11db59a44f6b"
    ],
    "dresses": [
        "1515886657613-9f3515b0c78f", "1572804013309-59a88b7e92f1", "1566174053879-31528523f8ae"
    ],
    "ethnic": [
        "1610030469983-98e550d6193c", "1617627143750-d86bc21e42bb"
    ],
    "watches": [
        "1522335789203-aabd1fc54bc9", "1524805444758-089113d48a6d", "1533139502-7d29b9904304"
    ],
    "bags": [
        "1553062407-98eeb64c6a62", "1548036328-c9fa89d128fa", "1590874103328-eac38a683ce7"
    ],
    "sunglasses": [
        "1511499767150-a48a237f0083", "1572635196237-14b3f281503f"
    ],
    "jewellery": [
        "1599643478518-a784e5dc4c8f", "1535632066927-ab7c9ab60908"
    ],
    # Appliances
    "refrigerators": ["1584992236310-6edddc08acff", "1571175443880-49e1d25b2bc5"],
    "washing_machines": ["1626806787461-102c1bfaaea1", "1610557892470-55d9e80c0bce"],
    "air_conditioners": ["1585659722983-3a675dabf23d", "1588854337236-6889d631faa8"],
    "microwaves": ["1584269600464-37b1b58a9fe7", "1556909114-f6e7ad7d3136"],
    "mixer_grinders": ["1574269909862-7e1d70bb8078", "1544816155-12df9643f363"],
    "vacuum_cleaners": ["1558317374-067fb5f30001", "1527515637462-cff94eecc1ac"],
    # Home & Kitchen
    "cookware": ["1584269600464-37b1b58a9fe7", "1556911220-e15b29be8c8f", "1583847268964-b28dc8f51f92"],
    "dinnerware": ["1513694203232-719a280e022f", "1507473885765-e6ed057f782c"],
    "kitchen_storage": ["1540518614846-7ede433c4b49", "1586023492125-27b2c045efd7"],
    "home_decor": ["1513694203232-719a280e022f", "1530587191325-3db32d826c18", "1616486338812-3dadae4b4ace"],
    "furniture": ["1555041469-a586c61ea9bc", "1586023492125-27b2c045efd7"],
    "lighting": ["1507473885765-e6ed057f782c", "1513506003901-1e6a229e2d15"],
    # Beauty
    "skincare": ["1556228720-195a672e8a03", "1571781926291-c477ebfd024b", "1598440947619-2c35fc9aa908"],
    "haircare": ["1522337360788-8b13dee7a37e", "1608248597359-54199999052b"],
    "makeup": ["1522337360788-8b13dee7a37e", "1512496015851-a90fb38ba796"],
    "fragrances": ["1523293182086-7651a899d37f", "1592945403244-b3fbafd7f539"],
    # Sports
    "gym_equipment": ["1517838277536-f5f99be501cd", "1534438327276-14e5300c3a48", "1583454110551-21f2fa2afe61"],
    "cricket": ["1531415074868-036b1c5c53ec", "1540747913346-19e32dc3e97e"],
    "football": ["1508098682722-e99c43a406b2", "1579952363873-27f3bade9f55"],
    "cycling": ["1485965120184-e220f721d03e", "1532298229144-0ec0c57515c7"],
    "yoga": ["1544367567-0f2fcb009e0b", "1518611012118-696072aa579a"],
    "sports_nutrition": ["1579722821273-0f6c7d44362f", "1593095948071-474c5cc2989d"],
    # Pet
    "dog_food": ["1589924691995-400dc9ecc119", "1583511655857-d19b40a7a54e"],
    "cat_food": ["1514888286974-6c03e2ca1dba", "1548767791-007f35b64c0a"],
    "pet_toys": ["1576201836106-db1758fd1c97", "1535294435445-d7249524ef2e"],
    "pet_accessories": ["1601758228041-f3b2795255f1", "1583337130417-3346a1be7dee"],
    # Books
    "fiction": ["1544947950-fa07a98d237f", "1512820790803-83ca734da794", "1532012164546-f432f2e3777f"],
    "non_fiction": ["1589829085413-56de8ae18c73", "1497633762265-9d179a990aa6"],
    "academic": ["1457369804613-52c61a468e7d", "1532012164546-f432f2e3777f"],
    # Toys & Baby
    "toys_games": ["1566576912321-d58ddd7a6088", "1587654780291-39c9404d746b"],
    "board_games": ["1610890716171-6b1bb98ffd09", "1632501641765-e568d28b0015"],
    "baby_care": ["1515488042361-ee00e0ddd4e4", "1555252333-9f8e92e65df9"],
    # Grocery
    "beverages": ["1544787219-7f47ccb76574", "1514432324607-a09d9b4aefdd"],
    "tea_coffee": ["1511920170033-f8396924c348", "1497515114629-f71d768fd07c"],
    "snacks": ["1599940824399-b87987ceb72a", "1563636619-e9143da7973b"],
    "chocolates": ["1549007994-cb92caebd54b", "1511381939415-e44015466834"]
}

# Department-level fallback pools
UNSPLASH_POOLS: Dict[str, List[str]] = {
    "Electronics": [
        "1511707171634-5f897ff02aa9", "1598327105666-5b89351aff97", "1580910051074-3eb694886505",
        "1588872657578-7efd1f1555ed", "1505740420928-5e560c06d30e", "1546868871-7041f2a55e12"
    ],
    "Fashion": [
        "1521572267360-ee0c2909d518", "1578587018452-892bacefd3d2", "1519241486490-b98b8c5e70de",
        "1585487000160-6a5c4bede7c4", "1541099649105-f69ad21f3246", "1542295669297-ec9e28a15ef1",
    ],
    "Footwear": [
        "1542291026-7eec264c27ff", "1584735935682-2f2b69dff9d2", "1600185365926-3a2ce3cdb9eb",
        "1552346154-21d32810aba3", "1595950653106-6c9ebd614d3a", "1608231387042-66d1773070a5",
    ],
    "Home & Kitchen": [
        "1584269600464-37b1b58a9fe7", "1556911220-e15b29be8c8f", "1583847268964-b28dc8f51f92",
        "1513694203232-719a280e022f", "1507473885765-e6ed057f782c", "1540518614846-7ede433c4b49",
    ],
    "Appliances": [
        "1571175443880-49e1d25b2bc5", "1585659722983-3a675dabf23d", "1584269600464-37b1b58a9fe7",
        "1556909114-f6e7ad7d3136", "1574269909862-7e1d70bb8078", "1626806787461-102c1bfaaea1",
    ],
    "Beauty & Personal Care": [
        "1522337360788-8b13dee7a37e", "1598440947619-2c35fc9aa908", "1571781926291-c477ebfd024b",
        "1556228720-195a672e8a03", "1608248597359-54199999052b", "1567928805192-7f49f07fe92e",
    ],
    "Sports & Fitness": [
        "1517838277536-f5f99be501cd", "1584735935682-2f2b69dff9d2", "1574680096145-d05b474e2155",
        "1598289431512-b97b0917affc", "1534438327276-14e5300c3a48", "1517836357463-d25dfeac3438",
    ],
    "Grocery & Gourmet": [
        "1514432324607-a09d9b4aefdd", "1544787219-7f47ccb76574", "1509440159596-0249088772ff",
        "1587334274328-64186a80aeee", "1563636619-e9143da7973b", "1599940824399-b87987ceb72a",
    ],
    "Books & Stationery": [
        "1544947950-fa07a98d237f", "1512820790803-83ca734da794", "1532012164546-f432f2e3777f",
        "1585779034823-7e9ac8faec70", "1589829085413-56de8ae18c73", "1497633762265-9d179a990aa6",
    ],
    "Toys & Baby": [
        "1596461404969-9ae70f2830c1", "1566576912321-d58ddd7a6088", "1515488042361-ee00e0ddd4e4",
        "1587654780291-39c9404d746b", "1533228876829-65c94e7b5025", "1558060370-d644479cb6f7",
    ],
    "Health & Wellness": [
        "1584308666744-24d5c474f2ae", "1584017911766-d451b3d0e843", "1550572017-edd951aa8f72",
        "1576091160399-112ba8d25d1d", "1505751172876-fa1923c5c528", "1584744982491-665216d95f8b",
    ],
    "Automotive & Tools": [
        "1581244277943-fe4a9c777189", "1503376780353-7e6692767b70", "1580273916550-e323be2ae537",
        "1541348263662-e0c8de4259ba", "1558981403-c5f9899a28bc", "1568605117036-5fe5e7bab0b7",
    ],
    "Pet Supplies": [
        "1583511655857-d19b40a7a54e", "1548767791-007f35b64c0a", "1583337130417-3346a1be7dee",
        "1537151608828-ea2b11777ee8", "1514888286974-6c03e2ca1dba", "1543466835-00a7907e9de1",
    ],
}

DEFAULT_PHOTOS = [
    "1511707171634-5f897ff02aa9", "1598327105666-5b89351aff97", "1542291026-7eec264c27ff",
    "1526170375885-4d8ecf77b99f", "1572635196237-14b3f281503f", "1583394838336-acd977736f90",
]


def _img(photo_id: str, w: int = 600, h: int = 800) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&h={h}&q=80"


def _build_rich_description(title: str, brand: str, dept: str, cat: str, meta: Dict[str, Any], merchant_name: str) -> str:
    """Constructs a comprehensive, multi-paragraph e-commerce product description."""
    material = meta.get("material", "high-grade engineered materials")
    color = meta.get("color", "Standard")
    fit = meta.get("fit", "Regular True-to-Size Fit")
    care = meta.get("care", "Wipe clean with a soft dry cloth")
    origin = meta.get("origin", "India")
    
    # Custom engineering highlights based on department
    if dept == "Footwear":
        highlight = "Built with multi-layer shock absorption, responsive cushioning, and an anti-skid rubber outsole for optimum grip on road, track, and gym surfaces."
    elif dept == "Electronics":
        highlight = "Equipped with high-precision acoustic engineering, low-latency Bluetooth connectivity, and ultra-durable battery longevity for all-day seamless performance."
    elif dept == "Appliances":
        highlight = "Engineered with smart energy-efficient motors, intuitive touch controls, and heavy-duty thermal protection to elevate modern household workflows."
    elif dept == "Home & Kitchen":
        highlight = "Crafted for timeless durability, ergonomic daily handling, and high-heat resistance, seamlessly blending aesthetics with culinary function."
    elif dept == "Beauty & Personal Care":
        highlight = "Dermatologically tested, enriched with nourishing bio-actives and vitamins, designed to restore, protect, and revitalize daily wellness."
    elif dept == "Sports & Fitness":
        highlight = "Constructed to professional tournament standards with reinforced joints and impact-resistant alloys to support rigorous training sessions."
    else:
        highlight = "Tailored with precision stitching, premium breathability, and colorfast dying technology to maintain a crisp, refined look across all occasions."

    desc = (
        f"**Overview & Design**:\n"
        f"The {brand} {title} represents best-in-class craftsmanship in {cat}. Designed with premium {material} in a signature {color} finish, it balances ergonomic comfort with contemporary styling.\n\n"
        f"**Performance & Engineering**:\n"
        f"{highlight} Every unit undergoes rigorous multi-point quality inspections to guarantee stellar performance.\n\n"
        f"**Specifications & Fit**:\n"
        f"- **Material**: {material}\n"
        f"- **Fit Profile**: {fit}\n"
        f"- **Care Instructions**: {care}\n"
        f"- **Country of Origin**: {origin}\n"
        f"- **Authenticity**: 100% Genuine Guaranteed by {merchant_name}\n"
        f"- **Warranty**: Covered by standard manufacturer warranty against defects."
    )
    return desc


def generate_10k_products() -> List[Dict[str, Any]]:
    """
    Produces exactly 10,000 products across all general E-commerce departments:
    - Lifestyle, Fashion, Appliances, Electronics, Home & Kitchen, etc.
    """
    products: List[Dict[str, Any]] = []

    target_count = 10000
    n_subcats = len(SUBCATEGORIES)
    base_per_subcat = target_count // n_subcats
    remainder = target_count % n_subcats

    curr_id = 1
    rng = random.Random(42)  # Deterministic seed for reproducible data

    for subcat_idx, subcat in enumerate(SUBCATEGORIES):
        count_for_this = base_per_subcat + (1 if subcat_idx < remainder else 0)
        dept = subcat["department"]
        cat = subcat["category"]
        noun = subcat["noun"]
        brands = subcat["brands"]
        min_price, max_price = subcat["price"]
        series_pool = subcat.get("series") or ["Pro", "Max", "Plus", "Air", "Core", "Elite", "Prime"]
        desc_pool = subcat.get("descriptors") or ["Premium", "Essential", "Classic", "Ultra", "Daily"]
        materials = subcat.get("materials") or ["Durable composite", "Premium quality material"]
        colors = subcat.get("colors") or ["Black", "White", "Grey", "Blue"]
        genders = subcat.get("genders") or ["Unisex"]
        base_tags = subcat.get("tags") or []
        specs_t = subcat.get("specs_t") or {}
        specs_f = subcat.get("specs_f") or {}
        care_text = subcat.get("care") or "Wipe with damp cloth"

        # Image pool
        subcat_images = SUBCATEGORY_UNSPLASH_POOLS.get(subcat["key"]) or UNSPLASH_POOLS.get(dept, DEFAULT_PHOTOS)

        for item_idx in range(count_for_this):
            # Brand & Price calculation (ordered premium -> budget)
            brand_idx = item_idx % len(brands)
            brand = brands[brand_idx]
            brand_factor = 1.0 - (brand_idx / max(1, len(brands))) * 0.55  # 1.0 down to ~0.45
            
            # Price jitter
            jitter = rng.uniform(0.92, 1.08)
            raw_price = min_price + (max_price - min_price) * brand_factor * jitter
            price = max(min_price, min(max_price, round(raw_price / 10) * 10))
            if price > 500:
                price = round(price / 50) * 50 - 1  # e.g., 1499, 2499, 9999

            # Discount
            discount_pct = rng.choice([10, 15, 20, 25, 30, 35, 40, 50])
            original_price = round(price / (1.0 - discount_pct / 100.0) / 10) * 10 - 1
            if original_price <= price:
                original_price = price + 500

            # Title composition
            series = rng.choice(series_pool)
            descriptor = rng.choice(desc_pool)
            color = rng.choice(colors)
            gender = rng.choice(genders)

            # Build realistic title
            noun_in_desc = noun.lower() in descriptor.lower() or any(w in descriptor.lower() for w in noun.lower().split() if len(w) > 3)
            base_name = descriptor if noun_in_desc else f"{descriptor} {noun}"

            if dept in ["Fashion", "Footwear"]:
                if gender in ["Men", "Women"]:
                    title = f"{gender}'s {base_name} — {color}"
                else:
                    title = f"{base_name} — {color}"
            elif dept == "Electronics":
                variant_str = f" ({subcat['variants'][item_idx % len(subcat['variants'])]})" if subcat.get("variants") else ""
                if brand == "Apple" and subcat["key"] == "smartphones":
                    title = f"iPhone {series} {descriptor}{variant_str}"
                elif brand == "Samsung" and subcat["key"] == "smartphones":
                    title = f"Galaxy {series} {descriptor}{variant_str}"
                elif brand == "Apple" and subcat["key"] == "laptops":
                    title = f"MacBook {series} {descriptor}{variant_str}"
                elif brand == "Apple" and subcat["key"] == "tablets":
                    title = f"iPad {series} {descriptor}{variant_str}"
                else:
                    title = f"{series} {base_name}{variant_str}"
            else:
                title = f"{base_name} — {color}"

            # City & Merchant Association
            city = rng.choice(CITIES)
            merchant = get_merchant_for_product(brand, cat, city)

            # Image
            photo_id = subcat_images[item_idx % len(subcat_images)]
            image_url = _img(photo_id)

            # Build metadata & tiered specs
            meta_dict: Dict[str, Any] = {
                "material": rng.choice(materials),
                "color": color,
                "care": care_text,
                "department": dept,
                "origin": subcat.get("origin", "India"),
                "merchant_id": merchant["merchant_id"],
                "merchant_name": merchant["merchant_name"],
            }

            # Tiered specs aligned with price percentile
            pct = (price - min_price) / max(1, (max_price - min_price))
            for spec_key, spec_vals in specs_t.items():
                s_idx = min(len(spec_vals) - 1, int(pct * len(spec_vals)))
                meta_dict[spec_key] = spec_vals[s_idx]

            # Free specs
            for spec_key, spec_vals in specs_f.items():
                meta_dict[spec_key] = rng.choice(spec_vals)

            # Return policy
            policy = policy_for(dept, subcat["key"])
            meta_dict["returnable"] = policy["returnable"]
            meta_dict["return_window"] = policy["window"]

            # Multi-paragraph detailed description
            description = _build_rich_description(title, brand, dept, cat, meta_dict, merchant["merchant_name"])

            # Tags for TF-IDF & vector retrieval
            title_tokens = [w.lower().strip("(),—") for w in title.split() if len(w) > 2]
            tags_list = list(set(base_tags + title_tokens + [
                brand.lower(),
                cat.lower(),
                dept.lower(),
                color.lower(),
                noun.lower(),
                descriptor.lower(),
                series.lower(),
                gender.lower(),
                merchant["merchant_name"].lower(),
                merchant["merchant_id"].lower(),
            ]))

            # FBT cross-sell IDs - will be populated dynamically after all products are built
            fbt_ids = []

            # Rating & reviews
            rating = round(rng.triangular(3.8, 5.0, 4.5), 1)
            review_count = int(rng.triangular(15, 1200, 150))
            stock = rng.randint(10, 150)

            products.append({
                "id": curr_id,
                "title": title,
                "brand": brand,
                "category": cat,
                "department": dept,
                "gender": gender,
                "color": color,
                "price": float(price),
                "original_price": float(original_price),
                "discount_pct": int(discount_pct),
                "rating": float(rating),
                "review_count": int(review_count),
                "stock": int(stock),
                "city": city,
                "merchant_id": merchant["merchant_id"],
                "merchant_name": merchant["merchant_name"],
                "image_url": image_url,
                "description": description,
                "tags": json.dumps(tags_list),
                "fbt_product_ids": json.dumps(fbt_ids),
                "product_meta": json.dumps(meta_dict),
                "is_active": True,
            })
            curr_id += 1

    # Guarantee unique sequential IDs from 1 to N
    for idx, p in enumerate(products):
        p["id"] = idx + 1

    # Intelligent FBT assignment by department
    from collections import defaultdict
    dept_to_ids = defaultdict(list)
    for p in products:
        dept_to_ids[p["department"]].append(p["id"])

    for p in products:
        dept = p["department"]
        pool = dept_to_ids[dept]
        if len(pool) >= 3:
            fbt = rng.sample([pid for pid in pool if pid != p["id"]], 2)
        else:
            fbt = [((p["id"] + 15) % target_count) + 1, ((p["id"] + 27) % target_count) + 1]
        p["fbt_product_ids"] = json.dumps(fbt)

    return products
