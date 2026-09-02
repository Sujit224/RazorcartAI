import os
import sys

# Set standard output encoding for utf-8 on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.database import Base, engine, SessionLocal
from app.services.seed_data import seed_database
from app.agents.graph import agent_app
from app.agents.state import AgentState

def run_test():
    print("Testing DB initialization and seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    print("Testing LangGraph agent execution...")
    initial_state = {
        "user_message": "pink running shoes under 4000",
        "user_id": 1,
        "user_city": "Bengaluru",
        "session_id": "test_session",
        "current_cart_ids": [],
        "simulation_flag": None,
        "intent": "discovery",
        "extracted_filters": {},
        "search_query": "pink running shoes",
        "products": [],
        "fbt_products": [],
        "checkout_data": None,
        "recovery_data": None,
        "reply": "",
        "suggested_actions": [],
        "audit_reasoning": "",
        "rating_review_impact": None,
        "money_amount": 0.0,
        "profit_impact": 0.0,
        "audit_id": None
    }
    
    result = agent_app.invoke(initial_state)
    print("Test Agent Response:", result.get("reply"))
    print("Products returned count:", len(result.get("products", [])))
    print("Audit ID logged:", result.get("audit_id"))
    print("Pipeline test SUCCESSFUL!")

if __name__ == "__main__":
    run_test()
