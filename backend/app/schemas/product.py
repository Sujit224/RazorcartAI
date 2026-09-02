from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductBase(BaseModel):
    title: str
    brand: str
    category: str
    gender: str
    color: Optional[str] = None
    price: float
    original_price: float
    discount_pct: int = 0
    rating: float = 4.5
    review_count: int = 50
    stock: int = 20
    city: str = "Bengaluru"
    image_url: str
    description: Optional[str] = None
    tags: List[str] = []
    fbt_product_ids: List[int] = []

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    ranking_score: Optional[float] = None
    is_local_seller: Optional[bool] = False
    rating_review_badge: Optional[str] = None

    class Config:
        from_attributes = True

class ProductFilterParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    brand: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    city: Optional[str] = None
    sort_by: Optional[str] = "smart_rank" # smart_rank, rating_high, price_low, price_high
