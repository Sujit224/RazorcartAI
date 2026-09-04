import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.cart import CartItem
from ..models.product import Product
from ..schemas.cart import CartItemCreate, CartItemUpdate, CartSummaryResponse, CartItemResponse
from ..services import cart_service as cs
from ..services.cart_service import CartError
from .products import format_product
from app.services.fbt_engine import get_dynamic_fbts

router = APIRouter(prefix="/api/cart", tags=["Cart"])

@router.get("", response_model=CartSummaryResponse)
def get_user_cart(user_id: int = 1, db: Session = Depends(get_db)):
    # Totals come from cart_service so this endpoint and the agent can never
    # disagree about what the bag costs.
    rows = cs.cart_rows(db, user_id)

    items_response = []
    all_fbts = []
    for item, prod in rows:
        items_response.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "size": item.size,
            "priority": item.priority,
            "product": format_product(prod, user_id, db)
        })
        # Generate FBTs dynamically for each product in the cart
        fbt_list = get_dynamic_fbts(db, prod, user_id, limit=3)
        for fbt in fbt_list:
            if fbt["id"] not in [f["id"] for f in all_fbts]:
                all_fbts.append(fbt)

    # Exclude items already in cart from FBT recommendations
    existing_pids = {item.product_id for item, _ in rows}
    fbt_products = [f for f in all_fbts if f["id"] not in existing_pids][:3]

    subtotal = sum(p.price * i.quantity for i, p in rows)
    shipping = cs.shipping_for(subtotal)
    return {
        "items": items_response,
        "subtotal": round(subtotal, 2),
        "shipping_fee": shipping,
        "total": round(subtotal + shipping, 2),
        "item_count": sum(i.quantity for i, _ in rows),
        "fbt_recommendations": fbt_products
    }

@router.post("/add")
def add_to_cart(req: CartItemCreate, user_id: int = 1, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == req.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        line, created, granted = cs.add_line(db, user_id, prod, req.quantity, req.size)
    except CartError as exc:
        # 409: the request was well-formed but the cart's bounds refused it
        # (per-line cap or stock). Previously this endpoint had no cap at all.
        raise HTTPException(status_code=409, detail=str(exc))

    message = "Product added to bag successfully"
    if granted < req.quantity:
        message = ("Added %d of %d - the rest exceeds the per-item limit or "
                   "available stock." % (granted, req.quantity))
    return {
        "message": message,
        "item_id": line.id,
        "quantity": line.quantity,
        "added": granted,
        "created_line": created,
        "max_per_line": cs.MAX_QTY_PER_LINE,
    }

@router.patch("/item/{item_id}")
def update_cart_item(
    item_id: int,
    req: CartItemUpdate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    """
    Change quantity, size or priority on an existing line.

    This is what the cart drawer's +/- buttons and the agent's "increase the
    quantity" both need; without it the only way to change a quantity was to
    remove the line and re-add it, which loses the line's position in the bag.
    """
    item = db.query(CartItem).filter(
        CartItem.id == item_id, CartItem.user_id == user_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in bag")

    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product no longer available")

    note = None
    removed = False
    if req.size is not None:
        item.size = req.size
    if req.priority is not None:
        item.priority = req.priority

    if req.quantity is not None:
        try:
            applied, note = cs.set_quantity(db, item, product, req.quantity)
        except CartError as exc:
            raise HTTPException(status_code=409, detail=str(exc))
        removed = applied == 0
    else:
        db.commit()
        applied = item.quantity

    return {
        "message": "Item removed from bag" if removed else "Bag updated",
        "item_id": None if removed else item.id,
        "quantity": applied,
        "note": note,
        "removed": removed,
        "max_per_line": cs.MAX_QTY_PER_LINE,
    }

@router.delete("/remove/{item_id}")
def remove_from_cart(item_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in bag")
    db.delete(item)
    db.commit()
    return {"message": "Item removed from bag"}

@router.delete("/clear")
def clear_cart(user_id: int = 1, db: Session = Depends(get_db)):
    removed = cs.clear_cart(db, user_id)
    return {"message": "Bag cleared", "lines_removed": removed}
