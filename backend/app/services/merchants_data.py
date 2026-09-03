"""
RazorCartAI Merchants Directory (55+ Real-world Verified Merchants)
───────────────────────────────────────────────────────────────────────────────
Used for catalog association, multi-merchant admin telemetry, and ledger attribution.
"""

from typing import List, Dict, Any

MERCHANTS: List[Dict[str, Any]] = [
    {"merchant_id": "merch_001", "merchant_name": "RazorCart Official Store", "email": "store@razorcart.ai", "city": "Bengaluru", "category": "General", "rating": 4.9},
    {"merchant_id": "merch_002", "merchant_name": "Nike Flagship India", "email": "nike.india@merchants.razorcart.ai", "city": "Bengaluru", "category": "Footwear", "rating": 4.8},
    {"merchant_id": "merch_003", "merchant_name": "Puma Sports Hub", "email": "puma.retail@merchants.razorcart.ai", "city": "Bengaluru", "category": "Sportswear", "rating": 4.7},
    {"merchant_id": "merch_004", "merchant_name": "Adidas Performance Lab", "email": "adidas.lab@merchants.razorcart.ai", "city": "Delhi", "category": "Footwear", "rating": 4.8},
    {"merchant_id": "merch_005", "merchant_name": "Apple Authorised Premium Retail", "email": "apple.retail@merchants.razorcart.ai", "city": "Mumbai", "category": "Electronics", "rating": 4.9},
    {"merchant_id": "merch_006", "merchant_name": "Samsung Digital Experience Plaza", "email": "samsung.plaza@merchants.razorcart.ai", "city": "Hyderabad", "category": "Electronics", "rating": 4.7},
    {"merchant_id": "merch_007", "merchant_name": "Sony Audio & Vision Store", "email": "sony.hub@merchants.razorcart.ai", "city": "Chennai", "category": "Electronics", "rating": 4.8},
    {"merchant_id": "merch_008", "merchant_name": "Fabindia Heritage Crafts", "email": "fabindia.crafts@merchants.razorcart.ai", "city": "Jaipur", "category": "Ethnic Wear", "rating": 4.6},
    {"merchant_id": "merch_009", "merchant_name": "Levi's Denim Studio", "email": "levis.studio@merchants.razorcart.ai", "city": "Bengaluru", "category": "Bottomwear", "rating": 4.7},
    {"merchant_id": "merch_010", "merchant_name": "Allen Solly & Van Heusen Hub", "email": "madura.apparel@merchants.razorcart.ai", "city": "Mumbai", "category": "Topwear", "rating": 4.6},
    {"merchant_id": "merch_011", "merchant_name": "Philips Smart Living & Appliances", "email": "philips.living@merchants.razorcart.ai", "city": "Pune", "category": "Appliances", "rating": 4.7},
    {"merchant_id": "merch_012", "merchant_name": "Prestige Home & Kitchen Studio", "email": "prestige.home@merchants.razorcart.ai", "city": "Bengaluru", "category": "Home & Kitchen", "rating": 4.6},
    {"merchant_id": "merch_013", "merchant_name": "L'Oreal Luxe & Beauty Lounge", "email": "loreal.luxe@merchants.razorcart.ai", "city": "Mumbai", "category": "Beauty & Personal Care", "rating": 4.8},
    {"merchant_id": "merch_014", "merchant_name": "Forest Essentials Ayurveda", "email": "forest.essentials@merchants.razorcart.ai", "city": "Delhi", "category": "Beauty & Personal Care", "rating": 4.9},
    {"merchant_id": "merch_015", "merchant_name": "boAt Lifestyle Audio", "email": "boat.audio@merchants.razorcart.ai", "city": "Delhi", "category": "Electronics", "rating": 4.5},
    {"merchant_id": "merch_016", "merchant_name": "OnePlus Official Flagship", "email": "oneplus.flagship@merchants.razorcart.ai", "city": "Bengaluru", "category": "Electronics", "rating": 4.7},
    {"merchant_id": "merch_017", "merchant_name": "Decathlon Sports India", "email": "decathlon.india@merchants.razorcart.ai", "city": "Bengaluru", "category": "Sports & Fitness", "rating": 4.8},
    {"merchant_id": "merch_018", "merchant_name": "Biba Ethnic Fashion House", "email": "biba.fashion@merchants.razorcart.ai", "city": "Jaipur", "category": "Ethnic Wear", "rating": 4.7},
    {"merchant_id": "merch_019", "merchant_name": "Manyavar Celebration Wear", "email": "manyavar.kolkata@merchants.razorcart.ai", "city": "Kolkata", "category": "Ethnic Wear", "rating": 4.8},
    {"merchant_id": "merch_020", "merchant_name": "W for Woman Designer Outlet", "email": "w.designer@merchants.razorcart.ai", "city": "Delhi", "category": "Dresses", "rating": 4.6},
    {"merchant_id": "merch_021", "merchant_name": "H&M Global Fashion Store", "email": "hm.retail@merchants.razorcart.ai", "city": "Mumbai", "category": "Topwear", "rating": 4.6},
    {"merchant_id": "merch_022", "merchant_name": "Zara India Fashion Boutique", "email": "zara.india@merchants.razorcart.ai", "city": "Delhi", "category": "Dresses", "rating": 4.8},
    {"merchant_id": "merch_023", "merchant_name": "ASICS Running Performance", "email": "asics.speed@merchants.razorcart.ai", "city": "Bengaluru", "category": "Footwear", "rating": 4.9},
    {"merchant_id": "merch_024", "merchant_name": "Under Armour Athletic Gear", "email": "ua.athletic@merchants.razorcart.ai", "city": "Mumbai", "category": "Sportswear", "rating": 4.8},
    {"merchant_id": "merch_025", "merchant_name": "Noise Smart Wearables", "email": "noise.tech@merchants.razorcart.ai", "city": "Delhi", "category": "Electronics", "rating": 4.5},
    {"merchant_id": "merch_026", "merchant_name": "Fire-Boltt Smart Gadgets", "email": "fireboltt.store@merchants.razorcart.ai", "city": "Hyderabad", "category": "Electronics", "rating": 4.4},
    {"merchant_id": "merch_027", "merchant_name": "Dyson Technology Store", "email": "dyson.india@merchants.razorcart.ai", "city": "Bengaluru", "category": "Appliances", "rating": 4.9},
    {"merchant_id": "merch_028", "merchant_name": "Havells Home Electricals", "email": "havells.retail@merchants.razorcart.ai", "city": "Delhi", "category": "Appliances", "rating": 4.6},
    {"merchant_id": "merch_029", "merchant_name": "IFB Appliances Hub", "email": "ifb.appliances@merchants.razorcart.ai", "city": "Kolkata", "category": "Appliances", "rating": 4.7},
    {"merchant_id": "merch_030", "merchant_name": "LG Electronics Premium Center", "email": "lg.center@merchants.razorcart.ai", "city": "Chennai", "category": "Appliances", "rating": 4.7},
    {"merchant_id": "merch_031", "merchant_name": "Whirlpool Home Solutions", "email": "whirlpool.solutions@merchants.razorcart.ai", "city": "Pune", "category": "Appliances", "rating": 4.5},
    {"merchant_id": "merch_032", "merchant_name": "Bose Audio Experience Zone", "email": "bose.sound@merchants.razorcart.ai", "city": "Mumbai", "category": "Electronics", "rating": 4.9},
    {"merchant_id": "merch_033", "merchant_name": "JBL Harman Store", "email": "jbl.audio@merchants.razorcart.ai", "city": "Bengaluru", "category": "Electronics", "rating": 4.7},
    {"merchant_id": "merch_034", "merchant_name": "Mamaearth Natural Care", "email": "mamaearth.care@merchants.razorcart.ai", "city": "Delhi", "category": "Beauty & Personal Care", "rating": 4.6},
    {"merchant_id": "merch_035", "merchant_name": "The Body Shop Botanical", "email": "bodyshop.retail@merchants.razorcart.ai", "city": "Mumbai", "category": "Beauty & Personal Care", "rating": 4.8},
    {"merchant_id": "merch_036", "merchant_name": "Nykaa Cosmetics Lounge", "email": "nykaa.lounge@merchants.razorcart.ai", "city": "Mumbai", "category": "Beauty & Personal Care", "rating": 4.7},
    {"merchant_id": "merch_037", "merchant_name": "Plum Goodness Vegan Care", "email": "plum.vegan@merchants.razorcart.ai", "city": "Bengaluru", "category": "Beauty & Personal Care", "rating": 4.7},
    {"merchant_id": "merch_038", "merchant_name": "Titan Watches & Eyewear", "email": "titan.store@merchants.razorcart.ai", "city": "Chennai", "category": "Accessories", "rating": 4.8},
    {"merchant_id": "merch_039", "merchant_name": "Fastrack Youth Hub", "email": "fastrack.youth@merchants.razorcart.ai", "city": "Bengaluru", "category": "Accessories", "rating": 4.5},
    {"merchant_id": "merch_040", "merchant_name": "Ray-Ban Sun & Opticals", "email": "rayban.optics@merchants.razorcart.ai", "city": "Delhi", "category": "Accessories", "rating": 4.9},
    {"merchant_id": "merch_041", "merchant_name": "Fossil Leather & Watches", "email": "fossil.leather@merchants.razorcart.ai", "city": "Mumbai", "category": "Accessories", "rating": 4.7},
    {"merchant_id": "merch_042", "merchant_name": "Wildcraft Adventure Gear", "email": "wildcraft.gear@merchants.razorcart.ai", "city": "Bengaluru", "category": "Sports & Fitness", "rating": 4.6},
    {"merchant_id": "merch_043", "merchant_name": "American Tourister Luggage", "email": "tourister.bags@merchants.razorcart.ai", "city": "Mumbai", "category": "Accessories", "rating": 4.7},
    {"merchant_id": "merch_044", "merchant_name": "Samsonite Travel Boutique", "email": "samsonite.travel@merchants.razorcart.ai", "city": "Delhi", "category": "Accessories", "rating": 4.9},
    {"merchant_id": "merch_045", "merchant_name": "Hawkins Cookers & Cookware", "email": "hawkins.kitchen@merchants.razorcart.ai", "city": "Mumbai", "category": "Home & Kitchen", "rating": 4.8},
    {"merchant_id": "merch_046", "merchant_name": "Borosil Glass & Kitchenware", "email": "borosil.glass@merchants.razorcart.ai", "city": "Ahmedabad", "category": "Home & Kitchen", "rating": 4.8},
    {"merchant_id": "merch_047", "merchant_name": "Cello Opalware & Plastics", "email": "cello.living@merchants.razorcart.ai", "city": "Surat", "category": "Home & Kitchen", "rating": 4.5},
    {"merchant_id": "merch_048", "merchant_name": "Milton Thermosteel Emporium", "email": "milton.steel@merchants.razorcart.ai", "city": "Mumbai", "category": "Home & Kitchen", "rating": 4.7},
    {"merchant_id": "merch_049", "merchant_name": "Sleepwell Comfort Mattresses", "email": "sleepwell.bed@merchants.razorcart.ai", "city": "Delhi", "category": "Home & Kitchen", "rating": 4.7},
    {"merchant_id": "merch_050", "merchant_name": "Wakefit Ergonomic Furniture", "email": "wakefit.home@merchants.razorcart.ai", "city": "Bengaluru", "category": "Home & Kitchen", "rating": 4.8},
    {"merchant_id": "merch_051", "merchant_name": "Urban Ladder Living Studio", "email": "urbanladder.studio@merchants.razorcart.ai", "city": "Bengaluru", "category": "Home & Kitchen", "rating": 4.7},
    {"merchant_id": "merch_052", "merchant_name": "Cosco Sports & Fitness", "email": "cosco.sports@merchants.razorcart.ai", "city": "Delhi", "category": "Sports & Fitness", "rating": 4.5},
    {"merchant_id": "merch_053", "merchant_name": "Nivia Sports Equipment", "email": "nivia.equipment@merchants.razorcart.ai", "city": "Jalandhar", "category": "Sports & Fitness", "rating": 4.6},
    {"merchant_id": "merch_054", "merchant_name": "Yonex Badminton Pro Shop", "email": "yonex.proshop@merchants.razorcart.ai", "city": "Bengaluru", "category": "Sports & Fitness", "rating": 4.9},
    {"merchant_id": "merch_055", "merchant_name": "Penguin Books & Stationery", "email": "penguin.books@merchants.razorcart.ai", "city": "Delhi", "category": "Books & Stationery", "rating": 4.9},
    {"merchant_id": "merch_056", "merchant_name": "Classmate & Paperkraft", "email": "classmate.stationery@merchants.razorcart.ai", "city": "Kolkata", "category": "Books & Stationery", "rating": 4.7},
    {"merchant_id": "merch_057", "merchant_name": "Pedigree & Whiskas Pet Store", "email": "petcare.store@merchants.razorcart.ai", "city": "Bengaluru", "category": "Pet Supplies", "rating": 4.8},
    {"merchant_id": "merch_058", "merchant_name": "Bosch Auto Tools & Accessories", "email": "bosch.auto@merchants.razorcart.ai", "city": "Pune", "category": "Automotive & Tools", "rating": 4.9},
    {"merchant_id": "merch_059", "merchant_name": "Himalaya Wellness Herbal", "email": "himalaya.herbal@merchants.razorcart.ai", "city": "Bengaluru", "category": "Health & Wellness", "rating": 4.7},
    {"merchant_id": "merch_060", "merchant_name": "Lego Official Play World", "email": "lego.toys@merchants.razorcart.ai", "city": "Mumbai", "category": "Toys & Baby", "rating": 4.9}
]

def get_merchant_for_product(brand: str, category: str, city: str = "Bengaluru") -> Dict[str, Any]:
    """Finds the best matching merchant for a given brand/category or falls back to a deterministic match."""
    brand_lower = brand.lower()
    for m in MERCHANTS:
        if brand_lower in m["merchant_name"].lower():
            return m

    # Category matching
    cat_matches = [m for m in MERCHANTS if m["category"].lower() == category.lower()]
    if cat_matches:
        # Prefer city match
        city_matches = [m for m in cat_matches if m["city"].lower() == city.lower()]
        if city_matches:
            return city_matches[0]
        return cat_matches[0]

    # Deterministic fallback based on hash
    idx = abs(hash(f"{brand}_{category}")) % len(MERCHANTS)
    return MERCHANTS[idx]
