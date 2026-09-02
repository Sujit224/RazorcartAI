from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime
from ..database import Base

class AuditLedger(Base):
    __tablename__ = "audit_ledger"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Who & where
    merchant_id = Column(String(50), nullable=True, index=True)   # Tags every entry to a merchant
    user_id = Column(Integer, nullable=True)
    user_city = Column(String(100), nullable=True)

    # What the agent did
    agent_type = Column(String(50), nullable=False)   # DiscoveryAgent, UpsellAgent, CheckoutAgent, RecoveryAgent
    action_type = Column(String(100), nullable=False)  # SEARCH_RANKED, FBT_COMPLEMENT_PITCHED, PAYMENT_INITIATED, TIMEOUT_UPI_FALLBACK, CART_NEGOTIATED_PRUNED

    # Context
    input_query = Column(Text, nullable=True)
    decision_reasoning = Column(Text, nullable=False)
    rating_review_impact = Column(Text, nullable=True)

    # Payment & money
    payment_status = Column(String(50), nullable=True)  # SUCCESS, TIMEOUT_RECOVERED, DECLINE_RESOLVED, INITIALIZED
    money_amount = Column(Float, default=0.0)            # Total transaction value in INR
    profit_impact = Column(Float, default=0.0)           # Revenue saved or generated (base)
    profit_from_ai = Column(Float, default=0.0)          # Portion of profit explicitly attributed to AI agent actions

    metadata_json = Column(Text, default="{}")
