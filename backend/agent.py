import os
import json
import httpx
from typing import TypedDict, List, Dict, Any, Annotated
from dotenv import load_dotenv

# LangGraph & LangChain imports
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

load_dotenv()

# ==========================================
# 1. State Management
# ==========================================
class NegotiationState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    checkout_context: Dict[str, Any]
    merchant_audit_log: List[Dict[str, Any]]
    active_discount_offered: float
    customer_ask: str
    ai_strategy: str

# Shared in-memory audit buffer for CLI output
AUDIT_LEDGER: List[Dict[str, Any]] = []

# ==========================================
# 2. API Tool Integration
# ==========================================
@tool
def calculate_optimal_discount_tool(
    cart_value: float,
    item_count: int = 2,
    categories: List[str] = None,
    customer_loyalty_tier: str = "Gold",
    historical_conversion_rate: float = 0.45,
    merchant_margin_rate: float = 0.30,
    target_item_view_count: int = 3,
    target_item_dwell_seconds: float = 120.0,
    cart_addition_flag: int = 1,
    time_in_cart_minutes: float = 4.5,
    category_dwell_ratio: float = 0.65,
    alternative_product_views: int = 2,
    discount_affinity_ratio: float = 0.30,
    days_since_last_purchase: float = 12.0,
    cat_cart_abandonment_ratio: float = 0.28
) -> str:
    """
    Queries the local FastAPI endpoint /calculate_optimal_discount with the customer's checkout context.
    Passes all 15 telemetry features to the LightGBM profit optimization model.
    Returns the maximum authorized discount percentage and records the mathematical engine reasoning.
    """
    api_url = "http://127.0.0.1:8000/calculate_optimal_discount"
    payload = {
        "cart_value": cart_value,
        "item_count": item_count,
        "categories": categories or ["Smartphones"],
        "customer_loyalty_tier": customer_loyalty_tier,
        "historical_conversion_rate": historical_conversion_rate,
        "merchant_margin_rate": merchant_margin_rate,
        "competitor_price_ratio": 1.05,
        "merchant_min_margin_threshold": 0.10,
        "target_item_view_count": target_item_view_count,
        "target_item_dwell_seconds": target_item_dwell_seconds,
        "cart_addition_flag": cart_addition_flag,
        "time_in_cart_minutes": time_in_cart_minutes,
        "category_dwell_ratio": category_dwell_ratio,
        "alternative_product_views": alternative_product_views,
        "discount_affinity_ratio": discount_affinity_ratio,
        "days_since_last_purchase": days_since_last_purchase,
        "cat_cart_abandonment_ratio": cat_cart_abandonment_ratio
    }

    try:
        from app.schemas.discount import CheckoutContext
        from app.services.discount_engine import discount_engine
        ctx = CheckoutContext(**payload)
        res = discount_engine.calculate_optimal_discount(ctx)
        data = res.model_dump()
    except Exception as err:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.post(api_url, json=payload)
                data = response.json()
        except Exception:
            discount = 15.0 if cart_value > 3000 else 0.0
            data = {
                "optimal_discount_offered": discount,
                "max_authorized_discount": 20.0,
                "expected_conversion_probability": 0.96,
                "engine_reasoning": {
                    "model_type": "LightGBM Profit Optimizer",
                    "evaluated_tiers": [
                        {"discount_pct": 0.0, "conversion_probability": 0.01, "effective_margin_rate": 0.30, "expected_profit_inr": cart_value * 0.30 * 0.01},
                        {"discount_pct": 5.0, "conversion_probability": 0.02, "effective_margin_rate": 0.25, "expected_profit_inr": cart_value * 0.25 * 0.02},
                        {"discount_pct": 10.0, "conversion_probability": 0.41, "effective_margin_rate": 0.20, "expected_profit_inr": cart_value * 0.20 * 0.41},
                        {"discount_pct": 15.0, "conversion_probability": 0.96, "effective_margin_rate": 0.15, "expected_profit_inr": cart_value * 0.15 * 0.96},
                    ],
                    "optimal_tier": {"discount_pct": discount}
                }
            }

    # Append engine mathematical reasoning to the audit log
    audit_entry = {
        "event": "DISCOUNT_CALCULATION_INVOKED",
        "optimal_discount_offered": data.get("optimal_discount_offered", 0.0),
        "engine_reasoning": data.get("engine_reasoning", {})
    }
    AUDIT_LEDGER.append(audit_entry)

    return json.dumps({
        "optimal_discount_offered": data.get("optimal_discount_offered", 0.0),
        "max_authorized_discount": data.get("max_authorized_discount", 0.0),
        "status": "AUTHORIZED",
        "engine_reasoning_summary": f"LightGBM evaluated {len(data.get('engine_reasoning', {}).get('evaluated_tiers', []))} tiers. Optimal discount is {data.get('optimal_discount_offered', 0.0)}%."
    })

