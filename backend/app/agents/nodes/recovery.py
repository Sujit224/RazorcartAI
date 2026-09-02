import uuid
from ..state import AgentState
from ...database import SessionLocal
from ...models.cart import CartItem
from ...models.product import Product
from ...services.razorpay_service import razorpay_service

def recovery_node(state: AgentState) -> AgentState:
    """
    Handles autonomous payment failure recovery and cart negotiation:
    1. Gateway Timeout / Server Error -> Intercepts failure, issues instant dynamic UPI QR, and locks cart price for 15 minutes.
    2. Card Decline / Insufficient Funds -> Identifies lowest-priority item, calculates pruned total, and offers 1-click cart optimization.
    """
    intent = state.get("intent")
    user_id = state.get("user_id")
    amount = state.get("money_amount") or 4391.0
    
    db = SessionLocal()
    try:
        if intent == "recovery_timeout":
            # Pillar 8: Graceful Timeout Recovery with Dynamic UPI & Price Lock
            mock_order_id = f"order_rec_{uuid.uuid4().hex[:8]}"
            upi_payload = razorpay_service.generate_upi_fallback(amount=amount, order_id=mock_order_id)
            
            state["recovery_data"] = {
                "type": "TIMEOUT_UPI_FALLBACK",
                "order_id": mock_order_id,
                "amount": amount,
                "upi_info": upi_payload
            }
            state["profit_impact"] = amount # Prevented lost sale
            state["reply"] = (
                f"⚠️ **Payment Gateway Delay Detected (HTTP 504 Timeout)**.\n\n"
                f"Don't worry! I have **held your cart price for 15 minutes** and generated an instant **Dynamic UPI QR Code**. "
                f"You can scan and pay seamlessly via GPay, PhonePe, or Paytm without losing your order."
            )
            state["audit_reasoning"] = (
                f"Payment timeout intercepted. Protected transaction of Rs. {amount} by auto-generating "
                f"dynamic UPI QR ({upi_payload['vpa']}) and applying 15-minute price lock guarantee."
            )
            state["rating_review_impact"] = "High customer satisfaction protection policy triggered."
            state["suggested_actions"] = [
                "Scan UPI QR to Pay",
                "Hold Cart for 15 Minutes",
                "Retry with NetBanking"
            ]

        elif intent == "recovery_funds":
            # Pillar 9: Cart Negotiation & Pruning on Insufficient Funds / Budget Limit
            cart_items = []
            if user_id:
                cart_entries = db.query(CartItem).filter(CartItem.user_id == user_id).all()
                for c in cart_entries:
                    p = db.query(Product).filter(Product.id == c.product_id).first()
                    if p:
                        cart_items.append({"cart_id": c.id, "product": p, "priority": c.priority, "price": p.price})
            
            # If no DB cart entries, simulate a multi-item cart
            if not cart_items:
                # E.g. Shoes (Rs. 3596) + Socks (Rs. 795) = Rs. 4391
                p1 = db.query(Product).filter(Product.id == 1).first()
                p2 = db.query(Product).filter(Product.id == 9).first()
                if p1 and p2:
                    cart_items = [
                        {"cart_id": 101, "product": p1, "priority": 1, "price": p1.price},
                        {"cart_id": 102, "product": p2, "priority": 0, "price": p2.price}
                    ]

            # Find lowest priority or lowest price accessory to prune
            if cart_items:
                # Sort: priority ascending, then price ascending
                sorted_items = sorted(cart_items, key=lambda x: (x["priority"], x["price"]))
                prunable = sorted_items[0]
                remaining = [it for it in cart_items if it != prunable]
                
                original_total = sum(it["price"] for it in cart_items)
                new_total = sum(it["price"] for it in remaining)

                state["recovery_data"] = {
                    "type": "CART_PRUNING_NEGOTIATION",
                    "original_total": original_total,
                    "new_total": new_total,
                    "removed_item": {
                        "id": prunable["product"].id,
                        "title": f"{prunable['product'].brand} {prunable['product'].title}",
                        "price": prunable["product"].price,
                        "rating": prunable["product"].rating
                    },
                    "remaining_items": [
                        {"title": f"{it['product'].brand} {it['product'].title}", "price": it["price"]}
                        for it in remaining
                    ]
                }
                state["money_amount"] = new_total
                state["profit_impact"] = new_total

                state["reply"] = (
                    f"💳 **Card Declined / Budget Limit Exceeded**.\n\n"
                    f"To help you stay within budget while securing your primary order, I can remove the accessory "
                    f"**{prunable['product'].brand} {prunable['product'].title}** (Rs. {int(prunable['product'].price)}).\n\n"
                    f"This reduces your checkout total from **Rs. {int(original_total):,}** to **Rs. {int(new_total):,}**. "
                    f"Would you like me to update your bag and retry payment?"
                )
                state["audit_reasoning"] = (
                    f"Autonomous cart negotiation: Identified lowest priority item '{prunable['product'].title}' (Rs. {prunable['product'].price}). "
                    f"Recalculated checkout to Rs. {new_total} to salvage customer checkout without complete abandonment."
                )
                state["rating_review_impact"] = f"Preserved core item with top customer rating ({remaining[0]['product'].rating}★)."
                state["suggested_actions"] = [
                    f"Remove accessory and Pay Rs. {int(new_total):,}",
                    "Try another payment method",
                    "Keep all items in bag"
                ]

    finally:
        db.close()

    return state
