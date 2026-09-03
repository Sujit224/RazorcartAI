"""
5,000 Flagship & Pro Mobile Phones Catalog Generator for RazorCart AI
───────────────────────────────────────────────────────────────────────────────
Ingests a collection of 5,000 smartphones across all top brands:
- Samsung (Galaxy S24 Ultra, Z Fold6, S23, A55, M35, S-Pen Series)
- Apple (iPhone 16 Pro Max, iPhone 16 Pro, iPhone 15, iPhone 14, SE)
- Nokia (Nokia PureView 5G, XR21 Rugged, X30, G42, Magic Max)
- OnePlus (OnePlus 12, 12R, Open Foldable, Nord 4)
- Google (Pixel 9 Pro XL, Pixel 9 Fold, Pixel 8a)
- Xiaomi / Redmi / POCO (Xiaomi 14 Ultra Leica, POCO F6, Redmi Note 13 Pro+)
- Motorola (Edge 50 Ultra, Razr 50 Ultra, G84)
- Asus ROG (ROG Phone 8 Pro 64GB RAM Gaming Workstation)
- Vivo / Oppo / Nothing / Realme / Sony Xperia

Each smartphone features rich tiered specs:
- Processors: Qualcomm Snapdragon 8 Gen 3, Snapdragon 8s Gen 3, Snapdragon 8 Gen 2, Snapdragon 7+ Gen 3, Apple A18 Pro Bionic, A17 Pro, MediaTek Dimensity 9300+, Google Tensor G4
- RAM options: 64GB RAM (Unified Extreme Gaming / Workstation), 32GB, 24GB LPDDR5X, 16GB, 12GB, 8GB
- High-resolution camera setups (200MP, 108MP, 50MP Sony LYT-900 1-inch, 5x/10x Periscope zoom)
- 120Hz/144Hz/165Hz LTPO AMOLED displays, 5000-6000mAh batteries with 100W+ HyperCharge
"""

import json
import random
from typing import List, Dict, Any
from .merchants_data import get_merchant_for_product

# Curated high-res Unsplash Smartphone photo pools
PHONE_PHOTOS = [
    "1511707171634-5f897ff02aa9", "1598327105666-5b89351aff97", "1580910051074-3eb694886505",
    "1565849904461-04a58ad377e0", "1592750475338-74b7b21085ab", "1546054454-aa26e2b734c7",
    "1574944985070-8f3ebc6b79d2", "1601784551446-20c9e07cdbdb", "1585060544812-6b45742d762f",
    "1567581935884-3349723552ca", "1533228876829-65c94e7b5025", "1584006682522-dc17d6c0d963",
    "1512499617640-c74ae3a79d37", "1570891836654-d4961a7b6929", "1591337676887-a217a6970a8a"
]

CITIES_POOL = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Jaipur", "Kolkata", "Ahmedabad"]

