"""
RazorCartAI Canonical Category & Department Ontology Engine
═══════════════════════════════════════════════════════════════════════════════
Provides deterministic and LLM-assisted category normalization, preventing
cross-domain misclassification and keyword contamination.
"""

import re
from typing import Optional, Dict, Tuple, List

# Canonical Taxonomy Tree: Mapping category tokens to (Category, Department)
CATEGORY_ONTOLOGY: Dict[str, Tuple[str, str]] = {
    # ── Electronics & Smartphones ────────────────────────────────────────────
    "mobile": ("Smartphones", "Electronics"),
    "mobiles": ("Smartphones", "Electronics"),
    "phone": ("Smartphones", "Electronics"),
    "phones": ("Smartphones", "Electronics"),
    "smartphone": ("Smartphones", "Electronics"),
    "smartphones": ("Smartphones", "Electronics"),
    "cellphone": ("Smartphones", "Electronics"),
    "cellphones": ("Smartphones", "Electronics"),
    "handset": ("Smartphones", "Electronics"),
    "handsets": ("Smartphones", "Electronics"),
    "iphone": ("Smartphones", "Electronics"),
    "iphones": ("Smartphones", "Electronics"),
    "galaxy": ("Smartphones", "Electronics"),
    "oneplus": ("Smartphones", "Electronics"),
    "pixel": ("Smartphones", "Electronics"),
    "poco": ("Smartphones", "Electronics"),
    
    # ── Laptops & Computing ──────────────────────────────────────────────────
    "laptop": ("Laptops", "Electronics"),
    "laptops": ("Laptops", "Electronics"),
    "macbook": ("Laptops", "Electronics"),
    "notebook": ("Laptops", "Electronics"),
    "ultrabook": ("Laptops", "Electronics"),
    
    # ── Audio & Wearables ────────────────────────────────────────────────────
    "headphone": ("Audio", "Electronics"),
    "headphones": ("Audio", "Electronics"),
    "earphone": ("Audio", "Electronics"),
    "earphones": ("Audio", "Electronics"),
    "earbuds": ("Audio", "Electronics"),
    "airpods": ("Audio", "Electronics"),
    "soundbar": ("Audio", "Electronics"),
    "speaker": ("Audio", "Electronics"),
    "speakers": ("Audio", "Electronics"),
    "smartwatch": ("Wearables", "Electronics"),
    "smartwatches": ("Wearables", "Electronics"),

    # ── Footwear ─────────────────────────────────────────────────────────────
    "shoe": ("Footwear", "Fashion"),
    "shoes": ("Footwear", "Fashion"),
    "sneaker": ("Footwear", "Fashion"),
    "sneakers": ("Footwear", "Fashion"),
    "running shoes": ("Footwear", "Fashion"),
    "runners": ("Footwear", "Fashion"),
    "boot": ("Footwear", "Fashion"),
    "boots": ("Footwear", "Fashion"),
    "sandal": ("Footwear", "Fashion"),
    "sandals": ("Footwear", "Fashion"),
    "slippers": ("Footwear", "Fashion"),
    "footwear": ("Footwear", "Fashion"),

    # ── Topwear & Apparel ────────────────────────────────────────────────────
    "shirt": ("Topwear", "Fashion"),
    "shirts": ("Topwear", "Fashion"),
    "t-shirt": ("Topwear", "Fashion"),
    "tshirt": ("Topwear", "Fashion"),
    "t-shirts": ("Topwear", "Fashion"),
    "tshirts": ("Topwear", "Fashion"),
    "tee": ("Topwear", "Fashion"),
    "tees": ("Topwear", "Fashion"),
    "top": ("Topwear", "Fashion"),
    "tops": ("Topwear", "Fashion"),
    "jacket": ("Topwear", "Fashion"),
    "jackets": ("Topwear", "Fashion"),
    "hoodie": ("Topwear", "Fashion"),
    "hoodies": ("Topwear", "Fashion"),
    "sweater": ("Topwear", "Fashion"),
    "sweaters": ("Topwear", "Fashion"),
    "kurta": ("Topwear", "Fashion"),
    "kurtas": ("Topwear", "Fashion"),
    "topwear": ("Topwear", "Fashion"),

    # ── Bottomwear ───────────────────────────────────────────────────────────
    "jean": ("Bottomwear", "Fashion"),
    "jeans": ("Bottomwear", "Fashion"),
    "pant": ("Bottomwear", "Fashion"),
    "pants": ("Bottomwear", "Fashion"),
    "trouser": ("Bottomwear", "Fashion"),
    "trousers": ("Bottomwear", "Fashion"),
    "shorts": ("Bottomwear", "Fashion"),
    "leggings": ("Bottomwear", "Fashion"),
    "bottomwear": ("Bottomwear", "Fashion"),

    # ── Appliances & Kitchen ─────────────────────────────────────────────────
    "air fryer": ("Kitchen Appliances", "Appliances"),
    "air fryers": ("Kitchen Appliances", "Appliances"),
    "fryer": ("Kitchen Appliances", "Appliances"),
    "microwave": ("Kitchen Appliances", "Appliances"),
    "microwaves": ("Kitchen Appliances", "Appliances"),
    "oven": ("Kitchen Appliances", "Appliances"),
    "ovens": ("Kitchen Appliances", "Appliances"),
    "refrigerator": ("Appliances", "Appliances"),
    "refrigerators": ("Appliances", "Appliances"),
    "fridge": ("Appliances", "Appliances"),
    "blender": ("Kitchen Appliances", "Appliances"),
    "mixer": ("Kitchen Appliances", "Appliances"),
    "grinder": ("Kitchen Appliances", "Appliances"),
    "cooktop": ("Kitchen Appliances", "Appliances"),
    "chimney": ("Kitchen Appliances", "Appliances"),
    "appliances": ("Appliances", "Appliances"),

    # ── Beauty & Personal Care ───────────────────────────────────────────────
    "perfume": ("Beauty", "Beauty & Personal Care"),
    "perfumes": ("Beauty", "Beauty & Personal Care"),
    "fragrance": ("Beauty", "Beauty & Personal Care"),
    "lipstick": ("Beauty", "Beauty & Personal Care"),
    "serum": ("Beauty", "Beauty & Personal Care"),
    "shampoo": ("Beauty", "Beauty & Personal Care"),
    "skincare": ("Beauty", "Beauty & Personal Care"),

    # ── Sports & Fitness ─────────────────────────────────────────────────────
    "dumbbell": ("Sports", "Sports & Fitness"),
    "dumbbells": ("Sports", "Sports & Fitness"),
    "yoga mat": ("Sports", "Sports & Fitness"),
    "treadmill": ("Sports", "Sports & Fitness"),
    "gym": ("Sports", "Sports & Fitness"),
    "sportswear": ("Sportswear", "Sports & Fitness"),

    # ── Books & Genres ──────────────────────────────────────────────────────
    "book": ("Books", "Books"),
    "books": ("Books", "Books"),
    "novel": ("Fiction & Literature", "Books"),
    "novels": ("Fiction & Literature", "Books"),
    "sci-fi": ("Sci-Fi & Cyberpunk", "Books"),
    "scifi": ("Sci-Fi & Cyberpunk", "Books"),
    "science fiction": ("Sci-Fi & Cyberpunk", "Books"),
    "cyberpunk": ("Sci-Fi & Cyberpunk", "Books"),
    "fantasy": ("Fantasy & Epic Saga", "Books"),
    "fiction": ("Fiction & Literature", "Books"),
    "literature": ("Fiction & Literature", "Books"),
    "mystery": ("Mystery & Thriller", "Books"),
    "thriller": ("Mystery & Thriller", "Books"),
    "biography": ("History & Biography", "Books"),
    "history": ("History & Biography", "Books"),
    "business": ("Business & Finance", "Books"),
    "finance": ("Business & Finance", "Books"),
    "investing": ("Business & Finance", "Books"),
    "technology": ("Technology & AI", "Books"),
    "tech": ("Technology & AI", "Books"),
    "self-help": ("Self-Help & Personal Development", "Books"),
    "self help": ("Self-Help & Personal Development", "Books"),
    "philosophy": ("Philosophy & Ethics", "Books"),
    "stoicism": ("Philosophy & Ethics", "Books"),
    "manga": ("Graphic Novels & Manga", "Books"),
    "comics": ("Graphic Novels & Manga", "Books"),
    "graphic novel": ("Graphic Novels & Manga", "Books"),
    "graphic novels": ("Graphic Novels & Manga", "Books"),

    # ── Furniture & Furnishings ──────────────────────────────────────────────
    "furniture": ("Furniture", "Home & Furniture"),
    "sofa": ("Sofas & Couches", "Home & Furniture"),
    "sofas": ("Sofas & Couches", "Home & Furniture"),
    "couch": ("Sofas & Couches", "Home & Furniture"),
    "couches": ("Sofas & Couches", "Home & Furniture"),
    "desk": ("Desks & Study", "Home & Furniture"),
    "desks": ("Desks & Study", "Home & Furniture"),
    "study table": ("Desks & Study", "Home & Furniture"),
    "chair": ("Chairs & Recliners", "Home & Furniture"),
    "chairs": ("Chairs & Recliners", "Home & Furniture"),
    "recliner": ("Chairs & Recliners", "Home & Furniture"),
    "recliners": ("Chairs & Recliners", "Home & Furniture"),
    "table": ("Tables & Dining", "Home & Furniture"),
    "tables": ("Tables & Dining", "Home & Furniture"),
    "dining": ("Tables & Dining", "Home & Furniture"),
    "dining table": ("Tables & Dining", "Home & Furniture"),
    "bed": ("Beds & Wardrobes", "Home & Furniture"),
    "beds": ("Beds & Wardrobes", "Home & Furniture"),
    "wardrobe": ("Beds & Wardrobes", "Home & Furniture"),
    "wardrobes": ("Beds & Wardrobes", "Home & Furniture"),
    # Furnishings & FBT items
    "sofa cover": ("Sofa Covers & Slipcovers", "Home & Furnishings"),
    "sofa covers": ("Sofa Covers & Slipcovers", "Home & Furnishings"),
    "pillow cover": ("Pillow & Cushion Covers", "Home & Furnishings"),
    "pillow covers": ("Pillow & Cushion Covers", "Home & Furnishings"),
    "cushion cover": ("Pillow & Cushion Covers", "Home & Furnishings"),
    "cushion covers": ("Pillow & Cushion Covers", "Home & Furnishings"),
    "curtain": ("Curtains & Drapes", "Home & Furnishings"),
    "curtains": ("Curtains & Drapes", "Home & Furnishings"),
    "drapes": ("Curtains & Drapes", "Home & Furnishings"),
    "table runner": ("Table Runners & Placemats", "Home & Furnishings"),
    "table runners": ("Table Runners & Placemats", "Home & Furnishings"),
    "placemat": ("Table Runners & Placemats", "Home & Furnishings"),
    "placemats": ("Table Runners & Placemats", "Home & Furnishings"),
    "desk mat": ("Desk Mats & Organizers", "Home & Furnishings"),
    "desk mats": ("Desk Mats & Organizers", "Home & Furnishings"),
    "chair pad": ("Chair Cushion Pads", "Home & Furnishings"),
    "chair pads": ("Chair Cushion Pads", "Home & Furnishings"),
}

