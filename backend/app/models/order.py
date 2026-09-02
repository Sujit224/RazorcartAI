from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    items_json = Column(Text, nullable=False) # JSON array of purchased item snapshots
    total_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="pending") # pending, success, failed, recovered_upi, price_held
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    payment_method = Column(String(50), default="razorpay_gateway") # razorpay_gateway, upi_qr, price_lock
    recovery_type = Column(String(100), nullable=True) # e.g. "timeout_recovered_upi", "cart_negotiated_pruned"
    created_at = Column(DateTime, default=datetime.utcnow)
