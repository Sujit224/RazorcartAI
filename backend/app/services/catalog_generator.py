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

# ── High-Quality Curated Unsplash Photo IDs by Department / Category ────────
UNSPLASH_POOLS: Dict[str, List[str]] = {
    "Electronics": [
        "1511707171634-5f897ff02aa9", "1546868871-7041f2a55e12", "1505740420928-5e560c06d30e",
        "1588872657578-7efd1f1555ed", "1544244015-0df4b3ffc6b0", "1585336261026-7f5a4d3b4178",
        "1527443224154-c4a3942d3acf", "1563770660941-20978e870e26", "1593642632823-8f785ba67e45",
        "1526170375885-4d8ecf77b99f", "1587829741301-dc798b83add3", "1609081219090-a6d81d3085bf",
        "1583394838336-acd977736f90", "1590658268037-6bf12165a8df", "1517336714731-489689fd1ca8",
    ],
    "Fashion": [
        "1521572267360-ee0c2909d518", "1578587018452-892bacefd3d2", "1519241486490-b98b8c5e70de",
        "1585487000160-6a5c4bede7c4", "1541099649105-f69ad21f3246", "1542295669297-ec9e28a15ef1",
        "1523381294911-b0e61a0f6bfe", "1626497764746-6dc36546b388", "1621072716542-b8ff2e5c4ec0",
        "1601987309602-a9766b98c944", "1548693258-27eb42a3e72f", "1583743814966-8936f5b7be1a",
        "1562157873-818bc0726f68", "1591047139829-d91aecb6caea", "1515886657613-9f3515b0c78f",
    ],
    "Footwear": [
        "1542291026-7eec264c27ff", "1584735935682-2f2b69dff9d2", "1600185365926-3a2ce3cdb9eb",
        "1552346154-21d32810aba3", "1595950653106-6c9ebd614d3a", "1608231387042-66d1773070a5",
        "1587563871167-1ee9c731aefb", "1491553895911-0055eca6402d", "1516478177764-9fe5bd7e9717",
        "1539185869925-2f96a6afe9a4", "1614252369475-35b451e55cda", "1524592094681-5b7c7a2a8b88",
        "1622803849083-4de22f734459", "1603487742131-4160ec999306", "1512374382763-bdfd843fe168",
    ],
    "Home & Kitchen": [
        "1584269600464-37b1b58a9fe7", "1556911220-e15b29be8c8f", "1583847268964-b28dc8f51f92",
        "1513694203232-719a280e022f", "1507473885765-e6ed057f782c", "1540518614846-7ede433c4b49",
        "1586023492125-27b2c045efd7", "1512917774080-9991f1c4c750", "1583847268964-b28dc8f51f92",
        "1530587191325-3db32d826c18", "1616486338812-3dadae4b4ace", "1598300042247-d088f8ab3a91",
    ],
    "Appliances": [
        "1571175443880-49e1d25b2bc5", "1585659722983-3a675dabf23d", "1584269600464-37b1b58a9fe7",
        "1556909114-f6e7ad7d3136", "1574269909862-7e1d70bb8078", "1626806787461-102c1bfaaea1",
        "1588854337236-6889d631faa8", "1544816155-12df9643f363", "1556909190-eccf4a8bf97a",
    ],
    "Beauty & Personal Care": [
        "1522337360788-8b13dee7a37e", "1598440947619-2c35fc9aa908", "1571781926291-c477ebfd024b",
        "1556228720-195a672e8a03", "1608248597359-54199999052b", "1567928805192-7f49f07fe92e",
        "1612817288484-6f916006741a", "1526947425960-945c6e72858f", "1617897903246-719242758050",
    ],
    "Sports & Fitness": [
        "1517838277536-f5f99be501cd", "1584735935682-2f2b69dff9d2", "1574680096145-d05b474e2155",
        "1598289431512-b97b0917affc", "1534438327276-14e5300c3a48", "1517836357463-d25dfeac3438",
        "1576678927484-cc907957088c", "1583454110551-21f2fa2afe61", "1518611012118-696072aa579a",
    ],
    "Grocery & Gourmet": [
        "1514432324607-a09d9b4aefdd", "1544787219-7f47ccb76574", "1509440159596-0249088772ff",
        "1587334274328-64186a80aeee", "1563636619-e9143da7973b", "1599940824399-b87987ceb72a",
        "1511920170033-f8396924c348", "1497515114629-f71d768fd07c", "1506368249639-73a05d6f6488",
    ],
    "Books & Stationery": [
        "1544947950-fa07a98d237f", "1512820790803-83ca734da794", "1532012164546-f432f2e3777f",
        "1585779034823-7e9ac8faec70", "1589829085413-56de8ae18c73", "1497633762265-9d179a990aa6",
        "1543002588-bfa74002ed7e", "1495446815901-a7297e633e8d", "1457369804613-52c61a468e7d",
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
    "1505740420928-5e560c06d30e", "1523275335684-37898b6baf30", "1542291026-7eec264c27ff",
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


from .phone_catalog import generate_5000_mobile_phones

def generate_10k_products() -> List[Dict[str, Any]]:
    """
    Produces exactly 10,000 products:
    - 5,000 Flagship & Pro Mobile Phones across top brands (Samsung, Apple, Nokia, OnePlus, Google, Xiaomi, Asus ROG)
    - 5,000 Lifestyle, Fashion, Appliances, and Electronics items.
    """
    products: List[Dict[str, Any]] = []

    # 1. Ingest 5,000 Flagship & Pro Mobile Phones
    phone_products = generate_5000_mobile_phones()
    products.extend(phone_products)

    # 2. Generate remaining (10000 - 70 = 9930) products
    target_count = 10000
    needed = target_count - len(products)
    n_subcats = len(SUBCATEGORIES)
    base_per_subcat = needed // n_subcats
    remainder = needed % n_subcats

    curr_id = len(products) + 1
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
        dept_images = UNSPLASH_POOLS.get(dept, DEFAULT_PHOTOS)

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
            photo_id = dept_images[(item_idx + subcat_idx) % len(dept_images)]
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

            # FBT cross-sell IDs
            fbt_ids = [
                ((curr_id + 3) % target_count) + 1,
                ((curr_id + 7) % target_count) + 1
            ]

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

    return products