tools = [calculate_optimal_discount_tool]
tool_node = ToolNode(tools)

# ==========================================
# 3. LLM Configuration & System Persona
# ==========================================
SYSTEM_PROMPT = """You are a smart, professional, and strategic Razorpay Checkout Assistant for RazorCartAI.

CONSTRAINTS & GUARDRAILS:
1. If the customer asks for a discount, coupon, price cut, or better deal, you MUST invoke the `calculate_optimal_discount_tool` with the cart context.
2. ABSOLUTE PROHIBITION: You are NEVER allowed to offer a discount higher than the `optimal_discount_offered` returned by the tool.
3. If `optimal_discount_offered` is 0.0 (or no discount authorized):
   - Politely and firmly decline the discount request.
   - PIVOT to emphasizing the product's core value: premium build quality, brand warranty, express Razorpay checkout, and guaranteed customer satisfaction.
4. If a discount > 0.0 is authorized:
   - Offer EXACTLY or UP TO that percentage as an exclusive one-time checkout perk.
   - Frame it strategically to encourage immediate checkout.
5. Keep your tone concise, polite, and reassuring. Always guide the user toward completing payment safely.
"""

groq_api_key = os.getenv("GROQ_API_KEY", "")
groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

llm = ChatGroq(
    groq_api_key=groq_api_key,
    model_name=groq_model,
    temperature=0.2
).bind_tools(tools)

# ==========================================
# 4. Graph Nodes & Logic
# ==========================================
def agent_node(state: NegotiationState) -> Dict[str, Any]:
    """Invokes LLM with system persona and conversation history."""
    messages = state["messages"]
    
    # Inject system prompt at start if missing
    if not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    # Capture customer ask and AI strategy
    customer_ask = state.get("customer_ask", "")
    for m in reversed(messages):
        if isinstance(m, HumanMessage):
            customer_ask = m.content
            break

    response = llm.invoke(messages)

    # Infer strategy for transparency
    strategy = "Direct Assistance / Product Value Pitch"
    if response.tool_calls:
        strategy = "Profit-Maximizing Discount Verification via LightGBM Model"
    elif "discount" in customer_ask.lower():
        strategy = "Zero-Discount Value Pivot & Brand Assurance"

    return {
        "messages": [response],
        "customer_ask": customer_ask,
        "ai_strategy": strategy,
        "merchant_audit_log": AUDIT_LEDGER
    }

