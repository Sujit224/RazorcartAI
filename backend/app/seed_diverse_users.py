"""
Seed rich search histories, viewed product IDs, and preferences across database users
so that AI Campaign generation, Zero-Query personalization, and Vector search match
a rich cohort of 15-30+ users per campaign category.
"""

import json
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.product import Product

def seed_users():
    db: Session = SessionLocal()
    try:
        users = db.query(User).filter(User.role == "customer").all()
        products = db.query(Product).all()
        print(f"Seeding {len(users)} users with category-specific shopping signals...")

        if not products:
            print("No products found in DB! Seed products first.")
            return

        # Categorize products by category keywords
        mobile_pids = [p.id for p in products if any(k in (p.title + " " + p.category + " " + p.brand).lower() for k in ["phone", "mobile", "snapdragon", "5g", "case", "charger", "screen", "headphone", "earbuds", "smartphone"])]
        footwear_pids = [p.id for p in products if any(k in (p.title + " " + p.category + " " + p.brand).lower() for k in ["shoe", "sneaker", "loafers", "boot", "footwear", "runner", "trainers"])]
        apparel_pids = [p.id for p in products if any(k in (p.title + " " + p.category + " " + p.brand).lower() for k in ["shirt", "jeans", "saree", "kurta", "jacket", "dress", "chinos", "fashion", "apparel"])]
        electronics_pids = [p.id for p in products if any(k in (p.title + " " + p.category + " " + p.brand).lower() for k in ["watch", "fryer", "laptop", "macbook", "keyboard", "espresso", "cookware", "electronics"])]

        all_pids = [p.id for p in products]

        mobile_queries = [
            "mobiles under 20000 50000 qualcomm snapdragon",
            "5g smartphone with high ram and fast charging",
            "nothing phone 2 12gb ram 512gb",
            "rugged heavy duty bumper phone case",
            "tempered glass anti glare screen protector",
            "foldable pocket desk phone holder stand",
            "best budget camera smartphone fast delivery"
        ]

        footwear_queries = [
            "pink road running shoes lightweight",
            "nike white slip on loafers cushion",
            "adidas ultraboost road running trainers",
            "puma speed trainers size 8",
            "cushioned ankle running socks 3 pack",
            "crep protect sneaker cleaning kit"
        ]

        apparel_queries = [
            "designer silk cotton kurtas festival discount",
            "levis 511 slim fit jeans denim",
            "formal navy blazer office wear",
            "floral beach summer maxi dress",
            "slim fit stretch chinos beige"
        ]

        electronics_queries = [
            "wireless noise cancelling bluetooth headphones",
            "smartwatch with heart rate ecg monitor",
            "mechanical gaming keyboard rgb",
            "smart digital air fryer low oil",
            "espresso coffee maker machine"
        ]

        categories_pool = [
            ("mobiles", mobile_queries, mobile_pids),
            ("footwear", footwear_queries, footwear_pids),
            ("apparel", apparel_queries, apparel_pids),
            ("electronics", electronics_queries, electronics_pids),
        ]

        updated_count = 0
        for idx, user in enumerate(users):
            cat_name, cat_queries, cat_pids = categories_pool[idx % len(categories_pool)]
            
            # Select 3-6 random search history queries
            chosen_queries = random.sample(cat_queries, min(len(cat_queries), random.randint(3, 5)))
            # Also throw in 1-2 cross-category queries so users look realistic
            other_cat = categories_pool[(idx + 1) % len(categories_pool)]
            chosen_queries.append(random.choice(other_cat[1]))

            # Select 4-8 viewed product IDs (ensuring some overlap for dwellers)
            viewed_ids = random.sample(cat_pids, min(len(cat_pids), random.randint(4, 8))) if cat_pids else random.sample(all_pids, min(len(all_pids), 4))
            
            user.search_history = json.dumps(chosen_queries)
            user.viewed_product_ids = json.dumps(viewed_ids)
            user.preferences = json.dumps({
                "favorite_category": cat_name,
                "preferred_brands": ["Nothing", "Nike", "Apple", "Puma", "Levis", "Sony"][idx % 6],
                "discount_sensitive": True if idx % 2 == 0 else False,
                "city": user.city
            })
            user.vector_embedding = f"{cat_name} {' '.join(chosen_queries)} {' '.join([str(pid) for pid in viewed_ids])}"
            updated_count += 1

        db.commit()
        print(f"Successfully updated shopping signals & embeddings for all {updated_count} users!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
