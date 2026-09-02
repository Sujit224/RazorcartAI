

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from datetime import datetime
from ..database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Footwear, Topwear, Bottomwear, Dresses, Accessories, Ethnic, Sportswear
    gender = Column(String(20), nullable=False, index=True)      # Men, Women, Unisex, Kids
    color = Column(String(50), nullable=True)
    price = Column(Float, nullable=False)                        # Selling price in INR
    original_price = Column(Float, nullable=False)               # MRP
    discount_pct = Column(Integer, default=0)                    # Visual discount badge % from MRP
    rating = Column(Float, default=4.5)                          # e.g. 4.6
    review_count = Column(Integer, default=50)                   # e.g. 275
    stock = Column(Integer, default=20)
    city = Column(String(100), nullable=False, default="Bengaluru")  # Seller city for fast dispatch
    image_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, default="[]")                            # JSON array of search tags
    fbt_product_ids = Column(Text, default="[]")                 # JSON array of complementary product IDs
    product_meta = Column("metadata", Text, default="{}")        # JSON blob: material, fit, occasion, season, care, style, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
