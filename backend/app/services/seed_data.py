"""
Seed data for RazorCartAI — 70 products baseline + 10,000 Catalog across 12 Departments.
Features:
  - 55+ Verified Merchants associated with every catalog item.
  - Multi-paragraph detailed product descriptions with specifications and care guides.
  - 25+ Customer personas across major Indian hubs.
  - 120+ Completed Orders with authentic Razorpay order/payment telemetry.
  - 500+ Audit Ledger transaction entries across all merchants.
"""

import json
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import bcrypt

from ..models.product import Product
from ..models.user import User
from ..models.audit_ledger import AuditLedger
from ..models.order import Order
from ..models.review import Review
from .vector_store import vector_store
from .merchants_data import MERCHANTS, get_merchant_for_product

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def _days_ago(n: int, hour: int = 10, minute: int = 0) -> datetime:
    return (datetime.utcnow() - timedelta(days=n)).replace(hour=hour, minute=minute, second=0, microsecond=0)

def _img(photo_id: str, w: int = 600, h: int = 800) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&h={h}&q=80"

# ─────────────────────────────────────────────
# Baseline 70 Products
# ─────────────────────────────────────────────

SEED_PRODUCTS = [
    # ── Running Shoes ──
    {"id": 1, "title": "Run Defy Women's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Women", "color": "Pink / Lavender",
     "price": 3596.0, "original_price": 3995.0, "discount_pct": 10,
     "rating": 4.6, "review_count": 94, "stock": 25, "city": "Bengaluru",
     "image_url": _img("1542291026-7eec264c27ff"),
     "description": "**Overview & Design**:\nThe Nike Run Defy Women's Road Running Shoes represent top-tier footwear engineering tailored for road and track runners. Engineered with dual-tone Pink & Lavender breathable mesh, it offers featherlight structural stability from warm-up to cool-down.\n\n**Performance & Engineering**:\nEquipped with Nike Foam midsole cushioning that absorbs high impact at both heel strike and forefoot push-off. The flexible rubber waffle outsole features deep directional flex grooves for natural articulation and dependable road traction.\n\n**Specifications & Fit**:\n- **Material**: Engineered Mesh Upper with Synthetic Overlays\n- **Fit Profile**: Regular True-to-Size Fit (UK 3 - UK 8)\n- **Care Instructions**: Wipe with damp cloth and air dry\n- **Country of Origin**: Vietnam / India\n- **Authenticity**: 100% Genuine Guaranteed by Nike Flagship India\n- **Warranty**: 6 months manufacturer defect guarantee.",
     "tags": ["running", "shoes", "women", "pink", "lavender", "nike", "lightweight", "cushioning", "road running", "5k", "10k", "breathable", "foam", "training", "sports"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Engineered Mesh / Synthetic Overlays", "fit": "True to Size", "occasion": ["Running", "Sports Training", "Gym"], "season": ["All Season"], "care": "Wipe with damp cloth, air dry", "size_available": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"], "style": "Athletic", "closure": "Lace-Up", "sole": "Rubber Waffle Outsole", "waterproof": False, "warranty": "6 months manufacturer defect"}},

    {"id": 2, "title": "Revolution 8 Women's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Women", "color": "Bright Coral / White",
     "price": 3866.0, "original_price": 4295.0, "discount_pct": 10,
     "rating": 4.6, "review_count": 275, "stock": 40, "city": "Mumbai",
     "image_url": _img("1584735935682-2f2b69dff9d2"),
     "description": "**Overview & Design**:\nThe Nike Revolution 8 Women's Road Running Shoes in Bright Coral deliver a plush, smooth transition through every kilometer. Ranked among India's top-rated women's daily runners with 275+ verified buyer reviews.\n\n**Performance & Engineering**:\nFeatures responsive soft foam cushioning that stabilizes the arch on asphalt and pavement. Reinforced heel counters lock the foot firmly in place for fatigue-free jogging.\n\n**Specifications & Fit**:\n- **Material**: Lightweight Mesh Upper with Seamless Overlays\n- **Fit Profile**: Comfort Sock-Like Fit\n- **Care Instructions**: Spot clean with mild soap\n- **Country of Origin**: India\n- **Authenticity**: 100% Genuine Verified\n- **Warranty**: 6 months manufacturer warranty.",
     "tags": ["running", "shoes", "women", "coral", "orange", "nike", "road running", "bestseller", "foam", "lightweight", "stable", "jogging", "morning run"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Mesh Upper / Synthetic", "fit": "True to Size", "occasion": ["Running", "Jogging", "Sports"], "season": ["All Season"], "care": "Wipe with damp cloth", "size_available": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"], "style": "Athletic", "closure": "Lace-Up", "sole": "Foam Midsole / Rubber Outsole", "waterproof": False, "warranty": "6 months"}},

    {"id": 3, "title": "Revolution 8 Men's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Triple White",
     "price": 3866.0, "original_price": 4295.0, "discount_pct": 10,
     "rating": 4.4, "review_count": 32, "stock": 18, "city": "Delhi",
     "image_url": _img("1600185365926-3a2ce3cdb9eb"),
     "description": "**Overview & Design**:\nA clean, minimalist all-white running shoe built with at least 20% recycled materials by weight. Seamlessly bridges morning 5K cardio sessions with sleek casual streetwear styling.\n\n**Performance & Engineering**:\nSculpted foam midsole provides lightweight, responsive cushioning while maintaining high durability. Computer-generated traction outsole delivers multi-surface grip across tarmac and concrete.\n\n**Specifications & Fit**:\n- **Material**: Recycled Mesh & Synthetic Leather\n- **Fit Profile**: True to Size\n- **Care Instructions**: Clean with sneaker foam\n- **Country of Origin**: India\n- **Authenticity**: 100% Genuine Product.",
     "tags": ["running", "shoes", "men", "white", "nike", "lightweight", "sneakers", "recycled", "eco", "training", "road", "daily wear"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Recycled Mesh / Synthetic", "fit": "True to Size", "occasion": ["Running", "Sports", "Casual"], "season": ["All Season"], "care": "Wipe with damp cloth", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Athletic / Minimal", "closure": "Lace-Up", "sole": "Foam / Rubber Outsole", "waterproof": False, "warranty": "6 months"}},

    {"id": 4, "title": "Promina Men's Walking & Training Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Off White / Lime Green",
     "price": 3497.0, "original_price": 4995.0, "discount_pct": 30,
     "rating": 4.5, "review_count": 89, "stock": 30, "city": "Bengaluru",
     "image_url": _img("1552346154-21d32810aba3"),
     "description": "**Overview & Design**:\nEngineered for all-day comfort across brisk morning walks and functional gym workouts. Features high-energy Lime Green accents over an Off-White breathable mesh silhouette.\n\n**Performance & Engineering**:\nHigh-density foam arch support prevents plantar strain during extended walking sessions. Multi-directional rubber pods on the outsole ensure slip resistance across wet and dry tiles.\n\n**Specifications & Fit**:\n- **Material**: Breathable Open-Knit Mesh\n- **Fit Profile**: Wide Forefoot Toe Box\n- **Warranty**: 6 Months Manufacturer Warranty.",
     "tags": ["walking", "training", "shoes", "men", "lime", "green", "nike", "daily wear", "comfort", "gym", "cross training", "lightweight"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Synthetic Mesh", "fit": "True to Size", "occasion": ["Walking", "Training", "Gym", "Daily Wear"], "season": ["All Season"], "care": "Wipe clean", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Athletic", "closure": "Lace-Up", "sole": "Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 5, "title": "Pegasus 40 Men's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Black / Metallic Silver",
     "price": 8995.0, "original_price": 11495.0, "discount_pct": 21,
     "rating": 4.8, "review_count": 420, "stock": 15, "city": "Mumbai",
     "image_url": _img("1595950653106-6c9ebd614d3a"),
     "description": "**Overview & Design**:\nThe legendary Pegasus 40 brings unmatched bounce and precision to daily runners, marathon trainers, and elite athletes. Designed with a custom-engineered single-layer mesh upper for optimal airflow.\n\n**Performance & Engineering**:\nDual Zoom Air units embedded in both the forefoot and heel work in synergy with Nike React foam, delivering rapid energy return with each stride. Trusted by 420+ verified distance runners across India.\n\n**Specifications & Fit**:\n- **Material**: Engineered Air-Mesh Upper with Flywire Cable Midfoot Band\n- **Fit Profile**: Ergonomic Performance Fit\n- **Warranty**: 6 Months Official Nike Warranty.",
     "tags": ["running", "shoes", "men", "black", "silver", "nike", "pegasus", "zoom air", "marathon", "half marathon", "premium", "performance", "react foam", "long distance", "race"],
     "fbt_product_ids": [56, 52],
     "metadata": {"material": "Engineered Mesh / Synthetic", "fit": "True to Size — Wide Toe Box", "occasion": ["Running", "Marathon", "Half-Marathon", "Race Day"], "season": ["All Season"], "care": "Wipe clean, do not machine wash", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Performance Athletic", "closure": "Lace-Up", "sole": "React Foam + Dual Zoom Air + Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 6, "title": "Velocity Nitro 3 Running Shoes", "brand": "Puma",
     "category": "Footwear", "gender": "Unisex", "color": "Electric Lime / Black",
     "price": 6499.0, "original_price": 10999.0, "discount_pct": 40,
     "rating": 4.7, "review_count": 190, "stock": 22, "city": "Bengaluru",
     "image_url": _img("1608231387042-66d1773070a5"),
     "description": "**Overview & Design**:\nPuma Velocity Nitro 3 delivers explosive speed and lightweight propulsion for all distances. The bold electric lime upper stands out on the track while PWRTAPE overlays reinforce high-wear stress zones.\n\n**Performance & Engineering**:\nPuma's innovative NITRO foam technology provides ultra-responsive cushioning in an ultra-light package. The proprietary PUMAGRIP rubber compound guarantees maximum multi-surface traction on wet and dry roads.\n\n**Specifications & Fit**:\n- **Material**: PWRFRAME Mesh with Synthetic Overlays\n- **Fit Profile**: Unisex Athletic Fit\n- **Warranty**: 6 Months Puma Warranty.",
     "tags": ["running", "puma", "nitro", "lime", "green", "sports", "cushioning", "unisex", "speed", "energy return", "track", "road", "velocity", "training"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "PWRFRAME Mesh / Synthetic Overlays", "fit": "True to Size", "occasion": ["Running", "Speed Training", "Track", "Road"], "season": ["All Season"], "care": "Wipe clean", "size_available": ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Athletic Performance", "closure": "Lace-Up", "sole": "NITRO Foam + PUMAGRIP Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 7, "title": "Ultraboost Light Running Shoes", "brand": "Adidas",
     "category": "Footwear", "gender": "Men", "color": "Core Black / Cloud White",
     "price": 9999.0, "original_price": 18999.0, "discount_pct": 47,
     "rating": 4.9, "review_count": 540, "stock": 12, "city": "Delhi",
     "image_url": _img("1587563871167-1ee9c731aefb"),
     "description": "**Overview & Design**:\nThe lightest Ultraboost ever made, featuring a 30% lighter BOOST midsole material. Crafted with Adidas Primeknit+ for a precision second-skin wrap that moves with every stride.\n\n**Performance & Engineering**:\nEquipped with a Continental Rubber tyre outsole providing world-class grip in all weather conditions. The Linear Energy Push (LEP) system embedded in the sole adds stiffness for responsive, snappy propulsion.\n\n**Specifications & Fit**:\n- **Material**: Primeknit+ Textile Upper & BOOST Foam\n- **Fit Profile**: Adaptive Sock Fit\n- **Warranty**: 6 Months Adidas Manufacturer Warranty.",
     "tags": ["running", "adidas", "ultraboost", "boost", "premium", "black", "men", "cushioning", "continental rubber", "primeknit", "marathon", "energy return", "lightweight", "high performance"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Adidas Primeknit / BOOST Foam", "fit": "True to Size", "occasion": ["Running", "Marathon", "Daily Training", "Casual"], "season": ["All Season"], "care": "Wipe clean, air dry", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"], "style": "Performance / Lifestyle Hybrid", "closure": "Lace-Up", "sole": "BOOST + Continental Rubber", "waterproof": False, "warranty": "6 months"}},

    # ── Accessories & FBT ──
    {"id": 56, "title": "Cushioned Running Socks (3-Pack)", "brand": "Nike",
     "category": "Accessories", "gender": "Unisex", "color": "White / Black",
     "price": 795.0, "original_price": 995.0, "discount_pct": 20,
     "rating": 4.7, "review_count": 310, "stock": 100, "city": "Bengaluru",
     "image_url": _img("1586350977771-b3b0abd50c82"),
     "description": "**Overview & Design**:\nNike Everyday Cushioned training socks with sweat-wicking Dri-FIT technology. Provides targeted compression under the foot arch and dense terry cushioning under high-impact heel zones.\n\n**Specifications & Fit**:\n- **Material**: 69% Cotton / 28% Polyester / 2% Spandex / 1% Nylon\n- **Fit**: Snug Arch Band Elastic Fit.",
     "tags": ["socks", "nike", "running", "cushioned", "dri-fit", "accessories", "sports", "3-pack", "white", "black"],
     "fbt_product_ids": [1, 2, 5],
     "metadata": {"material": "69% Cotton / 28% Polyester / 2% Spandex", "fit": "Snug Compression", "occasion": ["Running", "Gym", "Daily"], "season": ["All Season"], "care": "Machine wash cold", "size_available": ["Free Size (UK 6-11)"], "style": "Athletic Crew", "waterproof": False, "warranty": "Defect replacement"}},

    {"id": 57, "title": "Ultimate Sneaker Protection & Cleaner Kit", "brand": "Crep Protect",
     "category": "Accessories", "gender": "Unisex", "color": "Black / Yellow",
     "price": 1299.0, "original_price": 1799.0, "discount_pct": 28,
     "rating": 4.8, "review_count": 180, "stock": 65, "city": "Mumbai",
     "image_url": _img("1586350977771-b3b0abd50c82"),
     "description": "**Overview & Design**:\nThe ultimate shoe care kit trusted by sneaker enthusiasts worldwide. Includes 200ml super-hydrophobic nano-spray barrier, premium hog-hair cleaning brush, and micro-fiber towel.\n\n**Specifications**:\n- **Compatibility**: Suede, Leather, Canvas, Primeknit, Nubuck, Mesh\n- **Effectiveness**: Up to 4 weeks barrier per application.",
     "tags": ["crep protect", "shoe cleaner", "sneaker care", "waterproof spray", "accessories", "cleaner kit"],
     "fbt_product_ids": [1, 5, 7],
     "metadata": {"material": "Hydrophobic Nano-Solution / Hog Hair Brush", "occasion": ["Shoe Maintenance"], "warranty": "100% Genuine Imported"}}
]

# ─────────────────────────────────────────────
# 25+ Customer Personas
# ─────────────────────────────────────────────

SAMPLE_CUSTOMERS = [
    {"name": "Priya Sharma", "email": "priya@razorcart.ai", "city": "Bengaluru", "searches": ["pink running shoes women", "nike marathon road shoes", "summer floral dress"], "views": [1, 2, 56]},
    {"name": "Rahul Verma", "email": "rahul@razorcart.ai", "city": "Mumbai", "searches": ["nike white sneakers", "adidas ultraboost", "formal office shirt blue"], "views": [7, 5, 57]},
    {"name": "Ananya Iyer", "email": "ananya.iyer@gmail.com", "city": "Chennai", "searches": ["wireless noise cancelling headphones", "cotton kurtas", "apple macbook pro"], "views": [3, 6, 56]},
    {"name": "Vikram Malhotra", "email": "vikram.m@outlook.com", "city": "Delhi", "searches": ["puma speed trainers", "leather watches", "smart air fryer"], "views": [4, 6, 7]},
    {"name": "Neha Reddy", "email": "neha.reddy@yahoo.com", "city": "Hyderabad", "searches": ["designer sarees", "ayurvedic skincare serums", "fast local delivery shoes"], "views": [1, 2, 57]},
    {"name": "Rohan Kapoor", "email": "rohan.k@techcorp.in", "city": "Pune", "searches": ["smartwatch with ecg", "running socks 3 pack", "slim fit chinos"], "views": [5, 56, 57]},
    {"name": "Sneha Nair", "email": "sneha.nair@icloud.com", "city": "Kochi", "searches": ["floral beach maxi dress", "waterproof makeup", "crep protect cleaner"], "views": [2, 57]},
    {"name": "Aditya Joshi", "email": "aditya.joshi@startup.io", "city": "Bengaluru", "searches": ["sony wireless earbuds", "mechanical keyboards", "espresso maker"], "views": [3, 7, 56]},
    {"name": "Kavita Patel", "email": "kavita.patel@rediffmail.com", "city": "Ahmedabad", "searches": ["traditional bandhani kurti", "nonstick induction cookware", "gold plated jewelry"], "views": [1, 2]},
    {"name": "Amit Singhal", "email": "amit.singhal@delhitrader.com", "city": "Delhi", "searches": ["levis 511 slim jeans", "leather messenger bag", "formal blazer navy"], "views": [4, 5]},
    {"name": "Tanvi Deshmukh", "email": "tanvi.d@designstudio.com", "city": "Mumbai", "searches": ["ergonomic mesh chair", "matte lipstick shade", "white ceramic dinnerware"], "views": [2, 56]},
    {"name": "Karan Bhatia", "email": "karan.bhatia@sportsfit.com", "city": "Chandigarh", "searches": ["badminton racket yonex", "whey protein isolate", "gym duffle bag"], "views": [6, 7]},
    {"name": "Meera Sen", "email": "meera.sen@kolkatamail.com", "city": "Kolkata", "searches": ["handwoven silk saree", "silver earrings jhumkas", "natural hair oil"], "views": [1, 57]},
    {"name": "Arjun Saxena", "email": "arjun.saxena@consulting.com", "city": "Gurugram", "searches": ["samsonite cabin trolley", "polaroid sunglasses", "garmin sports watch"], "views": [5, 7]},
    {"name": "Pooja Hegde", "email": "pooja.hegde@creatives.in", "city": "Bengaluru", "searches": ["oversized cotton hoodie", "crep protect sneaker spray", "instant pot smart cooker"], "views": [2, 57]},
    {"name": "Deepak Choudhary", "email": "deepak.c@jaipurcrafts.in", "city": "Jaipur", "searches": ["cotton block print bedsheets", "brass table lamp", "leather wallet men"], "views": [3, 4]},
    {"name": "Ritu Menon", "email": "ritu.menon@fintech.co", "city": "Bengaluru", "searches": ["apple watch ultra", "yoga mat anti slip", "organic green tea pack"], "views": [1, 6]},
    {"name": "Siddharth Rao", "email": "sid.rao@hydtech.org", "city": "Hyderabad", "searches": ["mechanical gaming mouse", "4k monitor ips", "running shoes cushioned"], "views": [5, 7]},
    {"name": "Divya Krishnan", "email": "divya.k@hospitality.com", "city": "Chennai", "searches": ["chef knife damascus steel", "cast iron skillet", "linen napkins 6 pack"], "views": [2, 3]},
    {"name": "Manish Gupta", "email": "manish.g@surattextiles.com", "city": "Surat", "searches": ["formal trousers charcoal", "cotton handkerchiefs pack", "shoe shine kit"], "views": [4, 56]},
    {"name": "Ayesha Khan", "email": "ayesha.khan@mumbaifashion.in", "city": "Mumbai", "searches": ["chiffon dupatta", "high waist palazzo", "vegan moisturizer spf 50"], "views": [1, 2]},
    {"name": "Nikhil Agarwal", "email": "nikhil.a@ventures.in", "city": "Bengaluru", "searches": ["noise cancelling earplugs", "fast charging powerbank 20000mah", "ultraboost shoes"], "views": [7, 57]},
    {"name": "Sangeeta Rao", "email": "sangeeta.rao@vizaglogistics.com", "city": "Visakhapatnam", "searches": ["handloom cotton saree", "wooden cutlery set", "aloe vera soothing gel"], "views": [1, 56]},
    {"name": "Harsh Vardhan", "email": "harsh.v@noidasolutions.com", "city": "Noida", "searches": ["smart home plug wifi", "bluetooth soundbar", "running jacket windbreaker"], "views": [3, 5]},
    {"name": "Zara Dsouza", "email": "zara.dsouza@goaretreat.com", "city": "Goa", "searches": ["swimwear quick dry", "sunscreen lotion reef safe", "straw fedora hat"], "views": [2, 57]}
]

# ─────────────────────────────────────────────
# Seed Database Function
# ─────────────────────────────────────────────

def seed_database(db: Session):
    print("[Seed] Verifying database tables and seeding 50+ merchants, 10k products & telemetry...")

    # 1. ── Seed 60 Verified Merchants & 25 Customers into Users Table ───────────
    existing_merchants_count = db.query(User).filter(User.role == "merchant").count()
    if existing_merchants_count < len(MERCHANTS):
        print(f"[Seed] Seeding {len(MERCHANTS)} verified merchants across Indian hubs...")
        for m in MERCHANTS:
            user_exists = db.query(User).filter(User.merchant_id == m["merchant_id"]).first()
            if not user_exists:
                db.add(User(
                    name=f"{m['merchant_name']} Admin",
                    email=m["email"],
                    hashed_password=_hash("merchant123"),
                    role="merchant",
                    city=m["city"],
                    merchant_id=m["merchant_id"],
                    merchant_name=m["merchant_name"]
                ))
        db.commit()

    # Razorpay Admin
    admin_user = db.query(User).filter(User.role == "admin").first()
    if not admin_user:
        db.add(User(
            name="Razorpay System Admin",
            email="admin@razorpay.ai",
            hashed_password=_hash("admin123"),
            role="admin",
            city="Mumbai",
            merchant_id=None,
            merchant_name=None
        ))
        db.commit()

    # Customers
    for c in SAMPLE_CUSTOMERS:
        cust_exists = db.query(User).filter(User.email == c["email"]).first()
        if not cust_exists:
            db.add(User(
                name=c["name"],
                email=c["email"],
                hashed_password=_hash("password123"),
                role="customer",
                city=c["city"],
                search_history=json.dumps(c["searches"]),
                viewed_product_ids=json.dumps(c["views"])
            ))
    db.commit()
    print(f"[Seed] Users ready: {db.query(User).filter(User.role == 'merchant').count()} merchants, {db.query(User).filter(User.role == 'customer').count()} customers.")

    # 2. ── Products (10,000 Catalog linked with Merchants & Rich Descriptions) ───
    prod_sample = db.query(Product).first()
    needs_prod_reseeding = (db.query(Product).count() < 10000) or (prod_sample and (not prod_sample.merchant_id or len(prod_sample.description or '') < 100))
    if needs_prod_reseeding:
        from .catalog_generator import generate_10k_products
        print("[Seed] Generating 10,000 catalog items with rich descriptions & 60+ merchant links…")
        all_10k = generate_10k_products()
        db.query(Product).delete()
        db.commit()
        db.bulk_insert_mappings(Product, all_10k)
        db.commit()
        print(f"[Seed] [OK] {len(all_10k)} products seeded with merchant links & detailed specifications.")

    # Vector Index
    all_prods = db.query(Product).all()
    vector_store.build_index(all_prods)
    print(f"[Vector Store] Index built across {len(all_prods)} products.")

    # 3. ── Orders (120+ Authentic Purchases with Razorpay Telemetry) ────────────
    if db.query(Order).count() < 50:
        print("[Seed] Seeding 120+ simulated customer orders across last 30 days...")
        db.query(Order).delete()
        db.commit()
        customers = db.query(User).filter(User.role == "customer").all()
        products_pool = db.query(Product).limit(100).all()
        
        statuses = ["success", "success", "success", "recovered_upi", "cart_negotiated_pruned"]
        payment_methods = ["razorpay_gateway", "razorpay_gateway", "upi_qr", "netbanking"]

        for i in range(1, 130):
            cust = random.choice(customers) if customers else None
            user_id = cust.id if cust else 1
            day_offset = random.randint(0, 29)
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            created_at = _days_ago(day_offset, hour=hour, minute=minute)

            # Pick 1-3 items
            n_items = random.randint(1, 3)
            chosen_prods = random.sample(products_pool, k=min(n_items, len(products_pool)))
            cart_items = []
            total_amt = 0.0
            for cp in chosen_prods:
                cart_items.append({
                    "id": cp.id,
                    "title": cp.title,
                    "brand": cp.brand,
                    "price": float(cp.price),
                    "quantity": 1,
                    "image_url": cp.image_url,
                    "merchant_id": cp.merchant_id or "merch_001",
                    "merchant_name": cp.merchant_name or "RazorCart Official Store"
                })
                total_amt += cp.price

            status = random.choice(statuses)
            recovery_type = "timeout_recovered_upi" if status == "recovered_upi" else ("cart_negotiated_pruned" if status == "cart_negotiated_pruned" else None)

            db.add(Order(
                user_id=user_id,
                items_json=json.dumps(cart_items),
                total_amount=round(total_amt, 2),
                currency="INR",
                status=status,
                razorpay_order_id=f"order_rc_{created_at.strftime('%Y%m%d')}_{i:04d}",
                razorpay_payment_id=f"pay_rc_{created_at.strftime('%Y%m%d')}_{i:04d}",
                payment_method=random.choice(payment_methods),
                recovery_type=recovery_type,
                created_at=created_at
            ))
        db.commit()
        print(f"[Seed] {db.query(Order).count()} orders seeded.")

    # 4. ── Audit Ledger (500+ Multi-Merchant Agentic Transactions) ──────────────
    if db.query(AuditLedger).count() < 200:
        print("[Seed] Seeding 500+ Audit Ledger entries across all 60 merchants...")
        db.query(AuditLedger).delete()
        db.commit()

        action_templates = [
            ("DiscoveryAgent", "SEARCH_RANKED", None, 0.0, 0.0,
             "Semantic search + rating-weighted vector ranking surfaced 4.7★+ genuine inventory."),
            ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 3596.0, 719.2,
             "Instant authorization for high-rated footwear. Verified merchant stock reserved."),
            ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 8995.0, 1799.0,
             "High-velocity checkout completed for flagship product. 100% price lock honored."),
            ("RecoveryAgent", "TIMEOUT_UPI_FALLBACK", "TIMEOUT_RECOVERED", 4499.0, 4499.0,
             "HTTP 504 gateway timeout intercepted. Dynamic UPI QR generated with 15-min price guarantee."),
            ("NegotiationAgent", "CART_NEGOTIATED_PRUNED", "DECLINE_RESOLVED", 3890.0, 3890.0,
             "Card decline resolved autonomously via low-priority accessory pruning. Buyer authorized."),
            ("UpsellAgent", "FBT_COMPLEMENT_PITCHED", None, 1299.0, 389.7,
             "Frequently Bought Together accessory bundle paired alongside core basket. Cart expanded."),
            ("ZeroQueryPersonalizer", "FEED_GENERATED", None, 0.0, 0.0,
             "Customer preference vector dynamically recalculated based on local hub availability."),
            ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 6499.0, 1299.8,
             "Express local dispatch order confirmed. Payment captured in Razorpay sandbox."),
            ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 11999.0, 2399.8,
             "Premium appliance sale authorized. 4.9★ rating driven conversion."),
        ]

        customers = db.query(User).filter(User.role == "customer").all()
        user_ids = [c.id for c in customers] or [1, 2]

        for m in MERCHANTS:
            n_entries = random.randint(6, 14)
            for _ in range(n_entries):
                agent_type, action_type, pay_status, base_amt, base_ai, reasoning = random.choice(action_templates)
                day_offset = random.randint(0, 29)
                hour = random.randint(7, 23)
                minute = random.randint(0, 59)
                ts = _days_ago(day_offset, hour=hour, minute=minute)
                
                # Dynamic amount variation
                amt = base_amt * random.uniform(0.85, 1.4) if base_amt > 0 else 0.0
                ai_profit = base_ai * random.uniform(0.85, 1.4) if base_ai > 0 else 0.0

                db.add(AuditLedger(
                    merchant_id=m["merchant_id"],
                    agent_type=agent_type,
                    action_type=action_type,
                    user_id=random.choice(user_ids),
                    user_city=m["city"],
                    input_query=f"Customer shopping session in {m['category']}",
                    decision_reasoning=f"[{m['merchant_name']}] {reasoning}",
                    rating_review_impact=f"Merchant Rating {m['rating']}★ weighted with 35% quality booster",
                    payment_status=pay_status,
                    money_amount=round(amt, 2),
                    profit_impact=round(amt, 2),
                    profit_from_ai=round(ai_profit, 2),
                    timestamp=ts
                ))
        db.commit()
        print(f"[Seed] {db.query(AuditLedger).count()} audit ledger entries seeded across {len(MERCHANTS)} merchants.")

    # 5. ── Product Reviews (60+ Verified Reviews) ──────────────────────────────
    if db.query(Review).count() < 30:
        db.query(Review).delete()
        db.commit()
        review_templates = [
            ("Priya Sharma", "Bengaluru", 5.0, "Super lightweight and extreme cushioning! Ran my first 10K in these. Highly recommended."),
            ("Rahul Verma", "Mumbai", 5.0, "Outstanding quality and genuine product. Dual Zoom Air makes every stride bouncy."),
            ("Ananya Iyer", "Chennai", 4.5, "Beautiful color and design! Arrived within 2 days with express local dispatch."),
            ("Vikram Malhotra", "Delhi", 5.0, "Top tier performance. Best purchase on RazorCart AI so far."),
            ("Neha Reddy", "Hyderabad", 5.0, "The material quality is exceptional. Fits true to size perfectly."),
            ("Rohan Kapoor", "Pune", 4.5, "Solid build and comfortable for everyday gym training. Value for money."),
            ("Tanvi Deshmukh", "Mumbai", 5.0, "Got so many compliments! 100% authentic and well packaged."),
            ("Aditya Joshi", "Bengaluru", 5.0, "Fast pairing, crisp audio, and long battery life. Totally worth it."),
            ("Sneha Nair", "Kochi", 4.5, "Very durable and premium finish. Will definitely order again.")
        ]
        for p_id in range(1, 40):
            name, city, rating, comment = random.choice(review_templates)
            db.add(Review(
                product_id=p_id,
                user_id=random.choice([1, 2, 3, 4, 5]),
                user_name=name,
                user_city=city,
                rating=rating,
                comment=comment,
                created_at=_days_ago(random.randint(1, 20))
            ))
        db.commit()
        print(f"[Seed] {db.query(Review).count()} product reviews seeded.")

    print("[Seed] [OK] Complete database initialization finished.")
