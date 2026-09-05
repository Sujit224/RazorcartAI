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
    Interactive Merchant AI Negotiator: Customer chats and proposes a discount or budget.
    For bulk discount requests, the negotiator asks for quantity as a follow-up
    to validate if it is genuinely a bulk purchase (minimum 5 units).
    """
    user_msg = req.user_message.lower()

    # 1. Check if user message or chat history involves bulk / wholesale inquiry
    is_bulk_inquiry = any(term in user_msg for term in [
        "bulk", "wholesale", "quantity", "volume", "large order", "multiple units", "many pieces", "batch", "reseller", "corporate"
    ])

    # Check if previous assistant message in chat_history asked for quantity
    was_asked_quantity = False
    if req.chat_history:
        for m in reversed(req.chat_history):
            if m.get("sender") in ["merchant_ai", "assistant"]:
                prev_txt = m.get("text", "").lower()
                if "quantity" in prev_txt or "how many units" in prev_txt or "minimum 5 units" in prev_txt:
                    was_asked_quantity = True
                    break

    # 2. Extract numeric quantity from user_message or recent history
    # Look for digits associated with items/units or standalone numbers
    qty_matches = re.findall(r'(\d+)\s*(?:units?|items?|pieces?|pcs?|qty|quantity|nos?|phones?|pairs?|shoes?)?', user_msg)
    extracted_qty = None
    for match in qty_matches:
        if match.isdigit():
            val = int(match)
            if 1 <= val <= 1000 and not any(f"{val}%" in user_msg for val in [val]):
                extracted_qty = val
                break

    # If no quantity found in current message, but user was answering quantity follow-up
    if extracted_qty is None and was_asked_quantity:
        num_search = re.findall(r'\b(\d{1,4})\b', user_msg)
        if num_search:
            extracted_qty = int(num_search[0])

    # 3. Check confirmation status
    is_confirmation = any(term in user_msg for term in [
        "proceed", "apply", "accept", "yes", "go ahead", "confirm", "i agree", "ok", "sure", "checkout", "take me to checkout"
    ])

    # Check for previous discount offered in history if this is a confirmation
    prev_discount_pct = None
    if is_confirmation and req.chat_history:
        for hist_msg in reversed(req.chat_history):
            text = hist_msg.get("text", "")
            matches = re.findall(r'(\d{1,2})\s*%', text)
            if matches and float(matches[0]) > 0:
                prev_discount_pct = float(matches[0])
                break

    # 4. Enforce Quantity Follow-up Validation for Bulk Discounts
    if (is_bulk_inquiry or was_asked_quantity) and not is_confirmation:
        if extracted_qty is None and not was_asked_quantity:
            # Prompt user to specify quantity as a required follow-up
            reply_text = (
                "Thank you for your bulk order inquiry! To validate your request and authorize a wholesale volume discount, "
                "please specify the **quantity of units** you intend to purchase (e.g. **10, 20, or 50 units**).\n\n"
                "📌 *Note: Wholesale bulk discounts apply on minimum orders of 5 or more units.*"
            )
            return NegotiateChatResponse(
                reply=reply_text,
                discount_pct=0.0,
                discount_amount=0.0,
                original_total=req.cart_value,
                new_total=req.cart_value,
                can_apply=False,
                reasoning="Awaiting bulk quantity specification from buyer (minimum 5 units required).",
                auto_execute=False,
                client_action=None
            )
        elif extracted_qty is not None and extracted_qty < 5:
            # User specified fewer than 5 units
            reply_text = (
                f"You requested a bulk discount for **{extracted_qty} unit{'s' if extracted_qty > 1 else ''}**. "
                f"Our wholesale bulk discount tier requires a minimum order of **5 units**. "
                f"For **{extracted_qty} unit{'s' if extracted_qty > 1 else ''}**, our standard retail tier of **5% OFF** applies."
            )
            discount_amount = round(req.cart_value * 0.05, 2)
            return NegotiateChatResponse(
                reply=reply_text,
                discount_pct=5.0,
                discount_amount=discount_amount,
                original_total=req.cart_value,
                new_total=max(0.0, req.cart_value - discount_amount),
                can_apply=True,
                reasoning=f"Quantity {extracted_qty} is below bulk threshold of 5 units. Standard 5% retail discount offered.",
                auto_execute=False,
                client_action=None
            )

    # 5. Calculate guardrail & ML optimal limits
    effective_cart_val = req.cart_value if req.cart_value > 0 else 10000.0
    effective_item_cnt = extracted_qty if extracted_qty is not None else (req.item_count if req.item_count > 0 else 10)

    # Calculate bulk volume bonus if validated quantity >= 5
    bulk_bonus_pct = 0.0
    if effective_item_cnt >= 26:
        bulk_bonus_pct = 10.0
    elif effective_item_cnt >= 11:
        bulk_bonus_pct = 7.0
    elif effective_item_cnt >= 5:
        bulk_bonus_pct = 5.0

    disc_context = CheckoutContext(
        user_id=req.user_id or 1,
        cart_value=effective_cart_val,
        item_count=effective_item_cnt,
        categories=req.categories or ["General"],
        product_titles=req.product_titles,
        product_ids=req.product_ids,
        customer_loyalty_tier=req.customer_loyalty_tier,
        is_new_customer=False,
        historical_conversion_rate=0.45,
        merchant_margin_rate=0.35,
        competitor_price_ratio=1.05,
        merchant_min_margin_threshold=0.10
    )
    opt_res = discount_engine.calculate_optimal_discount(disc_context)
    max_discount_allowed = min(25.0, opt_res.optimal_discount_offered + bulk_bonus_pct)

    pct_matches = re.findall(r'(\d{1,2})\s*%', user_msg)
    requested_pct = float(pct_matches[0]) if pct_matches else prev_discount_pct
    
    budget_matches = re.findall(r'(?:for|to|budget|price)\s*(?:rs\.?|inr|₹)?\s*(\d{3,6})', user_msg)
    if not requested_pct and budget_matches:
        target_budget = float(budget_matches[0])
        if 0 < target_budget < effective_cart_val:
            requested_pct = round(((effective_cart_val - target_budget) / effective_cart_val) * 100.0, 1)

    if max_discount_allowed <= 0:
        offered_pct = 0.0
    elif requested_pct is not None:
        if requested_pct <= max_discount_allowed:
            offered_pct = float(requested_pct)
        else:
            offered_pct = float(max_discount_allowed)
    else:
        offered_pct = float(max_discount_allowed)

    discount_amount = round((effective_cart_val * offered_pct) / 100.0, 2)
    new_total = max(0.0, round(effective_cart_val - discount_amount, 2))
    auto_execute = is_confirmation and (offered_pct > 0 or prev_discount_pct is not None)
    client_action = "checkout" if auto_execute else None

    items_desc = ", ".join(req.product_titles[:3]) if req.product_titles else f"{effective_item_cnt} items"
    
    if auto_execute:
        reply_text = (
            f"Done! I have confirmed your **{offered_pct}% discount** (saving Rs. {int(discount_amount):,}). "
            f"Applying your updated total of **Rs. {int(new_total):,}** and opening checkout now..."
        )
    else:
        bulk_prefix = f"✅ **Bulk Purchase Validated ({effective_item_cnt} units)**\n\n" if (effective_item_cnt >= 5) else ""
        system_prompt = (
            f"You are the Merchant AI Price Negotiator for RazorCartAI. "
            f"The customer is negotiating a discount for their cart.\n"
            f"Cart Details: Total Rs. {int(effective_cart_val)}, Items: {effective_item_cnt} ({items_desc}), "
            f"Loyalty Tier: {req.customer_loyalty_tier}.\n"
            f"Merchant Decision: You have authorized a {offered_pct}% discount (saving Rs. {int(discount_amount)}, new total Rs. {int(new_total)}).\n"
            f"STRICT RULES:\n"
            f"- Be polite, professional, and commercial.\n"
            f"- State the authorized discount clearly.\n"
            f"- If quantity is >= 5, confirm that their bulk order has been validated.\n"
            f"- If the customer requested more than allowed, politely explain that merchant margin guardrails cap the discount at {offered_pct}%.\n"
            f"- If discount is 0%, explain that items are already at direct seller floor price.\n"
            f"- DO NOT use any emojis in your reply."
        )
        
        try:
            llm_reply = groq_llm.invoke_chat(
                system_prompt=system_prompt,
                user_message=req.user_message,
                response_format_json=False
            )
            reply_text = bulk_prefix + llm_reply
        except Exception:
            if offered_pct > 0:
                reply_text = (
                    f"{bulk_prefix}"
                    f"I reviewed your cart of {items_desc} with our merchant pricing system. "
                    f"Based on your order of {effective_item_cnt} units and {req.customer_loyalty_tier} tier, "
                    f"I have authorized a **{offered_pct}% discount** (saving you Rs. {int(discount_amount):,}). "
                    f"Your updated total is **Rs. {int(new_total):,}**."
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
        reasoning=f"Engine authorized up to {max_discount_allowed}% within margin guardrails for {effective_item_cnt} units.",
        auto_execute=auto_execute,
        client_action=client_action
    )