def resolve_category_from_query(
    user_query: str,
    llm_extracted_category: Optional[str] = None
) -> Tuple[Optional[str], Optional[str]]:
    """
    Combines deterministic regex/keyword matching with LLM extraction to reliably
    identify (category, department) and prevent keyword pollution across domains.
    """
    text_lower = user_query.lower()

    # 1. Direct ontology regex scan (longest matches first)
    sorted_keywords = sorted(CATEGORY_ONTOLOGY.keys(), key=lambda k: -len(k))
    for kw in sorted_keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, text_lower):
            return CATEGORY_ONTOLOGY[kw]

    # 2. Match LLM-extracted category against ontology
    if llm_extracted_category:
        llm_clean = llm_extracted_category.strip().lower()
        if llm_clean in CATEGORY_ONTOLOGY:
            return CATEGORY_ONTOLOGY[llm_clean]
        
        # Stem match
        stem = llm_clean.rstrip('s')
        if stem in CATEGORY_ONTOLOGY:
            return CATEGORY_ONTOLOGY[stem]

        # Department direct match
        for dept in ["Electronics", "Fashion", "Appliances", "Home & Kitchen", "Beauty & Personal Care", "Sports & Fitness", "Books", "Home & Furniture", "Home & Furnishings"]:
            if dept.lower() in llm_clean:
                return (llm_extracted_category, dept)

        return (llm_extracted_category, None)

    return (None, None)
