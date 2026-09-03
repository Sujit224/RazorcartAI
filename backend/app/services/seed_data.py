"""
Seed data for RazorCartAI — 70 products across 7 categories.
Categories: Footwear · Topwear · Bottomwear · Dresses · Accessories · Ethnic Wear · Sportswear
Every product includes:
  - Detailed description (RAG/MiniLM semantic indexing)
  - Rich tags list (BM25 lexical retrieval)
  - FBT cross-sell IDs
  - Metadata JSON (material, fit, occasion, season, care, size, style, …)
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
# Product Catalog — 70 Products
# ─────────────────────────────────────────────

SEED_PRODUCTS = [

    # ═══════════════════════════════════════════════════════════════════
    # FOOTWEAR  (IDs 1–16)
    # ═══════════════════════════════════════════════════════════════════

    # ── Running Shoes ──────────────────────────────────────────────────

    {"id": 1, "title": "Run Defy Women's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Women", "color": "Pink / Lavender",
     "price": 3596.0, "original_price": 3995.0, "discount_pct": 10,
     "rating": 4.6, "review_count": 94, "stock": 25, "city": "Bengaluru",
     "image_url": _img("1542291026-7eec264c27ff"),
     "description": "Engineered mesh upper delivers breathable, lightweight support ideal for 5K–10K training runs on road and track. Nike Foam cushioning absorbs impact at both heel and forefoot for a plush, responsive feel. Flexible rubber waffle outsole with deep flex grooves ensures natural foot motion and multidirectional grip.",
     "tags": ["running", "shoes", "women", "pink", "lavender", "nike", "lightweight", "cushioning", "road running", "5k", "10k", "breathable", "foam", "training", "sports"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Engineered Mesh / Synthetic Overlays", "fit": "True to Size", "occasion": ["Running", "Sports Training", "Gym"], "season": ["All Season"], "care": "Wipe with damp cloth, air dry", "size_available": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"], "style": "Athletic", "closure": "Lace-Up", "sole": "Rubber Waffle Outsole", "waterproof": False, "warranty": "6 months manufacturer defect"}},

    {"id": 2, "title": "Revolution 8 Women's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Women", "color": "Bright Coral / White",
     "price": 3866.0, "original_price": 4295.0, "discount_pct": 10,
     "rating": 4.6, "review_count": 275, "stock": 40, "city": "Mumbai",
     "image_url": _img("1584735935682-2f2b69dff9d2"),
     "description": "Soft foam midsole delivers an exceptionally smooth, stable ride on pavement, making every morning jog comfortable from start to finish. The flexible, lightweight upper wraps the foot in a secure sock-like fit for a distraction-free run. Rated India's bestselling women's road running shoe with 275+ verified reviews.",
     "tags": ["running", "shoes", "women", "coral", "orange", "nike", "road running", "bestseller", "foam", "lightweight", "stable", "jogging", "morning run"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Mesh Upper / Synthetic", "fit": "True to Size", "occasion": ["Running", "Jogging", "Sports"], "season": ["All Season"], "care": "Wipe with damp cloth", "size_available": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"], "style": "Athletic", "closure": "Lace-Up", "sole": "Foam Midsole / Rubber Outsole", "waterproof": False, "warranty": "6 months"}},

    {"id": 3, "title": "Revolution 8 Men's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Triple White",
     "price": 3866.0, "original_price": 4295.0, "discount_pct": 10,
     "rating": 4.4, "review_count": 32, "stock": 18, "city": "Delhi",
     "image_url": _img("1600185365926-3a2ce3cdb9eb"),
     "description": "Minimalist all-white running shoe built with recycled mesh materials for a cleaner planet. The foam midsole provides reliable cushioning on daily training runs while keeping the silhouette clean and versatile enough to pair with casual outfits post-workout.",
     "tags": ["running", "shoes", "men", "white", "nike", "lightweight", "sneakers", "recycled", "eco", "training", "road", "daily wear"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Recycled Mesh / Synthetic", "fit": "True to Size", "occasion": ["Running", "Sports", "Casual"], "season": ["All Season"], "care": "Wipe with damp cloth", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Athletic / Minimal", "closure": "Lace-Up", "sole": "Foam / Rubber Outsole", "waterproof": False, "warranty": "6 months"}},

    {"id": 4, "title": "Promina Men's Walking & Training Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Off White / Lime Green",
     "price": 3497.0, "original_price": 4995.0, "discount_pct": 30,
     "rating": 4.5, "review_count": 89, "stock": 30, "city": "Bengaluru",
     "image_url": _img("1552346154-21d32810aba3"),
     "description": "Built for all-day comfort across morning walks and cross-training sessions, the Promina features a lightweight foam midsole that keeps fatigue at bay. The lime green pop adds energy to every stride while the durable rubber outsole handles gym floors, pavements, and light trails with equal confidence.",
     "tags": ["walking", "training", "shoes", "men", "lime", "green", "nike", "daily wear", "comfort", "gym", "cross training", "lightweight"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Synthetic Mesh", "fit": "True to Size", "occasion": ["Walking", "Training", "Gym", "Daily Wear"], "season": ["All Season"], "care": "Wipe clean", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Athletic", "closure": "Lace-Up", "sole": "Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 5, "title": "Pegasus 40 Men's Road Running Shoes", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Black / Metallic Silver",
     "price": 8995.0, "original_price": 11495.0, "discount_pct": 21,
     "rating": 4.8, "review_count": 420, "stock": 15, "city": "Mumbai",
     "image_url": _img("1595950653106-6c9ebd614d3a"),
     "description": "Powered by dual Zoom Air units in both heel and forefoot, the Pegasus 40 delivers explosive energy return with every stride — perfect for half-marathon training and race day performance. The wider toe box offers generous room while the updated React foam midsole reduces fatigue across long distances. Trusted by 420+ marathon runners across India.",
     "tags": ["running", "shoes", "men", "black", "silver", "nike", "pegasus", "zoom air", "marathon", "half marathon", "premium", "performance", "react foam", "long distance", "race"],
     "fbt_product_ids": [56, 52],
     "metadata": {"material": "Engineered Mesh / Synthetic", "fit": "True to Size — Wide Toe Box", "occasion": ["Running", "Marathon", "Half-Marathon", "Race Day"], "season": ["All Season"], "care": "Wipe clean, do not machine wash", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Performance Athletic", "closure": "Lace-Up", "sole": "React Foam + Dual Zoom Air + Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 6, "title": "Velocity Nitro 3 Running Shoes", "brand": "Puma",
     "category": "Footwear", "gender": "Unisex", "color": "Electric Lime / Black",
     "price": 6499.0, "original_price": 10999.0, "discount_pct": 40,
     "rating": 4.7, "review_count": 190, "stock": 22, "city": "Bengaluru",
     "image_url": _img("1608231387042-66d1773070a5"),
     "description": "Puma's NITRO foam technology delivers maximum energy return with every footstrike, making the Velocity Nitro 3 a true speed trainer. The bold electric lime upper turns heads at the track while the PUMAGRIP outsole maintains traction on wet and dry road surfaces. Suitable for both men and women with a versatile unisex sizing.",
     "tags": ["running", "puma", "nitro", "lime", "green", "sports", "cushioning", "unisex", "speed", "energy return", "track", "road", "velocity", "training"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "PWRFRAME Mesh / Synthetic Overlays", "fit": "True to Size", "occasion": ["Running", "Speed Training", "Track", "Road"], "season": ["All Season"], "care": "Wipe clean", "size_available": ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Athletic Performance", "closure": "Lace-Up", "sole": "NITRO Foam + PUMAGRIP Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 7, "title": "Ultraboost Light Running Shoes", "brand": "Adidas",
     "category": "Footwear", "gender": "Men", "color": "Core Black / Cloud White",
     "price": 9999.0, "original_price": 18999.0, "discount_pct": 47,
     "rating": 4.9, "review_count": 540, "stock": 12, "city": "Delhi",
     "image_url": _img("1587563871167-1ee9c731aefb"),
     "description": "The lightest Ultraboost ever engineered, featuring a BOOST midsole with 20% lighter construction that still delivers the signature energy return Ultraboost is famous for. Continental Rubber outsole provides unmatched wet and dry grip — the same rubber used on premium car tyres. Adidas's Primeknit upper offers a second-skin fit that adapts to your foot's natural shape across all distances.",
     "tags": ["running", "adidas", "ultraboost", "boost", "premium", "black", "men", "cushioning", "continental rubber", "primeknit", "marathon", "energy return", "lightweight", "high performance"],
     "fbt_product_ids": [56, 57],
     "metadata": {"material": "Adidas Primeknit / BOOST Foam", "fit": "True to Size", "occasion": ["Running", "Marathon", "Daily Training", "Casual"], "season": ["All Season"], "care": "Wipe clean, air dry", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"], "style": "Performance / Lifestyle Hybrid", "closure": "Lace-Up", "sole": "BOOST + Continental Rubber", "waterproof": False, "warranty": "6 months"}},

    # ── Casual & Lifestyle Sneakers ─────────────────────────────────────

    {"id": 8, "title": "Stan Smith Casual Sneakers", "brand": "Adidas",
     "category": "Footwear", "gender": "Unisex", "color": "White / Green",
     "price": 4995.0, "original_price": 6995.0, "discount_pct": 28,
     "rating": 4.7, "review_count": 620, "stock": 45, "city": "Mumbai",
     "image_url": _img("1491553895911-0055eca6402d"),
     "description": "The iconic Stan Smith is the world's best-selling leather sneaker with over 50 years of heritage. Crafted from premium full-grain leather with the distinctive three-stripe perforations, it transitions effortlessly from streetwear to smart casual. The green heel tab and Adidas logo badge make it instantly recognisable across generations.",
     "tags": ["casual", "sneakers", "adidas", "stan smith", "white", "green", "leather", "lifestyle", "unisex", "iconic", "street style", "everyday", "classic"],
     "fbt_product_ids": [30, 57],
     "metadata": {"material": "Full-Grain Leather Upper / Rubber Sole", "fit": "True to Size", "occasion": ["Casual", "Daily Wear", "Street Style", "College"], "season": ["All Season"], "care": "Wipe with damp leather cloth, use leather conditioner", "size_available": ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Classic Casual", "closure": "Lace-Up", "sole": "Vulcanised Rubber", "waterproof": False, "warranty": "6 months"}},

    {"id": 9, "title": "Chuck Taylor All Star Hi Top Canvas Sneakers", "brand": "Converse",
     "category": "Footwear", "gender": "Unisex", "color": "Black / Black",
     "price": 3995.0, "original_price": 4995.0, "discount_pct": 20,
     "rating": 4.5, "review_count": 380, "stock": 35, "city": "Delhi",
     "image_url": _img("1516478177764-9fe5bd7e9717"),
     "description": "The Converse Chuck Taylor All Star Hi has been a cultural icon since 1917 — worn by musicians, artists, skaters, and everyone in between. The high-top canvas upper provides ankle support while the distinctive rubber toe cap and vulcanised sole deliver timeless style with everyday durability. A wardrobe essential that never goes out of fashion.",
     "tags": ["casual", "sneakers", "converse", "chuck taylor", "black", "canvas", "high top", "unisex", "iconic", "street style", "music", "youth", "vintage", "lifestyle"],
     "fbt_product_ids": [30, 52],
     "metadata": {"material": "Canvas Upper / Rubber Sole", "fit": "Runs Small — Size Up", "occasion": ["Casual", "Street Style", "College", "Music Festivals"], "season": ["All Season"], "care": "Machine wash cold, air dry", "size_available": ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Classic High-Top", "closure": "Lace-Up", "sole": "Vulcanised Rubber", "waterproof": False, "warranty": "3 months"}},

    {"id": 10, "title": "574 Core Lifestyle Sneakers", "brand": "New Balance",
     "category": "Footwear", "gender": "Unisex", "color": "Navy Blue / Grey",
     "price": 5495.0, "original_price": 6995.0, "discount_pct": 21,
     "rating": 4.6, "review_count": 210, "stock": 28, "city": "Hyderabad",
     "image_url": _img("1595950653106-6c9ebd614d3a"),
     "description": "The New Balance 574 is a heritage runner turned everyday staple, featuring the iconic ENCAP midsole technology that combines EVA foam cushioning with a supportive polyurethane rim for all-day comfort. The premium pigskin suede and mesh upper ages beautifully while the classic silhouette effortlessly complements jeans, joggers, and chinos.",
     "tags": ["sneakers", "new balance", "574", "navy", "grey", "lifestyle", "unisex", "encap", "suede", "cushioning", "heritage", "casual", "everyday"],
     "fbt_product_ids": [30, 57],
     "metadata": {"material": "Pigskin Suede / Mesh Upper", "fit": "True to Size", "occasion": ["Casual", "Daily Wear", "Weekend", "College"], "season": ["All Season"], "care": "Suede brush for nap maintenance", "size_available": ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"], "style": "Heritage Lifestyle", "closure": "Lace-Up", "sole": "ENCAP EVA + PU Rim", "waterproof": False, "warranty": "6 months"}},

    # ── Formal & Office Shoes ───────────────────────────────────────────

    {"id": 11, "title": "Milano Derby Formal Leather Shoes", "brand": "Red Tape",
     "category": "Footwear", "gender": "Men", "color": "Classic Black",
     "price": 2799.0, "original_price": 4499.0, "discount_pct": 37,
     "rating": 4.3, "review_count": 156, "stock": 22, "city": "Kolkata",
     "image_url": _img("1533867617858-e7b97e060509"),
     "description": "Crafted from genuine upper leather with a cap-toe brogue detailing, these Red Tape Derby shoes are ideal for corporate presentations, formal events, and daily office wear. The cushioned PU insole provides support across long work days while the heat-resistant TPR sole delivers dependable traction on polished marble floors and rain-wet pavements.",
     "tags": ["formal", "shoes", "men", "black", "leather", "derby", "office", "corporate", "red tape", "dress shoes", "classic", "work", "professional", "brogue"],
     "fbt_product_ids": [17, 46],
     "metadata": {"material": "Genuine Leather Upper / TPR Sole", "fit": "True to Size", "occasion": ["Office", "Formal Events", "Business Meetings", "Weddings"], "season": ["All Season"], "care": "Polish regularly with leather cream, wipe clean", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Classic Derby", "closure": "Lace-Up", "sole": "TPR Heat-Resistant Sole", "waterproof": False, "warranty": "6 months"}},

    {"id": 12, "title": "Comfit Office Formal Shoes", "brand": "Bata",
     "category": "Footwear", "gender": "Men", "color": "Tan / Cognac Brown",
     "price": 1799.0, "original_price": 2499.0, "discount_pct": 28,
     "rating": 4.2, "review_count": 88, "stock": 30, "city": "Chennai",
     "image_url": _img("1543163521-1bf539c55dd2"),
     "description": "Bata's Comfit range is engineered specifically for professionals who stand or walk for extended periods. The memory foam insole molds to your foot shape for personalized cushioning across 8-hour shifts, while the rich tan leather upper ages gracefully with polish. A reliable, value-for-money formal shoe trusted by Indian offices for decades.",
     "tags": ["formal", "shoes", "men", "tan", "brown", "cognac", "bata", "office", "leather", "memory foam", "comfortable", "work", "professional", "daily"],
     "fbt_product_ids": [17, 46],
     "metadata": {"material": "Genuine Leather Upper / Memory Foam Insole", "fit": "True to Size", "occasion": ["Office", "Formal", "Daily Work"], "season": ["All Season"], "care": "Wipe with damp cloth, apply shoe cream", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Oxford / Formal", "closure": "Lace-Up", "sole": "Rubber", "waterproof": False, "warranty": "6 months"}},

    # ── Trekking & Outdoor ──────────────────────────────────────────────

    {"id": 13, "title": "Waterproof Trekking & Hiking Shoes", "brand": "Woodland",
     "category": "Footwear", "gender": "Men", "color": "Brown / Olive",
     "price": 4295.0, "original_price": 5995.0, "discount_pct": 28,
     "rating": 4.5, "review_count": 134, "stock": 18, "city": "Delhi",
     "image_url": _img("1551107696-a4b085a6d9a6"),
     "description": "Built to conquer Indian terrain from Himalayan trails to Coorg forest paths, the Woodland waterproof trekking shoe features a full-grain nubuck leather upper treated with DryTech waterproofing to keep feet dry in wet conditions. The chunky rubber lug outsole provides aggressive grip on loose rocks, mud, and roots. Reinforced toe cap and heel counter protect against trail debris.",
     "tags": ["trekking", "hiking", "outdoor", "shoes", "men", "brown", "olive", "woodland", "waterproof", "leather", "trail", "mountains", "camping", "rugged", "nubuck"],
     "fbt_product_ids": [32, 49],
     "metadata": {"material": "Full-Grain Nubuck Leather / DryTech Waterproof Membrane", "fit": "True to Size — Wear with Thick Socks", "occasion": ["Trekking", "Hiking", "Camping", "Outdoor"], "season": ["All Season", "Monsoon"], "care": "Waterproof spray after each trek, brush off mud", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Outdoor / Trail", "closure": "Lace-Up with Speed Lacing", "sole": "Lug Rubber Outsole with Slip-Guard", "waterproof": True, "warranty": "1 year"}},

    # ── Comfort & Everyday ──────────────────────────────────────────────

    {"id": 14, "title": "Classic Clogs", "brand": "Crocs",
     "category": "Footwear", "gender": "Unisex", "color": "Navy Blue",
     "price": 2999.0, "original_price": 3499.0, "discount_pct": 14,
     "rating": 4.6, "review_count": 890, "stock": 60, "city": "Bengaluru",
     "image_url": _img("1603487742131-4160ec999306"),
     "description": "The Crocs Classic Clog is the world's most comfortable shoe — worn by chefs, healthcare workers, and anyone who prioritizes comfort. Made from proprietary Croslite foam that is lightweight, odour-resistant, and moulds to your foot with warmth. The ventilation ports allow airflow and let water drain, making them perfect for beach days, poolside walks, and casual errands.",
     "tags": ["crocs", "clogs", "casual", "comfort", "navy", "unisex", "slip on", "beach", "pool", "lightweight", "foam", "waterproof", "daily", "home", "garden"],
     "fbt_product_ids": [39, 56],
     "metadata": {"material": "Croslite Foam", "fit": "True to Size", "occasion": ["Casual", "Beach", "Pool", "Home", "Garden"], "season": ["Summer", "Monsoon"], "care": "Rinse with water, wipe dry", "size_available": ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Clog / Casual", "closure": "Slip-On with Back Strap", "sole": "Croslite Non-Marking", "waterproof": True, "warranty": "1 year"}},

    {"id": 15, "title": "GoWalk 7 Slip-On Walking Shoes", "brand": "Skechers",
     "category": "Footwear", "gender": "Women", "color": "Light Grey / White",
     "price": 3295.0, "original_price": 4495.0, "discount_pct": 26,
     "rating": 4.5, "review_count": 203, "stock": 35, "city": "Pune",
     "image_url": _img("1560343090-f0409e92791a"),
     "description": "Skechers' GO WALK 7 is engineered for women who demand both style and effortless comfort in a slip-on design. The responsive ULTRA GO cushioning absorbs impact while the HIGH REBOUND insole returns energy for a lively, energised walk. Machine washable mesh upper keeps hygiene simple even after sweaty summer walks.",
     "tags": ["walking", "shoes", "women", "grey", "white", "skechers", "slip on", "comfort", "casual", "lightweight", "cushioning", "gowalk", "machine washable", "daily"],
     "fbt_product_ids": [32, 56],
     "metadata": {"material": "Stretch Knit Mesh / Skech-Knit Overlay", "fit": "True to Size", "occasion": ["Walking", "Casual", "Daily Wear", "Travel"], "season": ["All Season"], "care": "Machine wash cold, air dry", "size_available": ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"], "style": "Slip-On Casual", "closure": "Slip-On with Elastic Gore", "sole": "ULTRA GO + HIGH REBOUND", "waterproof": False, "warranty": "6 months"}},

    {"id": 16, "title": "Air Force 1 Low Men's Sneakers", "brand": "Nike",
     "category": "Footwear", "gender": "Men", "color": "Triple White",
     "price": 7495.0, "original_price": 8995.0, "discount_pct": 16,
     "rating": 4.8, "review_count": 715, "stock": 20, "city": "Mumbai",
     "image_url": _img("1491553895911-0055eca6402d"),
     "description": "Nike's Air Force 1 Low has been a streetwear essential since its 1982 debut — the first basketball shoe to use Nike Air cushioning, now reimagined as a clean all-white lifestyle icon. The full-grain leather upper ages beautifully with wear and polish while the encapsulated Nike Air unit in the heel provides comfortable, low-profile cushioning. Pairs with everything from joggers to formal chinos.",
     "tags": ["sneakers", "nike", "air force 1", "af1", "white", "men", "leather", "lifestyle", "street style", "basketball", "iconic", "classic", "casual", "premium"],
     "fbt_product_ids": [30, 52],
     "metadata": {"material": "Full-Grain Leather / Synthetic", "fit": "True to Size", "occasion": ["Casual", "Street Style", "Everyday", "Smart Casual"], "season": ["All Season"], "care": "Wipe with leather cleaner, air dry", "size_available": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"], "style": "Classic Low-Top", "closure": "Lace-Up", "sole": "Nike Air Cushioning + Rubber Pivot Circle", "waterproof": False, "warranty": "6 months"}},


    # ═══════════════════════════════════════════════════════════════════
    # TOPWEAR  (IDs 17–29)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 17, "title": "Slim Fit Formal Shirt — Blue Micro-Stripe", "brand": "Allen Solly",
     "category": "Topwear", "gender": "Men", "color": "Blue / White Stripe",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.4, "review_count": 220, "stock": 40, "city": "Bengaluru",
     "image_url": _img("1596755094514-f87e34085b2c"),
     "description": "Allen Solly's signature slim fit formal shirt features a classic blue micro-stripe on a poplin cotton-blend fabric that stays crisp all day without requiring ironing. Designed with a semi-spread collar and single-button cuffs, it pairs equally well with formal trousers for boardroom meetings or with dark jeans for business-casual Fridays.",
     "tags": ["formal", "shirt", "men", "blue", "stripe", "allen solly", "slim fit", "office", "corporate", "cotton", "poplin", "professional", "button down", "collared"],
     "fbt_product_ids": [32, 46],
     "metadata": {"material": "65% Polyester / 35% Cotton Poplin", "fit": "Slim Fit", "occasion": ["Office", "Formal", "Business Casual", "Meetings"], "season": ["All Season"], "care": "Machine wash cold, tumble dry low, light iron", "size_available": ["S", "M", "L", "XL", "XXL"], "style": "Formal", "pattern": "Micro-Stripe", "neck": "Semi-Spread Collar", "sleeve": "Full Sleeve"}},

    {"id": 18, "title": "Flex Formal Stretch Shirt — Solid White", "brand": "Van Heusen",
     "category": "Topwear", "gender": "Men", "color": "Optic White",
     "price": 1499.0, "original_price": 2499.0, "discount_pct": 40,
     "rating": 4.5, "review_count": 315, "stock": 50, "city": "Delhi",
     "image_url": _img("1602810318383-e386cc2a3ccf"),
     "description": "Van Heusen's Flex technology incorporates 4-way mechanical stretch into a solid white formal shirt that moves with you rather than restricting movement at the shoulders and elbows. The wrinkle-resistant finish keeps you looking polished through back-to-back meetings, flights, and long commutes without constant ironing.",
     "tags": ["formal", "shirt", "men", "white", "van heusen", "stretch", "flex", "office", "corporate", "wrinkle resistant", "professional", "button down", "solid"],
     "fbt_product_ids": [32, 46],
     "metadata": {"material": "Cotton / Spandex Blend — 4-Way Stretch", "fit": "Regular Fit", "occasion": ["Office", "Formal", "Corporate", "Travel"], "season": ["All Season"], "care": "Machine wash, wrinkle-resistant — no ironing required", "size_available": ["S", "M", "L", "XL", "XXL", "3XL"], "style": "Formal", "pattern": "Solid", "neck": "Spread Collar", "sleeve": "Full Sleeve"}},

    {"id": 19, "title": "Oversized Logo Hoodie Sweatshirt", "brand": "Jack & Jones",
     "category": "Topwear", "gender": "Men", "color": "Jet Black",
     "price": 1799.0, "original_price": 2999.0, "discount_pct": 40,
     "rating": 4.5, "review_count": 178, "stock": 45, "city": "Bengaluru",
     "image_url": _img("1556905055-8f358a7a47b2"),
     "description": "Jack & Jones' premium hoodie in brushed fleece-back jersey combines warmth with streetwear edge. The oversized logo embroidery across the chest adds visual impact while the kangaroo pocket, drawstring hood, and ribbed cuffs deliver the relaxed functionality Gen-Z and millennials expect from their casual layering piece.",
     "tags": ["hoodie", "sweatshirt", "men", "black", "jack jones", "oversized", "casual", "streetwear", "fleece", "winter", "warm", "logo", "layering", "lounge"],
     "fbt_product_ids": [30, 8],
     "metadata": {"material": "80% Cotton / 20% Polyester Fleece-Back Jersey", "fit": "Relaxed / Oversized", "occasion": ["Casual", "Street Style", "Lounge", "Travel", "Winter"], "season": ["Winter", "Autumn"], "care": "Machine wash cold, do not tumble dry", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Streetwear Casual", "pattern": "Solid with Embroidered Logo", "neck": "Drawstring Hood", "sleeve": "Full Sleeve with Ribbed Cuffs"}},

    {"id": 20, "title": "Sherpa-Lined Biker Jacket", "brand": "Roadster",
     "category": "Topwear", "gender": "Men", "color": "Midnight Black",
     "price": 2499.0, "original_price": 4999.0, "discount_pct": 50,
     "rating": 4.4, "review_count": 95, "stock": 20, "city": "Hyderabad",
     "image_url": _img("1591047139829-d91aecb6caea"),
     "description": "Roadster's Sherpa-lined biker jacket combines the timeless edge of a moto silhouette with the warmth of a fleece-backed Sherpa collar and lining — ideal for Indian winters from November to February. The faux leather outer with asymmetric zip closure, stud detailing, and multiple zippered pockets adds attitude to any casual or semi-casual look.",
     "tags": ["jacket", "biker jacket", "men", "black", "roadster", "sherpa", "faux leather", "moto", "winter", "casual", "streetwear", "outerwear", "warm", "edgy"],
     "fbt_product_ids": [30, 9],
     "metadata": {"material": "Faux Leather Outer / Sherpa Fleece Lining", "fit": "Regular Fit", "occasion": ["Casual", "Street Style", "Biking", "Night Outs", "Winter"], "season": ["Winter", "Autumn"], "care": "Dry clean only", "size_available": ["S", "M", "L", "XL", "XXL"], "style": "Moto / Biker", "pattern": "Solid with Stud Detail", "neck": "Shirt-Style Collar", "sleeve": "Full Sleeve"}},

    {"id": 21, "title": "Dri-FIT UV Miler Running T-Shirt", "brand": "Nike",
     "category": "Topwear", "gender": "Men", "color": "Obsidian Blue",
     "price": 1695.0, "original_price": 2295.0, "discount_pct": 26,
     "rating": 4.6, "review_count": 140, "stock": 35, "city": "Bengaluru",
     "image_url": _img("1521572267360-ee0c2909d518"),
     "description": "Nike's Dri-FIT UV Miler is engineered for sweat-heavy morning runs, featuring Dri-FIT technology that wicks moisture from skin to fabric surface for rapid evaporation. UPF 40+ UV protection shields your skin during noon training sessions while the reflective elements at chest and back increase visibility during pre-dawn and post-sunset runs.",
     "tags": ["t-shirt", "running", "men", "blue", "nike", "dri-fit", "uv protection", "moisture wicking", "reflective", "sports", "training", "athletic", "workout"],
     "fbt_product_ids": [30, 52],
     "metadata": {"material": "100% Recycled Polyester Dri-FIT", "fit": "Standard / Athletic Cut", "occasion": ["Running", "Sports", "Gym", "Outdoor Training"], "season": ["All Season"], "care": "Machine wash cold, do not bleach", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Athletic", "pattern": "Solid with Reflective Detail", "neck": "Crew Neck", "sleeve": "Short Sleeve"}},

    {"id": 22, "title": "Slim Fit Graphic Print T-Shirt", "brand": "H&M",
     "category": "Topwear", "gender": "Men", "color": "White / Black Print",
     "price": 799.0, "original_price": 1199.0, "discount_pct": 33,
     "rating": 4.3, "review_count": 87, "stock": 55, "city": "Delhi",
     "image_url": _img("1626497764746-6dc36546b388"),
     "description": "H&M's graphic print tee crafted from 100% organic cotton jersey is a wardrobe staple for the style-conscious millennial. The contrast front graphic in bold black-on-white adds edge without complexity, while the slim silhouette keeps the look sharp when tucked into high-waist jeans or worn loose with shorts.",
     "tags": ["t-shirt", "men", "white", "black", "graphic print", "h&m", "slim fit", "cotton", "casual", "organic", "streetwear", "everyday", "youth", "graphic tee"],
     "fbt_product_ids": [30, 52],
     "metadata": {"material": "100% Organic Cotton Jersey", "fit": "Slim Fit", "occasion": ["Casual", "Weekend", "Street Style", "College"], "season": ["Summer", "All Season"], "care": "Machine wash cold inside out, air dry", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Casual Graphic", "pattern": "Graphic Print", "neck": "Crew Neck", "sleeve": "Short Sleeve"}},

    {"id": 23, "title": "Essentials Logo Hoodie", "brand": "Puma",
     "category": "Topwear", "gender": "Unisex", "color": "Dark Grey Heather",
     "price": 2299.0, "original_price": 3499.0, "discount_pct": 34,
     "rating": 4.5, "review_count": 204, "stock": 40, "city": "Mumbai",
     "image_url": _img("1509967419530-da38b4704bc6"),
     "description": "Puma's Essentials hoodie in a versatile dark grey heather is the unisex wardrobe piece that bridges gym sessions and coffee shop hangs. French terry fabric provides warmth without bulk while the embroidered cat logo on the left chest keeps the brand presence clean and understated.",
     "tags": ["hoodie", "unisex", "grey", "puma", "essentials", "casual", "gym", "streetwear", "french terry", "warm", "everyday", "sweatshirt", "comfortable"],
     "fbt_product_ids": [39, 56],
     "metadata": {"material": "68% Cotton / 32% Polyester French Terry", "fit": "Regular Fit", "occasion": ["Casual", "Gym", "Street Style", "Daily Wear"], "season": ["All Season", "Winter"], "care": "Machine wash cold, tumble dry low", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Casual Athleisure", "pattern": "Solid with Embroidered Logo", "neck": "Drawstring Hood", "sleeve": "Full Sleeve"}},

    {"id": 24, "title": "Oversized Tie-Dye T-Shirt", "brand": "Zara",
     "category": "Topwear", "gender": "Women", "color": "Multi-Colour Tie Dye",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.3, "review_count": 63, "stock": 30, "city": "Mumbai",
     "image_url": _img("1521572267360-ee0c2909d518"),
     "description": "Zara's oversized tie-dye tee in a vibrant multicolour swirl pattern is the relaxed-cool piece that anchors any effortless summer outfit. Made from 100% soft cotton jersey, the dropped shoulders and boxy cut make it perfect for wearing with high-waist denim shorts, bike shorts, or tucking into a midi skirt.",
     "tags": ["t-shirt", "women", "tie dye", "multicolor", "zara", "oversized", "casual", "summer", "cotton", "streetwear", "boxy", "relaxed", "colorful"],
     "fbt_product_ids": [33, 42],
     "metadata": {"material": "100% Cotton Jersey", "fit": "Oversized / Boxy", "occasion": ["Casual", "Beach", "Summer Hangout", "Weekend"], "season": ["Summer", "Spring"], "care": "Machine wash cold, inside out to preserve color", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Casual / Boho", "pattern": "Tie-Dye", "neck": "Crew Neck", "sleeve": "Short Sleeve"}},

    {"id": 25, "title": "Cropped Hoodie Sweatshirt", "brand": "H&M",
     "category": "Topwear", "gender": "Women", "color": "Dusty Pink",
     "price": 1499.0, "original_price": 2299.0, "discount_pct": 34,
     "rating": 4.4, "review_count": 112, "stock": 38, "city": "Bengaluru",
     "image_url": _img("1562157873-818bc0726f68"),
     "description": "H&M's cropped hoodie in dusty pink brushed fleece is the ultimate cosy-cute wardrobe piece for autumn evenings and air-conditioned office freezers alike. The cropped length hits at the high waist, making it ideal to pair with high-rise leggings, jeans, or skirts. Kangaroo front pocket and adjustable drawstring hood complete the look.",
     "tags": ["hoodie", "women", "pink", "dusty pink", "h&m", "cropped", "casual", "cozy", "fleece", "winter", "autumn", "cute", "sweatshirt", "comfortable"],
     "fbt_product_ids": [33, 42],
     "metadata": {"material": "75% Cotton / 25% Polyester Brushed Fleece", "fit": "Relaxed Cropped", "occasion": ["Casual", "Loungewear", "College", "Weekend"], "season": ["Autumn", "Winter", "All Season"], "care": "Machine wash cold, tumble dry low", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Casual / Cosy", "pattern": "Solid", "neck": "Drawstring Hood", "sleeve": "Full Sleeve with Ribbed Cuffs"}},

    {"id": 26, "title": "Floral Lace Blouse", "brand": "Forever 21",
     "category": "Topwear", "gender": "Women", "color": "Ivory White",
     "price": 999.0, "original_price": 1599.0, "discount_pct": 37,
     "rating": 4.2, "review_count": 74, "stock": 25, "city": "Mumbai",
     "image_url": _img("1618354691373-d851c5c3a990"),
     "description": "Forever 21's floral lace blouse in ivory white adds a feminine, romantic touch to any outfit. The delicate floral lace overlay on a camisole lining creates a layered look without the bulk, while the relaxed fit ensures comfort across brunch, date nights, and casual office environments. Pairs beautifully with high-waist jeans or a flared midi skirt.",
     "tags": ["blouse", "women", "white", "ivory", "lace", "forever 21", "floral", "romantic", "feminine", "casual", "brunch", "date night", "overlay"],
     "fbt_product_ids": [36, 43],
     "metadata": {"material": "Floral Lace Overlay / Polyester Camisole Lining", "fit": "Relaxed Fit", "occasion": ["Casual", "Brunch", "Date Night", "Parties", "Smart Casual"], "season": ["Summer", "Spring", "All Season"], "care": "Hand wash cold, lay flat to dry", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Romantic / Feminine", "pattern": "Floral Lace", "neck": "Scoop Neck", "sleeve": "Short Sleeve"}},

    {"id": 27, "title": "Satin Blouse — Champagne Gold", "brand": "Zara",
     "category": "Topwear", "gender": "Women", "color": "Champagne Gold",
     "price": 1799.0, "original_price": 2999.0, "discount_pct": 40,
     "rating": 4.4, "review_count": 88, "stock": 22, "city": "Delhi",
     "image_url": _img("1515886657613-9f3515b0c78f"),
     "description": "Zara's fluid satin blouse in champagne gold is a dinner-table and cocktail-party essential that photographs beautifully under ambient lighting. The bias-cut drape skims the body flatteringly, the V-neck adds elegance without being overtly revealing, and the cami straps keep the silhouette delicate. Tuck it into wide-leg trousers or wear loose over tailored cigarette pants.",
     "tags": ["blouse", "women", "champagne", "gold", "satin", "zara", "elegant", "party", "dinner", "cocktail", "v-neck", "cami", "evening wear", "fluid"],
     "fbt_product_ids": [33, 43],
     "metadata": {"material": "100% Viscose Satin", "fit": "Relaxed Drape Fit", "occasion": ["Party", "Dinner", "Cocktail Events", "Date Night", "Festive"], "season": ["All Season"], "care": "Dry clean recommended; hand wash gentle", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Elegant / Festive", "pattern": "Solid Satin", "neck": "V-Neck with Adjustable Straps", "sleeve": "Sleeveless / Cami"}},

    {"id": 28, "title": "Women's Relaxed Linen Shirt", "brand": "Mango",
     "category": "Topwear", "gender": "Women", "color": "Natural White",
     "price": 2199.0, "original_price": 3499.0, "discount_pct": 37,
     "rating": 4.5, "review_count": 99, "stock": 30, "city": "Bengaluru",
     "image_url": _img("1534528741775-53994a69daeb"),
     "description": "Mango's relaxed linen shirt in natural white is the quintessential summer essential that breathes beautifully in Indian heat and humidity. The 100% linen construction provides thermoregulation — cool when it's hot, and layerable when evenings turn cool. The long, oversized silhouette works as a beach cover-up, a loose shirt dress with a belt, or a relaxed layering piece over a bikini top.",
     "tags": ["shirt", "women", "white", "linen", "mango", "relaxed", "summer", "breathable", "beach", "casual", "oversized", "natural", "sustainable", "versatile"],
     "fbt_product_ids": [33, 42],
     "metadata": {"material": "100% Natural Linen", "fit": "Relaxed / Oversized", "occasion": ["Casual", "Beach", "Summer Outings", "Travel", "Resort Wear"], "season": ["Summer", "Spring"], "care": "Machine wash 30°C, line dry, iron on linen setting", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Casual / Resort", "pattern": "Solid", "neck": "Classic Shirt Collar", "sleeve": "Long Sleeve / Rolled-Up"}},

    {"id": 29, "title": "Embroidered Printed Kurta — Floral", "brand": "Biba",
     "category": "Topwear", "gender": "Women", "color": "Teal / Gold Embroidery",
     "price": 1399.0, "original_price": 2199.0, "discount_pct": 36,
     "rating": 4.6, "review_count": 185, "stock": 40, "city": "Jaipur",
     "image_url": _img("1617627143750-d86bc21e42bb"),
     "description": "Biba's embroidered floral kurta in teal with gold thread detailing is a festive occasion staple that keeps you looking traditional yet contemporary. The straight silhouette flatters all body types while the cotton-blend fabric keeps you comfortable through long puja ceremonies or family gatherings. Pairs beautifully with churidar leggings or Palazzo pants.",
     "tags": ["kurta", "women", "teal", "gold", "biba", "embroidered", "floral", "ethnic", "festive", "traditional", "cotton", "casual ethnic", "straight cut", "indian wear"],
     "fbt_product_ids": [59, 50],
     "metadata": {"material": "Cotton Blend with Embroidery Thread", "fit": "Straight / Regular", "occasion": ["Festive", "Casual Ethnic", "Puja", "Family Gatherings", "Eid", "Diwali"], "season": ["All Season"], "care": "Machine wash cold, do not bleach", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Ethnic Casual", "pattern": "Floral Embroidery Print", "neck": "Round Neck with Embroidered Yoke", "sleeve": "Three-Quarter Sleeve"}},


    # ═══════════════════════════════════════════════════════════════════
    # BOTTOMWEAR  (IDs 30–41)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 30, "title": "511 Slim Fit All-Day Stretch Jeans", "brand": "Levi's",
     "category": "Bottomwear", "gender": "Men", "color": "Dark Indigo Stonewash",
     "price": 2599.0, "original_price": 3999.0, "discount_pct": 35,
     "rating": 4.5, "review_count": 220, "stock": 30, "city": "Bengaluru",
     "image_url": _img("1541099649105-f69ad21f3246"),
     "description": "Levi's 511 Slim Fit jeans are the gold standard for versatile everyday denim — slim through the seat and thigh with a straight leg opening that creates a clean, modern silhouette. The All-Day Stretch denim incorporates 2% elastane for a slight give that maintains shape through full days of wear and repeated washes. Available in authentic dark indigo stonewash.",
     "tags": ["jeans", "men", "dark indigo", "slim fit", "levis", "511", "denim", "stretch", "casual", "everyday", "streetwear", "classic", "pants", "bottomwear"],
     "fbt_product_ids": [21, 46],
     "metadata": {"material": "98% Cotton / 2% Elastane Denim", "fit": "Slim Fit — Slim Through Seat & Thigh", "occasion": ["Casual", "Smart Casual", "Daily Wear", "Office Casual"], "season": ["All Season"], "care": "Machine wash cold inside out, tumble dry low", "size_available": ["28x30", "30x30", "32x30", "32x32", "34x30", "34x32", "36x32"], "style": "Slim Denim", "rise": "Mid Rise", "closure": "Zip Fly with Button"}},

    {"id": 31, "title": "Regular Fit Jeans — Medium Wash", "brand": "Lee",
     "category": "Bottomwear", "gender": "Men", "color": "Medium Indigo Wash",
     "price": 1899.0, "original_price": 2999.0, "discount_pct": 36,
     "rating": 4.4, "review_count": 142, "stock": 35, "city": "Delhi",
     "image_url": _img("1473966968600-fa801b869a1a"),
     "description": "Lee's Regular Fit jeans offer the classic relaxed comfort that never goes out of style, featuring a straight leg cut from heel to hip that works across generations. The medium indigo wash gives a worn-in authenticity straight out of the packet, and the Lee denim's 4-pocket construction uses durable brass rivets at stress points for longevity.",
     "tags": ["jeans", "men", "medium wash", "regular fit", "lee", "denim", "classic", "straight leg", "casual", "everyday", "comfortable", "durable"],
     "fbt_product_ids": [22, 8],
     "metadata": {"material": "100% Cotton Denim", "fit": "Regular Fit — Straight Leg", "occasion": ["Casual", "Weekend", "Daily Wear"], "season": ["All Season"], "care": "Machine wash cold, tumble dry low", "size_available": ["28", "30", "32", "34", "36", "38"], "style": "Classic Straight", "rise": "Mid Rise", "closure": "Zip Fly with Button"}},

    {"id": 32, "title": "Slim Chino Trousers — Khaki", "brand": "H&M",
     "category": "Bottomwear", "gender": "Men", "color": "Khaki / Warm Beige",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.3, "review_count": 96, "stock": 42, "city": "Mumbai",
     "image_url": _img("1624378439575-d8705ad7ae80"),
     "description": "H&M's slim chino trouser in khaki is the quintessential smart-casual bottom that bridges the gap between formal trousers and jeans. The cotton-twill construction drapes cleanly for a polished appearance without the stiffness of formal wear, making it ideal for office casual dress codes, weekend brunches, and business travel.",
     "tags": ["chino", "trousers", "men", "khaki", "beige", "h&m", "slim fit", "casual", "smart casual", "office casual", "twill", "cotton", "bottomwear"],
     "fbt_product_ids": [17, 46],
     "metadata": {"material": "98% Cotton / 2% Elastane Twill", "fit": "Slim Fit", "occasion": ["Office Casual", "Smart Casual", "Weekend", "Travel"], "season": ["All Season"], "care": "Machine wash cold, iron on medium heat", "size_available": ["28", "30", "32", "34", "36", "38"], "style": "Smart Casual / Chino", "rise": "Mid Rise", "closure": "Zip & Button with Belt Loops"}},

    {"id": 33, "title": "High Waist Skinny Jeans — Black", "brand": "H&M",
     "category": "Bottomwear", "gender": "Women", "color": "Black",
     "price": 1499.0, "original_price": 2199.0, "discount_pct": 31,
     "rating": 4.5, "review_count": 310, "stock": 50, "city": "Bengaluru",
     "image_url": _img("1541099649105-f69ad21f3246"),
     "description": "H&M's high waist skinny jeans in jet black are the versatile wardrobe anchor for every modern woman — slimming, elongating, and effortlessly chic. The super-stretch denim retains its shape wash after wash, the high waist defines the silhouette and keeps everything securely tucked in, and the ankle-length cut flatters boots, heels, and trainers equally.",
     "tags": ["jeans", "women", "black", "high waist", "skinny", "h&m", "stretch", "slim", "ankle length", "versatile", "casual", "office", "everyday", "denim"],
     "fbt_product_ids": [23, 42],
     "metadata": {"material": "73% Cotton / 25% Polyester / 2% Elastane Denim", "fit": "High Waist Skinny", "occasion": ["Casual", "Office", "Daily Wear", "Smart Casual"], "season": ["All Season"], "care": "Machine wash cold inside out, tumble dry low", "size_available": ["XS(26)", "S(28)", "M(30)", "L(32)", "XL(34)", "XXL(36)"], "style": "High Waist Skinny", "rise": "High Rise", "closure": "Zip & Button"}},

    {"id": 34, "title": "Wide Leg Linen Trousers — Beige", "brand": "Zara",
     "category": "Bottomwear", "gender": "Women", "color": "Natural Beige",
     "price": 2199.0, "original_price": 3499.0, "discount_pct": 37,
     "rating": 4.4, "review_count": 78, "stock": 25, "city": "Delhi",
     "image_url": _img("1506629082955-511b1aa562c8"),
     "description": "Zara's wide leg linen trousers in natural beige are a sophisticated wardrobe investment that works from beach holidays to editorial-inspired street style. The high waist and flowing wide leg create a long, lean silhouette while the natural linen fabric breathes beautifully in tropical heat. Press a sharp crease down the front leg for an elevated formal-casual look.",
     "tags": ["trousers", "women", "beige", "wide leg", "linen", "zara", "high waist", "summer", "casual", "elegant", "sustainable", "breathable", "palazzo"],
     "fbt_product_ids": [27, 43],
     "metadata": {"material": "100% Linen", "fit": "High Waist Wide Leg", "occasion": ["Smart Casual", "Beach", "Summer Outings", "Editorial"], "season": ["Summer", "Spring"], "care": "Machine wash 30°C, iron on linen setting", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Wide Leg / Relaxed Elegant", "rise": "High Rise", "closure": "Side Zip"}},

    {"id": 35, "title": "Yoga Pants — High Performance Leggings", "brand": "HRX",
     "category": "Bottomwear", "gender": "Women", "color": "Charcoal Grey",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.5, "review_count": 236, "stock": 55, "city": "Bengaluru",
     "image_url": _img("1506126613408-eca07ce68773"),
     "description": "HRX's high performance yoga leggings feature a four-way stretch fabric with quick-dry moisture wicking to keep you cool and dry through hot yoga, Pilates, and HIIT sessions. The high waist band provides compression support without digging in, the gusseted crotch allows deep squat movement, and the hidden waistband pocket stores essentials hands-free.",
     "tags": ["yoga", "leggings", "women", "charcoal", "grey", "hrx", "high waist", "stretch", "gym", "sports", "fitness", "pilates", "hiit", "compression", "activewear"],
     "fbt_product_ids": [67, 68],
     "metadata": {"material": "88% Polyester / 12% Spandex — 4-Way Stretch", "fit": "High Waist Compression Fit", "occasion": ["Yoga", "Gym", "Running", "Sports", "Pilates"], "season": ["All Season"], "care": "Machine wash cold, do not bleach or tumble dry", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Sports / Activewear", "rise": "High Rise", "closure": "Elasticated Waistband with Drawcord"}},

    {"id": 36, "title": "Floral Pleated Mini Skirt", "brand": "Forever 21",
     "category": "Bottomwear", "gender": "Women", "color": "Multi-Floral Print",
     "price": 899.0, "original_price": 1499.0, "discount_pct": 40,
     "rating": 4.3, "review_count": 55, "stock": 28, "city": "Mumbai",
     "image_url": _img("1572804013309-59a88b7e92f1"),
     "description": "Forever 21's floral pleated mini skirt bounces joyfully with every step thanks to its flared pleated construction in a vibrant multicolour floral chiffon. The elasticated waistband makes it a flattering, one-size-friendly option, and the mini length paired with platform sneakers or strappy sandals creates the perfect summer-daydream aesthetic.",
     "tags": ["skirt", "mini skirt", "women", "floral", "multicolor", "forever 21", "pleated", "summer", "casual", "feminine", "cute", "chiffon", "daytime"],
     "fbt_product_ids": [26, 42],
     "metadata": {"material": "100% Polyester Chiffon", "fit": "A-Line Pleated", "occasion": ["Casual", "Brunch", "Beach", "Festival", "Summer"], "season": ["Summer", "Spring"], "care": "Machine wash cold, hang dry", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Feminine / Casual", "length": "Mini", "closure": "Elasticated Waistband"}},

    {"id": 37, "title": "Satin Midi Wrap Skirt — Dusty Coral", "brand": "W",
     "category": "Bottomwear", "gender": "Women", "color": "Dusty Coral",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.4, "review_count": 67, "stock": 22, "city": "Jaipur",
     "image_url": _img("1595777457583-95e059d581b8"),
     "description": "W's satin midi wrap skirt in dusty coral is a sophisticated, feminine piece that transitions effortlessly from daytime lunch to evening cocktails. The wrap design is universally flattering — adjustable tie waist and the fluid satin drape follows the body's silhouette. Pair with a tucked-in blouse, strappy heels, and minimal jewellery for a polished, put-together look.",
     "tags": ["skirt", "midi", "women", "coral", "dusty rose", "w", "satin", "wrap", "elegant", "dinner", "party", "feminine", "sophisticated"],
     "fbt_product_ids": [28, 43],
     "metadata": {"material": "100% Viscose Satin", "fit": "Wrap / Adjustable", "occasion": ["Dinner", "Party", "Smart Casual", "Cocktails", "Date Night"], "season": ["All Season"], "care": "Dry clean or hand wash gentle", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Elegant Midi", "length": "Midi (Knee to Calf)", "closure": "Tie Wrap"}},

    {"id": 38, "title": "Slim Straight Jeans — Washed Black", "brand": "Wrangler",
     "category": "Bottomwear", "gender": "Men", "color": "Washed Black",
     "price": 1699.0, "original_price": 2699.0, "discount_pct": 37,
     "rating": 4.3, "review_count": 108, "stock": 32, "city": "Hyderabad",
     "image_url": _img("1582552938357-32b906df40cb"),
     "description": "Wrangler's Slim Straight jeans in a versatile washed black deliver the clean, modern silhouette that works across denim occasions — formal denim on Fridays, evening dinners, or weekend city walks. The slight whisker wash at the thigh adds lived-in character while the durable cotton-blend construction maintains shape across hundreds of washes.",
     "tags": ["jeans", "men", "black", "washed", "slim straight", "wrangler", "denim", "casual", "versatile", "office casual", "evening", "classic"],
     "fbt_product_ids": [22, 8],
     "metadata": {"material": "99% Cotton / 1% Elastane Denim", "fit": "Slim Straight", "occasion": ["Casual", "Smart Casual", "Evening Wear"], "season": ["All Season"], "care": "Machine wash cold inside out", "size_available": ["28", "30", "32", "34", "36"], "style": "Slim Straight Denim", "rise": "Mid Rise", "closure": "Zip Fly"}},

    {"id": 39, "title": "Cargo Shorts — Utility Olive", "brand": "Roadster",
     "category": "Bottomwear", "gender": "Men", "color": "Military Olive",
     "price": 999.0, "original_price": 1799.0, "discount_pct": 44,
     "rating": 4.3, "review_count": 72, "stock": 45, "city": "Delhi",
     "image_url": _img("1582552938357-32b906dfca00"),
     "description": "Roadster's Utility Cargo Shorts in military olive are built for the man who needs his clothes to keep up with an adventurous weekend. Six cargo pockets — including two deep side cargo pockets with Velcro flaps — provide hands-free storage for phone, wallet, keys, earbuds, and more. The cotton-ripstop construction is durable enough for hikes, beach days, and city exploring.",
     "tags": ["cargo", "shorts", "men", "olive", "military", "roadster", "utility", "pockets", "casual", "outdoor", "summer", "beach", "hiking", "comfortable"],
     "fbt_product_ids": [22, 56],
     "metadata": {"material": "100% Cotton Ripstop", "fit": "Regular Fit", "occasion": ["Casual", "Outdoor", "Beach", "Hiking", "Weekend"], "season": ["Summer", "Monsoon"], "care": "Machine wash cold, tumble dry low", "size_available": ["28", "30", "32", "34", "36", "38"], "style": "Utility Cargo", "rise": "Mid Rise", "closure": "Zip Fly with Button and Elasticated Back Waist"}},

    {"id": 40, "title": "Running Shorts — Electric Blue", "brand": "Decathlon",
     "category": "Bottomwear", "gender": "Men", "color": "Electric Blue",
     "price": 699.0, "original_price": 999.0, "discount_pct": 30,
     "rating": 4.4, "review_count": 165, "stock": 60, "city": "Bengaluru",
     "image_url": _img("1538805060514-97d9cc17730c"),
     "description": "Decathlon's running shorts in electric blue are engineered for performance at an accessible price — the double-layer construction with inner compression shorts prevents chafing across long distances, while the lightweight polyester outer is treated with a DWR moisture-repellent finish. The elastic waistband with internal drawcord ensures the shorts stay in place from the first kilometre to the last.",
     "tags": ["running", "shorts", "men", "blue", "electric", "decathlon", "sports", "gym", "fitness", "lightweight", "quick dry", "compression", "anti-chafe", "marathon"],
     "fbt_product_ids": [23, 56],
     "metadata": {"material": "100% Polyester with DWR Finish / Inner Compression", "fit": "Regular Fit", "occasion": ["Running", "Gym", "Sports", "Training"], "season": ["Summer", "All Season"], "care": "Machine wash cold, do not iron", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Sports Performance", "rise": "Mid Rise", "closure": "Elasticated Waistband with Drawcord"}},

    {"id": 41, "title": "Slim Fit Biker Jeans — Washed Blue", "brand": "Roadster",
     "category": "Bottomwear", "gender": "Men", "color": "Washed Indigo Blue",
     "price": 1899.0, "original_price": 3499.0, "discount_pct": 45,
     "rating": 4.3, "review_count": 110, "stock": 20, "city": "Hyderabad",
     "image_url": _img("1541099649105-f69ad21f3246"),
     "description": "Roadster's biker-inspired slim jeans feature tonal stitching, knee-panel construction, and a slightly distressed washed-indigo wash that gives them an authentic denim-culture edge. The slim taper from thigh to ankle creates a clean, modern silhouette that pairs with chunky boots, white trainers, or Chelsea boots equally well.",
     "tags": ["jeans", "men", "washed", "blue", "indigo", "biker", "roadster", "slim", "distressed", "streetwear", "casual", "denim", "taper", "knee panel"],
     "fbt_product_ids": [20, 9],
     "metadata": {"material": "100% Cotton Denim with Washed Finish", "fit": "Slim Taper", "occasion": ["Casual", "Evening Wear", "Street Style"], "season": ["All Season"], "care": "Machine wash cold, inside out", "size_available": ["28", "30", "32", "34", "36"], "style": "Biker / Slim Denim", "rise": "Low-Mid Rise", "closure": "Zip Fly with Button"}},


    # ═══════════════════════════════════════════════════════════════════
    # DRESSES  (IDs 42–47)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 42, "title": "Floral Wrap Midi Dress", "brand": "H&M",
     "category": "Dresses", "gender": "Women", "color": "Multi Tropical Floral",
     "price": 1799.0, "original_price": 2999.0, "discount_pct": 40,
     "rating": 4.5, "review_count": 145, "stock": 32, "city": "Mumbai",
     "image_url": _img("1572804013309-59a88b7e92f1"),
     "description": "H&M's tropical floral wrap midi dress is the standout piece for summer holidays, beach weddings, and garden brunch parties. The V-neck wrap design creates a flattering hourglass silhouette for all body types, the tiered midi skirt adds drama with every step, and the viscose fabric drapes fluidly without clinging. Complete with adjustable tie waist and flutter sleeves.",
     "tags": ["dress", "wrap dress", "midi", "women", "floral", "tropical", "h&m", "summer", "beach", "casual", "feminine", "v-neck", "party", "holiday"],
     "fbt_product_ids": [53, 47],
     "metadata": {"material": "100% Viscose", "fit": "Wrap — Adjustable Tie Waist", "occasion": ["Casual", "Beach", "Summer Party", "Brunch", "Holiday"], "season": ["Summer", "Spring"], "care": "Machine wash 30°C, hang dry, iron on low", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Bohemian / Casual", "length": "Midi", "neckline": "V-Neck Wrap", "sleeve": "Flutter Sleeve"}},

    {"id": 43, "title": "Satin Bias-Cut Midi Dress — Midnight Blue", "brand": "Zara",
     "category": "Dresses", "gender": "Women", "color": "Midnight Blue",
     "price": 2999.0, "original_price": 4999.0, "discount_pct": 40,
     "rating": 4.5, "review_count": 89, "stock": 20, "city": "Delhi",
     "image_url": _img("1490481651871-ab68de25d43d"),
     "description": "Zara's bias-cut satin dress in midnight blue is the investment piece for women who believe dinner tables are runways. The diagonal bias cut makes the fluid satin skirt sway and catch light with each step, creating a cinematic effect. Spaghetti straps and cowl neckline add old-Hollywood glamour, while the midi length maintains elegance without sacrificing movement.",
     "tags": ["dress", "midi", "women", "blue", "midnight", "navy", "satin", "zara", "evening", "dinner", "party", "glamour", "elegant", "bias cut", "spaghetti strap"],
     "fbt_product_ids": [54, 47],
     "metadata": {"material": "100% Polyester Satin with Bias Cut", "fit": "Fitted / Bias Cut", "occasion": ["Evening Dinner", "Party", "Cocktails", "Date Night", "Wedding Guest"], "season": ["All Season"], "care": "Dry clean recommended; hand wash gentle", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Elegant / Glamorous", "length": "Midi", "neckline": "Cowl Neck / Spaghetti Strap", "sleeve": "Sleeveless"}},

    {"id": 44, "title": "Mini Bodycon Dress — Classic Black", "brand": "Forever 21",
     "category": "Dresses", "gender": "Women", "color": "Classic Black",
     "price": 999.0, "original_price": 1699.0, "discount_pct": 41,
     "rating": 4.2, "review_count": 118, "stock": 40, "city": "Bengaluru",
     "image_url": _img("1515372039744-b8f02a3ae446"),
     "description": "Forever 21's classic black mini bodycon dress is the night-out essential that takes you from after-office drinks to club nights without missing a beat. The ribbed jersey fabric provides enough stretch to move freely on the dance floor while clinging to every curve confidently. Style with block-heel ankle boots and a structured mini bag for a polished, modern look.",
     "tags": ["dress", "bodycon", "mini", "women", "black", "forever 21", "ribbed", "jersey", "night out", "clubbing", "party", "fitted", "sexy", "versatile"],
     "fbt_product_ids": [53, 48],
     "metadata": {"material": "95% Polyester / 5% Spandex Ribbed Jersey", "fit": "Bodycon / Fitted", "occasion": ["Night Out", "Clubbing", "Party", "Date Night"], "season": ["All Season"], "care": "Machine wash cold, lay flat to dry", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Bodycon / Party", "length": "Mini", "neckline": "Square Neck", "sleeve": "Sleeveless / Strapless"}},

    {"id": 45, "title": "Smocked Floral Maxi Dress", "brand": "H&M",
     "category": "Dresses", "gender": "Women", "color": "Sage Green Floral",
     "price": 2199.0, "original_price": 3499.0, "discount_pct": 37,
     "rating": 4.6, "review_count": 96, "stock": 25, "city": "Hyderabad",
     "image_url": _img("1496747611176-843222e1e57c"),
     "description": "H&M's smocked floral maxi dress in sage green is the boho-romantic piece made for golden-hour beach walks and open-air festival stages. The elasticated smocked bodice requires no zip or button — simply step in and go — while the sweeping maxi skirt billows beautifully in a coastal breeze. Adjustable spaghetti straps and a tiered skirt complete the free-spirited aesthetic.",
     "tags": ["dress", "maxi", "floral", "women", "green", "sage", "h&m", "smocked", "boho", "summer", "beach", "festival", "casual", "spaghetti strap", "tiered"],
     "fbt_product_ids": [54, 47],
     "metadata": {"material": "100% Viscose", "fit": "Smocked Bodice / Flared Maxi Skirt", "occasion": ["Beach", "Festival", "Casual", "Vacation", "Summer Party"], "season": ["Summer", "Spring"], "care": "Machine wash 30°C, hang dry", "size_available": ["XS", "S", "M", "L", "XL"], "style": "Boho / Romantic", "length": "Maxi", "neckline": "Smocked Square Neck / Spaghetti Strap", "sleeve": "Sleeveless"}},

    {"id": 46, "title": "Anarkali Midi Dress — Emerald Green", "brand": "W",
     "category": "Dresses", "gender": "Women", "color": "Emerald Green / Gold",
     "price": 2499.0, "original_price": 3999.0, "discount_pct": 37,
     "rating": 4.6, "review_count": 132, "stock": 22, "city": "Jaipur",
     "image_url": _img("1610030469983-98e550d6193c"),
     "description": "W's Anarkali midi dress in emerald green with subtle gold printed border is the festive-ethnic statement piece for Diwali parties, family gatherings, and temple visits. The flared Anarkali silhouette creates a graceful, royal look for all body types while the soft chanderi fabric keeps you comfortable through hours of celebrations. Complete with a matching dupatta.",
     "tags": ["anarkali", "dress", "women", "green", "emerald", "gold", "w", "ethnic", "festive", "diwali", "party", "indian wear", "chanderi", "dupatta", "traditional"],
     "fbt_product_ids": [59, 50],
     "metadata": {"material": "Chanderi Cotton / Silk Blend", "fit": "Flared / Anarkali Silhouette", "occasion": ["Festive", "Wedding Guest", "Diwali", "Religious Occasions"], "season": ["All Season"], "care": "Dry clean recommended", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "style": "Ethnic Festive", "length": "Midi (Calf)", "neckline": "Round Neck with Yoke Print", "sleeve": "Three-Quarter Sleeve", "dupatta_included": True}},


    # ═══════════════════════════════════════════════════════════════════
    # ACCESSORIES  (IDs 47–58)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 47, "title": "Aviator Classic Sunglasses — Gold / G-15", "brand": "Ray-Ban",
     "category": "Accessories", "gender": "Unisex", "color": "Gold / Green G-15 Lens",
     "price": 5690.0, "original_price": 6990.0, "discount_pct": 18,
     "rating": 4.7, "review_count": 340, "stock": 25, "city": "Mumbai",
     "image_url": _img("1572635196237-14b3f281503f"),
     "description": "The Ray-Ban Aviator Classic with iconic gold metal frame and G-15 green glass lenses has been the definitive pilot and fashion sunglasses since 1937 — worn by US military pilots, Hollywood stars, and anyone who understands timeless style. The G-15 lens provides 100% UVA/UVB protection while minimising colour distortion for a natural, comfortable view.",
     "tags": ["sunglasses", "ray-ban", "aviator", "gold", "green lens", "unisex", "uv protection", "classic", "iconic", "premium", "metal frame", "pilot", "fashion"],
     "fbt_product_ids": [42, 43],
     "metadata": {"material": "Metal Frame / G-15 Glass Lens", "occasion": ["Casual", "Outdoor", "Beach", "Driving", "Fashion"], "protection": "100% UVA/UVB", "lens_type": "Classic G-15 Glass", "frame_shape": "Teardrop Aviator", "polarised": False, "warranty": "1 year Ray-Ban warranty", "includes": ["Case", "Cleaning Cloth"]}},

    {"id": 48, "title": "Cat-Eye Sunglasses — Tortoise Shell", "brand": "Fastrack",
     "category": "Accessories", "gender": "Women", "color": "Tortoise Shell / Brown Lens",
     "price": 1299.0, "original_price": 1999.0, "discount_pct": 35,
     "rating": 4.4, "review_count": 168, "stock": 40, "city": "Bengaluru",
     "image_url": _img("1577803645773-f96470509666"),
     "description": "Fastrack's tortoiseshell cat-eye sunglasses add instant retro-glamour to any look, taking inspiration from 1960s Hollywood icons. The upsweep at the outer edge of the acetate frame creates a natural face-lifting effect while the UV400-protective brown lenses shield eyes from harsh Indian sun. Lightweight at just 22g — you'll forget you're wearing them.",
     "tags": ["sunglasses", "women", "cat eye", "tortoise", "brown", "fastrack", "retro", "vintage", "glamour", "uv protection", "lightweight", "stylish", "indian summer"],
     "fbt_product_ids": [44, 42],
     "metadata": {"material": "Acetate Frame / Polycarbonate UV400 Lens", "occasion": ["Casual", "Beach", "Daily Wear", "Fashion"], "protection": "UV400", "lens_type": "Polycarbonate Tinted Brown", "frame_shape": "Cat-Eye", "polarised": False, "warranty": "6 months", "includes": ["Pouch"]}},

    {"id": 49, "title": "Men's Leather Bifold Wallet — Dark Brown", "brand": "Da Milano",
     "category": "Accessories", "gender": "Men", "color": "Dark Chocolate Brown",
     "price": 1999.0, "original_price": 2999.0, "discount_pct": 33,
     "rating": 4.5, "review_count": 122, "stock": 35, "city": "Delhi",
     "image_url": _img("1548036328-c9fa89d128fa"),
     "description": "Da Milano's bifold wallet in full-grain dark chocolate leather is a luxury everyday essential that improves with age as the leather develops a rich patina. It accommodates 6 card slots, a clear ID window, and two full-length bill compartments — enough organisation for cash-heavy Indian markets and card-only checkout queues alike. Makes a thoughtful gift for fathers, graduates, and partners.",
     "tags": ["wallet", "men", "brown", "leather", "da milano", "bifold", "premium", "full grain", "card slots", "cash", "gift", "luxury", "accessories"],
     "fbt_product_ids": [11, 46],
     "metadata": {"material": "Full-Grain Genuine Leather", "occasion": ["Daily Use", "Office", "Travel", "Gift"], "capacity": "6 Card Slots + 2 Bill Compartments + ID Window", "closure": "Bifold", "dimensions": "11cm x 9cm x 1.5cm", "warranty": "1 year", "includes": ["Gift Box"]}},

    {"id": 50, "title": "Zaveri Pearls Ethnic Necklace Set — Gold Tone", "brand": "Zaveri Pearls",
     "category": "Accessories", "gender": "Women", "color": "Gold Tone / Ruby Red",
     "price": 799.0, "original_price": 1299.0, "discount_pct": 38,
     "rating": 4.3, "review_count": 210, "stock": 60, "city": "Jaipur",
     "image_url": _img("1515562141207-7a88fb7ce338"),
     "description": "Zaveri Pearls' ethnic necklace set combines gold-tone alloy craftsmanship with pearl and ruby-red stone accents in a traditional Rajasthani design. The set includes a statement neckpiece and matching drop earrings — perfect for completing a saree, salwar kameez, or lehenga look for festivals, weddings, and special occasions.",
     "tags": ["necklace", "jewellery", "women", "gold", "ethnic", "zaveri pearls", "pearl", "stone", "rajasthani", "festive", "wedding", "saree jewellery", "traditional", "accessories"],
     "fbt_product_ids": [59, 51],
     "metadata": {"material": "Alloy with Gold Plating / Pearl & Stone Accents", "occasion": ["Festive", "Wedding", "Ethnic Occasions", "Diwali", "Eid"], "set_includes": ["Choker Neckpiece", "Drop Earrings"], "stone": "Ruby Red Kundan & Pearls", "warranty": "None — fashion jewellery", "care": "Avoid water and perfume contact"}},

    {"id": 51, "title": "Crystal Stud Earrings — Rose Gold", "brand": "Accessorize",
     "category": "Accessories", "gender": "Women", "color": "Rose Gold / Crystal Clear",
     "price": 599.0, "original_price": 899.0, "discount_pct": 33,
     "rating": 4.4, "review_count": 178, "stock": 70, "city": "Mumbai",
     "image_url": _img("1535632066927-ab7c9ab60908"),
     "description": "Accessorize's crystal stud earrings in rose gold are the everyday luxury piece that effortlessly elevates casual and formal looks alike. The Swarovski-inspired faceted clear crystal set in a rose gold plated claw setting catches light at every angle — equally at home on Monday office mornings and Saturday evening dinners.",
     "tags": ["earrings", "stud", "women", "rose gold", "crystal", "accessorize", "everyday", "elegant", "sparkle", "casual", "formal", "office", "accessories", "jewellery"],
     "fbt_product_ids": [46, 50],
     "metadata": {"material": "Rose Gold Plated Alloy / Clear Crystal", "occasion": ["Daily Wear", "Office", "Dinner", "Casual"], "stone": "Faceted Crystal", "post_type": "Stud with Butterfly Back", "diameter": "8mm", "warranty": "None — fashion jewellery", "care": "Store away from humidity, wipe with dry cloth"}},

    {"id": 52, "title": "Dri-FIT Club Structured Cap — Black", "brand": "Nike",
     "category": "Accessories", "gender": "Unisex", "color": "Black / White",
     "price": 1195.0, "original_price": 1495.0, "discount_pct": 20,
     "rating": 4.6, "review_count": 290, "stock": 55, "city": "Bengaluru",
     "image_url": _img("1588850561407-ed78c282e89b"),
     "description": "The Nike Dri-FIT Club cap features a six-panel structured design with Dri-FIT sweatband that wicks moisture away from your forehead during training runs and gym workouts. The pre-curved bill shields eyes from direct sun while the adjustable back strap ensures a secure, comfortable fit across head sizes. The embroidered Swoosh on the front keeps it unmistakably Nike.",
     "tags": ["cap", "hat", "unisex", "black", "nike", "dri-fit", "baseball cap", "sporty", "structured", "running", "gym", "casual", "streetwear", "accessories"],
     "fbt_product_ids": [5, 56],
     "metadata": {"material": "Polyester with Dri-FIT Technology", "occasion": ["Running", "Gym", "Sports", "Casual", "Street Style"], "fit": "Adjustable Strap-Back", "style": "Six-Panel Structured", "brim": "Pre-Curved Bill", "care": "Hand wash, air dry", "warranty": "None"}},

    {"id": 53, "title": "Tan Structured Handbag — Medium", "brand": "Baggit",
     "category": "Accessories", "gender": "Women", "color": "Tan / Caramel",
     "price": 1799.0, "original_price": 2999.0, "discount_pct": 40,
     "rating": 4.4, "review_count": 185, "stock": 30, "city": "Mumbai",
     "image_url": _img("1590579491624-f98f36d4c763"),
     "description": "Baggit's tan structured handbag in cruelty-free vegan leather is the practical-yet-polished everyday carry for the modern Indian working woman. The medium body fits a 10-inch tablet, A4 documents, purse, and daily essentials with room to spare. Two interior zip pockets and one slip pocket organise your belongings efficiently while the gold-tone hardware adds a premium finish.",
     "tags": ["handbag", "women", "tan", "caramel", "baggit", "vegan leather", "structured", "office", "everyday", "medium", "gold hardware", "practical", "cruelty free"],
     "fbt_product_ids": [42, 47],
     "metadata": {"material": "Cruelty-Free Vegan Leather with Gold Hardware", "occasion": ["Office", "Daily Carry", "Smart Casual", "Shopping"], "capacity": "Fits 10-inch tablet, A4 docs, daily essentials", "compartments": "1 Main Zip + 2 Interior Zip + 1 Slip Pocket", "strap": "Fixed Top Handles + Detachable Shoulder Strap", "closure": "Zip Top Closure", "dimensions": "32cm x 26cm x 12cm"}},

    {"id": 54, "title": "Cognac Leather Tote Bag — Large", "brand": "Hidesign",
     "category": "Accessories", "gender": "Women", "color": "Cognac / Dark Brown",
     "price": 4995.0, "original_price": 6995.0, "discount_pct": 28,
     "rating": 4.7, "review_count": 98, "stock": 18, "city": "Bengaluru",
     "image_url": _img("1584917865442-de89df76afd3"),
     "description": "Hidesign's cognac leather tote is the investment carry-all that improves with every year of use as the full-grain vegetable-tanned leather develops a gorgeous individual patina. Hand-stitched by artisans in Pondicherry, it accommodates a 13-inch laptop, work documents, gym clothes, and daily essentials in its spacious main compartment — the bag for women who mean business.",
     "tags": ["tote", "bag", "women", "cognac", "brown", "leather", "hidesign", "premium", "laptop bag", "handcrafted", "artisan", "vegetable tanned", "investment", "work bag"],
     "fbt_product_ids": [43, 47],
     "metadata": {"material": "Full-Grain Vegetable-Tanned Leather — Hand-Stitched", "occasion": ["Office", "Travel", "Daily Carry", "Weekend"], "capacity": "Fits 13-inch laptop, work documents, daily essentials", "compartments": "1 Large Main + 1 Interior Slip + 1 Key Hook", "strap": "Dual Leather Top Handles", "closure": "Magnetic Snap + Interior Zip Pocket", "made_in": "Pondicherry, India", "warranty": "1 year craftsmanship"}},

    {"id": 55, "title": "Brasilia 9.5 Training Duffel Bag — 41L", "brand": "Nike",
     "category": "Accessories", "gender": "Unisex", "color": "Midnight Navy / Black",
     "price": 2495.0, "original_price": 2995.0, "discount_pct": 16,
     "rating": 4.6, "review_count": 180, "stock": 25, "city": "Bengaluru",
     "image_url": _img("1553062407-98eeb64c6a62"),
     "description": "The Nike Brasilia 9.5 Duffel is the go-to gym bag for athletes who demand organisation and durability from their kit. The 41L main compartment swallows training shoes, a change of clothes, a towel, and recovery equipment with room to spare, while the sealed wet/dry compartment keeps sweaty gear separate from clean items. Padded, adjustable shoulder strap and dual carry handles.",
     "tags": ["bag", "duffel", "gym bag", "unisex", "navy", "nike", "brasilia", "training", "sports", "gym", "travel", "wet dry", "41 litre", "athlete"],
     "fbt_product_ids": [5, 56],
     "metadata": {"material": "100% Polyester / Sealed Wet Compartment", "occasion": ["Gym", "Sports Training", "Travel", "Weekend Trips"], "capacity": "41 Litres", "compartments": "1 Main + Sealed Wet/Dry + Zip Outer + Side Bottle Pockets", "strap": "Adjustable Padded Shoulder + Dual Top Handles", "closure": "Zip Top", "dimensions": "56cm x 31cm x 30cm", "warranty": "2 years Nike warranty"}},

    {"id": 56, "title": "Everyday Plus Cushioned Socks 3-Pack", "brand": "Nike",
     "category": "Accessories", "gender": "Unisex", "color": "White / Black / Grey Mix",
     "price": 795.0, "original_price": 995.0, "discount_pct": 20,
     "rating": 4.7, "review_count": 310, "stock": 80, "city": "Bengaluru",
     "image_url": _img("1586350977771-b3b0abd50c82"),
     "description": "Nike's Everyday Plus Cushioned socks come in a 3-pack offering the perfect blend of arch support, moisture management, and targeted cushioning at the ball and heel. The reinforced heel and toe increase durability for high-mileage runners while the Dri-FIT material pulls sweat away from the skin for blister-free training sessions.",
     "tags": ["socks", "nike", "unisex", "white", "black", "cushioned", "running", "sports", "gym", "dri-fit", "3 pack", "arch support", "training", "accessories"],
     "fbt_product_ids": [1, 5],
     "metadata": {"material": "Polyester / Nylon / Spandex Dri-FIT Blend", "occasion": ["Running", "Gym", "Training", "Daily Wear"], "pack_size": "3 Pairs", "cushioning": "Heavy heel and ball cushioning", "technology": "Dri-FIT moisture management + Reinforced heel and toe", "size_available": ["S (UK 3-5)", "M (UK 6-8)", "L (UK 9-11)"], "care": "Machine wash cold, tumble dry low"}},

    {"id": 57, "title": "Sneaker Cleaning Kit — Premium", "brand": "Crep Protect",
     "category": "Accessories", "gender": "Unisex", "color": "Black / Yellow",
     "price": 1299.0, "original_price": 1599.0, "discount_pct": 18,
     "rating": 4.8, "review_count": 480, "stock": 50, "city": "Mumbai",
     "image_url": _img("1514989940723-e8e51635b782"),
     "description": "Crep Protect's premium sneaker cleaning kit is trusted by sneakerheads worldwide to restore white trainers, leather sneakers, and canvas shoes to pristine condition. The biodegradable cleaning solution is safe for all uppers including mesh, canvas, leather, and suede. Hog-hair bristle brush lifts dirt without scratching surfaces while the microfiber cloth polishes to a gleaming finish.",
     "tags": ["cleaning kit", "sneaker care", "shoe care", "accessories", "unisex", "crep protect", "sneakers", "white shoes", "leather care", "suede care", "canvas", "cleaning solution", "brush"],
     "fbt_product_ids": [7, 16],
     "metadata": {"material": "Biodegradable Solution / Hog-Hair Brush / Microfiber Cloth", "occasion": ["Sneaker Maintenance"], "kit_includes": ["100ml Cleaning Solution", "Hog-Hair Bristle Brush", "Microfiber Cloth"], "compatible_with": "All sneaker materials — Mesh, Canvas, Leather, Suede, Nubuck", "usage": "Apply solution with brush in circular motion, wipe with cloth", "eco_friendly": True}},

    {"id": 58, "title": "Edge Ultra-Slim Formal Watch — Silver Dial", "brand": "Titan",
     "category": "Accessories", "gender": "Men", "color": "Silver / White",
     "price": 4995.0, "original_price": 6995.0, "discount_pct": 28,
     "rating": 4.6, "review_count": 255, "stock": 20, "city": "Bengaluru",
     "image_url": _img("1523275335684-37898b6baf30"),
     "description": "The Titan Edge is one of the world's slimmest mechanical watches at just 3.5mm thin — a feat of Indian horological engineering. The stainless steel case with a white sunray dial and baton indices creates a clean, contemporary formal aesthetic that pairs beautifully with formal shirts, blazers, and kurta sets alike. Quartz movement ensures precision without requiring winding.",
     "tags": ["watch", "titan", "edge", "ultra slim", "silver", "white", "formal", "men", "stainless steel", "quartz", "analog", "corporate", "premium", "dress watch", "indian"],
     "fbt_product_ids": [17, 46],
     "metadata": {"material": "Stainless Steel Case / Mineral Crystal / Leather Strap", "occasion": ["Formal", "Office", "Weddings", "Smart Casual"], "movement": "Quartz Analog", "case_diameter": "40mm", "case_thickness": "3.5mm", "water_resistant": "30m WR", "strap": "Genuine Leather with Butterfly Clasp", "warranty": "2 years Titan warranty", "includes": ["Box", "Warranty Card"]}},


    # ═══════════════════════════════════════════════════════════════════
    # ETHNIC WEAR  (IDs 59–66)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 59, "title": "Cotton Silk Handloom Saree — Teal & Gold Zari", "brand": "Fabindia",
     "category": "Ethnic Wear", "gender": "Women", "color": "Teal / Gold Zari Border",
     "price": 3499.0, "original_price": 4999.0, "discount_pct": 30,
     "rating": 4.7, "review_count": 122, "stock": 20, "city": "Jaipur",
     "image_url": _img("1610030469983-98e550d6193c"),
     "description": "Fabindia's teal cotton-silk handloom saree with an intricate gold zari border is a celebration of India's rich weaving heritage. Woven by skilled artisans in Jaipur's textile districts, the 5.5-metre drape offers the perfect weight — light enough to drape comfortably through a full festival day, rich enough to command attention at wedding ceremonies. The blouse piece is included.",
     "tags": ["saree", "women", "teal", "gold", "zari", "fabindia", "handloom", "cotton silk", "ethnic", "festive", "wedding", "indian wear", "traditional", "artisan", "woven"],
     "fbt_product_ids": [50, 51],
     "metadata": {"material": "55% Cotton / 45% Silk Handloom Weave", "occasion": ["Festivals", "Weddings", "Formal Ethnic Occasions"], "season": ["All Season"], "care": "Dry clean recommended; hand wash cold if necessary", "saree_length": "5.5 metres", "blouse_piece": "0.8 metres included", "weave_origin": "Jaipur, Rajasthan", "border": "Gold Zari Woven Border", "dupatta_included": False}},

    {"id": 60, "title": "Straight Suit Set — Royal Blue", "brand": "Biba",
     "category": "Ethnic Wear", "gender": "Women", "color": "Royal Blue / White Print",
     "price": 2499.0, "original_price": 3999.0, "discount_pct": 37,
     "rating": 4.5, "review_count": 198, "stock": 35, "city": "Delhi",
     "image_url": _img("1583391733956-3750e0ff4e8b"),
     "description": "Biba's royal blue straight suit set features a block-print kurta with matching tapered salwar and a sheer dupatta — the complete ethnic ensemble for Eid celebrations, Diwali gatherings, and wedding functions. The cotton-blend fabric is soft, breathable, and easy to maintain, and the block print pays homage to traditional Indian textile arts.",
     "tags": ["suit set", "salwar kameez", "women", "blue", "royal blue", "biba", "block print", "ethnic", "eid", "diwali", "wedding", "festive", "dupatta", "cotton"],
     "fbt_product_ids": [50, 51],
     "metadata": {"material": "Cotton Blend with Block Print", "fit": "Straight Kurta / Tapered Salwar", "occasion": ["Festivals", "Wedding Guest", "Eid", "Diwali", "Family Functions"], "season": ["All Season"], "care": "Machine wash cold, inside out", "set_includes": ["Kurta", "Salwar", "Dupatta"], "dupatta_included": True, "size_available": ["XS", "S", "M", "L", "XL", "XXL"]}},

    {"id": 61, "title": "Printed Kurta Set — Mustard & Block Print", "brand": "W",
     "category": "Ethnic Wear", "gender": "Women", "color": "Mustard / Rust Print",
     "price": 1999.0, "original_price": 2999.0, "discount_pct": 33,
     "rating": 4.5, "review_count": 145, "stock": 30, "city": "Bengaluru",
     "image_url": _img("1515886657613-9f3515b0c78f"),
     "description": "W's mustard-rust block print kurta set is designed for the modern Indian woman who wants ethnic ease without sacrificing contemporary sensibility. The A-line kurta is versatile enough for college, office ethnic days, temple visits, and casual family outings. Paired with a solid palazzo bottom, the set achieves the perfect balance of tradition and modernity.",
     "tags": ["kurta set", "women", "mustard", "rust", "block print", "w", "ethnic", "casual ethnic", "a-line", "palazzo", "office ethnic", "college", "traditional"],
     "fbt_product_ids": [50, 51],
     "metadata": {"material": "Cotton Blend", "fit": "A-Line Kurta / Relaxed Palazzo", "occasion": ["Casual Ethnic", "Office Ethnic Day", "College", "Temple Visits", "Family"], "season": ["All Season"], "care": "Machine wash cold", "set_includes": ["Kurta", "Palazzo"], "dupatta_included": False, "size_available": ["XS", "S", "M", "L", "XL", "XXL"]}},

    {"id": 62, "title": "Anarkali Floor-Length Suit — Magenta", "brand": "Global Desi",
     "category": "Ethnic Wear", "gender": "Women", "color": "Magenta / Gold Thread",
     "price": 3299.0, "original_price": 4999.0, "discount_pct": 34,
     "rating": 4.6, "review_count": 87, "stock": 18, "city": "Mumbai",
     "image_url": _img("1609357605129-26f69add5d6e"),
     "description": "Global Desi's floor-length magenta Anarkali is a festive showstopper — the flared silhouette creates a dramatic entrance at engagement ceremonies, mehendi functions, and sangeet nights. Intricate gold thread embroidery across the yoke and hem adds premium detailing while the sheer palazzo bottom in matching fabric moves gracefully with the wearer.",
     "tags": ["anarkali", "suit", "women", "magenta", "gold", "global desi", "embroidered", "floor length", "festive", "wedding", "engagement", "ethnic", "traditional", "silk blend"],
     "fbt_product_ids": [50, 51],
     "metadata": {"material": "Art Silk / Georgette with Gold Thread Embroidery", "fit": "Flared Anarkali / Floor-Length", "occasion": ["Wedding", "Engagement", "Mehendi", "Sangeet", "Festive"], "season": ["All Season"], "care": "Dry clean only", "set_includes": ["Anarkali Kurta", "Palazzo", "Dupatta"], "dupatta_included": True, "size_available": ["XS", "S", "M", "L", "XL", "XXL"]}},

    {"id": 63, "title": "Kurta Pyjama Set — Ivory Linen", "brand": "Manyavar",
     "category": "Ethnic Wear", "gender": "Men", "color": "Ivory / Off-White",
     "price": 2999.0, "original_price": 4499.0, "discount_pct": 33,
     "rating": 4.6, "review_count": 168, "stock": 22, "city": "Delhi",
     "image_url": _img("1617627143750-d86bc21e42bb"),
     "description": "Manyavar's ivory linen kurta pyjama set is the elegant, understated choice for men who want to look dressed up for Eid, Diwali, haldi ceremonies, and engagement lunches without being overdressed. The straight-cut mandarin collar kurta in breathable linen pairs with matching straight-leg pyjamas and looks equally dashing with a Nehru jacket layered on top.",
     "tags": ["kurta pyjama", "men", "ivory", "white", "manyavar", "linen", "ethnic", "eid", "diwali", "festive", "wedding", "engagement", "traditional", "mandarin collar"],
     "fbt_product_ids": [58, 49],
     "metadata": {"material": "100% Linen", "fit": "Straight Cut / Regular", "occasion": ["Festive", "Eid", "Diwali", "Wedding Functions", "Engagement"], "season": ["All Season"], "care": "Machine wash cold, iron on linen setting", "set_includes": ["Kurta", "Pyjama"], "size_available": ["S", "M", "L", "XL", "XXL", "3XL"], "embellishment": "Minimal Embroidered Border"}},

    {"id": 64, "title": "Embroidered Sherwani Set — Maroon & Gold", "brand": "Raymond",
     "category": "Ethnic Wear", "gender": "Men", "color": "Maroon / Gold Embroidery",
     "price": 8999.0, "original_price": 13999.0, "discount_pct": 35,
     "rating": 4.7, "review_count": 54, "stock": 10, "city": "Mumbai",
     "image_url": _img("1615800098779-1be32e60cca3"),
     "description": "Raymond's maroon sherwani with gold zardozi embroidery is the grand statement piece for groom's family and baraat participants at traditional Indian weddings. The full-length sherwani coat in rich velvet-touch fabric features intricate hand-embroidered floral motifs across the yoke, cuffs, and hem. Complete with churidar pyjama, pocket square, and a traditional katha sash.",
     "tags": ["sherwani", "men", "maroon", "gold", "raymond", "embroidered", "wedding", "groom", "baraat", "ethnic", "formal ethnic", "velvet", "zardozi", "traditional", "premium"],
     "fbt_product_ids": [63, 49],
     "metadata": {"material": "Velvet-Touch Polyester / Gold Zardozi Embroidery / Brocade Churidar", "fit": "Tailored Straight Sherwani", "occasion": ["Wedding", "Baraat", "Formal Ethnic Ceremonies"], "season": ["All Season"], "care": "Dry clean only", "set_includes": ["Sherwani Coat", "Churidar Pyjama", "Pocket Square", "Katha Sash"], "size_available": ["S", "M", "L", "XL", "XXL"]}},

    {"id": 65, "title": "Embroidered Festive Lehenga Set — Rose Gold", "brand": "Biba",
     "category": "Ethnic Wear", "gender": "Women", "color": "Rose Gold / Blush Pink",
     "price": 4999.0, "original_price": 7999.0, "discount_pct": 37,
     "rating": 4.7, "review_count": 76, "stock": 15, "city": "Jaipur",
     "image_url": _img("1609357605129-26f69add5d6e"),
     "description": "Biba's rose gold festive lehenga set is the dream ensemble for bridesmaids, sangeet nights, and Navratri celebrations — the flared skirt in heavy art silk with mirror embellishment and cut-work border creates a silhouette that sparkles under event lighting. The coordinated blouse with cap sleeves and net dupatta with gota-patti border complete the full bridal-adjacent look.",
     "tags": ["lehenga", "women", "rose gold", "pink", "biba", "embroidered", "mirror work", "festive", "wedding", "sangeet", "navratri", "bridal", "silk", "ethnic"],
     "fbt_product_ids": [50, 51],
     "metadata": {"material": "Art Silk / Net Dupatta / Mirror & Cut-Work Embroidery", "fit": "Flared Lehenga / Fitted Blouse", "occasion": ["Wedding", "Sangeet", "Navratri", "Festive", "Bridal Functions"], "season": ["All Season"], "care": "Dry clean only", "set_includes": ["Lehenga Skirt", "Blouse", "Net Dupatta"], "dupatta_included": True, "size_available": ["XS", "S", "M", "L", "XL"]}},

    {"id": 66, "title": "Nehru Jacket & Kurta Set — Bandhgala", "brand": "Fabindia",
     "category": "Ethnic Wear", "gender": "Men", "color": "Natural Beige / Ivory",
     "price": 3299.0, "original_price": 4999.0, "discount_pct": 33,
     "rating": 4.5, "review_count": 88, "stock": 18, "city": "Delhi",
     "image_url": _img("1617627143750-d86bc21e42bb"),
     "description": "Fabindia's Nehru jacket and kurta ensemble in natural beige celebrates the Bandhgala collar silhouette that bridges formal Indian and contemporary Western wear. The handwoven cotton-silk kurta paired with the tailored Nehru jacket works for corporate ethnic days, wedding receptions, and festive house parties where Indian formal is the dress code.",
     "tags": ["nehru jacket", "kurta", "men", "beige", "ivory", "fabindia", "bandhgala", "ethnic formal", "handwoven", "cotton silk", "corporate ethnic", "wedding", "reception"],
     "fbt_product_ids": [63, 58],
     "metadata": {"material": "Cotton-Silk Handwoven Kurta / Woven Nehru Jacket", "fit": "Tailored", "occasion": ["Wedding Reception", "Corporate Ethnic", "Festive", "Formal Ethnic"], "season": ["All Season"], "care": "Dry clean recommended", "set_includes": ["Kurta", "Nehru Jacket"], "size_available": ["S", "M", "L", "XL", "XXL"]}},


    # ═══════════════════════════════════════════════════════════════════
    # SPORTSWEAR  (IDs 67–70)
    # ═══════════════════════════════════════════════════════════════════

    {"id": 67, "title": "Woven Training Track Pants — Black/White", "brand": "Puma",
     "category": "Sportswear", "gender": "Men", "color": "Black / White Side Stripe",
     "price": 1999.0, "original_price": 2999.0, "discount_pct": 33,
     "rating": 4.5, "review_count": 143, "stock": 45, "city": "Bengaluru",
     "image_url": _img("1517836357463-d25dfeac3438"),
     "description": "Puma's woven track pants in black with white side stripes are the athleisure-to-training crossover piece that works for sprint warm-ups, weight training, and post-gym coffee runs equally well. The water-repellent woven outer shrugs off light drizzle while the elasticated waistband with internal drawcord and full zip side pockets complete the functional design.",
     "tags": ["track pants", "men", "black", "white", "puma", "woven", "training", "gym", "sports", "athleisure", "running", "workout", "zip pockets", "water repellent"],
     "fbt_product_ids": [23, 12],
     "metadata": {"material": "100% Polyester Woven with DWR Coating", "fit": "Regular Fit / Tapered Hem", "occasion": ["Training", "Gym", "Running", "Athleisure"], "season": ["All Season"], "care": "Machine wash cold, tumble dry low", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "technology": "Water-Repellent DWR Finish", "closure": "Elasticated + Drawcord Waist + Full Zip Hem"}},

    {"id": 68, "title": "3-Stripes Training Tights — Women's", "brand": "Adidas",
     "category": "Sportswear", "gender": "Women", "color": "Black / White 3-Stripes",
     "price": 2299.0, "original_price": 3499.0, "discount_pct": 34,
     "rating": 4.6, "review_count": 198, "stock": 40, "city": "Mumbai",
     "image_url": _img("1518611012118-696072aa579a"),
     "description": "Adidas's AEROREADY 3-Stripes tights combine performance compression with everyday style in a clean black and white palette. AEROREADY moisture management technology keeps skin dry during intense HIIT sessions while the 7/8 length is flattering on all heights and shows off training shoes. The wide waistband with phone pocket and flatlock seams prevent riding and chafing.",
     "tags": ["tights", "leggings", "women", "black", "white", "adidas", "3 stripes", "aeroready", "compression", "gym", "running", "hiit", "yoga", "training", "activewear"],
     "fbt_product_ids": [67, 1],
     "metadata": {"material": "78% Recycled Polyester / 22% Elastane — AEROREADY", "fit": "Compression / 7/8 Length", "occasion": ["Gym", "Running", "HIIT", "Yoga", "Training"], "season": ["All Season"], "care": "Machine wash cold, do not tumble dry", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "technology": "AEROREADY Moisture Management", "waistband": "Wide High-Waist with Phone Pocket"}},

    {"id": 69, "title": "Swoosh Medium-Support Sports Bra", "brand": "Nike",
     "category": "Sportswear", "gender": "Women", "color": "Deep Purple / Lilac",
     "price": 1695.0, "original_price": 2195.0, "discount_pct": 22,
     "rating": 4.5, "review_count": 154, "stock": 35, "city": "Bengaluru",
     "image_url": _img("1544367567-0f2fcb009e0b"),
     "description": "Nike's Swoosh medium-support sports bra provides the ideal support level for running, HIIT, cycling, and yoga sessions. The Dri-FIT fabric wicks sweat efficiently while the wide underband and padded cups provide comfort without constriction. Racerback design allows full shoulder mobility for overhead movements and boxing drills.",
     "tags": ["sports bra", "women", "purple", "lilac", "nike", "swoosh", "medium support", "running", "gym", "hiit", "yoga", "dri-fit", "padded", "racerback", "activewear"],
     "fbt_product_ids": [68, 1],
     "metadata": {"material": "Polyester / Spandex Dri-FIT", "fit": "Medium Compression / Racerback", "occasion": ["Running", "HIIT", "Yoga", "Cycling", "Gym"], "season": ["All Season"], "care": "Machine wash cold, do not bleach, hang dry", "size_available": ["XS", "S", "M", "L", "XL"], "support_level": "Medium (B-D Cup)", "technology": "Dri-FIT + Removable Cups"}},

    {"id": 70, "title": "Compression Shorts — Flex Training", "brand": "HRX",
     "category": "Sportswear", "gender": "Men", "color": "Navy Blue",
     "price": 999.0, "original_price": 1599.0, "discount_pct": 37,
     "rating": 4.4, "review_count": 89, "stock": 50, "city": "Delhi",
     "image_url": _img("1517836357463-d25dfeac3438"),
     "description": "HRX's Flex Training compression shorts in navy blue provide graduated compression to improve circulation and reduce muscle fatigue during heavy squat sessions, sprint training, and cycling intervals. The 10-inch inseam prevents thigh chafing, the HRX quick-dry fabric expels moisture rapidly, and the internal waistband prevents rolling during dynamic movements.",
     "tags": ["compression shorts", "men", "navy", "blue", "hrx", "gym", "training", "sports", "compression", "quick dry", "cycling", "squat", "sprint", "activewear"],
     "fbt_product_ids": [5, 56],
     "metadata": {"material": "88% Polyester / 12% Spandex — Compression Knit", "fit": "Compression / 10-inch Inseam", "occasion": ["Gym", "Cycling", "Sprint Training", "Cross-Training"], "season": ["All Season"], "care": "Machine wash cold, do not tumble dry", "size_available": ["XS", "S", "M", "L", "XL", "XXL"], "technology": "Graduated Compression + HRX QuickDry", "waistband": "Non-Roll Elasticated Waist"}},
]


# ─────────────────────────────────────────────
# Rich Audit Ledger History
# ─────────────────────────────────────────────

def _audit_rows(merchant_id: str):
    """Generate 30 days of realistic audit ledger entries for one merchant."""
    entries = []
    action_templates = [
        ("DiscoveryAgent", "SEARCH_RANKED", None, 0, 0,
         "Semantic search + rating-weighted ranking surfaced top products (4.6–4.9★, 94–540 reviews)."),
        ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 3596.0, 718.0,
         "Checkout for Nike Run Defy (Rs.3596). Customer converted after AI recommended high-rated product."),
        ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 8995.0, 1799.0,
         "Checkout for Pegasus 40 (Rs.8995) — premium item. 4.8★ (420 reviews) drove confidence."),
        ("RecoveryAgent", "TIMEOUT_UPI_FALLBACK", "TIMEOUT_RECOVERED", 3866.0, 3866.0,
         "HTTP 504 gateway timeout intercepted. Dynamic UPI QR generated, price locked 15 min. Sale preserved."),
        ("NegotiationAgent", "CART_NEGOTIATED_PRUNED", "DECLINE_RESOLVED", 3596.0, 3596.0,
         "Card decline on Rs.4391. Lowest-priority accessory (socks, Rs.795) removed. Customer retried & paid."),
        ("UpsellAgent", "FBT_COMPLEMENT_PITCHED", None, 795.0, 238.5,
         "FBT: Nike socks (4.7★, 310 reviews) pitched alongside shoe purchase. Customer accepted."),
        ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 6499.0, 1299.8,
         "Puma Velocity Nitro 3 sold. 4.7★ + Bengaluru express dispatch boosted conversion."),
        ("ZeroQueryPersonalizer", "FEED_GENERATED", None, 0, 0,
         "Composite interest vector rebuilt. Personalized rail boosted click-through by surfacing 4.6★+ products."),
        ("CheckoutAgent", "PAYMENT_INITIATED", "SUCCESS", 9999.0, 1999.8,
         "Adidas Ultraboost sold at Rs.9999. Highest rated item (4.9★, 540 reviews) led conversion."),
        ("RecoveryAgent", "TIMEOUT_UPI_FALLBACK", "TIMEOUT_RECOVERED", 6499.0, 6499.0,
         "Razorpay timeout on Puma checkout. UPI QR recovery + 15-min price hold executed."),
    ]

    for day_offset in range(30, 0, -1):
        n_events = random.randint(1, 4)
        selected = random.choices(action_templates, k=n_events)
        for i, tmpl in enumerate(selected):
            agent_type, action_type, pay_status, amount, ai_profit, reasoning = tmpl
            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            ts = _days_ago(day_offset, hour=hour, minute=minute)
            entries.append({
                "merchant_id": merchant_id,
                "agent_type": agent_type,
                "action_type": action_type,
                "user_id": random.choice([1, 2]),
                "user_city": random.choice(["Bengaluru", "Mumbai", "Delhi", "Hyderabad"]),
                "input_query": "Customer shopping session",
                "decision_reasoning": reasoning,
                "rating_review_impact": "Weighted 4.5★+ products with 35% quality score multiplier",
                "payment_status": pay_status,
                "money_amount": amount,
                "profit_impact": amount,
                "profit_from_ai": ai_profit,
                "timestamp": ts,
            })
    return entries


# ─────────────────────────────────────────────
# Main seed function
# ─────────────────────────────────────────────

def seed_database(db: Session):

    # ── Products (10,000 Catalog across 12 Departments) ───────────────────
    if db.query(Product).count() < 10000:
        from .catalog_generator import generate_10k_products
        print("[Seed] Generating 10,000 catalog items across 12 departments…")
        all_10k = generate_10k_products()
        db.query(Product).delete()
        db.commit()
        db.bulk_insert_mappings(Product, all_10k)
        db.commit()
        print(f"[Seed] ✅ {len(all_10k)} products seeded across 12 departments and 95+ subcategories.")

    # Rebuild vector index across all 10,000 products
    all_prods = db.query(Product).all()
    vector_store.build_index(all_prods)
    print(f"[Vector Store] Index ready for {len(all_prods)} products.")

    # ── Users (3 roles) ───────────────────────────────────────────────────
    if db.query(User).count() == 0:
        # Customers
        db.add(User(name="Priya Sharma", email="priya@razorcart.ai",
                    hashed_password=_hash("password123"), role="customer", city="Bengaluru",
                    search_history=json.dumps(["pink running shoes women", "nike marathon road shoes", "summer floral dress"]),
                    viewed_product_ids=json.dumps([1, 2, 42, 56])))

        db.add(User(name="Rahul Verma", email="rahul@razorcart.ai",
                    hashed_password=_hash("password123"), role="customer", city="Mumbai",
                    search_history=json.dumps(["nike white sneakers", "adidas ultraboost", "formal office shirt blue"]),
                    viewed_product_ids=json.dumps([7, 16, 17, 57])))

        # Merchant
        db.add(User(name="Arjun Mehta", email="merchant@razorcart.ai",
                    hashed_password=_hash("merchant123"), role="merchant", city="Bengaluru",
                    merchant_id="merch_001", merchant_name="RazorCart Official Store"))

        # Second merchant
        db.add(User(name="Sneha Patel", email="sneha@fashionhub.ai",
                    hashed_password=_hash("merchant123"), role="merchant", city="Mumbai",
                    merchant_id="merch_002", merchant_name="FashionHub Mumbai"))

        # Razorpay Admin
        db.add(User(name="Razorpay Admin", email="admin@razorpay.ai",
                    hashed_password=_hash("admin123"), role="admin", city="Mumbai",
                    merchant_id=None, merchant_name=None))

        db.commit()
        print("[Seed] 5 users seeded (2 customers, 2 merchants, 1 admin).")

    # ── Audit Ledger ──────────────────────────────────────────────────────
    if db.query(AuditLedger).count() == 0:
        for merch_id in ["merch_001", "merch_002"]:
            rows = _audit_rows(merch_id)
            for r in rows:
                db.add(AuditLedger(**r))
        db.commit()
        count = db.query(AuditLedger).count()
        print(f"[Seed] {count} audit ledger entries seeded across 2 merchants.")

    # ── Product Reviews ───────────────────────────────────────────────────
    if db.query(Review).count() == 0:
        sample_reviews = [
            {"product_id": 1,  "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 5.0, "comment": "Super lightweight and extreme cushioning! Ran my first 10K in these. Highly recommended for women runners."},
            {"product_id": 2,  "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 4.5, "comment": "Love the bright coral colour! Comfortable for morning walks. Good fit true to size."},
            {"product_id": 5,  "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 5.0, "comment": "Pegasus 40 is elite. Dual Zoom Air makes every stride feel bouncy. Worth every rupee."},
            {"product_id": 7,  "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 5.0, "comment": "Best running shoe I have ever owned. Continental outsole grip is outstanding even in rain."},
            {"product_id": 8,  "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 4.5, "comment": "Stan Smiths are timeless. The leather quality is excellent and they are comfortable all day."},
            {"product_id": 16, "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 5.0, "comment": "AF1s in white are iconic. Looks great with everything from joggers to chinos."},
            {"product_id": 17, "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 4.0, "comment": "Allen Solly shirt fits well and stays crisp through long office days. Good material."},
            {"product_id": 30, "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 4.5, "comment": "511s are my go-to jeans. The stretch makes a massive difference for comfort."},
            {"product_id": 42, "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 5.0, "comment": "Absolutely stunning floral wrap dress! Got so many compliments at a beach wedding. True to size."},
            {"product_id": 56, "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 4.5, "comment": "Good quality cushioned socks. Perfect arch support for long runs."},
            {"product_id": 57, "user_id": 2, "user_name": "Rahul Verma",   "user_city": "Mumbai",    "rating": 5.0, "comment": "Crep Protect is magic. Restored my Ultraboosts to near-new condition. Must-have for sneakerheads."},
            {"product_id": 59, "user_id": 1, "user_name": "Priya Sharma",  "user_city": "Bengaluru", "rating": 4.5, "comment": "Beautiful Fabindia saree. The zari border is stunning. Drapes well and arrived well-packaged."},
        ]
        for r in sample_reviews:
            db.add(Review(**r))
        db.commit()
        print(f"[Seed] {len(sample_reviews)} customer reviews seeded.")

    # ── Orders ────────────────────────────────────────────────────────────
    if db.query(Order).count() == 0:
        sample_orders = [
            {
                "user_id": 1,
                "items_json": json.dumps([
                    {"id": 1, "title": "Run Defy Women's Road Running Shoes", "brand": "Nike", "price": 3596.0, "quantity": 1, "image_url": _img("1542291026-7eec264c27ff")},
                    {"id": 56, "title": "Cushioned Running Socks (3-Pack)", "brand": "Nike", "price": 795.0, "quantity": 1, "image_url": _img("1586350977771-b3b0abd50c82")}
                ]),
                "total_amount": 4391.0,
                "currency": "INR",
                "status": "success",
                "razorpay_order_id": "order_rc_priya_001",
                "razorpay_payment_id": "pay_rc_priya_001",
                "payment_method": "razorpay_gateway",
                "recovery_type": None,
                "created_at": _days_ago(5, hour=14, minute=30)
            },
            {
                "user_id": 1,
                "items_json": json.dumps([
                    {"id": 42, "title": "Floral Wrap Maxi Dress", "brand": "Forever New", "price": 4999.0, "quantity": 1, "image_url": _img("1515372039744-b8f02a3ae446")}
                ]),
                "total_amount": 4999.0,
                "currency": "INR",
                "status": "recovered_upi",
                "razorpay_order_id": "order_rc_priya_002",
                "razorpay_payment_id": "pay_rc_priya_002_upi",
                "payment_method": "upi_qr",
                "recovery_type": "timeout_recovered_upi",
                "created_at": _days_ago(2, hour=18, minute=15)
            },
            {
                "user_id": 2,
                "items_json": json.dumps([
                    {"id": 5, "title": "Pegasus 40 Men's Road Running Shoes", "brand": "Nike", "price": 8995.0, "quantity": 1, "image_url": _img("1595950653106-6c9ebd614d3a")},
                    {"id": 57, "title": "Crep Protect Ultimate Shoe Cleaner", "brand": "Crep Protect", "price": 1299.0, "quantity": 1, "image_url": _img("1586350977771-b3b0abd50c82")}
                ]),
                "total_amount": 10294.0,
                "currency": "INR",
                "status": "success",
                "razorpay_order_id": "order_rc_rahul_001",
                "razorpay_payment_id": "pay_rc_rahul_001",
                "payment_method": "razorpay_gateway",
                "recovery_type": None,
                "created_at": _days_ago(7, hour=11, minute=20)
            },
            {
                "user_id": 2,
                "items_json": json.dumps([
                    {"id": 7, "title": "Ultraboost Light Running Shoes", "brand": "Adidas", "price": 9999.0, "quantity": 1, "image_url": _img("1587563871167-1ee9c731aefb")}
                ]),
                "total_amount": 9999.0,
                "currency": "INR",
                "status": "success",
                "razorpay_order_id": "order_rc_rahul_002",
                "razorpay_payment_id": "pay_rc_rahul_002",
                "payment_method": "razorpay_gateway",
                "recovery_type": "cart_negotiated_pruned",
                "created_at": _days_ago(1, hour=16, minute=45)
            }
        ]
        for o in sample_orders:
            db.add(Order(**o))
        db.commit()
        print(f"[Seed] {len(sample_orders)} sample orders seeded.")

