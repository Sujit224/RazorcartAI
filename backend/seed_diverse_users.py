import json
import random
import bcrypt
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.cart import CartItem

# Indian Cities
CITIES = [
    "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai",
    "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Kochi",
    "Chandigarh", "Gurgaon", "Noida", "Lucknow", "Goa"
]

# Standard Hashed Password for "password123"
DEFAULT_HASHED_PASSWORD = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode('utf-8')

# Personas definition
PERSONAS = [
    {
        "name_prefix": "Athletic & Footwear",
        "names": [
            "Aarav Mehta", "Kabir Deshmukh", "Vikram Rathore", "Tushar Singhania", "Rohan Joshi",
            "Manish Pandey", "Devansh Thakur", "Karan Malhotra", "Rupesh Nair", "Samir Kulkarni",
            "Abhinav Sundaram", "Varun Saxena", "Nikhil D'Souza", "Harshvardhan Goel", "Gaurav Sen"
        ],
        "email_domain": "runner.in",
        "category_keywords": ["Footwear", "Sportswear", "Gym Equipment", "Racquet Sports", "Cricket"],
        "search_queries": [
            "nike running shoes carbon plate", "puma nitro trail sneakers", "adidas ultraboost 5 light",
            "compression athletic socks 3 pack", "badminton racquet graphite", "sweat wicking gym t-shirt",
            "breathable mesh marathoning shoes", "pro wrist wraps stability", "foam roller deep tissue"
        ],
        "preferences": {
            "favorite_category": "Footwear",
            "preferred_brand": "Nike",
            "activity": "marathon running & gym",
            "size": "UK 9",
            "price_sensitivity": "medium"
        }
    },
    {
        "name_prefix": "Smartphones & Gadgets",
        "names": [
            "Diya Sengupta", "Siddharth Bansal", "Riya Roy", "Pranav Kulkarni", "Aditi Rao",
            "Tanmay Bose", "Nisha Agarwal", "Akash Murthy", "Shweta Verma", "Madhav Nambiar",
            "Isha Kapoor", "Rishabh Jain", "Meera Hegde", "Sujay Chatterji", "Bhavya Solanki"
        ],
        "email_domain": "techgeek.io",
        "category_keywords": ["Smartphones", "Headphones & Earbuds", "Mobile Accessories", "Tablets", "Power Banks & Chargers"],
        "search_queries": [
            "apple iphone 15 pro max 256gb", "samsung galaxy s24 ultra camera", "sony wh-1000xm5 noise cancelling",
            "fast wireless magsafe charger 65w", "ipad air M2 display", "anker power bank 20000mah fast charge",
            "type-c braided durable cable", "bluetooth true wireless earbuds deep bass"
        ],
        "preferences": {
            "favorite_category": "Smartphones",
            "preferred_brand": "Apple & Sony",
            "tech_profile": "flagship enthusiast",
            "ecosystem": "iOS & Android",
            "price_sensitivity": "high_end"
        }
    },
    {
        "name_prefix": "PC Gaming & Laptops",
        "names": [
            "Arjun Saxena", "Trupti Kulkarni", "Kunal Shah", "Ananya Menon", "Dhruv Bhatia",
            "Preeti Reddi", "Siddhesh Paranjpe", "Vaibhav Gupta", "Swati Pillai", "Rahul Varma",
            "Snehal Chawla", "Yashwant Shinde", "Kavya Venkat", "Rohan Merchant", "Aakash Tripathi"
        ],
        "email_domain": "gamers.net",
        "category_keywords": ["Laptops", "Gaming", "Monitors", "Desk Mats & Organizers", "Headphones & Earbuds"],
        "search_queries": [
            "rtx 4080 gaming laptop 32gb ram", "custom mechanical keyboard red linear switches", "curved gaming monitor 144hz 1ms",
            "ergonomic vertical mouse wireless", "large desk pad stitched edges", "7.1 surround sound gaming headset",
            "laptop cooling pad dual fan", "cat6 ethernet high speed cable"
        ],
        "preferences": {
            "favorite_category": "Laptops",
            "preferred_brand": "ASUS ROG & Logitech",
            "use_case": "esports gaming & software dev",
            "price_sensitivity": "premium"
        }
    },
    {
        "name_prefix": "Sci-Fi & Book Lovers",
        "names": [
            "Meera Nambiar", "Ishaan Chatterjee", "Nivedita Roy", "Subhash Ganguly", "Rashmi Iyer",
            "Saurabh Datta", "Pooja Hegde", "Chinmay Joshi", "Gayatri Venkataraman", "Alok Soni",
            "Mitali Majumdar", "Hemant Rastogi", "Shruti Mukerjee", "Parth Sarathi", "Vandana Nair"
        ],
        "email_domain": "bookworm.org",
        "category_keywords": ["Sci-Fi & Cyberpunk", "Fantasy & Epic Saga", "Fiction & Literature", "Technology & AI", "Graphic Novels & Manga"],
        "search_queries": [
            "sci-fi cyberpunk hardbound books", "dune messiah deluxe illustrated edition", "foundational deep learning AI book",
            "manga box set complete series", "wheel of time fantasy series hardcover", "neuromancer cyberpunk classic novel",
            "three body problem trilogy", "isaac asimov foundation series"
        ],
        "preferences": {
            "favorite_category": "Sci-Fi & Cyberpunk",
            "format": "Hardcover & Collector Editions",
            "reading_pace": "2-3 books per month",
            "price_sensitivity": "medium"
        }
    },
    {
        "name_prefix": "Home Decor & Furnishings",
        "names": [
            "Shalini Soni", "Deepak Bhardwaj", "Priya Nair", "Manju Kothari", "Naveen Singhal",
            "Ritu Jhunjhunwala", "Sanjay Aggarwal", "Ankita Mittal", "Rajesh Sharma", "Deepika Parekh",
            "Vineet Goenka", "Reena Lodha", "Sunil Bajpai", "Monica Mahajan", "Tarun Bhasin"
        ],
        "email_domain": "homestyle.in",
        "category_keywords": ["Bedding & Linen", "Curtains & Drapes", "Pillow & Cushion Covers", "Home Decor", "Table Runners & Placemats"],
        "search_queries": [
            "pure cotton king size bedsheet 400 tc", "sheer linen blackout curtains 9ft", "embroidered velvet cushion covers set of 5",
            "handwoven jute floor area rug", "brass vintage table lamp warm light", "ceramic decorative flower vase boho",
            "quilted mattress protector waterproof"
        ],
        "preferences": {
            "favorite_category": "Curtains & Drapes",
            "style": "Boho Chic & Warm Earthy",
            "preferred_brand": "Fabindia & Home Centre",
            "price_sensitivity": "value_for_money"
        }
    },
    {
        "name_prefix": "Furniture & Recliners",
        "names": [
            "Venkatesh Rao", "Harish Chawla", "Radhika Sood", "Suresh Menon", "Smita Deshpande",
            "Gautam Mathur", "Bhavna Bajaj", "Ashish Khurana", "Pallavi Kulkarni", "Milind Naik",
            "Chitra Raghavan", "Hemendra Patel", "Nalini Pillai", "Girish Ahuja", "Kiran Varma"
        ],
        "email_domain": "furniturehub.co",
        "category_keywords": ["Beds & Wardrobes", "Desks & Study", "Chairs & Recliners", "Sofas & Couches", "Tables & Dining"],
        "search_queries": [
            "ergonomic mesh high back office chair lumbar", "solid teak wood study desk with drawers", "3 seater velvet sofa dark navy blue",
            "extendable 6 seater dining table wooden", "queen size bed with hydraulic storage", "leatherette recliner chair cup holder",
            "modular wall bookshelf teak finish"
        ],
        "preferences": {
            "favorite_category": "Chairs & Recliners",
            "preferred_material": "Solid Teak & Ergonomic Mesh",
            "budget": "high_quality",
            "price_sensitivity": "premium"
        }
    },
    {
        "name_prefix": "Ethnic Fashion & Festive",
        "names": [
            "Aditi Sharma", "Gaurav Malhotra", "Sunita Tripathi", "Nidhi Agarwal", "Manish Vyas",
            "Kritika Joshi", "Yashoda Pillai", "Devendra Chauhan", "Sonal Mishra", "Pankaj Tandon",
            "Richa Saxena", "Birendra Roy", "Anupama Das", "Mayank Saraf", "Geeta Bhatt"
        ],
        "email_domain": "ethnicwear.in",
        "category_keywords": ["Ethnic Wear", "Jewellery", "Dresses", "Eyewear", "Fragrances"],
        "search_queries": [
            "chikankari lucknowi handloom kurti yellow", "banarasi silk saree festive wedding edition", "oxidised silver jhumka earrings set",
            "raw silk sherwani for wedding groom", "handcrafted leather mojaris juttis", "designer georgette lehenga choli",
            "chanderi dupattas embroidered"
        ],
        "preferences": {
            "favorite_category": "Ethnic Wear",
            "preferred_brand": "Fabindia & Manyavar",
            "occasion": "weddings & festive celebrations",
            "fabric": "Handloom Cotton & Pure Silk"
        }
    },
    {
        "name_prefix": "Kitchen & Gourmet Coffee",
        "names": [
            "Rajiv Merchant", "Kavita Subramanian", "Sameer Prabhu", "Sonali Wagle", "Jitin Duggal",
            "Aarti Shenoy", "Pradeep Hegde", "Pooja Sundaram", "Umesh Kamat", "Swara Bhaskar",
            "Anurag Dixit", "Leela Iyengar", "Vikrant Kaushik", "Nupur Talwar", "Mahesh Chandra"
        ],
        "email_domain": "gourmetchef.in",
        "category_keywords": ["Microwaves & OTG", "Mixer Grinders", "Cookware", "Tea & Coffee", "Beverages"],
        "search_queries": [
            "de longhi espresso coffee machine pump bar", "digital air fryer dual basket 5.5l", "triply stainless steel cookware kadai",
            "french press coffee plunger stainless steel", "freshly roasted arabica coffee beans dark roast", "750w heavy duty mixer grinder 4 jars",
            "non stick granite induction pan set"
        ],
        "preferences": {
            "favorite_category": "Tea & Coffee",
            "coffee_type": "espresso & french press",
            "appliance_grade": "professional culinary",
            "price_sensitivity": "high"
        }
    },
    {
        "name_prefix": "Baby Care & STEM Toys",
        "names": [
            "Divya Nair", "Karthik Iyer", "Shweta Kulkarni", "Amitabh Sen", "Rohini Nambiar",
            "Suraj Shetty", "Varsha Deshmukh", "Nishant Rastogi", "Sayali Marathe", "Varun Murthy",
            "Sharmila Ghosh", "Taranjit Singh", "Neetika Chopra", "Naveen Rajan", "Bhakti Patel"
        ],
        "email_domain": "parents.org",
        "category_keywords": ["Baby Care", "Baby Gear", "Toys & Games", "Learning & STEM", "Diapers & Wipes"],
        "search_queries": [
            "organic bamboo baby rompers onesies", "convertible ISOFIX baby car seat 0-4 yrs", "wooden STEM building blocks puzzle toy",
            "lightweight umbrella stroller foldable", "hypoallergenic aloe baby wipes 80 pack", "bpa free anti colic baby feeding bottle",
            "montessori sensory toys for toddlers"
        ],
        "preferences": {
            "favorite_category": "Baby Care",
            "priority": "safety certified & organic natural",
            "child_age": "1 to 3 years old",
            "price_sensitivity": "medium"
        }
    },
    {
        "name_prefix": "Pet Lovers & Grooming",
        "names": [
            "Natasha D'Souza", "Siddharth Lobo", "Tanya Fernandez", "Kenneth Pinto", "Vanessa Saldanha",
            "Ryan Rodrigues", "Fiona Alvares", "Gavin Pereira", "Chloe Coutinho", "Dylan Menezes",
            "Samantha D'Cruz", "Joel Miranda", "Valerie Gonsalves", "Tristan Noronho", "Bianca Dias"
        ],
        "email_domain": "petlovers.in",
        "category_keywords": ["Dog Food & Treats", "Cat Food & Litter", "Pet Accessories", "Pet Grooming", "Pet Toys"],
        "search_queries": [
            "grain free adult dog food salmon 10kg", "bentonite cat litter lavender clump scent", "de-shedding pet grooming vacuum brush",
            "orthopedic memory foam dog bed large", "interactive laser pointer cat toy electric", "durable rubber chew bone for dogs",
            "scratching post cat tree house multi level"
        ],
        "preferences": {
            "favorite_category": "Dog Food & Treats",
            "pet_types": "Golden Retriever & Persian Cat",
            "diet": "high protein grain-free natural",
            "price_sensitivity": "premium"
        }
    }
]

