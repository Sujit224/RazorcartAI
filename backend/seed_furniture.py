import json
import random
import sys
from datetime import datetime
from app.database import SessionLocal
from app.models.product import Product

BRANDS = [
    "Urban Ladder", "Pepperfry", "IKEA", "Wakefit", "Godrej Interio",
    "Nilkamal", "Sleepwell", "Durian", "Home Centre", "Solimo",
    "Story@Home", "Kuber Industries", "Spaces", "Solimo Home", "Green Soul"
]

CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune"]
MERCHANTS = [
    ("merch_furn_01", "Urban Ladder Official"),
    ("merch_furn_02", "Pepperfry Furniture"),
    ("merch_furn_03", "IKEA Home Store"),
    ("merch_furn_04", "Godrej Interio Hub"),
    ("merch_001", "RazorCart Home Store")
]

COLORS = ["Walnut", "Teak Wood", "Oak", "Charcoal Grey", "Navy Blue", "Beige", "Emerald Green", "Brown", "White", "Rust Red"]

FURNITURE_CATEGORIES = [
    {
        "category": "Sofas & Couches",
        "items": [
            "3-Seater Velvet Fabric Recliner Sofa", "L-Shape 5-Seater Sectional Sofa",
            "Chesterfield Premium Leather Couch", "2-Seater Wooden Sofa with Cushions",
            "Convertible Fabric Sofa Bed with Storage", "Minimalist Scandinavian 3-Seater Sofa",
            "Tufted Velvet Loveseat Couch", "Recliner Single Seater Armchair Sofa"
        ],
        "materials": ["Premium Velvet", "Genuine Leather", "Solid Teak & Fabric", "High-Density Foam & Suede"],
        "min_price": 14999, "max_price": 75000,
        "image_urls": [
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Desks & Study",
        "items": [
            "Ergonomic Electric Height Adjustable Standing Desk", "Solid Sheesham Wood Executive Study Desk",
            "L-Shaped Corner Computer Workstation Desk", "Compact Folding Study Desk with Bookshelf",
            "Modern Industrial Metal Frame Office Desk", "Dual-Monitor Gaming Workstation Desk"
        ],
        "materials": ["Solid Teak Wood", "Engineered Wood & Steel", "Powder-Coated Carbon Steel", "Solid Sheesham"],
        "min_price": 4999, "max_price": 38000,
        "image_urls": [
            "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Chairs & Recliners",
        "items": [
            "High-Back Ergonomic Breathable Mesh Executive Chair", "Premium Bonded Leather Manager Armchair",
            "Full-Body Power Recliner Chair with Cup Holder", "Nordic Solid Wood Accent Armchair",
            "360-Degree Swivel Gaming Chair with Lumbar Support", "Velvet Dining Chair Set of 2"
        ],
        "materials": ["Breathable Polymer Mesh", "Bonded Italian Leather", "Memory Foam & Steel", "Solid Beech Wood"],
        "min_price": 3499, "max_price": 28000,
        "image_urls": [
            "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Tables & Dining",
        "items": [
            "6-Seater Solid Teak Wood Dining Table Set", "Italian Marble Top 4-Seater Dining Table",
            "Solid Wood Nesting Coffee Center Table", "Modern Glass Top Coffee Table with Shelf",
            "Extendable 8-Seater Hardwood Dining Table", "Rustic Round Wooden Side End Table"
        ],
        "materials": ["Solid Teak Wood", "Italian Carrara Marble", "Tempered Glass & Steel", "Sheesham Wood"],
        "min_price": 5999, "max_price": 65000,
        "image_urls": [
            "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Beds & Wardrobes",
        "items": [
            "King Size Teak Wood Bed with Hydraulic Storage", "Queen Size Upholstered Bed with Headboard",
            "4-Door Large Wardrobe with Mirror & Drawers", "3-Door Sliding Mirror Bedroom Wardrobe",
            "Solid Wood Bedside Table Nightstand with Drawer", "Orthopedic Memory Foam Mattress Bed Combo"
        ],
        "materials": ["Solid Teak Wood", "Engineered Hardwood & Velvet", "High-Density Ply & German Hardware"],
        "min_price": 8999, "max_price": 85000,
        "image_urls": [
            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1540518614846-7ede433c517a?w=800&auto=format&fit=crop&q=80"
        ]
    }
]

FBT_COMPLEMENTARY_CATEGORIES = [
    {
        "category": "Sofa Covers & Slipcovers",
        "items": [
            "Elastic Stretch Velvet Sofa Cover (3-Seater)", "Waterproof Anti-Slip L-Shape Sectional Couch Protector",
            "Quilted Reversible Furniture Sofa Slipcover", "Dustproof Jacquard Fabric Couch Cover Set"
        ],
        "materials": ["Spandex Elastic Velvet", "Waterproof Quilted Polyester", "Jacquard Knit Fabric"],
        "min_price": 899, "max_price": 3499,
        "image_urls": [
            "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Pillow & Cushion Covers",
        "items": [
            "Set of 5 Jacquard Velvet Throw Pillow Covers (16x16 inch)", "Boho Tufted Cotton Embroidered Cushion Covers",
            "Luxurious Satin Square Accent Pillow Slipcases Set", "Geometric Decorative Couch Cushion Covers Set of 4"
        ],
        "materials": ["100% Combed Cotton", "Soft Velvet", "Satin Silk"],
        "min_price": 499, "max_price": 1999,
        "image_urls": [
            "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Curtains & Drapes",
        "items": [
            "100% Blackout Thermal Insulated Door Curtains (Set of 2)", "Semi-Transparent Sheer Linen Window Curtains",
            "Grommet Top Noise-Reducing Living Room Drapes", "Embroidered Velvet Heavy Room Divider Curtains"
        ],
        "materials": ["Triple Weave Polyester", "Pure Sheer Linen", "Rich Velvet"],
        "min_price": 799, "max_price": 2999,
        "image_urls": [
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Table Runners & Placemats",
        "items": [
            "Handwoven Jute Table Runner with Tassels (72 inch)", "Heat-Resistant Washable Dining Placemats Set of 6",
            "Luxury Damask Dining Table Cloth & Runner Set", "Waterproof PVC Non-Slip Table Mat Protector"
        ],
        "materials": ["Natural Jute", "Heat-Resistant Vinyl", "Damask Woven Fabric"],
        "min_price": 449, "max_price": 1799,
        "image_urls": [
            "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Desk Mats & Organizers",
        "items": [
            "Extended Waterproof PU Leather Desk Pad & Blotter", "Bamboo Ergonomic Monitor Stand Riser with Drawer",
            "Under-Desk Cable Management Tray & Organizer", "Anti-Slip Felt Desk Mat for Keyboard & Mouse"
        ],
        "materials": ["Dual-Sided PU Leather", "Natural Bamboo", "High-Density Felt"],
        "min_price": 599, "max_price": 2499,
        "image_urls": [
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80"
        ]
    },
    {
        "category": "Chair Cushion Pads",
        "items": [
            "Memory Foam Orthopedic Coccyx Seat Cushion", "Non-Slip Tufted Dining Chair Pad Set of 4",
            "Breathable Gel Office Chair Seat Cushion for Back Relief", "Water-Resistant Outdoor Patio Chair Pad"
        ],
        "materials": ["Orthopedic Memory Foam", "Cooling Medical Gel", "Tufted Cotton"],
        "min_price": 699, "max_price": 2299,
        "image_urls": [
            "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800&auto=format&fit=crop&q=80"
        ]
    }
]

def generate_furniture_data(total_count=5000):
    db = SessionLocal()
    print(f"Starting seeding of {total_count} furniture & furnishings items into database...")
    
    # 75% Furniture (3750 items), 25% Furnishings / FBT Complementary (1250 items)
    num_furniture = int(total_count * 0.75)
    num_furnishings = total_count - num_furniture
    
    products_to_create = []
    
    # 1. Generate Furniture Entries
    for i in range(num_furniture):
        cat_info = random.choice(FURNITURE_CATEGORIES)
        category = cat_info["category"]
        item_base = random.choice(cat_info["items"])
        brand = random.choice(BRANDS)
        material = random.choice(cat_info["materials"])
        color = random.choice(COLORS)
        img_url = random.choice(cat_info["image_urls"])
        city = random.choice(CITIES)
        merch_id, merch_name = random.choice(MERCHANTS)
        
        price = float(random.randint(cat_info["min_price"], cat_info["max_price"]))
        mrp_multiplier = random.uniform(1.15, 1.45)
        original_price = round(price * mrp_multiplier, 0)
        discount_pct = int(((original_price - price) / original_price) * 100)
        
        rating = round(random.uniform(4.0, 5.0), 1)
        review_count = random.randint(20, 5200)
        stock = random.randint(10, 80)
        
        title = f"{brand} {item_base} ({color})"
        
        description = (
            f"**{title}** engineered with **{material}** by **{brand}**.\n\n"
            f"Department: **Home & Furniture** | Category: **{category}** | Color: **{color}**\n\n"
            f"Crafted for modern homes and commercial spaces with ergonomic support, heavy-duty durability, "
            f"and premium aesthetic finish. Verified customer satisfaction rating of {rating}/5.0 based on {review_count}+ reviews. "
            f"Ships direct from verified {city} fulfillment center with express delivery."
        )
        
        tags_list = [
            category.lower(), "furniture", "home", "living", brand.lower(),
            color.lower(), material.lower(), "decor"
        ] + [w.lower() for w in item_base.split() if len(w) > 2]
        
        metadata_dict = {
            "department": "Home & Furniture",
            "category": category,
            "brand": brand,
            "material": material,
            "color": color,
            "warranty": "3 Years Manufacturer Warranty",
            "assembly": "Free Carpenter Assembly Provided"
        }
        
        p = Product(
            title=title,
            brand=brand,
            category=category,
            department="Home & Furniture",
            gender="Unisex",
            color=color,
            price=price,
            original_price=original_price,
            discount_pct=discount_pct,
            rating=rating,
            review_count=review_count,
            stock=stock,
            city=city,
            merchant_id=merch_id,
            merchant_name=merch_name,
            image_url=img_url,
            description=description,
            tags=json.dumps(list(set(tags_list))),
            product_meta=json.dumps(metadata_dict),
            is_active=True,
            created_at=datetime.utcnow()
        )
        products_to_create.append(p)
        
        if len(products_to_create) >= 500:
            db.bulk_save_objects(products_to_create)
            db.commit()
            print(f"Committed batch of 500 furniture items (Total: {i + 1}/{num_furniture})")
            products_to_create = []

    # 2. Generate Furnishings & FBT Complementary Entries
    print(f"\nSeeding {num_furnishings} complementary FBT furnishings (Sofa covers, pillow covers, curtains, table runners, desk mats, cushion pads)...")
    for j in range(num_furnishings):
        cat_info = random.choice(FBT_COMPLEMENTARY_CATEGORIES)
        category = cat_info["category"]
        item_base = random.choice(cat_info["items"])
        brand = random.choice(BRANDS)
        material = random.choice(cat_info["materials"])
        color = random.choice(COLORS)
        img_url = random.choice(cat_info["image_urls"])
        city = random.choice(CITIES)
        merch_id, merch_name = random.choice(MERCHANTS)
        
        price = float(random.randint(cat_info["min_price"], cat_info["max_price"]))
        mrp_multiplier = random.uniform(1.20, 1.50)
        original_price = round(price * mrp_multiplier, 0)
        discount_pct = int(((original_price - price) / original_price) * 100)
        
        rating = round(random.uniform(4.2, 5.0), 1)
        review_count = random.randint(45, 4800)
        stock = random.randint(15, 100)
        
        title = f"{brand} {item_base} - {color}"
        
        description = (
            f"**{title}** crafted from **{material}**.\n\n"
            f"Department: **Home & Furnishings** | Category: **{category}** | Color: **{color}**\n\n"
            f"Enhance your living room, study, or dining setup with premium texture and long-lasting protection. "
            f"Machine washable, fade-resistant, and tailored for a snug fit. Rated **{rating}/5.0** by {review_count}+ happy homeowners."
        )
        
        tags_list = [
            category.lower(), "furnishings", "fbt", "home", "decor", brand.lower(),
            color.lower(), material.lower(), "protection", "cover"
        ] + [w.lower() for w in item_base.split() if len(w) > 2]
        
        metadata_dict = {
            "department": "Home & Furnishings",
            "category": category,
            "brand": brand,
            "material": material,
            "color": color,
            "washable": "Machine Washable",
            "fitting": "Custom Universal Stretch Fit"
        }
        
        p = Product(
            title=title,
            brand=brand,
            category=category,
            department="Home & Furnishings",
            gender="Unisex",
            color=color,
            price=price,
            original_price=original_price,
            discount_pct=discount_pct,
            rating=rating,
            review_count=review_count,
            stock=stock,
            city=city,
            merchant_id=merch_id,
            merchant_name=merch_name,
            image_url=img_url,
            description=description,
            tags=json.dumps(list(set(tags_list))),
            product_meta=json.dumps(metadata_dict),
            is_active=True,
            created_at=datetime.utcnow()
        )
        products_to_create.append(p)
        
        if len(products_to_create) >= 500:
            db.bulk_save_objects(products_to_create)
            db.commit()
            print(f"Committed batch of 500 furnishings items...")
            products_to_create = []

    if products_to_create:
        db.bulk_save_objects(products_to_create)
        db.commit()

    total_in_db = db.query(Product).count()
    total_furniture = db.query(Product).filter(Product.department.in_(["Home & Furniture", "Home & Furnishings"])).count()
    print(f"\nFurniture & Furnishings seeding complete! Database now contains {total_in_db} total products ({total_furniture} furniture & furnishings).")
    db.close()

if __name__ == "__main__":
    generate_furniture_data(5000)
