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

class AgentChatResponse(BaseModel):
    reply: str
    intent: str # discovery, fbt_upsell, checkout, recovery_timeout, recovery_funds, general
    products: List[ProductResponse] = []
    fbt_products: List[ProductResponse] = []
    checkout_data: Optional[Dict[str, Any]] = None
    recovery_data: Optional[Dict[str, Any]] = None
    audit_id: Optional[int] = None
    suggested_actions: List[str] = []
