from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from ...config import settings
from ..tools_schema import AVAILABLE_TOOLS
from ..state import AgentState
from ..reference import get_focus
from ...database import SessionLocal
from ...models.product import Product
import os
import json

BASE_SYSTEM_PROMPT = """You are RazorCartAI's conversational shopping copilot.
You have access to a variety of tools to interact with the database and perform actions for the user.
Interpret the user's intent from the full conversational context and invoke the appropriate tool(s).

Available tools:
- view_cart: View items currently in the cart.
- get_latest_orders: Retrieve recent order history.
- recommend_products: Search/discover products by semantic query, brand or author, department (e.g. Books, Electronics, Fashion), category or genre (e.g. Sci-Fi, Fantasy, Business & Finance, Technology, Fiction, Mystery), max price, rating.
- get_product_details: Explore full specifications, detailed description, merchant info, and features of a specific product (by 1-based list index like 1, 2, 9, 10 or product ID/name).
- compare_products: Compare 2 or more products side-by-side by list indices (e.g. product_indices=[9, 10]), product IDs, or names.
- manage_cart: Add, remove, update quantities, or clear the cart.
- checkout: Proceed to checkout and launch payment session.
- apply_discount: Apply authorized/negotiated percentage discount and launch checkout modal.
- navigate: Navigate the UI to specific pages ('cart', 'orders', 'negotiate', 'home', 'product').
- negotiate_price: Initiate bulk discount/negotiation with merchant AI engine.

RULES FOR TOOL CALLING & CONVERSATION:
1. When the user asks to checkout, pay, proceed with offer/discount, or confirm payment ("proceed with this", "apply discount", "checkout now", "pay", "yes"), ALWAYS call `checkout` or `apply_discount`.
2. When the user asks to compare items (e.g. "compare 1 and 2"), ALWAYS call `compare_products` specifying `product_indices`.
3. When the user asks to explore or see details (e.g. "tell me more about 1st one"), ALWAYS call `get_product_details` with `product_index`.
4. When the user wants to add, remove, update, or clear items, call `manage_cart`.
5. When the user asks for new products or recommendations, call `recommend_products`.
6. When the user asks to navigate to cart, orders, or negotiate page, call `navigate`.
7. When the user asks about bulk orders, wholesale discounts, or negotiating prices, call `negotiate_price` or `apply_discount`.
8. If the user asks for payment options or alternatives, list the available options: Razorpay, UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, and NetBanking.
9. Always use tools rather than generic conversational text when information retrieval or store action is requested.
"""

def get_llm():
    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    return ChatGroq(api_key=api_key, model=settings.GROQ_MODEL, temperature=0.1).bind_tools(AVAILABLE_TOOLS)

def agent_node(state: AgentState) -> dict:
    llm = get_llm()
    session_id = state.get("session_id", "default")
    
    # 1. Gather active context (previously recommended products)
    prev_prods = state.get("previous_products") or []
    if not prev_prods:
        saved = get_focus(session_id)
        if saved:
            db_temp = SessionLocal()
            try:
                f_ids = [f.ref_id for f in saved]
                prods_db = db_temp.query(Product).filter(Product.id.in_(f_ids)).all()
                prod_map = {p.id: p for p in prods_db}
                prev_prods = [
                    {
                        "id": f.ref_id,
                        "title": prod_map[f.ref_id].title,
                        "brand": prod_map[f.ref_id].brand,
                        "price": prod_map[f.ref_id].price,
                        "category": prod_map[f.ref_id].category
                    }
                    for f in saved if f.ref_id in prod_map
                ]
            finally:
                db_temp.close()

    context_str = ""
    if prev_prods:
        prod_lines = []
        for idx, p in enumerate(prev_prods[:15]):
            prod_lines.append(f"{idx + 1}. [ID: {p.get('id')}] {p.get('brand', '')} {p.get('title', '')} — Rs. {int(p.get('price', 0)):,} ({p.get('category', '')})")
        context_str = "\n\nCURRENTLY RECOMMENDED / DISPLAYED PRODUCTS (1-indexed for the user):\n" + "\n".join(prod_lines)
    
    cart_ids = state.get("current_cart_ids") or []
    if cart_ids:
        context_str += f"\n\nCurrent Cart: {len(cart_ids)} item(s) in cart."

    system_prompt = BASE_SYSTEM_PROMPT + context_str

    messages = [
        SystemMessage(content=system_prompt)
    ]
    
    # Pass past conversation turns so LLM has full conversational context
    chat_history = state.get("chat_history") or []
    if chat_history:
        from langchain_core.messages import AIMessage
        for turn in chat_history[-8:]:
            role = turn.get("role") or turn.get("sender")
            content = turn.get("content") or turn.get("text") or ""
            if content:
                if role in ["user", "human"]:
                    messages.append(HumanMessage(content=content))
                else:
                    messages.append(AIMessage(content=content))
    
    msg = state.get("user_message", "")
    if msg:
        # Avoid duplicate if last message in chat_history matches current msg
        if not chat_history or (chat_history[-1].get("content") != msg and chat_history[-1].get("text") != msg):
            messages.append(HumanMessage(content=msg))
    
    print(f"\n[Agent Node] Invoking LLM with message count={len(messages)}, latest: {msg}")
    response = llm.invoke(messages)
    
    reply_text = getattr(response, "content", "") or ""
    
    suggested_actions = state.get("suggested_actions") or []
    if "bulk" in msg.lower() or "negotiat" in msg.lower() or "wholesale" in msg.lower():
        if "Negotiate Bulk Order" not in suggested_actions:
            suggested_actions = ["Negotiate Bulk Order"] + list(suggested_actions)

    if hasattr(response, "tool_calls") and response.tool_calls:
        print(f"[Agent Node] LLM decided to use {len(response.tool_calls)} tools.")
        for tc in response.tool_calls:
            print(f"  -> {tc['name']}({tc['args']})")
    else:
        print(f"[Agent Node] LLM responded with conversational text: {reply_text[:100]}...")
    
    return {
        "messages": [response],
        "reply": reply_text,
        "suggested_actions": suggested_actions
    }

