import json
import re
from typing import Dict, Any, List
from ..state import AgentState
from ..groq_llm import groq_llm
from ..commands import parse_command
from ..reference import get_pending
from ...database import SessionLocal
from ...models.user import User

ROUTER_SYSTEM_PROMPT = """You are RazorCartAI's Master Intent & Attribute Extraction Engine.
Analyze the user's shopping message AND conversation history to output a clean JSON object with this EXACT structure:
{
  "intent": "discovery" | "fbt_upsell" | "checkout" | "recovery_timeout" | "recovery_funds" | "view_cart" | "view_orders" | "cart_add" | "cart_update_qty" | "cart_remove" | "cart_clear" | "open_item" | "confirm" | "deny" | "general",
  "filters": {
    "brand": string | null,
    "department": "Electronics" | "Fashion" | "Appliances" | "Home & Kitchen" | "Beauty & Personal Care" | "Sports & Fitness" | null,
    "gender": "Men" | "Women" | "Unisex" | null,
    "category": string | null,
    "color": string | null,
    "min_price": number | null,
    "max_price": number | null,
    "min_rating": number | null,
    "spec_keywords": ["attribute1", "attribute2", ...]
  },
  "search_query": "concise semantic search terms without filler or price words",
  "conversational_reply": "friendly summary of what you are searching for (STRICT RULE: DO NOT INCLUDE ANY EMOJIS)"
}

Extraction guidelines across ALL product domains (Electronics, Fashion, Home, Kitchen, Appliances, Footwear, Sports):
- "brand": Extract explicit brand names (e.g. Nike, Apple, Samsung, Puma, Adidas, Nokia, Dyson, Philips, OnePlus, Sony, Levi's, etc.) or null.
- "department": Extract the main department if mentioned or implied (Electronics, Fashion, Appliances, Home & Kitchen, Beauty & Personal Care, Sports & Fitness) or null.
- "category": Extract product sub-category if mentioned or implied (e.g. Footwear, Smartphones, Laptops, Topwear, Bottomwear, etc.) or null.
- "color": Extract color name or null.
- "min_price": Extract numeric minimum price for ranges like "between 30000 - 50000" (min: 30000, max: 50000), "from 20k to 40k", "above 15000", etc.
- "max_price": Extract numeric maximum price if user mentions "under 50000", "below 4000", "within 2k", etc.
- "min_rating": Extract minimum rating if user asks for "best rated", "top rated", "4.5 star", etc.
- "spec_keywords": Extract key technical, material, or use-case specifications (e.g. ["64gb", "snapdragon"], ["running", "cushioned"], ["cotton", "oversized"], ["leather", "waterproof"], ["inverter", "5 star"], etc.).
- "search_query": Cleaned semantic terms without price filler words (e.g. "mobiles between 30000 - 50000" -> "mobile phone smartphone", "pink running shoes under 4k" -> "pink running shoes").

Intent rules & CONVERSATIONAL CONTEXT:
1. ALWAYS pay attention to the "Recent conversation". If the recent context is about a payment failure/timeout, and the user says "explore more options" or "what else", they mean payment options, NOT product discovery. Map this to "general" intent so the agent can list payment options.
2. "checkout" means ONLY that the user explicitly wants to pay for items in their bag: "checkout", "pay now", "place order".
3. "view_orders" means the user wants to see their past or recent orders.
4. "view_cart" means the user wants to see what is currently in their bag/cart.
5. "cart_add", "cart_remove", "cart_clear", "cart_update_qty" for managing items in the bag.
6. "open_item" to view details of a specific item.
7. "confirm" / "deny" for answering yes/no to pending requests.
8. Searching for new products is "discovery". BUT if the user is following up on a non-product topic (like payments), use "general".

Do not return anything outside the JSON.
"""

_PAY_VERB = re.compile(
    r"\b(?:checkout|check\s+out|pay|paying|payment|proceed|buy\s+now|purchase\s+now"
    r"|place\s+(?:my\s+|the\s+)?order|complete\s+(?:my\s+|the\s+)?(?:order|purchase)"
    r"|razorpay|upi|card|netbanking|apply|accept|confirm|yes|deal|discount|ok|sure|go\s+ahead)\b",
    re.I,
)

def router_node(state: AgentState) -> AgentState:
    """
    Classifies the turn using:
      1. Deterministic grammar (agents/commands.py) for strict cart/order actions.
      2. High-capacity LLM (openai/gpt-oss-120b) for open-ended product discovery across all departments.
    """
    msg = state.get("user_message", "")
    sim_flag = state.get("simulation_flag")
    session_id = state.get("session_id") or "default"
    chat_history = state.get("chat_history") or []

    # Demo simulation flags
    if sim_flag == "SIMULATE_TIMEOUT":
        state["intent"] = "recovery_timeout"
        state["search_query"] = msg
        state["extracted_filters"] = {}
        return state
    elif sim_flag == "SIMULATE_INSUFFICIENT_FUNDS":
        state["intent"] = "recovery_funds"
        state["search_query"] = msg
        state["extracted_filters"] = {}
        return state

    # 1. Deterministic Grammar for Cart & Orders
    # User requested to use LLM directly instead of RegEx, so we bypass parse_command for intent.
    # command = parse_command(msg, has_pending=bool(get_pending(session_id)))
    # if command is not None:
    #     state["intent"] = command.intent
    #     state["search_query"] = msg
    #     state["extracted_filters"] = {
    #         "_command": command,
    #         "_pattern": command.pattern,
    #         **command.slots,
    #     }
    #     print(f"[Router Node] deterministic match: {command.intent} via {command.pattern}")
    #     return state

    # 2. General LLM Extraction
    # Format context from recent conversation turns
    context_str = ""
    if chat_history:
        recent = chat_history[-3:]
        context_str = "\nRecent conversation:\n" + "\n".join(f"{m.get('role', 'user')}: {m.get('content', '')}" for m in recent) + "\n\nCurrent query: "

    prompt_input = f"{context_str}{msg}" if context_str else msg

    raw_response = groq_llm.invoke_chat(
        system_prompt=ROUTER_SYSTEM_PROMPT,
        user_message=prompt_input,
        response_format_json=True
    )

    try:
        parsed = json.loads(raw_response)
        state["intent"] = parsed.get("intent", "discovery")
        state["extracted_filters"] = parsed.get("filters", {})
        state["search_query"] = parsed.get("search_query", msg)
    except Exception as e:
        print(f"[Router Node] Error parsing LLM response: {e}")
        state["intent"] = "discovery"
        state["extracted_filters"] = {}
        state["search_query"] = msg

    # Save extracted color taste to User preferences for FBT personalization
    extracted_color = state["extracted_filters"].get("color")
    if extracted_color and state.get("user_id"):
        try:
            db = SessionLocal()
            user = db.query(User).filter(User.id == state["user_id"]).first()
            if user:
                prefs = {}
                if user.preferences:
                    prefs = json.loads(user.preferences)
                prefs["color"] = extracted_color.lower()
                user.preferences = json.dumps(prefs)
                db.commit()
            db.close()
        except Exception as e:
            print(f"[Router Node] Error saving user preferences: {e}")

    # Guard the money intent
    if state["intent"] == "checkout" and not _PAY_VERB.search(msg):
        state["intent"] = "discovery"
        state["extracted_filters"] = dict(state.get("extracted_filters") or {})
        state["extracted_filters"]["_checkout_downgraded"] = True

    return state
