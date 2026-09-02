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
    intent: str # discovery, fbt_upsell, checkout, recovery_timeout, recovery_funds, general
    extracted_filters: Dict[str, Any]
    search_query: str

    # Output products
    products: List[Dict[str, Any]]
    fbt_products: List[Dict[str, Any]]

    # Checkout & Payment recovery payloads
    checkout_data: Optional[Dict[str, Any]]
    recovery_data: Optional[Dict[str, Any]]

    # Response & Audit
    reply: str
    suggested_actions: List[str]
    audit_reasoning: str
    rating_review_impact: Optional[str]
    money_amount: float
    profit_impact: float
    audit_id: Optional[int]
