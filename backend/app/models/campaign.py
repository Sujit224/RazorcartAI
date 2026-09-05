from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from ..database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String(50), index=True, nullable=False)
    title = Column(String(200), nullable=False)
    prompt = Column(Text, nullable=False)
    
    # Store AI reasoning summary
    strategy_summary = Column(Text, nullable=True)
    
    # JSON arrays/dicts
    target_products_json = Column(Text, default="[]")
    target_segments_json = Column(Text, default="{}") # e.g. {"dwellers": [user_id_1, ...], "explorers": [user_id_2, ...]}
    personalized_offers_json = Column(Text, default="{}")
    
    status = Column(String(20), default="draft") # draft, active, completed, cancelled
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
