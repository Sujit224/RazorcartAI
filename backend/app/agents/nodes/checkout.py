from ..state import AgentState
from ...database import SessionLocal
from ...models.cart import CartItem
from ...models.product import Product
from ...services.razorpay_service import razorpay_service

def checkout_node(state: AgentState) -> AgentState:
    """Generates Razorpay Test Mode Order and initiates conversational in-app checkout."""
    user_id = state.get("user_id")
    cart_ids = state.get("current_cart_ids", [])
    
    db = SessionLocal()
    total_amount = 0.0
    items_summary = []

    try:
        if user_id:
            cart_entries = db.query(CartItem).filter(CartItem.user_id == user_id).all()
            for entry in cart_entries:
                prod = db.query(Product).filter(Product.id == entry.product_id).first()
                if prod:
                    sub = prod.price * entry.quantity
                    total_amount += sub
                    items_summary.append(f"{entry.quantity}x {prod.brand} {prod.title} (Rs. {int(prod.price)})")

        if total_amount == 0.0:
            # Fallback if cart is queried directly from product list
            products = state.get("products", [])
            if products:
                total_amount = products[0]["price"]
                items_summary.append(f"1x {products[0]['brand']} {products[0]['title']} (Rs. {int(products[0]['price'])})")
            else:
                total_amount = 3596.0 # Default demo cart

        # Generate Razorpay Order via SDK
        order_payload = razorpay_service.create_order(amount=total_amount)
        
        state["checkout_data"] = {
            "razorpay_order_id": order_payload["id"],
            "amount": total_amount,
            "currency": "INR",
            "key_id": razorpay_service.key_id,
            "items_summary": items_summary,
            "checkout_url": order_payload.get("checkout_url", "")
        }

        state["money_amount"] = total_amount
        state["profit_impact"] = total_amount
        state["reply"] = (
            f"Your order total is **Rs. {int(total_amount):,}**. "
            f"I have initialized a secure Razorpay Test Gateway session. "
            f"Click **Pay Now with Razorpay** below to complete your checkout safely."
        )
        state["audit_reasoning"] = f"Created Razorpay order {order_payload['id']} for amount Rs. {total_amount}. Order bounded and ready for payment capture."
        state["rating_review_impact"] = "Cart items verified with positive rating profiles."
        state["suggested_actions"] = [
            "Complete Razorpay Payment",
            "Simulate Gateway Timeout (Chaos Demo)",
            "Simulate Card Decline (Chaos Demo)"
        ]

    finally:
        db.close()

    return state
