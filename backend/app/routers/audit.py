from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.audit_ledger import AuditLedger
from ..schemas.audit import AuditLedgerResponse, AuditSummaryStats

router = APIRouter(prefix="/api/audit", tags=["Merchant Audit Ledger"])

@router.get("/ledger", response_model=List[AuditLedgerResponse])
def get_audit_ledger(
    limit: int = 50,
    agent_type: Optional[str] = None,
    action_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves immutable agent action logs for merchant dashboard auditing."""
    q = db.query(AuditLedger).order_by(AuditLedger.timestamp.desc())
    if agent_type:
        q = q.filter(AuditLedger.agent_type == agent_type)
    if action_type:
        q = q.filter(AuditLedger.action_type == action_type)
    return q.limit(limit).all()

@router.get("/stats", response_model=AuditSummaryStats)
def get_audit_stats(db: Session = Depends(get_db)):
    """Summary metrics of agentic revenue growth and recovery impact."""
    total_actions = db.query(AuditLedger).count()
    
    total_rev = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.payment_status.in_(["SUCCESS", "INITIALIZED", "TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).scalar() or 0.0

    recovered_count = db.query(AuditLedger).filter(
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).count()

    recovered_rev = db.query(func.sum(AuditLedger.profit_impact)).filter(
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).scalar() or 0.0

    high_rating_count = db.query(AuditLedger).filter(
        AuditLedger.rating_review_impact != None
    ).count()

    return AuditSummaryStats(
        total_revenue_generated=round(float(total_rev), 2),
        total_actions_logged=total_actions,
        successful_recoveries_count=recovered_count,
        recovered_revenue=round(float(recovered_rev), 2),
        high_rating_conversions_count=high_rating_count
    )
