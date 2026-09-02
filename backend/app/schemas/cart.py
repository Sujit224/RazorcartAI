from pydantic import BaseModel
from typing import Optional, List
from .product import ProductResponse

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1
    size: Optional[str] = "UK 8"
    priority: Optional[int] = 1

class CartItemUpdate(BaseModel):
    quantity: Optional[int] = None
    size: Optional[str] = None
    priority: Optional[int] = None

class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    size: str
    priority: int
    product: ProductResponse

    class Config:
        from_attributes = True

class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    shipping_fee: float = 0.0
    total: float
    item_count: int
    fbt_recommendations: List[ProductResponse] = []
