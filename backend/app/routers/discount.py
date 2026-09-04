import re
import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from ..schemas.discount import (
    CheckoutContext,
    OptimalDiscountResponse,
    NegotiateChatRequest,
    NegotiateChatResponse
)
from ..services.discount_engine import discount_engine
from ..agents.groq_llm import groq_llm
from ..database import SessionLocal
from ..models.product import Product

router = APIRouter(prefix="", tags=["Discount Negotiation Engine"])

@router.post("/calculate_optimal_discount", response_model=OptimalDiscountResponse)
def calculate_optimal_discount_endpoint(context: CheckoutContext):
    """
    Computes mathematical discount limit and returns expected profit breakdown
    for complete merchant observability.
    """
    return discount_engine.calculate_optimal_discount(context)

@router.get("/api/discount/guardrails/{product_id}", response_model=Dict[str, Any])
def get_discount_guardrails(product_id: int):
    """Return discount guardrails for a given product.
    For simplicity, this returns static rules based on product discount_pct.
    """
    # Fetch product from DB
    db = SessionLocal()
    product = db.query(Product).filter(Product.id == product_id).first()
    db.close()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Determine guardrails
    no_discount = product.discount_pct == 0
    # Example bulk discount rules
    bulk_discounts = []
    if product.discount_pct > 0:
        bulk_discounts.append({"min_qty": 5, "max_qty": 10, "discount_pct": product.discount_pct})
        bulk_discounts.append({"min_qty": 11, "max_qty": None, "discount_pct": min(product.discount_pct + 5, 30)})
    # Custom restrictions placeholder
    custom_restrictions = []
    if product.category == "Electronics":
        custom_restrictions.append("Maximum discount 20% on premium devices")
    return {
        "product_id": product_id,
        "no_discount": no_discount,
        "bulk_discounts": bulk_discounts,
        "custom_restrictions": custom_restrictions,
    }

@router.post("/api/discount/negotiate_chat", response_model=NegotiateChatResponse)
def negotiate_chat_endpoint(req: NegotiateChatRequest):
    """
    Interactive Merchant AI Negotiator: Customer chats and proposes a discount or budget,
    and the Merchant AI dynamically evaluates merchant margin guardrails, product categories,
    and conversion curves to offer a personalized discount with an apply button.
    """
    # 1. Calculate guardrail & ML optimal limits
    disc_context = CheckoutContext(
        user_id=req.user_id or 1,
        cart_value=req.cart_value,
        item_count=req.item_count,
        categories=req.categories or ["General"],
        product_titles=req.product_titles,
        product_ids=req.product_ids,
        customer_loyalty_tier=req.customer_loyalty_tier,
        is_new_customer=req.is_new_customer,
        historical_conversion_rate=0.45,
        merchant_margin_rate=0.35,
        competitor_price_ratio=1.05,
        merchant_min_margin_threshold=0.10
    )
    opt_res = discount_engine.calculate_optimal_discount(disc_context)
    max_discount_allowed = opt_res.optimal_discount_offered

    # 2. Extract any specific percentage or budget requested in user prompt
    user_msg = req.user_message.lower()
    pct_matches = re.findall(r'(\d{1,2})\s*%', user_msg)
    requested_pct = float(pct_matches[0]) if pct_matches else None
    
    # Check if user mentioned an absolute budget (e.g., "for 3000", "round to 2500")
    budget_matches = re.findall(r'(?:for|to|budget|price)\s*(?:rs\.?|inr|₹)?\s*(\d{3,6})', user_msg)
    if not requested_pct and budget_matches:
        target_budget = float(budget_matches[0])
        if 0 < target_budget < req.cart_value:
            requested_pct = round(((req.cart_value - target_budget) / req.cart_value) * 100.0, 1)

    # 3. Determine authorized discount
    if max_discount_allowed <= 0:
        offered_pct = 0.0
    elif requested_pct is not None:
        if requested_pct <= max_discount_allowed:
            offered_pct = float(requested_pct)
        else:
            # Grant maximum authorized cap
            offered_pct = float(max_discount_allowed)
    else:
        # Default smart offer from ML engine
        offered_pct = float(max_discount_allowed)

    discount_amount = round((req.cart_value * offered_pct) / 100.0, 2)
    new_total = max(0.0, round(req.cart_value - discount_amount, 2))

    # 4. Generate conversational reply via Groq LLM or deterministic fallback
    items_desc = ", ".join(req.product_titles[:3]) if req.product_titles else f"{req.item_count} items"
    system_prompt = (
        f"You are the Merchant AI Price Negotiator for RazorCartAI. "
        f"The customer is negotiating a discount for their cart.\n"
        f"Cart Details: Total Rs. {int(req.cart_value)}, Items: {req.item_count} ({items_desc}), "
        f"Loyalty Tier: {req.customer_loyalty_tier}.\n"
        f"Merchant Decision: You have authorized a {offered_pct}% discount (saving Rs. {int(discount_amount)}, new total Rs. {int(new_total)}).\n"
        f"STRICT RULES:\n"
        f"- Be polite, professional, and commercial.\n"
        f"- State the discount clearly and invite the customer to click the 'Apply Discount' button below to continue.\n"
        f"- If the customer requested more than allowed, politely explain that merchant margin guardrails cap the discount at {offered_pct}%.\n"
        f"- If discount is 0%, explain that items are already at direct seller floor price.\n"
        f"- DO NOT use any emojis in your reply."
    )
    
    try:
        reply_text = groq_llm.invoke_chat(
            system_prompt=system_prompt,
            user_message=req.user_message,
            response_format_json=False
        )
    except Exception:
        if offered_pct > 0:
            reply_text = (
                f"I reviewed your cart of {items_desc} with our merchant pricing system. "
                f"Based on your order and {req.customer_loyalty_tier} tier, I have authorized a {offered_pct}% discount "
                f"(saving you Rs. {int(discount_amount):,}). Your updated total is Rs. {int(new_total):,}. "
                f"Click 'Apply Discount & Continue' below to lock in this special price."
            )
        else:
            reply_text = (
                f"I checked the merchant floor margins for your items. These products are already listed at "
                f"direct manufacturer minimum pricing with zero additional markup, so an extra discount cannot be applied."
            )

    return NegotiateChatResponse(
        reply=reply_text,
        discount_pct=offered_pct,
        discount_amount=discount_amount,
        original_total=req.cart_value,
        new_total=new_total,
        can_apply=offered_pct > 0,
        reasoning=f"Engine authorized up to {max_discount_allowed}% within margin guardrails."
    )
