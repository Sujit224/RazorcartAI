import json
from typing import List, Any
from sqlalchemy.orm import Session
from ..models.product import Product
from ..models.user import User
from .vector_store import vector_store
from .ranking import rank_products

def get_zero_query_feed(db: Session, user: User, limit: int = 12) -> List[Any]:
    """
    Generates a personalized home feed tailored to the user's past search queries
    and viewed products using composite vector embeddings + smart rating ranking.
    """
    try:
        search_history = json.loads(user.search_history or "[]")
    except Exception:
        search_history = []

    try:
        viewed_ids = json.loads(user.viewed_product_ids or "[]")
    except Exception:
        viewed_ids = []

    # Get composite semantic similarity scores for all products
    semantic_scores = vector_store.get_composite_user_vector_scores(search_history, viewed_ids)
    
    # Query all active products
    all_products = db.query(Product).filter(Product.is_active == True).all()

    # Rank products considering user city and high ratings/reviews
    ranked = rank_products(
        products=all_products,
        user_city=user.city,
        semantic_scores=semantic_scores,
        sort_by="smart_rank"
    )

    results = []
    for item in ranked[:limit]:
        p = item["product"]
        # Format as ProductResponse compatible dict
        p_dict = {
            "id": p.id,
            "title": p.title,
            "brand": p.brand,
            "category": p.category,
            "gender": p.gender,
            "color": p.color,
            "price": p.price,
            "original_price": p.original_price,
            "discount_pct": p.discount_pct,
            "rating": p.rating,
            "review_count": p.review_count,
            "stock": p.stock,
            "city": p.city,
            "image_url": p.image_url,
            "description": p.description,
            "tags": (json.loads(p.tags) if isinstance(p.tags, str) else p.tags) or [],
            "fbt_product_ids": (json.loads(p.fbt_product_ids) if isinstance(p.fbt_product_ids, str) else p.fbt_product_ids) or [],
            "is_active": p.is_active,
            "created_at": p.created_at,
            "ranking_score": round(item["final_score"], 3),
            "is_local_seller": item["is_local_seller"],
            "rating_review_badge": item["rating_review_badge"]
        }
        results.append(p_dict)

    return results
