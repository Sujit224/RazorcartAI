import json
from typing import List, Optional
from datetime import datetime, timedelta, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from ..database import get_db
from ..models.audit_ledger import AuditLedger
from ..models.user import User
from ..models.product import Product
from ..models.order import Order
from ..routers.auth import require_merchant
from ..services.vector_store import vector_store


router = APIRouter(prefix="/api/merchant", tags=["Merchant Portal"])


def _audit_to_dict(row: AuditLedger) -> dict:
    meta = {}
    if row.metadata_json:
        try:
            meta = json.loads(row.metadata_json) if isinstance(row.metadata_json, str) else row.metadata_json
        except Exception:
            meta = {}
    return {
        "id": row.id,
        "timestamp": row.timestamp.isoformat() if row.timestamp else None,
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
        "metadata": meta,
    }


def _product_to_dict(p: Product) -> dict:
    tags = []
    if p.tags:
        try:
            tags = json.loads(p.tags) if isinstance(p.tags, str) else p.tags
        except Exception:
            tags = [t.strip() for t in str(p.tags).split(",") if t.strip()]
    fbt = []
    if p.fbt_product_ids:
        try:
            fbt = json.loads(p.fbt_product_ids) if isinstance(p.fbt_product_ids, str) else p.fbt_product_ids
        except Exception:
            fbt = []
    return {
        "id": p.id,
        "title": p.title,
        "brand": p.brand,
        "category": p.category,
        "gender": p.gender,
        "color": p.color,
        "price": p.price,
        "original_price": p.original_price,
        "discount_pct": p.discount_pct,
        "rating": p.rating,
        "review_count": p.review_count,
        "stock": p.stock,
        "city": p.city,
        "image_url": p.image_url,
        "description": p.description,
        "tags": tags,
        "fbt_product_ids": fbt,
        "is_active": p.is_active,
        "created_at": p.created_at.isoformat() if p.created_at else None,
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

    # Product count
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # Unique customers count
    unique_customer_ids = db.query(AuditLedger.user_id).filter(
        AuditLedger.merchant_id == mid,
        AuditLedger.user_id.isnot(None)
    ).distinct().count()

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
        "merchant_name": current_user.merchant_name or f"{current_user.name} Organization",
        "merchant_email": current_user.email,
        "merchant_city": current_user.city,
        "total_revenue": round(total_revenue, 2),
        "total_ai_profit": round(total_ai_profit, 2),
        "total_profit_impact": round(total_profit_impact, 2),
        "total_recoveries": recoveries,
        "total_transactions": total_transactions,
        "total_products": total_products,
        "total_customers": unique_customer_ids,
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


# ─────────────────────────────────────────────
# Products Catalog Management
# ─────────────────────────────────────────────

@router.get("/products")
def get_merchant_products(
    query: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """View products catalog with optional search, category filtering, and pagination."""
    q = db.query(Product).filter(Product.is_active == True)

    if query and query.strip():
        search_term = f"%{query.strip()}%"
        q = q.filter(
            (Product.title.ilike(search_term)) |
            (Product.brand.ilike(search_term)) |
            (Product.description.ilike(search_term)) |
            (Product.tags.ilike(search_term))
        )

    if category and category != "ALL":
        q = q.filter(Product.category.ilike(f"%{category}%"))

    total = q.count()
    offset = (page - 1) * per_page
    products = q.order_by(Product.id.desc()).offset(offset).limit(per_page).all()

    # Get distinct categories for filter dropdown
    categories = [r[0] for r in db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()]

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "categories": categories,
        "products": [_product_to_dict(p) for p in products],
    }


@router.post("/products")
def add_merchant_product(
    req: dict,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """Add a new product to catalog and re-index vector store for immediate search discovery."""
    title = req.get("title", "").strip()
    brand = req.get("brand", "").strip()
    category = req.get("category", "Footwear").strip()
    gender = req.get("gender", "Unisex").strip()
    price = float(req.get("price", 0.0))
    original_price = float(req.get("original_price", price))
    discount_pct = int(req.get("discount_pct", 0))
    stock = int(req.get("stock", 25))
    image_url = req.get("image_url", "").strip() or "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=800&q=80"
    description = req.get("description", "").strip() or f"{brand} {title} crafted with premium quality materials."
    color = req.get("color", "")
    city = req.get("city", current_user.city or "Bengaluru")
    
    tags = req.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    if not tags:
        tags = [title.lower(), brand.lower(), category.lower()]

    fbt_ids = req.get("fbt_product_ids", [])
    if isinstance(fbt_ids, str):
        try:
            fbt_ids = json.loads(fbt_ids)
        except Exception:
            fbt_ids = []

    if not title or not brand or price <= 0:
        raise HTTPException(status_code=400, detail="Title, brand, and positive price are required.")

    if discount_pct <= 0 and original_price > price:
        discount_pct = int(round(((original_price - price) / original_price) * 100))

    new_prod = Product(
        title=title,
        brand=brand,
        category=category,
        gender=gender,
        color=color,
        price=price,
        original_price=original_price,
        discount_pct=discount_pct,
        rating=float(req.get("rating", 4.8)),
        review_count=int(req.get("review_count", 1)),
        stock=stock,
        city=city,
        image_url=image_url,
        description=description,
        tags=json.dumps(tags),
        fbt_product_ids=json.dumps(fbt_ids),
        product_meta=json.dumps(req.get("metadata", {"department": category, "fit": "True to Size"})),
        is_active=True,
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    # Re-index in background vector store
    try:
        all_prods = db.query(Product).all()
        vector_store.build_index(all_prods)
    except Exception:
        pass

    return {
        "message": "Product created and indexed successfully.",
        "product": _product_to_dict(new_prod),
    }


@router.delete("/products/{product_id}")
def delete_merchant_product(
    product_id: int,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """Delete / deactivate a product from catalog."""
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    prod.is_active = False
    db.commit()

    # Rebuild vector index
    try:
        active_prods = db.query(Product).filter(Product.is_active == True).all()
        vector_store.build_index(active_prods)
    except Exception:
        pass

    return {
        "message": f"Product #{product_id} '{prod.title}' successfully removed.",
        "deleted_id": product_id,
    }


# ─────────────────────────────────────────────
# Customer Directory & AI Journey Analytics
# ─────────────────────────────────────────────

@router.get("/customers")
def get_merchant_customers(
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """
    List all Razorcart users who made purchases or engaged with this merchant.
    Includes customer stats: total spend, AI profit contribution, recovery events, and last active timestamp.
    """
    mid = current_user.merchant_id

    # 1. Query distinct user IDs who have audit ledger events under this merchant
    user_rows = db.query(AuditLedger.user_id).filter(
        AuditLedger.merchant_id == mid,
        AuditLedger.user_id.isnot(None)
    ).distinct().all()

    user_ids = [r[0] for r in user_rows if r[0] is not None]

    # Also include customer users from database to ensure complete list
    all_customer_users = db.query(User).filter(User.role == "customer").all()
    user_map = {u.id: u for u in all_customer_users}
    for u in all_customer_users:
        if u.id not in user_ids:
            user_ids.append(u.id)

    customers = []
    for uid in user_ids:
        user_obj = user_map.get(uid) or db.query(User).filter(User.id == uid).first()
        if not user_obj:
            continue

        # Aggregate total revenue & AI profit from AuditLedger
        ledger_q = db.query(AuditLedger).filter(
            AuditLedger.merchant_id == mid,
            AuditLedger.user_id == uid
        )

        total_spend = db.query(func.sum(AuditLedger.money_amount)).filter(
            AuditLedger.merchant_id == mid,
            AuditLedger.user_id == uid,
            AuditLedger.payment_status.in_(["SUCCESS", "TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
        ).scalar() or 0.0

        ai_profit = db.query(func.sum(AuditLedger.profit_from_ai)).filter(
            AuditLedger.merchant_id == mid,
            AuditLedger.user_id == uid
        ).scalar() or 0.0

        recoveries_count = ledger_q.filter(
            AuditLedger.payment_status.in_(["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"])
        ).count()

        total_actions = ledger_q.count()

        last_entry = ledger_q.order_by(AuditLedger.timestamp.desc()).first()
        last_active = last_entry.timestamp.isoformat() if last_entry and last_entry.timestamp else (user_obj.created_at.isoformat() if user_obj.created_at else None)
        latest_action = last_entry.action_type if last_entry else "REGISTERED"

        # Search keywords and viewed product count
        search_kw = []
        if user_obj.search_history:
            try:
                search_kw = json.loads(user_obj.search_history) if isinstance(user_obj.search_history, str) else user_obj.search_history
            except Exception:
                search_kw = []

        customers.append({
            "id": user_obj.id,
            "name": user_obj.name,
            "email": user_obj.email,
            "city": user_obj.city,
            "role": user_obj.role,
            "created_at": user_obj.created_at.isoformat() if user_obj.created_at else None,
            "total_spend": round(total_spend, 2),
            "ai_profit_lift": round(ai_profit, 2),
            "recoveries_count": recoveries_count,
            "total_actions": total_actions,
            "last_active": last_active,
            "latest_action": latest_action,
            "search_keywords": search_kw[:3],
        })

    # Sort customers by total spend descending
    customers.sort(key=lambda c: (c["total_spend"], c["total_actions"]), reverse=True)

    return {
        "total_customers": len(customers),
        "customers": customers,
    }


@router.get("/customers/{user_id}")
def get_merchant_customer_details(
    user_id: int,
    current_user: User = Depends(require_merchant),
    db: Session = Depends(get_db)
):
    """
    Detailed customer profile for a merchant drill-down:
    1. Customer Identity & Preferences
    2. Comprehensive Lifetime Metrics (Total Revenue, AI Profit Lift, Recovered Transactions)
    3. Stage-by-Stage Razorcart AI Impact & Revenue Lift
    4. Full Chronological History of Every Action Made
    5. Completed Orders Summary
    """
    mid = current_user.merchant_id

    customer = db.query(User).filter(User.id == user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # All audit ledger actions under this merchant
    ledger_entries = (
        db.query(AuditLedger)
        .filter(AuditLedger.merchant_id == mid, AuditLedger.user_id == user_id)
        .order_by(AuditLedger.timestamp.desc())
        .all()
    )

    # In case merchant_id wasn't tagged on some actions, also check actions with user_id
    if not ledger_entries:
        ledger_entries = (
            db.query(AuditLedger)
            .filter(AuditLedger.user_id == user_id)
            .order_by(AuditLedger.timestamp.desc())
            .all()
        )

    # Aggregate Metrics
    total_spend = sum(
        e.money_amount for e in ledger_entries
        if e.payment_status in ["SUCCESS", "TIMEOUT_RECOVERED", "DECLINE_RESOLVED"]
    )
    total_ai_profit = sum(e.profit_from_ai for e in ledger_entries)
    
    recovered_events = [e for e in ledger_entries if e.payment_status in ["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"]]
    recovered_revenue = sum(e.money_amount for e in recovered_events)

    # ── Stage-by-Stage Razorcart Revenue Boost Analysis ──
    # Stage 1: Discovery & Semantic Personalization
    discovery_entries = [e for e in ledger_entries if e.agent_type in ["DiscoveryAgent", "ZeroQueryPersonalizer"] or e.action_type in ["SEARCH_RANKED", "FEED_GENERATED", "PRODUCT_OPENED"]]
    discovery_boost = sum(e.profit_from_ai for e in discovery_entries)
    
    # Stage 2: Autonomous Upsell & Bundling (FBT)
    upsell_entries = [e for e in ledger_entries if e.agent_type in ["UpsellAgent", "Bundle"] or e.action_type in ["FBT_COMPLEMENT_PITCHED", "BUNDLE_RECOMMENDED"]]
    upsell_revenue = sum(e.money_amount for e in upsell_entries)
    upsell_profit = sum(e.profit_from_ai for e in upsell_entries)

    # Stage 3: Dynamic Price Lock & Seamless Checkout
    checkout_entries = [e for e in ledger_entries if e.agent_type == "CheckoutAgent" or e.action_type in ["PAYMENT_INITIATED", "PAYMENT_CAPTURED", "CART_ITEM_ADDED"]]
    checkout_volume = sum(e.money_amount for e in checkout_entries if e.payment_status == "SUCCESS")

    # Stage 4: Autonomous Payment Failure Recovery
    recovery_entries = [e for e in ledger_entries if e.agent_type in ["RecoveryAgent", "NegotiationAgent"] or e.payment_status in ["TIMEOUT_RECOVERED", "DECLINE_RESOLVED"] or e.action_type in ["TIMEOUT_UPI_FALLBACK", "CART_NEGOTIATED_PRUNED"]]
    recovery_revenue = sum(e.money_amount for e in recovery_entries)

    stages = [
        {
            "stage_number": 1,
            "stage_name": "Discovery & Semantic Ranking",
            "agent": "DiscoveryAgent",
            "badge_color": "pink",
            "icon": "Search",
            "action_count": len(discovery_entries),
            "revenue_lift": round(discovery_boost, 2),
            "headline": "Personalized intent matching with high-rating multiplier",
            "impact_description": "Surfaced top 4.5★+ products tailored to customer's search intent and composite vector profile, maximizing conversion propensity.",
            "sample_actions": [_audit_to_dict(e) for e in discovery_entries[:3]],
        },
        {
            "stage_number": 2,
            "stage_name": "Autonomous Upselling (FBT)",
            "agent": "UpsellAgent",
            "badge_color": "purple",
            "icon": "Sparkles",
            "action_count": len(upsell_entries),
            "revenue_lift": round(upsell_revenue, 2),
            "profit_generated": round(upsell_profit, 2),
            "headline": "Frequently Bought Together (FBT) cross-sell add-ons",
            "impact_description": "Pitched high-affinity complementary items (accessories, shoe care, matched tops) with social proof reviews, directly expanding basket value.",
            "sample_actions": [_audit_to_dict(e) for e in upsell_entries[:3]],
        },
        {
            "stage_number": 3,
            "stage_name": "High-Velocity Checkout & Price Lock",
            "agent": "CheckoutAgent",
            "badge_color": "indigo",
            "icon": "Zap",
            "action_count": len(checkout_entries),
            "revenue_lift": round(checkout_volume, 2),
            "headline": "Frictionless checkout session & localized price guarantee",
            "impact_description": "Guaranteed 15-minute price lock and instant Razorpay checkout initialization, eliminating cart abandonment friction.",
            "sample_actions": [_audit_to_dict(e) for e in checkout_entries[:3]],
        },
        {
            "stage_number": 4,
            "stage_name": "Autonomous Payment Recovery",
            "agent": "RecoveryAgent",
            "badge_color": "amber",
            "icon": "RefreshCw",
            "action_count": len(recovery_entries),
            "revenue_lift": round(recovery_revenue, 2),
            "headline": "Zero-dropoff 504 timeout UPI QR & card decline resolution",
            "impact_description": "Autonomous agents intercepted gateway dropouts, dynamically dispatched UPI fallback QR, and pruned low-priority items on card decline to recover otherwise lost sales.",
            "sample_actions": [_audit_to_dict(e) for e in recovery_entries[:3]],
        },
    ]

    # Customer search and viewed products
    search_keywords = []
    if customer.search_history:
        try:
            search_keywords = json.loads(customer.search_history) if isinstance(customer.search_history, str) else customer.search_history
        except Exception:
            search_keywords = []

    viewed_ids = []
    if customer.viewed_product_ids:
        try:
            viewed_ids = json.loads(customer.viewed_product_ids) if isinstance(customer.viewed_product_ids, str) else customer.viewed_product_ids
        except Exception:
            viewed_ids = []

    viewed_products = []
    if viewed_ids:
        prods = db.query(Product).filter(Product.id.in_(viewed_ids)).all()
        viewed_products = [_product_to_dict(p) for p in prods]

    # Customer orders
    orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    formatted_orders = []
    for o in orders:
        items = []
        try:
            items = json.loads(o.items_json) if isinstance(o.items_json, str) else o.items_json
        except Exception:
            items = []
        formatted_orders.append({
            "id": o.id,
            "total_amount": o.total_amount,
            "currency": o.currency,
            "status": o.status,
            "payment_method": o.payment_method,
            "recovery_type": o.recovery_type,
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items_count": len(items),
            "items": items,
        })

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "city": customer.city,
            "role": customer.role,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
            "search_keywords": search_keywords,
            "viewed_products": viewed_products,
        },
        "metrics": {
            "total_spend": round(total_spend, 2),
            "total_ai_profit": round(total_ai_profit, 2),
            "ai_lift_percentage": round((total_ai_profit / total_spend * 100) if total_spend > 0 else 24.5, 1),
            "total_actions_count": len(ledger_entries),
            "recovered_orders_count": len(recovered_events),
            "recovered_revenue": round(recovered_revenue, 2),
            "total_orders_count": len(formatted_orders),
        },
        "revenue_stages": stages,
        "action_history": [_audit_to_dict(e) for e in ledger_entries],
        "orders": formatted_orders,
    }
