import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.cart import CartItem
from ..models.product import Product
from ..schemas.cart import CartItemCreate, CartItemUpdate, CartSummaryResponse, CartItemResponse
from .products import format_product_dict

router = APIRouter(prefix="/api/cart", tags=["Cart"])

@router.get("", response_model=CartSummaryResponse)
def get_user_cart(user_id: int = 1, db: Session = Depends(get_db)):
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    
    items_response = []
    subtotal = 0.0
    all_fbt_ids = set()

    for item in cart_items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            subtotal += prod.price * item.quantity
            p_dict = format_product_dict(prod)
            items_response.append({
                "id": item.id,
                "user_id": item.user_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "size": item.size,
                "priority": item.priority,
                "product": p_dict
            })
            # Gather FBT IDs
            fbt_list = json.loads(prod.fbt_product_ids or "[]")
            for fid in fbt_list:
                all_fbt_ids.add(fid)

    # Exclude items already in cart from FBT recommendations
    existing_pids = {it.product_id for it in cart_items}
    candidate_fbt_ids = [fid for fid in all_fbt_ids if fid not in existing_pids]
    
    fbt_products = []
    if candidate_fbt_ids:
        prods = db.query(Product).filter(Product.id.in_(candidate_fbt_ids[:3])).all()
        fbt_products = [format_product_dict(p) for p in prods]

    return {
        "items": items_response,
        "subtotal": subtotal,
        "shipping_fee": 0.0 if subtotal > 1199 or subtotal == 0 else 99.0,
        "total": subtotal + (0.0 if subtotal > 1199 or subtotal == 0 else 99.0),
        "item_count": sum(it.quantity for it in cart_items),
        "fbt_recommendations": fbt_products
    }

@router.post("/add")
def add_to_cart(req: CartItemCreate, user_id: int = 1, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == req.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == req.product_id,
        CartItem.size == req.size
    ).first()

    if existing:
        existing.quantity += req.quantity
    else:
        # Determine priority (accessories get priority 0 for negotiable pruning)
        priority = 0 if prod.category == "Accessories" else 1
        item = CartItem(
            user_id=user_id,
            product_id=req.product_id,
            quantity=req.quantity,
            size=req.size or "UK 8",
            priority=priority
        )
        db.add(item)
    
    db.commit()
    return {"message": "Product added to bag successfully"}

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
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    return {"message": "Bag cleared"}
