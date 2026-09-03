from langgraph.graph import StateGraph, END
from .state import AgentState
from .commands import CART_OPS_INTENTS
from .nodes.router import router_node
from .nodes.discovery import discovery_node
from .nodes.upsell import upsell_node
from .nodes.checkout import checkout_node
from .nodes.recovery import recovery_node
from .nodes.cart_ops import cart_ops_node
from .nodes.audit_logger import audit_logger_node

def route_next_node(state: AgentState) -> str:
    """Conditional edge router based on intent."""
    intent = state.get("intent", "discovery")
    # Cart/order operations are membership-tested against the set commands.py
    # owns, so a new verb is wired up by adding it there and nowhere else.
    if intent in CART_OPS_INTENTS:
        return "cart_ops_node"
    if intent == "discovery":
        return "discovery_node"
    elif intent == "fbt_upsell":
        return "upsell_node"
    elif intent == "checkout":
        return "checkout_node"
    elif intent in ["recovery_timeout", "recovery_funds"]:
        return "recovery_node"
    else:
        return "discovery_node"


def build_agent_graph():
    """Builds and compiles the LangGraph Multi-Agent Workflow."""
    workflow = StateGraph(AgentState)

    # Register Nodes
    workflow.add_node("router_node", router_node)
    workflow.add_node("discovery_node", discovery_node)
    workflow.add_node("upsell_node", upsell_node)
    workflow.add_node("checkout_node", checkout_node)
    workflow.add_node("recovery_node", recovery_node)
    workflow.add_node("cart_ops_node", cart_ops_node)
    workflow.add_node("audit_logger_node", audit_logger_node)

    # Entrypoint
    workflow.set_entry_point("router_node")

    # Conditional Branching from Router
    workflow.add_conditional_edges(
        "router_node",
        route_next_node,
        {
            "discovery_node": "discovery_node",
            "upsell_node": "upsell_node",
            "checkout_node": "checkout_node",
            "recovery_node": "recovery_node",
            "cart_ops_node": "cart_ops_node"
        }
    )

    # All functional nodes flow into the Audit Logger before ending
    workflow.add_edge("discovery_node", "audit_logger_node")
    workflow.add_edge("upsell_node", "audit_logger_node")
    workflow.add_edge("checkout_node", "audit_logger_node")
    workflow.add_edge("recovery_node", "audit_logger_node")
    workflow.add_edge("cart_ops_node", "audit_logger_node")
    workflow.add_edge("audit_logger_node", END)

    return workflow.compile()


# Global compiled agent graph singleton
agent_app = build_agent_graph()
