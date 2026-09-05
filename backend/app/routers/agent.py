import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.agent import AgentChatRequest, AgentChatResponse
from ..agents.graph import agent_app
from ..agents.state import AgentState

router = APIRouter(prefix="/api/agent", tags=["Agentic Copilot"])

# Default merchant for audit tagging when no merchant context is provided
DEFAULT_MERCHANT_ID = "merch_001"

@router.post("/chat", response_model=AgentChatResponse)
def agent_chat(req: AgentChatRequest, db: Session = Depends(get_db)):
    """
    Executes the LangGraph Multi-Agent Engine.
    Audit entries are tagged with the active merchant's merchant_id.
    """
    # Track search history for customer users
    if req.user_id:
        user = db.query(User).filter(User.id == req.user_id).first()
        if user and user.role == "customer":
            try:
                hist = json.loads(user.search_history or "[]")
                if req.message not in hist:
                    hist.append(req.message)
                    user.search_history = json.dumps(hist[-10:])
                    db.commit()
            except Exception:
                pass

    # Determine merchant_id to tag audit entries
    merchant_id = req.merchant_id or DEFAULT_MERCHANT_ID

    initial_state: AgentState = {
        "user_message": req.message,
        "user_id": req.user_id or 1,
        "user_city": req.user_city or "Bengaluru",
        "session_id": req.session_id or "default",
        "current_cart_ids": req.current_cart_ids or [],
        "simulation_flag": req.simulation_flag,
        "merchant_id": merchant_id,
        "chat_history": req.chat_history or [],
        "previous_products": req.previous_products or [],
        "voice_mode": req.voice_mode or False,
        "intent": "discovery",
        "extracted_filters": {},
        "search_query": req.message,
        "products": [],
        "fbt_products": [],
        "checkout_data": None,
        "recovery_data": None,
        "focus_list": [],
        "reference_reason": None,
        "cart_snapshot": None,
        "orders_snapshot": None,
        "action_result": None,
        "pending_confirmation": None,
        "client_action": None,
        "reply": "",
        "suggested_actions": [],
        "audit_reasoning": "",
        "rating_review_impact": None,
        "money_amount": 0.0,
        "profit_impact": 0.0,
        "audit_id": None
    }

    final_state = agent_app.invoke(initial_state)

    return AgentChatResponse(
        reply=final_state.get("reply", "I am here to help you discover the highest rated products."),
        intent=final_state.get("intent", "discovery"),
        products=final_state.get("products", []),
        fbt_products=final_state.get("fbt_products", []),
        checkout_data=final_state.get("checkout_data"),
        recovery_data=final_state.get("recovery_data"),
        audit_id=final_state.get("audit_id"),
        suggested_actions=final_state.get("suggested_actions", []),
        focus_list=final_state.get("focus_list") or [],
        reference_reason=final_state.get("reference_reason"),
        cart_snapshot=final_state.get("cart_snapshot"),
        orders_snapshot=final_state.get("orders_snapshot"),
        action_result=final_state.get("action_result"),
        pending_confirmation=final_state.get("pending_confirmation"),
        client_action=final_state.get("client_action")
    )
