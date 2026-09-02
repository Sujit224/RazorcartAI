import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.order import Order
from ..models.user import User

router = APIRouter(prefix="/api/orders", tags=["Customer Orders"])

@router.get("/my-orders")
def get_my_orders(user_id: int = 1, db: Session = Depends(get_db)):
    """Fetch order history for the active customer."""
    orders = (
        db.query(Order)
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    result = []
    for o in orders:
        try:
            items = json.loads(o.items_json or "[]")
        except Exception:
            items = []
        result.append({
            "id": o.id,
            "user_id": o.user_id,
            "items": items,
            "total_amount": o.total_amount,
            "currency": o.currency,
            "status": o.status,
            "payment_method": o.payment_method,
            "razorpay_order_id": o.razorpay_order_id,
            "razorpay_payment_id": o.razorpay_payment_id,
            "recovery_type": o.recovery_type,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })
    return result
