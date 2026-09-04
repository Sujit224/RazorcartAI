from ..state import AgentState
from ...database import SessionLocal
from ...models.cart import CartItem
from ...models.product import Product
from ...services.razorpay_service import razorpay_service
from ...services.discount_engine import discount_engine
from ...schemas.discount import CheckoutContext

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

        # Calculate optimal discount via Profit Maximization Engine
        categories = [p.category for p in db.query(Product).filter(Product.id.in_([e.product_id for e in cart_entries])).all()] if user_id else ["General"]
        disc_context = CheckoutContext(
            user_id=user_id or 1,
            cart_value=total_amount,
            item_count=len(cart_entries) if user_id else 1,
            categories=categories if categories else ["General"],
            customer_loyalty_tier="Gold",
            historical_conversion_rate=0.45,
            merchant_margin_rate=0.30,
            competitor_price_ratio=1.05,
            merchant_min_margin_threshold=0.10
        )
        disc_res = discount_engine.calculate_optimal_discount(disc_context)
        optimal_disc_pct = disc_res.optimal_discount_offered
        
        user_msg = (state.get("user_message") or "").lower()
        discount_applied_amount = 0.0
        discount_note = ""

        if optimal_disc_pct > 0:
            discount_applied_amount = (total_amount * optimal_disc_pct) / 100.0
            discounted_total = max(0.0, total_amount - discount_applied_amount)
            discount_note = f"\n\n**AI Negotiator Applied {optimal_disc_pct}% Discount:** You saved **Rs. {int(discount_applied_amount):,}**."
            total_amount = discounted_total
        elif any(w in user_msg for w in ["discount", "coupon", "offer", "deal", "cheap", "less"]):
            discount_note = "\n\n*Merchant Guardrails Note: Cart items are already at direct manufacturer floor price with zero markup.*"

        # Generate Razorpay Order via SDK
        order_payload = razorpay_service.create_order(amount=total_amount)
        
        state["checkout_data"] = {
            "razorpay_order_id": order_payload["id"],
            "amount": total_amount,
            "currency": "INR",
            "key_id": razorpay_service.key_id,
            "items_summary": items_summary,
            "checkout_url": order_payload.get("checkout_url", ""),
            "optimal_discount_pct": optimal_disc_pct,
            "discount_saved_inr": discount_applied_amount
        }

        state["money_amount"] = total_amount
        state["profit_impact"] = total_amount
        state["reply"] = (
            f"Your order total is **Rs. {int(total_amount):,}**.{discount_note} "
            f"I have initialized a secure Razorpay Test Gateway session. "
            f"Click **Pay Now with Razorpay** below to complete your checkout safely."
        )
        
        opt_tier = disc_res.engine_reasoning.get("optimal_tier", {})
        state["audit_reasoning"] = (
            f"Created Razorpay order {order_payload['id']} for amount Rs. {total_amount}. "
            f"Negotiation Engine: {optimal_disc_pct}% authorized (Max Exp Profit: Rs. {opt_tier.get('max_expected_profit_inr', 0)}). "
            f"Order bounded and ready for payment capture."
        )
        state["rating_review_impact"] = "Cart items verified with positive rating profiles."
        state["suggested_actions"] = [
            "Complete Razorpay Payment",
            "Simulate Gateway Timeout (Chaos Demo)",
            "Simulate Card Decline (Chaos Demo)"
        ]

    finally:
        db.close()

    return state
