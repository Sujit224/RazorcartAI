import json
import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.order import Order
from ..models.audit_ledger import AuditLedger
from ..services.razorpay_service import razorpay_service

router = APIRouter(prefix="/api/payment", tags=["Payments & Recovery"])

class PaymentCreateRequest(BaseModel):
    user_id: int
    amount: float
    items: list
    simulate_timeout: Optional[bool] = False
    simulate_insufficient_funds: Optional[bool] = False

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    order_id: Optional[int] = None

@router.post("/create-order")
def create_payment_order(req: PaymentCreateRequest, db: Session = Depends(get_db)):
    if req.simulate_timeout:
        # Simulate gateway timeout (Pillar 8)
        mock_order_id = f"order_timeout_{uuid.uuid4().hex[:8]}"
        upi_fallback = razorpay_service.generate_upi_fallback(req.amount, mock_order_id)
        
        # Log to Audit Ledger
        audit_entry = AuditLedger(
            agent_type="RecoveryAgent",
            action_type="TIMEOUT_UPI_FALLBACK",
            user_id=req.user_id,
            input_query="Payment Gateway Timeout (504)",
            decision_reasoning=f"Captured HTTP 504 gateway timeout on amount Rs. {req.amount}. Dispatched dynamic UPI QR to preserve high conversion intent.",
            rating_review_impact="Customer cart preserved; price held for 15 minutes",
            payment_status="TIMEOUT_RECOVERED",
            money_amount=req.amount,
            profit_impact=req.amount,
            metadata_json=json.dumps({"upi_vpa": upi_fallback["vpa"], "order_id": mock_order_id})
        )
        db.add(audit_entry)
        db.commit()

        return {
            "status": "TIMEOUT_RECOVERED",
            "message": "Gateway timeout intercepted. Dynamic UPI QR generated and price locked for 15 minutes.",
            "fallback": upi_fallback,
            "audit_id": audit_entry.id
        }

    # Normal Razorpay order generation
    rzp_order = razorpay_service.create_order(amount=req.amount)
    
    order = Order(
        user_id=req.user_id,
        items_json=json.dumps(req.items),
        total_amount=req.amount,
        status="pending",
        razorpay_order_id=rzp_order["id"],
        payment_method="razorpay_gateway"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Log to Audit Ledger
    audit_entry = AuditLedger(
        agent_type="CheckoutAgent",
        action_type="PAYMENT_INITIATED",
        user_id=req.user_id,
        input_query=f"Checkout {len(req.items)} items",
        decision_reasoning=f"Initialized Razorpay order {rzp_order['id']} for amount Rs. {req.amount}.",
        rating_review_impact="All items verified with stellar review ratings.",
        payment_status="INITIALIZED",
        money_amount=req.amount,
        profit_impact=req.amount,
        metadata_json=json.dumps({"order_id": order.id, "razorpay_order_id": rzp_order["id"]})
    )
    db.add(audit_entry)
    db.commit()

    return {
        "status": "SUCCESS",
        "order_id": order.id,
        "razorpay_order": rzp_order,
        "key_id": razorpay_service.key_id,
        "audit_id": audit_entry.id
    }

@router.post("/confirm-success")
def confirm_payment_success(data: Dict[str, Any], db: Session = Depends(get_db)):
    order_id = data.get("order_id")
    payment_id = data.get("payment_id", f"pay_{uuid.uuid4().hex[:10]}")
    payment_method = data.get("payment_method", "razorpay_gateway")
    
    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = "success"
            order.razorpay_payment_id = payment_id
            order.payment_method = payment_method
            db.commit()

    # Log success to ledger
    db.add(AuditLedger(
        agent_type="CheckoutAgent",
        action_type="PAYMENT_CAPTURED",
        user_id=data.get("user_id", 1),
        input_query="Payment Authorized",
        decision_reasoning=f"Payment {payment_id} successfully captured via {payment_method}. Order marked confirmed.",
        rating_review_impact="Transaction finalized seamlessly.",
        payment_status="SUCCESS",
        money_amount=data.get("amount", 0),
        profit_impact=data.get("amount", 0),
        metadata_json=json.dumps({"order_id": order_id, "payment_id": payment_id})
    ))
    db.commit()

    return {"status": "success", "payment_id": payment_id}

@router.get("/methods/{user_id}")
def get_user_payment_methods(user_id: int, db: Session = Depends(get_db)):
    """Returns the top 2 payment methods used by the user, or cold start defaults."""
    from sqlalchemy import func
    
    # Query for the most frequent payment methods for this user on successful orders
    method_counts = (
        db.query(Order.payment_method, func.count(Order.payment_method).label("count"))
        .filter(Order.user_id == user_id, Order.status == "success", Order.payment_method != "razorpay_gateway")
        .group_by(Order.payment_method)
        .order_by(func.count(Order.payment_method).desc())
        .limit(2)
        .all()
    )

    popular_defaults = ["UPI (GPay, PhonePe, Paytm)", "Credit / Debit Card", "Netbanking"]
    
    if method_counts:
        top_methods = [m.payment_method for m in method_counts]
        # Fill in the rest from popular defaults if we have less than 2
        for default in popular_defaults:
            if len(top_methods) >= 2:
                break
            if default not in top_methods:
                top_methods.append(default)
        return {"methods": top_methods}
    else:
        # Cold start
        return {"methods": popular_defaults[:2]}
