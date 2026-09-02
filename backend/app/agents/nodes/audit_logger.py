import json
from ..state import AgentState
from ...database import SessionLocal
from ...models.audit_ledger import AuditLedger

def audit_logger_node(state: AgentState) -> AgentState:
    """Logs the multi-agent decision, financial impacts, ratings impact, and reasoning into the Audit Ledger."""
    db = SessionLocal()
    try:
        intent = state.get("intent", "discovery")
        agent_type_map = {
            "discovery": "DiscoveryAgent",
            "fbt_upsell": "UpsellAgent",
            "checkout": "CheckoutAgent",
            "recovery_timeout": "RecoveryAgent",
            "recovery_funds": "NegotiationAgent",
            "general": "ShoppingCopilot"
        }
        agent_type = agent_type_map.get(intent, "ShoppingCopilot")

        action_type_map = {
            "discovery": "SEARCH_RANKED",
            "fbt_upsell": "FBT_COMPLEMENT_PITCHED",
            "checkout": "PAYMENT_INITIATED",
            "recovery_timeout": "TIMEOUT_UPI_FALLBACK",
            "recovery_funds": "CART_NEGOTIATED_PRUNED",
            "general": "GENERAL_INQUIRY"
        }
        action_type = action_type_map.get(intent, "GENERAL_ASSIST")

        payment_status = None
        if intent == "checkout":
            payment_status = "INITIALIZED"
        elif intent == "recovery_timeout":
            payment_status = "TIMEOUT_RECOVERED"
        elif intent == "recovery_funds":
            payment_status = "DECLINE_RESOLVED"

        metadata = {
            "extracted_filters": state.get("extracted_filters", {}),
            "suggested_actions": state.get("suggested_actions", []),
            "products_count": len(state.get("products", [])),
            "fbt_count": len(state.get("fbt_products", [])),
            "simulation_flag": state.get("simulation_flag")
        }

        entry = AuditLedger(
            merchant_id=state.get("merchant_id", "merch_001"),
            agent_type=agent_type,
            action_type=action_type,
            user_id=state.get("user_id"),
            user_city=state.get("user_city"),
            input_query=state.get("user_message"),
            decision_reasoning=state.get("audit_reasoning", "Agent evaluated context and produced optimal response."),
            rating_review_impact=state.get("rating_review_impact"),
            payment_status=payment_status,
            money_amount=state.get("money_amount", 0.0),
            profit_impact=state.get("profit_impact", 0.0),
            profit_from_ai=round(state.get("profit_impact", 0.0) * 0.2, 2),  # 20% AI attribution
            metadata_json=json.dumps(metadata)
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        state["audit_id"] = entry.id
    except Exception as e:
        print(f"[Audit Logger Node Error]: {e}")
    finally:
        db.close()

    return state