def seed_diverse_users():
    db = SessionLocal()
    try:
        print("[INFO] Scanning product catalog by categories...")
        # Index products by categories
        category_to_products = {}
        all_products = db.query(Product).all()
        for p in all_products:
            cat = p.category or "General"
            if cat not in category_to_products:
                category_to_products[cat] = []
            category_to_products[cat].append(p)

        print(f"Total categories indexed: {len(category_to_products)}")

        created_count = 0
        order_count = 0
        cart_item_count = 0

        for persona in PERSONAS:
            cats = persona["category_keywords"]
            
            # Gather candidate products for this persona
            persona_products = []
            for cat_keyword in cats:
                for cat_name, prods in category_to_products.items():
                    if cat_keyword.lower() in cat_name.lower():
                        persona_products.extend(prods)
            
            if not persona_products:
                # Fallback to random sample
                persona_products = random.sample(all_products, min(50, len(all_products)))

            print(f"[Persona] '{persona['name_prefix']}': matched {len(persona_products)} candidate products.")

            for i, name in enumerate(persona["names"]):
                email_user = name.lower().replace(" ", ".").replace("'", "")
                email = f"{email_user}@{persona['email_domain']}"
                
                # Check if user already exists
                existing = db.query(User).filter(User.email == email).first()
                if existing:
                    user = existing
                else:
                    user = User(
                        name=name,
                        email=email,
                        hashed_password=DEFAULT_HASHED_PASSWORD,
                        role="customer",
                        city=random.choice(CITIES)
                    )
                    db.add(user)
                    db.flush()
                    created_count += 1

                # Sample viewed product IDs (10 to 20 products)
                sampled_prods = random.sample(persona_products, min(15, len(persona_products)))
                viewed_ids = [p.id for p in sampled_prods]
                
                # Queries
                searches = random.sample(persona["search_queries"], min(5, len(persona["search_queries"])))
                
                # Vector Embedding Text representation
                prod_titles = " ".join([p.title for p in sampled_prods[:5]])
                vector_text = (
                    f"{' '.join(searches)} {' '.join(cats)} {prod_titles} "
                    f"{json.dumps(persona['preferences'])} {user.city}"
                )

                user.search_history = json.dumps(searches)
                user.viewed_product_ids = json.dumps(viewed_ids)
                user.preferences = json.dumps(persona["preferences"])
                user.vector_embedding = vector_text

                # Seed 1-3 Orders for each user
                num_orders = random.randint(1, 3)
                for _ in range(num_orders):
                    ordered_prods = random.sample(sampled_prods, min(random.randint(1, 3), len(sampled_prods)))
                    items_snapshot = [
                        {
                            "id": op.id,
                            "title": op.title,
                            "price": op.price,
                            "brand": op.brand,
                            "image_url": op.image_url,
                            "quantity": random.randint(1, 2)
                        } for op in ordered_prods
                    ]
                    total_amount = sum(it["price"] * it["quantity"] for it in items_snapshot)
                    order_date = datetime.utcnow() - timedelta(days=random.randint(1, 45))
                    
                    order = Order(
                        user_id=user.id,
                        items_json=json.dumps(items_snapshot),
                        total_amount=total_amount,
                        currency="INR",
                        status="success",
                        payment_method="razorpay_gateway",
                        created_at=order_date
                    )
                    db.add(order)
                    order_count += 1

                # Seed 1 Cart item
                cart_prod = random.choice(sampled_prods)
                # Check existing cart item
                existing_cart = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == cart_prod.id).first()
                if not existing_cart:
                    cart_item = CartItem(
                        user_id=user.id,
                        product_id=cart_prod.id,
                        quantity=1,
                        size="Standard"
                    )
                    db.add(cart_item)
                    cart_item_count += 1

        db.commit()
        print("\n--- SEEDING COMPLETE ---")
        print(f"Users Created/Updated: {created_count}")
        print(f"Orders Populated: {order_count}")
        print(f"Cart Items Populated: {cart_item_count}")

        # Check final user counts
        total_customers = db.query(User).filter(User.role == "customer").count()
        print(f"Total Customers in Database: {total_customers}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_diverse_users()
