from typing import List, Optional
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from ..database import get_db
from ..models.audit_ledger import AuditLedger
from ..models.user import User
from ..routers.auth import require_merchant


router = APIRouter(prefix="/api/merchant", tags=["Merchant Portal"])


def _audit_to_dict(row: AuditLedger) -> dict:
    return {
        "id": row.id,
        "timestamp": row.timestamp.isoformat(),
        "agent_type": row.agent_type,
        "action_type": row.action_type,
        "user_id": row.user_id,
        "user_city": row.user_city,
        "input_query": row.input_query,
        "decision_reasoning": row.decision_reasoning,
        "rating_review_impact": row.rating_review_impact,
        "payment_status": row.payment_status,
        "money_amount": row.money_amount,
        "profit_impact": row.profit_impact,
        "profit_from_ai": row.profit_from_ai,
    }


@router.get("/dashboard")
def get_merchant_dashboard(
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """Merchant's own summary: total revenue, AI profit, recoveries, today stats."""
    mid = current_user.merchant_id

    base_q = db.query(AuditLedger).filter(AuditLedger.merchant_id == mid)

    total_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.merchant_id == mid,
        AuditLedger.payment_status == "SUCCESS"
    ).scalar() or 0.0

    total_ai_profit = db.query(func.sum(AuditLedger.profit_from_ai)).filter(
        AuditLedger.merchant_id == mid
    ).scalar() or 0.0

    total_profit_impact = db.query(func.sum(AuditLedger.profit_impact)).filter(
        AuditLedger.merchant_id == mid
    ).scalar() or 0.0

    recoveries = base_q.filter(
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).count()

    total_transactions = base_q.count()

    # Today stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.merchant_id == mid,
        AuditLedger.payment_status == "SUCCESS",
        AuditLedger.timestamp >= today_start
    ).scalar() or 0.0

    today_ai_profit = db.query(func.sum(AuditLedger.profit_from_ai)).filter(
        AuditLedger.merchant_id == mid,
        AuditLedger.timestamp >= today_start
    ).scalar() or 0.0

    return {
        "merchant_id": mid,
        "merchant_name": current_user.merchant_name,
        "total_revenue": round(total_revenue, 2),
        "total_ai_profit": round(total_ai_profit, 2),
        "total_profit_impact": round(total_profit_impact, 2),
        "total_recoveries": recoveries,
        "total_transactions": total_transactions,
        "today_revenue": round(today_revenue, 2),
        "today_ai_profit": round(today_ai_profit, 2),
    }


@router.get("/transactions")
def get_merchant_transactions(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """Paginated transaction log for the merchant's own audit entries."""
    mid = current_user.merchant_id
    offset = (page - 1) * per_page

    total = db.query(AuditLedger).filter(AuditLedger.merchant_id == mid).count()
    rows = (
        db.query(AuditLedger)
        .filter(AuditLedger.merchant_id == mid)
        .order_by(AuditLedger.timestamp.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "transactions": [_audit_to_dict(r) for r in rows],
    }


@router.get("/daily-chart")
def get_merchant_daily_chart(
    days: int = 30,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """Daily revenue vs AI profit for the last N days (for chart rendering)."""
    mid = current_user.merchant_id
    since = datetime.utcnow() - timedelta(days=days)

    rows = db.execute(text("""
        SELECT strftime('%Y-%m-%d', timestamp) as day,
               SUM(money_amount) as revenue,
               SUM(profit_from_ai) as ai_profit
        FROM audit_ledger
        WHERE merchant_id = :mid AND timestamp >= :since
        GROUP BY strftime('%Y-%m-%d', timestamp)
        ORDER BY day
    """), {"mid": mid, "since": since.isoformat()}).fetchall()

    return [
        {
            "date": r[0],
            "revenue": round(r[1] or 0, 2),
            "ai_profit": round(r[2] or 0, 2),
        }
        for r in rows
    ]