# Smartphone Brand Architectures & Models
PHONE_BRAND_SPECS = [
    {
        "brand": "Samsung",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "Galaxy S24 Ultra 5G", "base_price": 129999, "chip": "Qualcomm Snapdragon 8 Gen 3 for Galaxy", "cam": "200MP Quad Zoom + 50MP 5x Periscope + 100x Space Zoom", "screen": "6.8\" 120Hz Dynamic AMOLED 2X (2600 nits)"},
            {"series": "Galaxy S24+ 5G", "base_price": 99999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP Dual Pixel OIS + 10MP 3x Telephoto", "screen": "6.7\" QHD+ Dynamic AMOLED 2X"},
            {"series": "Galaxy Z Fold 6 5G", "base_price": 164999, "chip": "Qualcomm Snapdragon 8 Gen 3 for Galaxy", "cam": "50MP Triple OIS + Under-Display Cam", "screen": "7.6\" Foldable Dynamic AMOLED 120Hz"},
            {"series": "Galaxy Z Flip 6 5G", "base_price": 109999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP OIS Wide + 12MP Ultra-wide", "screen": "6.7\" FHD+ Dynamic AMOLED 120Hz + 3.4\" Flex Window"},
            {"series": "Galaxy S23 Ultra 5G", "base_price": 89999, "chip": "Qualcomm Snapdragon 8 Gen 2", "cam": "200MP ISOCELL HP2 + 10x Optical Periscope", "screen": "6.8\" Edge QHD+ 120Hz AMOLED"},
            {"series": "Galaxy A55 5G", "base_price": 39999, "chip": "Qualcomm Snapdragon 7+ Gen 3", "cam": "50MP OIS Triple Camera", "screen": "6.6\" 120Hz Super AMOLED Gorilla Victus+"},
            {"series": "Galaxy M35 5G", "base_price": 19999, "chip": "Qualcomm Snapdragon 778G", "cam": "50MP No Shake OIS Camera", "screen": "6.6\" 120Hz sAMOLED (6000mAh Battery)"},
            {"series": "Galaxy S24 Ultra Workstation Edition (64GB RAM)", "base_price": 149999, "chip": "Qualcomm Snapdragon 8 Gen 3 Extreme", "cam": "200MP Pro Master Sensor + 8K RAW Video", "screen": "6.8\" Anti-Reflective Armor AMOLED (64GB RAM Edition)"}
        ],
        "colors": ["Titanium Gray", "Titanium Black", "Titanium Violet", "Titanium Yellow", "Onyx Black", "Marble Gray", "Amber Yellow", "Cobalt Violet"]
    },
    {
        "brand": "Apple",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "iPhone 16 Pro Max", "base_price": 144900, "chip": "Apple A18 Pro Bionic (6-Core GPU)", "cam": "48MP Fusion Camera + 5x Tetraprism Telephoto + 4K120fps Dolby Vision", "screen": "6.9\" Super Retina XDR OLED ProMotion 120Hz"},
            {"series": "iPhone 16 Pro", "base_price": 119900, "chip": "Apple A18 Pro Bionic", "cam": "48MP Fusion + 48MP Ultra Wide + 5x Telephoto", "screen": "6.3\" Super Retina XDR OLED ProMotion 120Hz"},
            {"series": "iPhone 16 Plus", "base_price": 89900, "chip": "Apple A18 Bionic", "cam": "48MP Fusion + 2x Telephoto Sensor-Shift", "screen": "6.7\" Super Retina XDR OLED"},
            {"series": "iPhone 16", "base_price": 79900, "chip": "Apple A18 Bionic", "cam": "48MP 2-in-1 Fusion Camera + Action Button", "screen": "6.1\" Super Retina XDR OLED Ceramic Shield"},
            {"series": "iPhone 15 Pro Max", "base_price": 134900, "chip": "Apple A17 Pro Bionic (Hardware Ray Tracing)", "cam": "48MP Pro System + 5x Optical Zoom", "screen": "6.7\" Super Retina XDR ProMotion"},
            {"series": "iPhone 15", "base_price": 69900, "chip": "Apple A16 Bionic", "cam": "48MP Main with 2x Telephoto + Dynamic Island", "screen": "6.1\" Super Retina XDR OLED"},
            {"series": "iPhone 14", "base_price": 57900, "chip": "Apple A15 Bionic (5-Core GPU)", "cam": "12MP Dual Pixel OIS Camera", "screen": "6.1\" Super Retina XDR"},
            {"series": "iPhone 16 Pro Max Extreme Studio (64GB Unified RAM)", "base_price": 189900, "chip": "Apple A18 Pro Max Neural Core", "cam": "48MP ProRes RAW + Log 2 Encoding", "screen": "6.9\" Titanium Grade 5 ProMotion OLED (64GB Unified RAM)"}
        ],
        "colors": ["Desert Titanium", "Natural Titanium", "White Titanium", "Black Titanium", "Ultramarine", "Teal", "Pink", "Deep Purple", "Midnight"]
    },
    {
        "brand": "Nokia",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "PureView 5G Ultra Pro", "base_price": 54999, "chip": "Qualcomm Snapdragon 8 Gen 2", "cam": "108MP Zeiss Optics Penta-Cam with RAW HDR", "screen": "6.7\" 120Hz PureDisplay OLED (Gorilla Glass Victus)"},
            {"series": "Magic Max 5G (64GB RAM Edition)", "base_price": 64999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "200MP Zeiss Sensor + 32MP Telephoto", "screen": "6.8\" 144Hz Super AMOLED 2K (64GB High-Density RAM)"},
            {"series": "XR21 Rugged Military 5G", "base_price": 44999, "chip": "Qualcomm Snapdragon 695 5G", "cam": "64MP AI Dual Camera with OZO Audio Capture", "screen": "6.49\" FHD+ 120Hz Wet-Touch Protected (IP69K Certified)"},
            {"series": "X30 5G Eco Flagship", "base_price": 36999, "chip": "Qualcomm Snapdragon 695 5G", "cam": "50MP PureView OIS Camera with Dark Vision", "screen": "6.43\" 90Hz AMOLED PureDisplay"},
            {"series": "G42 5G QuickFix Repairable", "base_price": 12999, "chip": "Qualcomm Snapdragon 480+ 5G", "cam": "50MP AI Triple Camera + OZO 3D Audio", "screen": "6.56\" 90Hz HD+ with 3-Day Battery"}
        ],
        "colors": ["Zeiss Blue", "Nordic Ice", "Charcoal Gray", "Pine Green", "So Grey", "Meteorite Black", "Polar Night"]
    },
    {
        "brand": "OnePlus",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "OnePlus 12 5G", "base_price": 64999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP Sony LYT-808 + 64MP 3x Periscope (Hasselblad)", "screen": "6.82\" 2K 120Hz ProXDR LTPO AMOLED (4500 nits)"},
            {"series": "OnePlus 12R 5G", "base_price": 39999, "chip": "Qualcomm Snapdragon 8 Gen 2", "cam": "50MP Sony IMX890 OIS + 100W SUPERVOOC", "screen": "6.78\" 120Hz 1.5K LTPO4 AMOLED (5500mAh)"},
            {"series": "OnePlus Open Foldable 5G", "base_price": 139999, "chip": "Qualcomm Snapdragon 8 Gen 2", "cam": "48MP LYTIA Dual-Layer Transistor OIS Hasselblad", "screen": "7.82\" 2K 120Hz Flexi-Fluid AMOLED"},
            {"series": "OnePlus Nord 4 5G", "base_price": 29999, "chip": "Qualcomm Snapdragon 7+ Gen 3", "cam": "50MP Sony LYT-600 OIS (Metal Unibody Design)", "screen": "6.74\" 120Hz 1.5K Ultra AMOLED"},
            {"series": "OnePlus 12 Extreme Gaming Edition (64GB RAM)", "base_price": 79999, "chip": "Qualcomm Snapdragon 8 Gen 3 HyperBoost", "cam": "50MP Hasselblad Dual OIS + 100W GaN Fast Charger", "screen": "6.82\" 2K 120Hz ProXDR (64GB LPDDR5X RAM)"}
        ],
        "colors": ["Flowy Emerald", "Silky Black", "Cool Blue", "Iron Gray", "Oasis Green", "Mercury Silver", "Obsidian Black"]
    },
    {
        "brand": "Google",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "Pixel 9 Pro XL 5G", "base_price": 124999, "chip": "Google Tensor G4 (Titan M2 Security)", "cam": "50MP Octa PD + 48MP 5x Quad Telephoto + 30x Super Res Zoom", "screen": "6.8\" Super Actua LTPO OLED 120Hz (3000 nits)"},
            {"series": "Pixel 9 Pro 5G", "base_price": 109999, "chip": "Google Tensor G4", "cam": "50MP Pro Camera System + Gemini AI Nano On-Device", "screen": "6.3\" Super Actua OLED 120Hz"},
            {"series": "Pixel 9 5G", "base_price": 79999, "chip": "Google Tensor G4", "cam": "50MP Advanced Dual Rear + Macro Focus", "screen": "6.3\" Actua OLED 120Hz"},
            {"series": "Pixel 8 Pro 5G", "base_price": 84999, "chip": "Google Tensor G3", "cam": "50MP with Temperature Sensor + Pro Controls", "screen": "6.7\" Super Actua LTPO OLED 120Hz"}
        ],
        "colors": ["Obsidian", "Porcelain", "Hazel", "Rose Quartz", "Bay Blue", "Mint Green"]
    },
    {
        "brand": "Xiaomi",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "14 Ultra 5G Leica", "base_price": 99999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP 1-inch LYT-900 Quad Camera + Dual Telephoto Leica Summilux", "screen": "6.73\" WQHD+ 120Hz LTPO AMOLED (3000 nits)"},
            {"series": "14 Pro 5G", "base_price": 69999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP Light Fusion 900 Variable Aperture f/1.42", "screen": "6.36\" 120Hz LTPO OLED"},
            {"series": "Redmi Note 13 Pro+ 5G", "base_price": 31999, "chip": "MediaTek Dimensity 7200 Ultra", "cam": "200MP OIS Super QPD + 120W HyperCharge", "screen": "6.67\" 3D Curved 1.5K 120Hz AMOLED IP68"},
            {"series": "POCO F6 Pro 5G", "base_price": 33999, "chip": "Qualcomm Snapdragon 8 Gen 2", "cam": "50MP Light Hunter 800 OIS (LiquidCool 4.0)", "screen": "6.67\" WQHD+ 120Hz Flow AMOLED"},
            {"series": "14 Ultra Studio Pro (64GB RAM)", "base_price": 119999, "chip": "Qualcomm Snapdragon 8 Gen 3 Pro Edition", "cam": "50MP Quad Leica All-Star Sensors (8K Dolby Vision)", "screen": "6.73\" 120Hz LTPO AMOLED (64GB RAM Workstation)"}
        ],
        "colors": ["Titanium Black", "Leica White", "Aurora Purple", "Fusion Camo", "Midnight Dark", "Fusion White"]
    },
    {
        "brand": "Motorola",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "Edge 50 Ultra 5G", "base_price": 59999, "chip": "Qualcomm Snapdragon 8s Gen 3", "cam": "50MP AI Panton-Validated + 64MP 3x Periscope Zoom", "screen": "6.7\" 144Hz 1.5K Super HD pOLED (Real Wood Back)"},
            {"series": "Razr 50 Ultra Foldable 5G", "base_price": 89999, "chip": "Qualcomm Snapdragon 8s Gen 3", "cam": "50MP Dual OIS + 4.0\" External LTPO Display", "screen": "6.9\" 165Hz Foldable FHD+ pOLED"},
            {"series": "Edge 50 Pro 5G", "base_price": 31999, "chip": "Qualcomm Snapdragon 7 Gen 3", "cam": "50MP AI Photo Enhancement Engine + 125W TurboPower", "screen": "6.7\" 144Hz 1.5K 3D Curved pOLED"}
        ],
        "colors": ["Nordic Wood", "Peach Fuzz", "Forest Gray", "Spring Green", "Midnight Blue", "Hot Pink"]
    },
    {
        "brand": "Asus",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "ROG Phone 8 Pro Extreme Gaming (64GB RAM)", "base_price": 119999, "chip": "Qualcomm Snapdragon 8 Gen 3 (3.3GHz Overclocked)", "cam": "50MP Sony IMX890 6-Axis Gimbal Stabilizer", "screen": "6.78\" 165Hz LTPO Samsung Flexible AMOLED (64GB RAM)"},
            {"series": "ROG Phone 8 5G", "base_price": 79999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP Gimbal OIS + 32MP Telephoto 3x", "screen": "6.78\" 165Hz E6 AMOLED (AniMe Vision Display)"},
            {"series": "Zenfone 11 Ultra 5G", "base_price": 69999, "chip": "Qualcomm Snapdragon 8 Gen 3", "cam": "50MP Gimbal OIS + AI Noise Cancellation 3.0", "screen": "6.78\" 144Hz LTPO AMOLED"}
        ],
        "colors": ["Phantom Black", "Rebel Gray", "Skyline Blue", "Storm White"]
    },
    {
        "brand": "Vivo",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "X100 Pro 5G Zeiss", "base_price": 89999, "chip": "MediaTek Dimensity 9300+", "cam": "50MP 1-inch Sony IMX989 + 50MP Zeiss APO Floating Telephoto", "screen": "6.78\" 120Hz LTPO AMOLED (3000 nits)"},
            {"series": "V30 Pro 5G Zeiss", "base_price": 41999, "chip": "MediaTek Dimensity 8200 5G", "cam": "50MP Triple Zeiss Professional Portrait + Studio Aura Light", "screen": "6.78\" 120Hz 3D Curved 1.5K AMOLED"}
        ],
        "colors": ["Asteroid Black", "Sunset Orange", "Andaman Blue", "Classic Black"]
    },
    {
        "brand": "Nothing",
        "category": "Electronics",
        "department": "Electronics",
        "models": [
            {"series": "Phone (2) 5G Glyph", "base_price": 36999, "chip": "Qualcomm Snapdragon 8+ Gen 1", "cam": "50MP Sony IMX890 Dual OIS + Glyph Lighting Matrix", "screen": "6.7\" 120Hz LTPO OLED (Nothing OS 2.5)"},
            {"series": "Phone (2a) Plus 5G", "base_price": 27999, "chip": "MediaTek Dimensity 7350 Pro 5G", "cam": "50MP Dual Camera with TrueLens Engine", "screen": "6.7\" 120Hz Flexible AMOLED (1300 nits)"}
        ],
        "colors": ["Dark Grey", "White", "Milk White", "Black"]
    }
]

