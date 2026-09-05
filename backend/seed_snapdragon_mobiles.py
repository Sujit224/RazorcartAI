"""
Seed Script: Seed 1000+ Qualcomm Snapdragon Mobiles (₹20,000 - ₹50,000)
═══════════════════════════════════════════════════════════════════════════════
Populates database catalog with diverse Qualcomm Snapdragon powered smartphones
ranging from ₹20,000 to ₹50,000 across top brands (OnePlus, iQOO, Samsung,
Xiaomi, Motorola, Realme, Nothing, Poco, Vivo, Oppo) with full metadata,
tags (including typo variants like 'qualcom', 'snapdraogon'), and specs.
"""

import json
import random
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, SessionLocal
from app.models.product import Product
from app.services.vector_store import vector_store

# Qualcomm Snapdragon Processors in the ₹20,000 - ₹50,000 segment
SNAPDRAGON_PROCESSORS = [
    "Qualcomm Snapdragon 8 Gen 3",
    "Qualcomm Snapdragon 8s Gen 3",
    "Qualcomm Snapdragon 8 Gen 2",
    "Qualcomm Snapdragon 7+ Gen 3",
    "Qualcomm Snapdragon 7s Gen 2",
    "Qualcomm Snapdragon 7 Gen 3",
    "Qualcomm Snapdragon 888 5G",
    "Qualcomm Snapdragon 870 5G",
    "Qualcomm Snapdragon 778G+ 5G",
    "Qualcomm Snapdragon 695 5G",
]

