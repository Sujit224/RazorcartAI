from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    user_message: str
    user_id: Optional[int]
    user_city: Optional[str]
    session_id: str
    current_cart_ids: List[int]
    simulation_flag: Optional[str] # "SIMULATE_TIMEOUT", "SIMULATE_INSUFFICIENT_FUNDS", None
    merchant_id: Optional[str]      # used to tag all audit ledger entries to the correct merchant

    # Extracted by Router Node
    intent: str # discovery, fbt_upsell, checkout, recovery_timeout, recovery_funds, general,
                # view_cart, view_orders, cart_add, cart_update_qty, cart_remove,
                # cart_clear, open_item, confirm, deny
    extracted_filters: Dict[str, Any]
    search_query: str

    # Output products
    products: List[Dict[str, Any]]
    fbt_products: List[Dict[str, Any]]

    # Checkout & Payment recovery payloads
    checkout_data: Optional[Dict[str, Any]]
    recovery_data: Optional[Dict[str, Any]]

    # ── Conversational cart / order operations ───────────────────────────────
    # `focus_list` is the numbered list this turn displayed, echoed back so the
    # next turn's "the 2nd one" has something to resolve against.  It is written
    # by every node that shows the user a list (see agents/reference.py).
    focus_list: List[Dict[str, Any]]
    # How the referring expression in this turn was resolved, verbatim into the
    # audit ledger -- the answer to "why did the agent touch that item".
    reference_reason: Optional[str]
    cart_snapshot: Optional[Dict[str, Any]]      # items, subtotal, shipping, total
    orders_snapshot: Optional[List[Dict[str, Any]]]
    # Result of a mutation: {action, product_id, quantity, delta, ...}
    action_result: Optional[Dict[str, Any]]
    # A spend that needs an explicit yes before it executes.  Presence of this
    # field in the response is what makes the action *gated* rather than assumed.
    pending_confirmation: Optional[Dict[str, Any]]
    # Instruction for the browser, e.g. navigating to a product page. The server
    # cannot route the SPA, so "open the first one" is resolved here and executed
    # by the client.
    client_action: Optional[Dict[str, Any]]

    # Response & Audit
    reply: str
    suggested_actions: List[str]
    audit_reasoning: str
    rating_review_impact: Optional[str]
    money_amount: float
    profit_impact: float
    audit_id: Optional[int]