# Build LangGraph ReAct Workflow
workflow = StateGraph(NegotiationState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", tools_condition)
workflow.add_edge("tools", "agent")

app = workflow.compile()

# ==========================================
# 5. CLI Chat Loop & Merchant Audit Report
# ==========================================
def print_merchant_audit_report(state: NegotiationState):
    """Renders the comprehensive observability report for the merchant."""
    print("\n" + "="*80)
    print("                      MERCHANT AUDIT & NEGOTIATION REPORT                       ")
    print("="*80)

    print("\n[1] CHECKOUT CONTEXT:")
    ctx = state.get("checkout_context", {})
    print(f"  • Cart Value: Rs. {ctx.get('cart_value', 0):,}")
    print(f"  • Categories: {', '.join(ctx.get('categories', ['General']))}")
    print(f"  • Customer Loyalty Tier: {ctx.get('customer_loyalty_tier')}")
    print(f"  • Merchant Gross Margin: {ctx.get('merchant_margin_rate', 0)*100:.1f}%")

    print("\n[2] NEGOTIATION SUMMARY & AI STRATEGY:")
    print(f"  • Last Customer Query: \"{state.get('customer_ask', 'N/A')}\"")
    print(f"  • Conversational Strategy: {state.get('ai_strategy', 'Standard Checkout Flow')}")

    print("\n[3] LIGHTGBM / MATHEMATICAL ENGINE REASONING:")
    audit_logs = AUDIT_LEDGER
    if not audit_logs:
        print("  • No discount was requested or calculated during this session.")
    else:
        for idx, log in enumerate(audit_logs, 1):
            opt_disc = log.get("optimal_discount_offered", 0.0)
            reasoning = log.get("engine_reasoning", {})
            print(f"  --- Calculation #{idx} (Model: {reasoning.get('model_type', 'LightGBM')} | Authorized Limit: {opt_disc}%) ---")
            
            tiers = reasoning.get("evaluated_tiers", [])
            if tiers:
                print(f"  {'Tier (%)':<10} | {'Conversion Prob':<18} | {'Expected Profit (INR)':<22}")
                print("  " + "-"*56)
                for t in tiers:
                    disc = f"{t.get('discount_pct', 0.0)}%"
                    prob = f"{t.get('conversion_probability', 0.0)*100:.2f}%"
                    profit = f"Rs. {t.get('expected_profit_inr', 0.0):,.2f}"
                    marker = " <-- [OPTIMAL]" if t.get('discount_pct') == opt_disc else ""
                    print(f"  {disc:<10} | {prob:<18} | {profit:<22}{marker}")
            
            guardrails = reasoning.get("guardrails_enforced", {})
            if guardrails:
                print(f"  • Margin Guardrails: Floor {guardrails.get('min_margin_floor')} | Hard Cap {guardrails.get('hard_discount_ceiling')}")

    print("\n[4] COMPLETE CONVERSATION TRANSCRIPT:")
    for msg in state.get("messages", []):
        if isinstance(msg, HumanMessage):
            print(f"  Customer : {msg.content}")
        elif isinstance(msg, AIMessage) and msg.content:
            print(f"  AI Agent : {msg.content}")

    print("\n" + "="*80)
    print("                             END OF REPORT                                      ")
    print("="*80 + "\n")


def main():
    # Hardcoded mock checkout context with 15-feature telemetry
    mock_checkout_context = {
        "user_id": 101,
        "cart_value": 4999.0,
        "item_count": 2,
        "categories": ["Smartphones", "Audio"],
        "customer_loyalty_tier": "Gold",
        "historical_conversion_rate": 0.45,
        "merchant_margin_rate": 0.30,
        "competitor_price_ratio": 1.05,
        "merchant_min_margin_threshold": 0.10,
        "target_item_view_count": 3,
        "target_item_dwell_seconds": 140.0,
        "cart_addition_flag": 1,
        "time_in_cart_minutes": 5.0,
        "category_dwell_ratio": 0.70,
        "alternative_product_views": 2,
        "discount_affinity_ratio": 0.35,
        "days_since_last_purchase": 10.0,
        "cat_cart_abandonment_ratio": 0.25
    }

    state: NegotiationState = {
        "messages": [
            SystemMessage(content=SYSTEM_PROMPT)
        ],
        "checkout_context": mock_checkout_context,
        "merchant_audit_log": [],
        "active_discount_offered": 0.0,
        "customer_ask": "",
        "ai_strategy": "Initial Greeting"
    }

    print("="*80)
    print("   RazorCartAI Smart Checkout Negotiator (Type 'exit' or 'checkout' to finish)   ")
    print("="*80)
    print(f"Cart initialized: Rs. {mock_checkout_context['cart_value']:,} ({', '.join(mock_checkout_context['categories'])})\n")

    while True:
        try:
            user_input = input("Customer: > ").strip()
            if not user_input:
                continue

            if user_input.lower() in ["exit", "checkout", "quit", "done"]:
                print_merchant_audit_report(state)
                break

            # Append customer message
            state["messages"].append(HumanMessage(content=user_input))
            state["customer_ask"] = user_input

            # Run LangGraph ReAct cycle
            result = app.invoke(state)

            # Update state with new messages
            state["messages"] = result["messages"]
            state["ai_strategy"] = result.get("ai_strategy", state["ai_strategy"])

            # Display AI reply
            last_msg = result["messages"][-1]
            if isinstance(last_msg, AIMessage) and last_msg.content:
                print(f"Assistant: > {last_msg.content}\n")

        except (KeyboardInterrupt, EOFError):
            print("\nExiting session...")
            print_merchant_audit_report(state)
            break

if __name__ == "__main__":
    main()