BRANDS_MODELS = {
    "OnePlus": [
        ("Nord 4 5G", ["Qualcomm Snapdragon 7+ Gen 3"], ["8GB", "12GB", "16GB"], ["128GB", "256GB", "512GB"], 28999, 35999),
        ("12R 5G", ["Qualcomm Snapdragon 8 Gen 2"], ["8GB", "16GB"], ["128GB", "256GB"], 38999, 45999),
        ("Nord CE 4 5G", ["Qualcomm Snapdragon 7 Gen 3"], ["8GB"], ["128GB", "256GB"], 24999, 27999),
        ("Nord 3 5G Snapdragon Edition", ["Qualcomm Snapdragon 778G+ 5G"], ["8GB", "12GB"], ["128GB", "256GB"], 22999, 25999),
        ("11R 5G", ["Qualcomm Snapdragon 8+ Gen 1"], ["8GB", "16GB"], ["128GB", "256GB"], 32999, 39999),
    ],
    "iQOO": [
        ("Neo 9 Pro 5G", ["Qualcomm Snapdragon 8 Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 34999, 39999),
        ("Neo 7 Pro 5G", ["Qualcomm Snapdragon 8+ Gen 1"], ["8GB", "12GB"], ["128GB", "256GB"], 29999, 33999),
        ("Z9 Turbo 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["12GB", "16GB"], ["256GB", "512GB"], 27999, 31999),
        ("Z9s Pro 5G", ["Qualcomm Snapdragon 7 Gen 3"], ["8GB", "12GB"], ["128GB", "256GB"], 24999, 28999),
        ("12 5G Flash Edition", ["Qualcomm Snapdragon 8 Gen 3"], ["12GB", "16GB"], ["256GB", "512GB"], 48999, 49999),
    ],
    "Samsung": [
        ("Galaxy S23 FE 5G (Snapdragon Edition)", ["Qualcomm Snapdragon 8 Gen 1"], ["8GB"], ["128GB", "256GB"], 39999, 44999),
        ("Galaxy S22 5G", ["Qualcomm Snapdragon 8 Gen 1"], ["8GB"], ["128GB", "256GB"], 36999, 41999),
        ("Galaxy A55 5G Pro", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 34999, 38999),
        ("Galaxy M55 5G", ["Qualcomm Snapdragon 7 Gen 1"], ["8GB", "12GB"], ["128GB", "256GB"], 23999, 27999),
        ("Galaxy S23 5G (Compact)", ["Qualcomm Snapdragon 8 Gen 2"], ["8GB"], ["128GB", "256GB"], 46999, 49999),
    ],
    "Poco": [
        ("F6 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["8GB", "12GB"], ["256GB", "512GB"], 27999, 32999),
        ("X6 Pro 5G Snapdragon Edition", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["256GB", "512GB"], 21999, 25999),
        ("F5 5G", ["Qualcomm Snapdragon 7+ Gen 2"], ["8GB", "12GB"], ["256GB"], 23999, 26999),
        ("X6 5G Neo", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 20999, 23999),
        ("F6 Pro 5G", ["Qualcomm Snapdragon 8 Gen 2"], ["12GB", "16GB"], ["256GB", "512GB"], 36999, 41999),
    ],
    "Motorola": [
        ("Edge 50 Pro 5G", ["Qualcomm Snapdragon 7 Gen 3"], ["8GB", "12GB"], ["256GB"], 31999, 35999),
        ("Edge 50 Fusion 5G", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 22999, 25999),
        ("Edge 40 Neo Snapdragon Edition", ["Qualcomm Snapdragon 778G+ 5G"], ["8GB", "12GB"], ["128GB", "256GB"], 21999, 24999),
        ("Razr 40 5G Flip", ["Qualcomm Snapdragon 7 Gen 1"], ["8GB"], ["256GB"], 42999, 46999),
        ("Edge 50 Ultra 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["12GB", "16GB"], ["512GB"], 48999, 49999),
    ],
    "Xiaomi": [
        ("14 Civi 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["8GB", "12GB"], ["256GB", "512GB"], 42999, 47999),
        ("Redmi Note 13 Pro+ 5G (Snapdragon Special)", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["256GB", "512GB"], 28999, 32999),
        ("13T Pro 5G", ["Qualcomm Snapdragon 8 Gen 2"], ["12GB"], ["256GB", "512GB"], 39999, 44999),
        ("Redmi Note 13 Pro 5G", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 23999, 27999),
        ("12 Pro 5G", ["Qualcomm Snapdragon 8 Gen 1"], ["8GB", "12GB"], ["256GB"], 31999, 35999),
    ],
    "Realme": [
        ("GT 6T 5G", ["Qualcomm Snapdragon 7+ Gen 3"], ["8GB", "12GB"], ["128GB", "256GB", "512GB"], 24999, 29999),
        ("GT 6 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["8GB", "12GB", "16GB"], ["256GB", "512GB"], 39999, 44999),
        ("12 Pro+ 5G", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 29999, 33999),
        ("12 Pro 5G", ["Qualcomm Snapdragon 6 Gen 1"], ["8GB"], ["128GB", "256GB"], 21999, 24999),
        ("GT Neo 6 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["12GB", "16GB"], ["256GB", "512GB"], 34999, 38999),
    ],
    "Nothing": [
        ("Phone (2) 5G", ["Qualcomm Snapdragon 8+ Gen 1"], ["8GB", "12GB"], ["128GB", "256GB", "512GB"], 36999, 42999),
        ("Phone (2a) Plus 5G (Snapdragon Edition)", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB", "12GB"], ["128GB", "256GB"], 25999, 28999),
        ("Phone (2a) Special Edition", ["Qualcomm Snapdragon 7 Gen 3"], ["12GB"], ["256GB"], 27999, 30999),
    ],
    "Vivo": [
        ("T3 Ultra 5G", ["Qualcomm Snapdragon 8s Gen 3"], ["8GB", "12GB"], ["128GB", "256GB"], 31999, 35999),
        ("V30 Pro 5G (Snapdragon Edition)", ["Qualcomm Snapdragon 7 Gen 3"], ["8GB", "12GB"], ["256GB", "512GB"], 41999, 46999),
        ("T3 Pro 5G", ["Qualcomm Snapdragon 7 Gen 3"], ["8GB"], ["128GB", "256GB"], 24999, 27999),
        ("V29 5G", ["Qualcomm Snapdragon 778G 5G"], ["8GB", "12GB"], ["128GB", "256GB"], 30999, 34999),
        ("X90s Snapdragon Edition", ["Qualcomm Snapdragon 8 Gen 2"], ["12GB"], ["256GB"], 47999, 49999),
    ],
    "Oppo": [
        ("Reno 11 Pro 5G (Snapdragon Edition)", ["Qualcomm Snapdragon 8+ Gen 1"], ["12GB"], ["256GB", "512GB"], 37999, 41999),
        ("F27 Pro+ 5G", ["Qualcomm Snapdragon 7s Gen 2"], ["8GB"], ["128GB", "256GB"], 27999, 30999),
        ("Reno 12 5G", ["Qualcomm Snapdragon 7+ Gen 3"], ["8GB", "12GB"], ["256GB"], 32999, 36999),
        ("Find X6 Lite 5G", ["Qualcomm Snapdragon 778G 5G"], ["8GB"], ["128GB"], 23999, 26999),
    ]
}

COLORS = [
    "Phantom Black", "Glacier Blue", "Emerald Green", "Titanium Gray", 
    "Sunset Gold", "Obsidian Black", "Marble White", "Starlight Silver",
    "Cosmic Blue", "Cyber Purple", "Lush Green", "Frosted White"
]

CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"]

PHONE_IMAGES = [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574944985070-8f30c4397e3c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80",
]


def seed_snapdragon_mobiles(target_count: int = 1000):
    db = SessionLocal()
    try:
        print(f"Starting seed for {target_count} Qualcomm Snapdragon Mobiles (Rs. 20,000 - Rs. 50,000)...")

        # Fetch existing mobile accessories for FBT assignment
        accessory_ids = [r[0] for r in db.query(Product.id).filter(Product.category.ilike("%Accessori%")).limit(50).all()]
        if not accessory_ids:
            accessory_ids = [101, 102, 103, 104]

        new_products = []
        created_count = 0

        # Loop until target_count is reached
        while created_count < target_count:
            brand = random.choice(list(BRANDS_MODELS.keys()))
            models = BRANDS_MODELS[brand]
            model_info = random.choice(models)

            model_name, proc_options, ram_options, storage_options, min_p, max_p = model_info

            processor = random.choice(proc_options)
            ram = random.choice(ram_options)
            storage = random.choice(storage_options)
            color = random.choice(COLORS)
            city = random.choice(CITIES)
            image_url = random.choice(PHONE_IMAGES)

            # Generate price between 20,000 and 50,000
            price_base = random.randint(min_p, max_p)
            price = float((price_base // 1000) * 1000 + random.choice([999, 499, 899]))
            if price < 20000.0:
                price = 20999.0
            elif price > 50000.0:
                price = 49999.0

            discount_pct = random.choice([10, 12, 15, 18, 20, 25])
            original_price = round(price / (1 - (discount_pct / 100.0)), 2)

            rating = round(random.uniform(4.3, 4.9), 1)
            review_count = random.randint(150, 4500)
            stock = random.randint(15, 120)

            title = f"{brand} {model_name} ({processor}, {ram} RAM, {storage})"

            # Tags including typo variants requested by user ('qualcom', 'snapdraogon')
            tags = [
                "mobiles", "mobile", "smartphones", "smartphone", "phone", "phones", "handset",
                "qualcomm", "snapdragon", "qualcom", "snapdraogon", "chip", "chipset", "processor",
                brand.lower(), model_name.lower().split()[0], "5g", "android",
                f"{int(price)}", "20000-50000", "under 50000", "under 50k", "under 30000", "under 40000"
            ]

            meta = {
                "department": "Electronics",
                "processor": processor,
                "ram": ram,
                "storage": storage,
                "display": "6.7 inch 120Hz LTPO AMOLED",
                "battery": f"{random.choice([4800, 5000, 5500])} mAh Fast Charge",
                "camera": "50MP Sony OIS Primary + 12MP Ultra-wide",
                "chipset": "Qualcomm Snapdragon",
                "network": "5G Dual SIM",
                "os": "Android 14"
            }

            fbt_ids = random.sample(accessory_ids, k=min(2, len(accessory_ids))) if accessory_ids else []

            p = Product(
                title=title,
                brand=brand,
                category="Smartphones",
                department="Electronics",
                gender="Unisex",
                color=color,
                price=price,
                original_price=original_price,
                discount_pct=discount_pct,
                rating=rating,
                review_count=review_count,
                stock=stock,
                city=city,
                merchant_id="merch_001",
                merchant_name="RazorCart Official Store",
                image_url=image_url,
                description=f"Flagship performance smartphone powered by {processor}. Features {ram} RAM, {storage} ultra-fast UFS storage, 120Hz LTPO AMOLED display, Sony OIS camera system, 5000mAh battery, and localized price guarantee.",
                tags=json.dumps(tags),
                fbt_product_ids=json.dumps(fbt_ids),
                product_meta=json.dumps(meta),
                is_active=True,
                created_at=datetime.utcnow()
            )

            new_products.append(p)
            created_count += 1

            if len(new_products) >= 200:
                db.bulk_save_objects(new_products)
                db.commit()
                print(f"  Inserted {created_count}/{target_count} Qualcomm Snapdragon Mobiles...")
                new_products = []

        if new_products:
            db.bulk_save_objects(new_products)
            db.commit()
            print(f"  Inserted {created_count}/{target_count} Qualcomm Snapdragon Mobiles...")

        # Re-index all active products into Vector Store
        print("Re-building Catalog Vector Store inverted index for fast sub-millisecond retrieval...")
        all_prods = db.query(Product).filter(Product.is_active == True).all()
        vector_store.build_index(all_prods)
        print(f"Successfully seeded {created_count} Qualcomm Snapdragon Mobiles (Rs. 20,000 - Rs. 50,000). Total products in DB: {len(all_prods)}.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_snapdragon_mobiles(1000)
