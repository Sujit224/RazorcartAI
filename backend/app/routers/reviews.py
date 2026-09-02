from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.review import Review
from ..models.product import Product
from ..models.user import User
from ..schemas.review import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/api/products", tags=["Ratings & Reviews"])

@router.get("/{product_id}/reviews", response_model=List[ReviewResponse])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """Fetch all customer reviews for a given product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.post("/{product_id}/reviews", response_model=ReviewResponse)
def create_product_review(product_id: int, req: ReviewCreate, db: Session = Depends(get_db)):
    """Submit a rating & text review for a product, auto-recalculating product rating and count."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.rating < 1.0 or req.rating > 5.0:
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0.")

    review = Review(
        product_id=product_id,
        user_id=user.id,
        user_name=user.name,
        user_city=user.city,
        rating=round(req.rating, 1),
        comment=req.comment.strip()
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Recalculate product rating & review_count
    stats = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("count")
    ).filter(Review.product_id == product_id).first()

    if stats and stats.count > 0:
        product.rating = round(float(stats.avg_rating), 1)
        product.review_count = int(stats.count)
        db.commit()

    return review
