from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.agent_node import agent_node
from .nodes.tool_executor_node import tool_executor_node
from .nodes.audit_logger import audit_logger_node
from .nodes.checkout import checkout_node
from .nodes.recovery import recovery_node
from .nodes.upsell import upsell_node

def route_after_agent(state: AgentState) -> str:
    """Route based on whether the agent invoked tools."""
    messages = state.get("messages", [])
    if messages and hasattr(messages[-1], "tool_calls") and messages[-1].tool_calls:
        return "tool_executor_node"
    return "audit_logger_node"

def route_after_tools(state: AgentState) -> str:
    """Route after tools execute. For now, go to audit logger or specific nodes if intent was set."""
    intent = state.get("intent")
    if intent == "checkout":
        return "checkout_node"
    elif intent == "fbt_upsell":
        return "upsell_node"
    elif intent in ["recovery_timeout", "recovery_funds"]:
        return "recovery_node"
    return "audit_logger_node"

def build_agent_graph():
    """Builds and compiles the LangGraph Multi-Agent Workflow."""
    workflow = StateGraph(AgentState)

    # Register Nodes
    workflow.add_node("agent_node", agent_node)
    workflow.add_node("tool_executor_node", tool_executor_node)
    workflow.add_node("checkout_node", checkout_node)
    workflow.add_node("recovery_node", recovery_node)
    workflow.add_node("upsell_node", upsell_node)
    workflow.add_node("audit_logger_node", audit_logger_node)

    # Entrypoint
    workflow.set_entry_point("agent_node")

    # Conditional Branching from Agent
    workflow.add_conditional_edges(
        "agent_node",
        route_after_agent,
        {
            "tool_executor_node": "tool_executor_node",
            "audit_logger_node": "audit_logger_node"
        }
    )

    # Conditional Branching from Tools
    workflow.add_conditional_edges(
        "tool_executor_node",
        route_after_tools,
        {
            "checkout_node": "checkout_node",
            "upsell_node": "upsell_node",
            "recovery_node": "recovery_node",
            "audit_logger_node": "audit_logger_node"
        }
    )

    # All functional nodes flow into the Audit Logger before ending
    workflow.add_edge("checkout_node", "audit_logger_node")
    workflow.add_edge("recovery_node", "audit_logger_node")
    workflow.add_edge("upsell_node", "audit_logger_node")
    workflow.add_edge("audit_logger_node", END)

    return workflow.compile()


# Global compiled agent graph singleton
agent_app = build_agent_graph()

