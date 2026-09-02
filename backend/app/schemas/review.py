from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    user_id: int
    rating: float  # 1.0 to 5.0
    comment: str

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str
    user_city: Optional[str] = None
    rating: float
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True
