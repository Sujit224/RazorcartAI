import uuid
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
import bcrypt
from ..database import get_db
from ..models.audit_ledger import AuditLedger
from ..models.user import User
from ..routers.auth import require_admin


router = APIRouter(prefix="/api/admin", tags=["Razorpay Admin Portal"])


# ─────────────────────────────────────────────
# Global Dashboard
# ─────────────────────────────────────────────

@router.get("/dashboard")
def get_admin_dashboard(
    days: int = 30,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Global stats across all merchants."""
    total_merchants = db.query(User).filter(User.role == "merchant").count()
    total_customers = db.query(User).filter(User.role == "customer").count()

    total_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.payment_status == "SUCCESS"
    ).scalar() or 0.0

    total_ai_profit = db.query(func.sum(AuditLedger.profit_from_ai)).scalar() or 0.0

    total_recoveries = db.query(AuditLedger).filter(
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).count()

    recovered_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).scalar() or 0.0

    total_transactions = db.query(AuditLedger).count()

    # Today stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.payment_status == "SUCCESS",
        AuditLedger.timestamp >= today_start
    ).scalar() or 0.0

    # Per-day chart via raw SQL (avoids SQLAlchemy DateTime type-processor on strftime results)
    since = datetime.utcnow() - timedelta(days=days)
    raw_chart = db.execute(text("""
        SELECT strftime('%Y-%m-%d', timestamp) as day,
               SUM(money_amount) as revenue,
               SUM(profit_from_ai) as ai_profit,
               COUNT(id) as txn_count
        FROM audit_ledger
        WHERE timestamp >= :since
        GROUP BY strftime('%Y-%m-%d', timestamp)
        ORDER BY day
    """), {"since": since.isoformat()}).fetchall()
    daily_chart = [
        {"date": r[0], "revenue": round(r[1] or 0, 2),
         "ai_profit": round(r[2] or 0, 2), "txn_count": r[3]}
        for r in raw_chart
    ]

    return {
        "total_merchants": total_merchants,
        "total_customers": total_customers,
        "total_transactions": total_transactions,
        "total_revenue": round(total_revenue, 2),
        "total_ai_profit": round(total_ai_profit, 2),
        "total_recoveries": total_recoveries,
        "recovered_revenue": round(recovered_revenue, 2),
        "today_revenue": round(today_revenue, 2),
        "daily_chart": daily_chart,
    }


# ─────────────────────────────────────────────
# Merchants Management
# ─────────────────────────────────────────────

@router.get("/merchants")
def list_all_merchants(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all onboarded merchants with their aggregate stats."""
    merchants = db.query(User).filter(User.role == "merchant").all()
    result = []
    for m in merchants:
        total_rev = db.query(func.sum(AuditLedger.money_amount)).filter(
            AuditLedger.merchant_id == m.merchant_id,
            AuditLedger.payment_status == "SUCCESS"
        ).scalar() or 0.0

        total_ai_p = db.query(func.sum(AuditLedger.profit_from_ai)).filter(
            AuditLedger.merchant_id == m.merchant_id
        ).scalar() or 0.0

        txn_count = db.query(AuditLedger).filter(
            AuditLedger.merchant_id == m.merchant_id
        ).count()

        recoveries = db.query(AuditLedger).filter(
            AuditLedger.merchant_id == m.merchant_id,
            AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
        ).count()

        result.append({
            "id": m.id,
            "merchant_id": m.merchant_id,
            "merchant_name": m.merchant_name,
            "email": m.email,
            "city": m.city,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "total_revenue": round(total_rev, 2),
            "total_ai_profit": round(total_ai_p, 2),
            "total_transactions": txn_count,
            "total_recoveries": recoveries,
        })

    return result


@router.post("/merchants")
def onboard_merchant(
    req: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Onboard a new merchant account (admin only)."""
    email = req.get("email", "").strip().lower()
    name = req.get("name", "")
    merchant_name = req.get("merchant_name", name + " Store")
    city = req.get("city", "Bengaluru")
    password = req.get("password", "merchant123")

    if not email or not name:
        raise HTTPException(status_code=400, detail="Email and name are required.")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    merchant_id = f"merch_{uuid.uuid4().hex[:8]}"
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    merchant = User(
        name=name,
        email=email,
        hashed_password=hashed,
        role="merchant",
        city=city,
        merchant_id=merchant_id,
        merchant_name=merchant_name,
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return {
        "message": "Merchant onboarded successfully.",
        "merchant_id": merchant_id,
        "merchant_name": merchant_name,
        "email": email,
    }


# ─────────────────────────────────────────────
# Per-Merchant Drill-Down
# ─────────────────────────────────────────────

@router.get("/merchants/{merchant_id}/stats")
def get_merchant_stats(
    merchant_id: str,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Detailed stats for a single merchant."""
    merchant = db.query(User).filter(
        User.merchant_id == merchant_id, User.role == "merchant"
    ).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found.")

    total_revenue = db.query(func.sum(AuditLedger.money_amount)).filter(
        AuditLedger.merchant_id == merchant_id,
        AuditLedger.payment_status == "SUCCESS"
    ).scalar() or 0.0

    total_ai_profit = db.query(func.sum(AuditLedger.profit_from_ai)).filter(
        AuditLedger.merchant_id == merchant_id
    ).scalar() or 0.0

    total_profit_impact = db.query(func.sum(AuditLedger.profit_impact)).filter(
        AuditLedger.merchant_id == merchant_id
    ).scalar() or 0.0

    recoveries = db.query(AuditLedger).filter(
        AuditLedger.merchant_id == merchant_id,
        AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
    ).count()

    # Daily chart via raw SQL
    since = datetime.utcnow() - timedelta(days=30)
    raw_chart = db.execute(text("""
        SELECT strftime('%Y-%m-%d', timestamp) as day,
               SUM(money_amount) as revenue,
               SUM(profit_from_ai) as ai_profit
        FROM audit_ledger
        WHERE merchant_id = :mid AND timestamp >= :since
        GROUP BY strftime('%Y-%m-%d', timestamp)
        ORDER BY day
    """), {"mid": merchant_id, "since": since.isoformat()}).fetchall()

    return {
        "merchant_id": merchant_id,
        "merchant_name": merchant.merchant_name,
        "email": merchant.email,
        "city": merchant.city,
        "total_revenue": round(total_revenue, 2),
        "total_ai_profit": round(total_ai_profit, 2),
        "total_profit_impact": round(total_profit_impact, 2),
        "total_recoveries": recoveries,
        "daily_chart": [
            {"date": r[0], "revenue": round(r[1] or 0, 2),
             "ai_profit": round(r[2] or 0, 2)}
            for r in raw_chart
        ],
    }


@router.get("/merchants/{merchant_id}/transactions")
def get_merchant_transactions(
    merchant_id: str,
    page: int = 1,
    per_page: int = 25,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Full paginated transaction list for a given merchant (admin drill-down)."""
    offset = (page - 1) * per_page
    total = db.query(AuditLedger).filter(AuditLedger.merchant_id == merchant_id).count()
    rows = (
        db.query(AuditLedger)
        .filter(AuditLedger.merchant_id == merchant_id)
        .order_by(AuditLedger.timestamp.desc())
        .offset(offset).limit(per_page)
        .all()
    )

    def _row(r):
        return {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "agent_type": r.agent_type,
            "action_type": r.action_type,
            "user_city": r.user_city,
            "input_query": r.input_query,
            "decision_reasoning": r.decision_reasoning,
            "payment_status": r.payment_status,
            "money_amount": r.money_amount,
            "profit_impact": r.profit_impact,
            "profit_from_ai": r.profit_from_ai,
        }

    return {"total": total, "page": page, "per_page": per_page,
            "transactions": [_row(r) for r in rows]}
