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
            "general": "ShoppingCopilot",
            # Conversational cart/order operations
            "view_cart": "CartAgent",
            "view_orders": "OrderHistoryAgent",
            "cart_add": "CartAgent",
            "cart_update_qty": "CartAgent",
            "cart_remove": "CartAgent",
            "cart_clear": "CartAgent",
            "open_item": "ShoppingCopilot",
            "confirm": "CartAgent",
            "deny": "CartAgent",
        }
        agent_type = agent_type_map.get(intent, "ShoppingCopilot")

        action_type_map = {
            "discovery": "SEARCH_RANKED",
            "fbt_upsell": "FBT_COMPLEMENT_PITCHED",
            "checkout": "PAYMENT_INITIATED",
            "recovery_timeout": "TIMEOUT_UPI_FALLBACK",
            "recovery_funds": "CART_NEGOTIATED_PRUNED",
            "general": "GENERAL_INQUIRY",
            "view_cart": "CART_VIEWED",
            "view_orders": "ORDER_HISTORY_VIEWED",
            "cart_add": "CART_ITEM_ADDED",
            "cart_update_qty": "CART_QUANTITY_CHANGED",
            "cart_remove": "CART_ITEM_REMOVED",
            "cart_clear": "CART_CLEARED",
            "open_item": "PRODUCT_OPENED",
            "confirm": "GATED_ACTION_CONFIRMED",
            "deny": "GATED_ACTION_DECLINED",
        }
        action_type = action_type_map.get(intent, "GENERAL_ASSIST")

        # A mutation that stopped at the gate is recorded as *held*, and one the
        # agent refused as *declined*.  The ledger has to distinguish "asked and
        # waiting" and "would not act" from "executed" -- otherwise a row reading
        # CART_ITEM_REMOVED cannot be trusted to mean anything was removed.
        action_result = state.get("action_result") or {}
        if state.get("pending_confirmation"):
            action_type = action_type + "_HELD_FOR_APPROVAL"
        elif action_result.get("executed") is False:
            action_type = action_type + "_DECLINED"

        payment_status = None
        if intent == "checkout":
            payment_status = "INITIALIZED"
        elif intent == "recovery_timeout":
            payment_status = "TIMEOUT_RECOVERED"
        elif intent == "recovery_funds":
            payment_status = "DECLINE_RESOLVED"

        cart_snapshot = state.get("cart_snapshot") or {}
        extracted = state.get("extracted_filters") or {}
        #: Underscore-prefixed keys are internal, and most are noise in the
        #: ledger -- except these two.  `_pattern` names the grammar rule that
        #: fired, and `_checkout_downgraded` records that the agent refused to
        #: start a payment the LLM had proposed.  Both are the reasoning behind a
        #: money decision, which is the whole point of the row.  `_command` holds
        #: a dataclass and is dropped so the row stays JSON-serialisable.
        _KEEP_INTERNAL = ("_pattern", "_checkout_downgraded")
        metadata = {
            "extracted_filters": {
                k: v for k, v in extracted.items()
                if not k.startswith("_") or k in _KEEP_INTERNAL
            },
            "suggested_actions": state.get("suggested_actions", []),
            "products_count": len(state.get("products", [])),
            "fbt_count": len(state.get("fbt_products", [])),
            "simulation_flag": state.get("simulation_flag"),
            # ── Conversational operations ────────────────────────────────────
            # `reference_reason` is the answer to "why did the agent touch THAT
            # item"; `action_result` is what actually changed; `focus_list` is
            # what the user could see when they said it.  Together they make a
            # cart mutation reconstructible after the fact.
            "reference_reason": state.get("reference_reason"),
            "action_result": state.get("action_result"),
            "pending_confirmation": state.get("pending_confirmation"),
            "focus_list": state.get("focus_list", []),
            "cart_value_after": cart_snapshot.get("total"),
            "cart_item_count_after": cart_snapshot.get("item_count"),
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
            # default=str so an unexpected object in the metadata degrades to its
            # repr instead of losing the whole ledger row to a TypeError.
            metadata_json=json.dumps(metadata, default=str)
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
