import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.product import Product
from ..models.user import User
from ..schemas.product import ProductResponse
from ..services.ranking import rank_products
from ..services.vector_store import vector_store
from ..services.personalization import get_zero_query_feed
from app.services.fbt_engine import get_dynamic_fbts

router = APIRouter(prefix="/api/products", tags=["Products"])

def format_product(p: Product, current_user_id: int, db: Session, score: float = 0.0, is_local: bool = False, badge: Optional[str] = None) -> dict:
    return {
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
        "tags": json.loads(p.tags) if isinstance(p.tags, str) else (p.tags or []),
        "fbt_products": get_dynamic_fbts(db, p, current_user_id, limit=2),
        "is_active": p.is_active,
        "created_at": p.created_at,
        "ranking_score": round(score, 3) if score else None,
        "is_local_seller": is_local,
        "rating_review_badge": badge or f"★ {p.rating} ({p.review_count}+ reviews)"
    }

@router.get("", response_model=List[ProductResponse])
def get_products(
    query: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    gender: Optional[str] = None,
    brand: Optional[str] = None,
    city: Optional[str] = None,
    min_rating: Optional[float] = None,
    sort_by: str = "smart_rank",
    user_city: Optional[str] = "Bengaluru",
    limit: int = Query(default=60, ge=1, le=250),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user_id: int = 1
):
    semantic_scores = {}
    has_query = bool(query and query.strip())

    if has_query:
        # 1. Search Query Path: Retrieve relevant vector candidates
        vec_res = vector_store.search(query.strip(), top_k=min(80, limit * 2))
        if vec_res:
            top_score = vec_res[0][1]
            threshold = max(0.20, top_score * 0.35)
            semantic_scores = {pid: s for pid, s in vec_res if s >= threshold}
            rel_ids = list(semantic_scores.keys()) if semantic_scores else [pid for pid, _ in vec_res[:15]]
            
            # Fetch candidate products by IDs
            q = db.query(Product).filter(Product.id.in_(rel_ids), Product.is_active == True)
            if category and category != "ALL":
                q = q.filter(Product.category.ilike(f"%{category}%"))
            if department:
                q = q.filter(Product.product_meta.ilike(f'%"department": "{department}"%'))
            if gender and gender != "All":
                q = q.filter(Product.gender.in_([gender, "Unisex"]))
            if brand:
                q = q.filter(Product.brand.ilike(f"%{brand}%"))
            if min_rating:
                q = q.filter(Product.rating >= min_rating)
            if city:
                q = q.filter(Product.city.ilike(f"%{city}%"))

            products = q.all()
        else:
            products = []
    else:
        # 2. Browse / Category Navigation Path
        q = db.query(Product).filter(Product.is_active == True)
        if department:
            q = q.filter(Product.product_meta.ilike(f'%"department": "{department}"%'))
        if category and category != "ALL":
            q = q.filter(Product.category.ilike(f"%{category}%"))
        if gender and gender != "All":
            q = q.filter(Product.gender.in_([gender, "Unisex"]))
        if brand:
            q = q.filter(Product.brand.ilike(f"%{brand}%"))
        if min_rating:
            q = q.filter(Product.rating >= min_rating)
        if city:
            q = q.filter(Product.city.ilike(f"%{city}%"))

        # Fetch candidate slice for browsing
        products = q.limit(150).offset(offset).all()

    # Rank products with multi-factor scoring
    ranked = rank_products(
        products=products,
        user_city=user_city,
        semantic_scores=semantic_scores,
        sort_by=sort_by,
        has_query=has_query
    )

    return [format_product(
        item["product"],
        current_user_id,
        db,
        score=item["final_score"],
        is_local=item["is_local_seller"],
        badge=item["rating_review_badge"]
    ) for item in ranked[:limit]]

@router.get("/personalized-feed", response_model=List[ProductResponse])
def get_personalized_feed(user_id: int = 1, db: Session = Depends(get_db)):
    """Pillar 3: Zero-Query Personalization feed based on composite user vector."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).first()
    
    if not user:
        products = db.query(Product).limit(10).all()
        return [format_product(p, user_id, db) for p in products]

    feed = get_zero_query_feed(db, user, limit=8)
    return feed

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_details(product_id: int, user_id: Optional[int] = 1, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update viewed products history if user_id present
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            try:
                viewed = json.loads(user.viewed_product_ids or "[]")
                if product_id not in viewed:
                    viewed.append(product_id)
                    user.viewed_product_ids = json.dumps(viewed[-10:])
                    db.commit()
            except Exception:
                pass

    return format_product(prod, user_id, db)
