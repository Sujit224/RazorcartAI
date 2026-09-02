from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    size = Column(String(20), default="UK 8")
    priority = Column(Integer, default=1) # 1=standard, 0=low-priority accessory (for cart negotiation)
    added_at = Column(DateTime, default=datetime.utcnow)
