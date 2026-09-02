from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class AuditLedgerResponse(BaseModel):
    id: int
    timestamp: datetime
    agent_type: str
    action_type: str
    user_id: Optional[int]
    user_city: Optional[str]
    input_query: Optional[str]
    decision_reasoning: str
    rating_review_impact: Optional[str]
    payment_status: Optional[str]
    money_amount: float
    profit_impact: float
    metadata_json: Optional[str]

    class Config:
        from_attributes = True

class AuditSummaryStats(BaseModel):
    total_revenue_generated: float
    total_actions_logged: int
    successful_recoveries_count: int
    recovered_revenue: float
    high_rating_conversions_count: int
