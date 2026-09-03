"""
Cart arithmetic, in one place.

Both the HTTP API (`routers/cart.py`) and the conversational agent
(`agents/nodes/cart_ops.py`) mutate the same cart rows.  With the logic
duplicated the two drift, and the drift shows up as the agent reporting a total
the cart drawer disagrees with -- so subtotal, shipping, quantity clamping and
the "does this line already exist" rule all live here and nowhere else.

The bounds are the point, not incidental validation.  `MAX_QTY_PER_LINE` and the
stock check are what make "increase the quantity" a *bounded* money action: an
agent looping on a misheard instruction cannot run a line item to 500 units, and
it cannot sell stock that does not exist.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from ..models.cart import CartItem
from ..models.product import Product

# ── Bounds and pricing rules ────────────────────────────────────────────────

#: Hard ceiling per cart line.  A retail basket never legitimately needs more,
#: and the cap is what stops a runaway "add one more" loop from becoming a
#: five-figure order.
MAX_QTY_PER_LINE = 10

FREE_SHIPPING_THRESHOLD = 1199.0
SHIPPING_FEE = 99.0


def shipping_for(subtotal: float) -> float:
    """Free above the threshold, and free for an empty cart (nothing to ship)."""
    if subtotal == 0 or subtotal > FREE_SHIPPING_THRESHOLD:
        return 0.0
    return SHIPPING_FEE


def default_size_for(product: Product) -> str:
    """
    A plausible default variant when the user did not name one.

    The previous hardcoded "UK 8" was applied to every category, which put
    refrigerators in the cart in shoe size 8.  Until `Product.variants` lands
    this at least keeps the label category-appropriate.
    """
    category = (product.category or "").lower()
    if "footwear" in category or "shoe" in category:
        return "UK 8"
    if any(k in category for k in ("topwear", "bottomwear", "dress", "ethnic", "sportswear")):
        return "M"
    return "Standard"


# ── Reads ───────────────────────────────────────────────────────────────────

def cart_rows(db: Session, user_id: int) -> List[Tuple[CartItem, Product]]:
    """
    (CartItem, Product) pairs for a user, oldest first.

    Ordered by id so the numbering the user sees is stable between turns --
    "the 2nd one" must mean the same row it meant ten seconds ago.
    """
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.id.asc())
        .all()
    )
    if not items:
        return []

    products = {
        p.id: p
        for p in db.query(Product).filter(Product.id.in_([i.product_id for i in items])).all()
    }
    return [(i, products[i.product_id]) for i in items if i.product_id in products]


def cart_summary(db: Session, user_id: int) -> Dict[str, Any]:
    """Totals plus a compact per-line view.  No FBT lookup -- callers that want
    recommendations ask for them separately, so a chat turn does not pay for a
    join it will not render."""
    rows = cart_rows(db, user_id)
    subtotal = sum(p.price * i.quantity for i, p in rows)
    shipping = shipping_for(subtotal)
    return {
        "items": [
            {
                "item_id": i.id,
                "product_id": p.id,
                "title": p.title,
                "brand": p.brand,
                "price": p.price,
                "quantity": i.quantity,
                "size": i.size,
                "line_total": round(p.price * i.quantity, 2),
                "image_url": p.image_url,
                "rating": p.rating,
                "review_count": p.review_count,
                "stock": p.stock,
            }
            for i, p in rows
        ],
        "subtotal": round(subtotal, 2),
        "shipping_fee": shipping,
        "total": round(subtotal + shipping, 2),
        "item_count": sum(i.quantity for i, _ in rows),
        "line_count": len(rows),
    }


def find_line(
    db: Session, user_id: int, product_id: int, size: Optional[str] = None
) -> Optional[CartItem]:
    """The existing cart line for a product, matching size when one is given."""
    q = db.query(CartItem).filter(
        CartItem.user_id == user_id, CartItem.product_id == product_id
    )
    if size is not None:
        q = q.filter(CartItem.size == size)
    return q.order_by(CartItem.id.asc()).first()


# ── Writes ──────────────────────────────────────────────────────────────────

class CartError(Exception):
    """A cart mutation that was refused, with a message fit to show the user."""


def add_line(
    db: Session,
    user_id: int,
    product: Product,
    quantity: int = 1,
    size: Optional[str] = None,
    *,
    commit: bool = True,
) -> Tuple[CartItem, bool, int]:
    """
    Add to the cart, merging into an existing line for the same product+size.

    Returns (line, created, granted) where `granted` is the quantity actually
    added -- which can be less than asked for when the cap or stock binds.  The
    caller is expected to tell the user when granted < quantity rather than
    silently under-delivering.
    """
    if quantity < 1:
        raise CartError("Quantity has to be at least 1.")
    if not product.is_active:
        raise CartError("%s %s is no longer available." % (product.brand, product.title))

    size = size or default_size_for(product)
    existing = find_line(db, user_id, product.id, size)
    current = existing.quantity if existing else 0

    ceiling = min(MAX_QTY_PER_LINE, max(product.stock or 0, 0))
    if ceiling <= current:
        if (product.stock or 0) <= current:
            raise CartError(
                "Only %d unit%s of %s %s are in stock and you already have %d in your bag."
                % (product.stock or 0, "" if product.stock == 1 else "s",
                   product.brand, product.title, current)
            )
        raise CartError(
            "Your bag already holds the %d-unit maximum of %s %s."
            % (MAX_QTY_PER_LINE, product.brand, product.title)
        )

    granted = min(quantity, ceiling - current)

    if existing:
        existing.quantity = current + granted
        line, created = existing, False
    else:
        # priority 0 marks a low-value accessory the negotiation agent may prune
        # first when a payment declines for insufficient funds.
        line = CartItem(
            user_id=user_id,
            product_id=product.id,
            quantity=granted,
            size=size,
            priority=0 if (product.category or "") == "Accessories" else 1,
        )
        db.add(line)
        created = True

    if commit:
        db.commit()
        db.refresh(line)
    return line, created, granted


def set_quantity(
    db: Session, line: CartItem, product: Product, quantity: int, *, commit: bool = True
) -> Tuple[int, Optional[str]]:
    """
    Set an absolute quantity on a line, clamped.

    Returns (applied_quantity, note) where `note` explains any clamping, or is
    None when the request was honoured exactly.  Quantity 0 or less deletes the
    line, which is what "reduce the quantity" on a single-unit line means.
    """
    if quantity <= 0:
        db.delete(line)
        if commit:
            db.commit()
        return 0, "removed the line entirely, since the quantity reached zero"

    note = None
    ceiling = min(MAX_QTY_PER_LINE, max(product.stock or 0, 0))
    if ceiling <= 0:
        raise CartError("%s %s is out of stock." % (product.brand, product.title))
    if quantity > ceiling:
        if (product.stock or 0) < quantity:
            note = "capped at %d, the stock on hand" % ceiling
        else:
            note = "capped at the %d-unit per-item maximum" % MAX_QTY_PER_LINE
        quantity = ceiling

    line.quantity = quantity
    if commit:
        db.commit()
        db.refresh(line)
    return quantity, note


def clear_cart(db: Session, user_id: int, *, commit: bool = True) -> int:
    """Empty the cart, returning how many lines were dropped."""
    removed = db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    if commit:
        db.commit()
    return int(removed or 0)
