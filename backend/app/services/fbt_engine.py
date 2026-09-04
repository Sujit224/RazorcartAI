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
    
    query = db.query(Product).filter(Product.id != product.id)
    
    if target_categories:
        query = query.filter(Product.category.in_(target_categories))
    else:
        # Fallback to the same department if no explicit cross-sell mapping exists
        query = query.filter(Product.department == product.department)

    # We fetch a larger pool to score in memory
    candidate_products = query.limit(100).all()

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
        
    # 4. Sort by score descending and pick top `limit`
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    
    # Add a tiny bit of random jitter so it doesn't always show the exact same 2 items forever
    # Take the top N (e.g. top 6) and pick a random sample of `limit`
    top_pool = [cp for _, cp in scored_candidates[:max(limit * 3, 6)]]
    
    try:
        final_fbts = random.sample(top_pool, min(limit, len(top_pool)))
    except ValueError:
        final_fbts = top_pool[:limit]

    return [format_product_dict(p) for p in final_fbts]


def format_product_dict(p: Product) -> Dict[str, Any]:
    # Returns the dictionary representation used by the frontend
    return {
        "id": p.id,
        "title": p.title,
        "brand": p.brand,
        "category": p.category,
        "department": p.department,
        "price": p.price,
        "original_price": p.original_price,
        "discount_pct": p.discount_pct,
        "rating": p.rating,
        "review_count": p.review_count,
        "image_url": p.image_url,
        "city": p.city,
        "color": p.color,
    }
