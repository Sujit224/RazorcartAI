import json
import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.product import Product
from app.models.user import User

FBT_CATEGORY_MAPPING = {
    "Smartphones": ["Mobile Accessories", "Headphones & Earbuds", "Smartwatches", "Power Banks & Chargers"],
    "Laptops": ["Monitors", "Headphones & Earbuds", "Power Banks & Chargers"],
    "Tablets": ["Mobile Accessories", "Headphones & Earbuds"],
    "Footwear": ["Bottomwear", "Topwear", "Accessories"],
    "Topwear": ["Bottomwear", "Footwear", "Accessories"],
    "Bottomwear": ["Topwear", "Footwear", "Accessories"],
    "Dresses": ["Accessories", "Footwear"],
    "Ethnic Wear": ["Accessories", "Footwear"],
    "Gaming": ["Monitors", "Headphones & Earbuds"],
    # Furniture & Furnishings FBT Mappings
    "Sofas & Couches": ["Sofa Covers & Slipcovers", "Pillow & Cushion Covers", "Curtains & Drapes"],
    "Desks & Study": ["Desk Mats & Organizers", "Chair Cushion Pads", "Curtains & Drapes"],
    "Chairs & Recliners": ["Chair Cushion Pads", "Desk Mats & Organizers", "Pillow & Cushion Covers"],
    "Tables & Dining": ["Table Runners & Placemats", "Curtains & Drapes", "Pillow & Cushion Covers"],
    "Beds & Wardrobes": ["Pillow & Cushion Covers", "Curtains & Drapes", "Sofa Covers & Slipcovers"],
}

def get_dynamic_fbts(db: Session, product: Product, user_id: int, limit: int = 2) -> List[Dict[str, Any]]:
    """
    Computes real-time Frequently Bought Together recommendations based on:
    1. Taxonomy mapping (Cross-category logic)
    2. Geolocation (Nearest location / same city)
    3. Ratings (Highest rated)
    4. Personalization (User color/taste preferences)
    """
    
    # 1. Determine target categories for FBT
    target_categories = FBT_CATEGORY_MAPPING.get(product.category)
    candidate_products = []
    if target_categories:
        for cat in target_categories:
            cat_prods = (
                db.query(Product)
                .filter(Product.id != product.id, Product.category == cat)
                .limit(400)
                .all()
            )
            candidate_products.extend(cat_prods)
    else:
        candidate_products = (
            db.query(Product)
            .filter(Product.id != product.id, Product.department == product.department)
            .limit(100)
            .all()
        )

    if not candidate_products:
        return []

    # 2. Get User Context
    user = db.query(User).filter(User.id == user_id).first()
    user_city = user.city if user else "Bengaluru"
    
    user_prefs = {}
    if user and user.preferences:
        try:
            user_prefs = json.loads(user.preferences)
        except json.JSONDecodeError:
            pass
            
    preferred_color = user_prefs.get("color", "").lower()
    
    # 3. Scoring Algorithm
    scored_candidates = []
    for cp in candidate_products:
        score = 0.0
        
        # Rating boost (Max ~5.0)
        score += float(cp.rating or 4.0) * 1.5
        
        # Geolocation boost (Same city for faster delivery)
        if cp.city == user_city:
            score += 15.0
            
        # Personalization boost (Color match)
        if preferred_color and cp.color and preferred_color in cp.color.lower():
            score += 25.0
            
        # Minor boost for higher review counts (popularity)
        if cp.review_count:
            score += min(float(cp.review_count) / 100.0, 5.0)
            
        scored_candidates.append((score, cp))
        
    # 4. For Smartphones, ensure a diverse blend across screen guards, cases, and phone stands
    if product.category == "Smartphones":
        screen_guards = []
        cases = []
        stands = []
        other_accessories = []
        
        for score, cp in scored_candidates:
            title_lower = (cp.title or "").lower()
            
            if any(k in title_lower for k in ["glass", "screen", "guard", "protector", "shield"]):
                screen_guards.append((score, cp))
            elif any(k in title_lower for k in ["case", "cover", "armor", "magsafe"]):
                cases.append((score, cp))
            elif any(k in title_lower for k in ["stand", "holder", "mount", "dock"]):
                stands.append((score, cp))
            else:
                other_accessories.append((score, cp))
                
        selected_fbts = []
        if screen_guards:
            top_screens = [cp for _, cp in screen_guards[:5]]
            selected_fbts.append(random.choice(top_screens))
        if cases:
            top_cases = [cp for _, cp in cases[:5]]
            selected_fbts.append(random.choice(top_cases))
        if stands and len(selected_fbts) < limit:
            top_stands = [cp for _, cp in stands[:5]]
            selected_fbts.append(random.choice(top_stands))
        if other_accessories and len(selected_fbts) < limit:
            top_others = [cp for _, cp in other_accessories[:5]]
            selected_fbts.append(random.choice(top_others))
            
        # Fill any remaining slots up to limit
        for score, cp in scored_candidates:
            if len(selected_fbts) >= limit:
                break
            if cp not in selected_fbts:
                selected_fbts.append(cp)
                
        return [format_product_dict(p) for p in selected_fbts[:limit]]

    # General category scoring for non-smartphones
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    top_pool = [cp for _, cp in scored_candidates[:max(limit * 3, 6)]]
    
    try:
        final_fbts = random.sample(top_pool, min(limit, len(top_pool)))
    except ValueError:
        final_fbts = top_pool[:limit]

    return [format_product_dict(p) for p in final_fbts]


def format_product_dict(p: Product) -> Dict[str, Any]:
    # Returns the dictionary representation used by the frontend and API schemas
    return {
        "id": p.id,
        "title": p.title,
        "brand": p.brand,
        "category": p.category,
        "department": getattr(p, "department", "General"),
        "gender": getattr(p, "gender", "Unisex") or "Unisex",
        "price": p.price,
        "original_price": p.original_price,
        "discount_pct": p.discount_pct,
        "rating": p.rating,
        "review_count": p.review_count,
        "image_url": p.image_url,
        "city": p.city,
        "color": p.color,
        "description": getattr(p, "description", "") or "",
        "is_active": getattr(p, "is_active", True),
        "created_at": getattr(p, "created_at", None),
        "rating_review_badge": f"★ {p.rating} ({p.review_count}+ reviews)"
    }
