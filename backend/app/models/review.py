from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    user_name = Column(String(100), nullable=False)
    user_city = Column(String(100), nullable=True)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
