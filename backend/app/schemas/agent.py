from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from .product import ProductResponse

class AgentChatRequest(BaseModel):
    message: str
    user_id: Optional[int] = None
    user_city: Optional[str] = "Bengaluru"
    session_id: Optional[str] = "default"
    current_cart_ids: Optional[List[int]] = []
    simulation_flag: Optional[str] = None  # None, "SIMULATE_TIMEOUT", "SIMULATE_INSUFFICIENT_FUNDS"
    merchant_id: Optional[str] = None      # tags audit entries to the correct merchant
    chat_history: Optional[List[Dict[str, Any]]] = []
    previous_products: Optional[List[Dict[str, Any]]] = []

class AgentChatResponse(BaseModel):
    reply: str
    intent: str # discovery, fbt_upsell, checkout, recovery_timeout, recovery_funds, general,
                # view_cart, view_orders, cart_add, cart_update_qty, cart_remove,
                # cart_clear, open_item, confirm, deny
    products: List[ProductResponse] = []
    fbt_products: List[ProductResponse] = []
    checkout_data: Optional[Dict[str, Any]] = None
    recovery_data: Optional[Dict[str, Any]] = None
    audit_id: Optional[int] = None
    suggested_actions: List[str] = []

    # ── Conversational cart / order operations ───────────────────────────────
    #: The numbered list this reply rendered, with the ordinal the user sees.
    #: Returned so the client can highlight what "the 2nd one" will refer to.
    focus_list: List[Dict[str, Any]] = []
    #: Why the agent believed the user meant this item -- surfaced in the UI, not
    #: just the ledger, so a wrong resolution is visible before it compounds.
    reference_reason: Optional[str] = None
    cart_snapshot: Optional[Dict[str, Any]] = None
    orders_snapshot: Optional[List[Dict[str, Any]]] = None
    #: What changed, if anything: {action, product_id, quantity_before/after, ...}
    action_result: Optional[Dict[str, Any]] = None
    #: A spend awaiting an explicit yes. Its presence is what makes the action
    #: gated rather than assumed -- the client renders confirm/cancel buttons.
    pending_confirmation: Optional[Dict[str, Any]] = None
    #: Client-side instruction, e.g. {"type": "navigate", "path": "/product/12"}.
    #: The server resolves "open the first one"; only the browser can route.
    client_action: Optional[Dict[str, Any]] = None
