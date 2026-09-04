from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="customer", nullable=False)  # "customer" | "merchant" | "admin"
    city = Column(String(100), default="Bengaluru")

    # Merchant-specific fields (null for customer/admin)
    merchant_id = Column(String(50), nullable=True, index=True)   # e.g. "merch_001"
    merchant_name = Column(String(150), nullable=True)             # e.g. "RazorCart Official Store"

    # Customer-specific fields
    search_history = Column(Text, default="[]")         # JSON array of search strings
    viewed_product_ids = Column(Text, default="[]")     # JSON array of product IDs
    preferences = Column(Text, default="{}")            # JSON dict for AI extracted preferences (e.g. {"color": "black"})

    created_at = Column(DateTime, default=datetime.utcnow)
