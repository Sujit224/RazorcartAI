import json
import re
from ..state import AgentState
from ..groq_llm import groq_llm
from ..commands import parse_command
from ..reference import get_pending

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

Intent rules:
- "checkout" means ONLY that the user wants to pay for what is already in their
  bag: "checkout", "pay now", "place my order", "complete my purchase".
- Wanting to FIND or ADD something is "discovery", never "checkout". "Add running
  shoes to my bag" and "put a laptop in my cart" are discovery: the user is
  telling you what to look for. Initiating a payment for a search would charge
  someone for something they never chose.

Do not return anything outside the JSON.
"""

#: A payment is initiated only when the user actually asked to pay.
#:
#: The LLM router is a classifier, not an authority.  It reliably reads "add
#: running shoes to my bag" as `checkout` -- verified against the live model --
#: and the checkout node then creates a real Razorpay order off what was plainly
#: a product search.  Requiring one of these verbs makes the money intent
#: checkable against the user's own words instead of trusted from a guess, which
#: is the difference between a gated money action and an accident.
_PAY_VERB = re.compile(
    r"\b(?:checkout|check\s+out|pay|paying|payment|proceed|buy\s+now|purchase\s+now"
    r"|place\s+(?:my\s+|the\s+)?order|complete\s+(?:my\s+|the\s+)?(?:order|purchase)"
    r"|razorpay|upi|card|netbanking)\b",
    re.I,
)

def router_node(state: AgentState) -> AgentState:
    """
    Classify the turn.

    Two routers in sequence, cheapest and most certain first:

      1. A **deterministic grammar** (`agents/commands.py`) for cart and order
         operations.  These are a closed verb set over a list the agent itself
         rendered, so a regex is both more reliable and free.  When it fires, no
         LLM call is made at all.
      2. The **LLM** for everything open-ended -- product discovery, which
         genuinely needs language understanding.

    The order matters.  "Increase the quantity" sent to the LLM comes back as a
    product search, which reads to the user as the agent ignoring them.
    """
    msg = state.get("user_message", "")
    sim_flag = state.get("simulation_flag")
    session_id = state.get("session_id") or "default"

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

    # ── Deterministic pass ──────────────────────────────────────────────────
    # `has_pending` gates the yes/no rules: a bare "yes" only means consent when
    # something is actually waiting on it.
    command = parse_command(msg, has_pending=bool(get_pending(session_id)))
    if command is not None:
        state["intent"] = command.intent
        state["search_query"] = msg
        # `_command` rides along in the filters dict so cart_ops_node can read
        # qty_mode/qty_value without a second parse.  The leading underscore
        # keeps it out of anything that treats filters as SQL predicates.
        state["extracted_filters"] = {
            "_command": command,
            "_pattern": command.pattern,
            **command.slots,
        }
        print("[Router Node] deterministic match: %s via %s"
              % (command.intent, command.pattern))
        return state

    # ── LLM pass ────────────────────────────────────────────────────────────
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

    # ── Guard the money intent ──────────────────────────────────────────────
    # Downgrade an unsupported `checkout` rather than acting on it.  Discovery is
    # the safe reading of an ambiguous shopping message: it shows the user
    # products instead of charging them, and if they did mean to pay, "checkout"
    # in the next turn works.  The reverse mistake is not recoverable that
    # cheaply.
    if state["intent"] == "checkout" and not _PAY_VERB.search(msg):
        print("[Router Node] downgraded checkout -> discovery: no payment verb in %r" % msg)
        state["intent"] = "discovery"
        state["extracted_filters"] = dict(state.get("extracted_filters") or {})
        state["extracted_filters"]["_checkout_downgraded"] = True

    return state
