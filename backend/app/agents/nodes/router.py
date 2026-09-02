import json
from ..state import AgentState
from ..groq_llm import groq_llm

ROUTER_SYSTEM_PROMPT = """You are RazorCartAI's Master Intent & Filter Extraction Engine.
Analyze the user's shopping message and output a clean JSON object with this EXACT structure:
{
  "intent": "discovery" | "fbt_upsell" | "checkout" | "recovery_timeout" | "recovery_funds" | "general",
  "filters": {
    "brand": "Nike" | "Adidas" | "Puma" | "Levi's" | "Roadster" | null,
    "gender": "Men" | "Women" | "Unisex" | null,
    "category": "Footwear" | "Topwear" | "Bottomwear" | "Accessories" | null,
    "color": "Pink" | "Black" | "White" | "Coral" | "Blue" | null,
    "max_price": number | null,
    "min_rating": number | null
  },
  "search_query": "concise query text for vector search",
  "conversational_reply": "friendly summary of what you are searching for, mentioning ratings"
}
Do not return anything outside the JSON.
"""

def router_node(state: AgentState) -> AgentState:
    """Route user intent and extract filters using Groq LLM."""
    msg = state.get("user_message", "")
    sim_flag = state.get("simulation_flag")

    # If demo simulation flag is active, override intent
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

    # Invoke Groq
    raw_response = groq_llm.invoke_chat(
        system_prompt=ROUTER_SYSTEM_PROMPT,
        user_message=msg,
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

    return state