def generate_5000_mobile_phones() -> List[Dict[str, Any]]:
    """
    Generates a dataset of 5,000 distinct smartphones with detailed technical specifications,
    verified merchant linkages, Qualcomm/Bionic/Dimensity chipsets, RAM options up to 64GB,
    and search tags for semantic vector search and attribute filtering.
    """
    phones: List[Dict[str, Any]] = []
    rng = random.Random(1337)
    
    ram_options = ["8GB RAM", "12GB RAM", "16GB RAM", "24GB RAM", "32GB RAM", "64GB RAM"]
    storage_options = ["128GB Storage", "256GB Storage", "512GB Storage", "1TB UFS 4.0 Storage"]

    total_target = 5000
    p_idx = 1

    while len(phones) < total_target:
        for brand_data in PHONE_BRAND_SPECS:
            if len(phones) >= total_target:
                break
                
            brand = brand_data["brand"]
            category = "Electronics"
            models = brand_data["models"]
            colors = brand_data["colors"]

            for model in models:
                if len(phones) >= total_target:
                    break

                series = model["series"]
                base_price = model["base_price"]
                chip = model["chip"]
                cam = model["cam"]
                screen = model["screen"]
                
                # Check if this model is a special 64GB RAM edition
                is_64gb_edition = "64GB" in series
                if is_64gb_edition:
                    ram = "64GB Unified Extreme RAM"
                    storage = "1TB UFS 4.0 High-Speed NVMe Storage"
                else:
                    ram = rng.choice(ram_options)
                    storage = rng.choice(storage_options)

                color = rng.choice(colors)
                city = rng.choice(CITIES_POOL)
                merchant = get_merchant_for_product(brand, "Electronics", city)

                # Price variation based on RAM / Storage tier
                price_multiplier = 1.0
                if "64GB" in ram:
                    price_multiplier = 1.35
                elif "24GB" in ram or "32GB" in ram:
                    price_multiplier = 1.2
                elif "16GB" in ram:
                    price_multiplier = 1.1
                elif "8GB" in ram:
                    price_multiplier = 0.92

                if "1TB" in storage:
                    price_multiplier += 0.15
                elif "512GB" in storage:
                    price_multiplier += 0.08

                selling_price = round((base_price * price_multiplier * rng.uniform(0.96, 1.04)) / 100) * 100 - 1
                discount_pct = rng.choice([10, 12, 15, 18, 20, 25, 30])
                original_price = round(selling_price / (1.0 - discount_pct / 100.0) / 100) * 100 - 1

                # Construct clean, professional title
                title = f"{brand} {series} ({ram}, {storage}, {color})"

                # Build rich multi-paragraph description
                description = (
                    f"**Overview & Design**:\n"
                    f"The {brand} {series} is a flagship smartphone engineered for ultimate mobile productivity, pro photography, and gaming. Finished in aerospace-grade {color} with IP68/IP69 water and dust resistance.\n\n"
                    f"**Processor & Performance**:\n"
                    f"- **Processor / Chipset**: {chip}\n"
                    f"- **Memory (RAM)**: {ram}\n"
                    f"- **Internal Storage**: {storage}\n"
                    f"- **Operating System**: Android 14 / iOS with 5+ years of guaranteed software & security updates.\n\n"
                    f"**Display & Visuals**:\n"
                    f"- **Display**: {screen}\n"
                    f"- **Refresh Rate**: 120Hz – 165Hz LTPO Adaptive Fluid Motion\n\n"
                    f"**Camera & Optics**:\n"
                    f"- **Camera System**: {cam}\n"
                    f"- **Video Recording**: 8K/4K 60fps Dolby Vision HDR with Optical Image Stabilization (OIS)\n\n"
                    f"**Battery & Charging**:\n"
                    f"- **Battery**: 5000mAh – 6000mAh Dual-Cell Battery with Fast HyperCharge & Wireless Qi Support\n\n"
                    f"**Authenticity & Merchant Guarantee**:\n"
                    f"- **Seller**: Sold and fulfilled by {merchant['merchant_name']} (📍 {city})\n"
                    f"- **Warranty**: 1-Year Comprehensive Brand Warranty + 7-Day Replacement Guarantee."
                )

                # Construct comprehensive search tags for semantic & BM25 retrieval
                tags = [
                    "mobile phone", "smartphone", "phone", "phones", "mobile", "electronics",
                    brand.lower(),
                    series.lower(),
                    color.lower(),
                    chip.lower(),
                    ram.lower(),
                    storage.lower(),
                    "5g", "amoled", "oled", "camera", "gaming", "fast charging", "dual sim", "esim",
                    merchant["merchant_name"].lower(),
                    merchant["merchant_id"].lower(),
                    city.lower(),
                ]
                if "qualcomm" in chip.lower() or "snapdragon" in chip.lower():
                    tags.extend(["qualcomm", "qualcomm processor", "snapdragon", "snapdragon processor", "snapdragon 8 gen 3", "snapdragon 8s gen 3", "snapdragon 8 gen 2"])
                if "64gb" in ram.lower():
                    tags.extend(["64gb", "64gb ram", "64 gb ram", "64 gb", "64gb ram mobile", "64gb ram phone", "64gb memory"])
                if "32gb" in ram.lower() or "24gb" in ram.lower():
                    tags.extend(["24gb ram", "32gb ram", "high ram", "gaming ram"])
                if "16gb" in ram.lower():
                    tags.extend(["16gb ram", "16 gb ram"])
                if "apple" in brand.lower() or "iphone" in series.lower():
                    tags.extend(["apple", "iphone", "ios", "bionic", "a18 pro", "a17 pro"])
                if "samsung" in brand.lower():
                    tags.extend(["samsung", "galaxy", "s24 ultra", "s-pen", "periscope"])
                if "nokia" in brand.lower():
                    tags.extend(["nokia", "pureview", "zeiss", "rugged", "magic max"])

                # Metadata dictionary
                metadata_dict = {
                    "processor": chip,
                    "ram": ram,
                    "storage": storage,
                    "display": screen,
                    "camera": cam,
                    "color": color,
                    "brand": brand,
                    "city": city,
                    "merchant_id": merchant["merchant_id"],
                    "merchant_name": merchant["merchant_name"],
                    "warranty": "1 Year Manufacturer Warranty",
                    "returnable": True,
                    "return_window": 7
                }

                # FBT Accessories (e.g. fast wireless charger, earbuds, protection case)
                fbt_ids = [((p_idx + 15) % 5000) + 1, ((p_idx + 27) % 5000) + 1]

                photo_id = PHONE_PHOTOS[(p_idx + len(phones)) % len(PHONE_PHOTOS)]
                image_url = f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=600&h=800&q=80"

                rating = round(rng.triangular(4.2, 5.0, 4.7), 1)
                review_count = int(rng.triangular(40, 1800, 250))
                stock = rng.randint(15, 80)

                phones.append({
                    "id": p_idx,
                    "title": title,
                    "brand": brand,
                    "category": "Smartphones",
                    "department": "Electronics",
                    "gender": "Unisex",
                    "color": color,
                    "price": float(selling_price),
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
                    "tags": json.dumps(list(set(tags))),
                    "fbt_product_ids": json.dumps(fbt_ids),
                    "product_meta": json.dumps(metadata_dict),
                    "is_active": True,
                })
                p_idx += 1

    return phones
