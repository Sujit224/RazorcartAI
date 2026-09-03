import json
import re
from typing import Dict, Any, List
from ..state import AgentState
from ..groq_llm import groq_llm
from ..commands import parse_command
from ..reference import get_pending

ROUTER_SYSTEM_PROMPT = """You are RazorCartAI's Master Intent & Attribute Extraction Engine.
Analyze the user's shopping message (and conversation history) and output a clean JSON object with this EXACT structure:
{
  "intent": "discovery" | "fbt_upsell" | "checkout" | "recovery_timeout" | "recovery_funds" | "general",
  "filters": {
    "brand": string | null,
    "gender": "Men" | "Women" | "Unisex" | null,
    "category": string | null,
    "color": string | null,
    "max_price": number | null,
    "min_rating": number | null,
    "spec_keywords": ["attribute1", "attribute2", ...]
  },
  "search_query": "concise semantic search terms",
  "conversational_reply": "friendly summary of what you are searching for"
}

Extraction guidelines across ALL product domains (Electronics, Fashion, Home, Kitchen, Appliances, Footwear, Sports):
- "brand": Extract explicit brand names (e.g. Nike, Apple, Samsung, Puma, Adidas, Nokia, Dyson, Philips, OnePlus, Sony, Levi's, etc.) or null.
- "category": Extract product category/department if mentioned or implied (e.g. Footwear, Electronics, Topwear, Bottomwear, Appliances, Home, Kitchen, Beauty, etc.) or null.
- "color": Extract color name or null.
- "max_price": Extract numeric maximum price if user mentions "under 50000", "below 4000", "within 2k", etc.
- "min_rating": Extract minimum rating if user asks for "best rated", "top rated", "4.5 star", etc.
- "spec_keywords": Extract key technical, material, or use-case specifications (e.g. ["64gb", "snapdragon"], ["running", "cushioned"], ["cotton", "oversized"], ["leather", "waterproof"], ["inverter", "5 star"], etc.).
- "search_query": Cleaned semantic terms without price filler words (e.g. "mobiles under 50000" -> "mobiles smartphone", "pink running shoes under 4k" -> "pink running shoes").

Intent rules:
- "checkout" means ONLY that the user explicitly wants to pay for items in their bag: "checkout", "pay now", "place order".
- Searching or browsing is ALWAYS "discovery".

Do not return anything outside the JSON.
"""

_PAY_VERB = re.compile(
    r"\b(?:checkout|check\s+out|pay|paying|payment|proceed|buy\s+now|purchase\s+now"
    r"|place\s+(?:my\s+|the\s+)?order|complete\s+(?:my\s+|the\s+)?(?:order|purchase)"
    r"|razorpay|upi|card|netbanking)\b",
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
    command = parse_command(msg, has_pending=bool(get_pending(session_id)))
    if command is not None:
        state["intent"] = command.intent
        state["search_query"] = msg
        state["extracted_filters"] = {
            "_command": command,
            "_pattern": command.pattern,
            **command.slots,
        }
        print(f"[Router Node] deterministic match: {command.intent} via {command.pattern}")
        return state

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

    # Guard the money intent
    if state["intent"] == "checkout" and not _PAY_VERB.search(msg):
        state["intent"] = "discovery"
        state["extracted_filters"] = dict(state.get("extracted_filters") or {})
        state["extracted_filters"]["_checkout_downgraded"] = True

    return state
