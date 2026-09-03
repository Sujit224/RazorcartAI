"""
Conversational cart and order operations.

This node executes the closed set of commands `agents/commands.py` recognises.
Three things about it are deliberate:

**It dispatches on the kind of the referent, not the verb.**  "Put the 2nd one
in the cart again" means *reorder that order* when an order list is on screen and
*add that product* when a product list is.  The user says the same words; the
right action depends on what they were looking at.  Reading the verb alone gets
this wrong, which is why `reference.FocusItem` carries `kind`.

**It never guesses.**  An unresolvable or ambiguous reference produces a
clarifying question listing the options, not a best effort.  Acting on a
misresolved reference means putting the wrong item in someone's cart.

**Spend is gated.**  Reorders above `CONFIRM_ABOVE_INR` and any cart wipe are
parked in the session as a pending action and executed only after an explicit
yes.  Everything else is bounded by `cart_service` (per-line cap, stock check),
so the worst case for an unconfirmed action is a single recoverable line item.

Every branch writes `audit_reasoning` including the reference resolution reason,
so the ledger explains not just what changed but why the agent believed that was
what the user meant.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from ...database import SessionLocal
from ...models.order import Order
from ...models.product import Product
from ...services import cart_service as cs
from ...services.cart_service import CartError
from .. import commands as cmd
from ..reference import (
    KIND_CART_ITEM,
    KIND_ORDER,
    KIND_PRODUCT,
    FocusItem,
    Resolution,
    get_pending,
    set_focus,
    set_last_ref,
    set_pending,
    wants_all,
)
from ..state import AgentState

#: A reorder at or above this value asks before it spends.  Below it, the action
#: is cheap, reversible and bounded, so a confirmation step is friction the user
#: did not ask for.
CONFIRM_ABOVE_INR = 5000.0

#: Cap on how many orders / cart lines get numbered in one reply.  Ordinals the
#: user cannot see are ordinals they cannot use.
MAX_LISTED = 8


# ── Formatting helpers ──────────────────────────────────────────────────────

def _rupees(amount: float) -> str:
    return "Rs. %s" % format(int(round(amount)), ",")


def _bag_size(line_count: int, item_count: int) -> str:
    """
    Describe the bag so the number matches what the user can actually count.

    `item_count` sums quantities, so a two-line bag holding ten blouses reads as
    "12 items" above a list of two rows -- a header the reader cannot reconcile
    with what is underneath it.  Lead with lines, and mention units only when the
    two genuinely differ.
    """
    lines = "%d item%s" % (line_count, "" if line_count == 1 else "s")
    if item_count == line_count:
        return lines
    return "%s (%d units)" % (lines, item_count)


def _truncation_note(total: int, shown: int, noun: str, *, which: str = "first") -> str:
    """
    Say so when a list was cut short.

    Ordinals are scoped to what was rendered, so a silently truncated list makes
    "the 8th one" mean different things to the user and to the agent.  Naming the
    cut is cheaper than resolving against a list the user thinks is complete.
    """
    if total <= shown:
        return ""
    return ("\n\n_Showing the %s %d of %d %s; the numbering above refers to these._"
            % (which, shown, total, noun))


def _order_items(order: Order) -> List[Dict[str, Any]]:
    """
    Purchased-item snapshots out of `Order.items_json`.

    The column holds whatever the checkout client posted, which over the life of
    this codebase has been both flat `{product_id, quantity}` dicts and nested
    `{product: {id: ...}}` cart rows.  Reorder has to cope with both, so the
    shape is normalised on read rather than trusted.
    """
    try:
        raw = json.loads(order.items_json or "[]")
    except (ValueError, TypeError):
        return []
    if not isinstance(raw, list):
        return []

    out: List[Dict[str, Any]] = []
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        nested = entry.get("product") if isinstance(entry.get("product"), dict) else {}
        pid = entry.get("product_id") or nested.get("id")
        if not pid:
            continue
        out.append({
            "product_id": int(pid),
            "quantity": int(entry.get("quantity") or 1),
            "size": entry.get("size"),
            "title": entry.get("title") or nested.get("title") or "item",
            "brand": entry.get("brand") or nested.get("brand") or "",
        })
    return out


def _order_label(order: Order, items: List[Dict[str, Any]]) -> str:
    when = order.created_at.strftime("%d %b %Y") if order.created_at else "date unknown"
    lead = ("%s %s" % (items[0].get("brand", ""), items[0].get("title", ""))).strip()
    if len(items) > 1:
        lead += " +%d more" % (len(items) - 1)
    return "Order #%d - %s - %s (%s)" % (order.id, lead or "no items",
                                        _rupees(order.total_amount), when)


def _refused(state: AgentState, why: str) -> AgentState:
    """
    Mark this turn as a refusal.

    The ledger reads `executed` to suffix the action type with `_DECLINED`, so a
    row saying CART_ITEM_REMOVED always means an item actually left the cart.  An
    audit trail that cannot distinguish "removed it" from "asked instead" is not
    an audit trail.
    """
    state["action_result"] = {
        "action": state.get("intent"), "executed": False, "why": why,
    }
    return state


def _ask_which(state: AgentState, res: Resolution, verb: str) -> AgentState:
    """Turn an unresolved reference into a clarifying question."""
    if res.candidates:
        listing = "\n".join(
            "%d. %s" % (c.ordinal, c.label) for c in res.candidates[:MAX_LISTED]
        )
        state["reply"] = (
            "I want to be sure before I %s - %s.\n\n%s\n\n"
            "Tell me the number and I will proceed." % (verb, res.reason, listing)
        )
        state["suggested_actions"] = [
            "The %s one" % w for w in ("first", "second", "third")[:len(res.candidates)]
        ]
    else:
        state["reply"] = (
            "I am not sure which item you mean - %s. Ask me to show your bag or "
            "your past orders first, then say \"the second one\"." % res.reason
        )
        state["suggested_actions"] = ["Show me my cart", "What are my past orders"]

    state["audit_reasoning"] = (
        "Declined to %s: reference unresolved (%s). No cart mutation performed."
        % (verb, res.reason)
    )
    state["reference_reason"] = res.reason
    return _refused(state, res.reason)


# ── Listings ────────────────────────────────────────────────────────────────

def _show_cart(state: AgentState, db: Session, user_id: int) -> AgentState:
    summary = cs.cart_summary(db, user_id)
    state["cart_snapshot"] = summary
    lines = summary["items"]

    if not lines:
        set_focus(state["session_id"], [])
        state["reply"] = (
            "Your bag is empty right now. Tell me what you are looking for and I "
            "will find the highest-rated options."
        )
        state["suggested_actions"] = ["Show trending footwear",
                                      "What are my past orders",
                                      "Show highest-rated sneakers"]
        state["audit_reasoning"] = "Read cart for user %s: empty." % user_id
        return state

    focus = [
        FocusItem(
            ordinal=n,
            kind=KIND_CART_ITEM,
            ref_id=row["item_id"],
            label="%s %s" % (row["brand"], row["title"]),
            extra={"product_id": row["product_id"], "quantity": row["quantity"],
                   "size": row["size"], "price": row["price"]},
        )
        for n, row in enumerate(lines[:MAX_LISTED], start=1)
    ]
    set_focus(state["session_id"], focus)
    state["focus_list"] = [f.to_dict() for f in focus]

    body = "\n".join(
        "%d. **%s %s** - %s x%d = %s  (size %s, %s★)"
        % (n, row["brand"], row["title"], _rupees(row["price"]), row["quantity"],
           _rupees(row["line_total"]), row["size"], row["rating"])
        for n, row in enumerate(lines[:MAX_LISTED], start=1)
    )
    ship = ("free shipping" if summary["shipping_fee"] == 0
            else "%s shipping" % _rupees(summary["shipping_fee"]))
    state["reply"] = (
        "You have **%s** in your bag:\n\n%s\n\nSubtotal %s + %s = **%s**%s"
        % (_bag_size(summary["line_count"], summary["item_count"]), body,
           _rupees(summary["subtotal"]), ship, _rupees(summary["total"]),
           _truncation_note(summary["line_count"], min(len(lines), MAX_LISTED),
                            "bag lines"))
    )
    state["suggested_actions"] = ["Increase the quantity of the first one",
                                 "Remove the last one", "Proceed to checkout"]
    state["audit_reasoning"] = (
        "Read cart for user %s: %d line(s), %d unit(s), total %s."
        % (user_id, summary["line_count"], summary["item_count"],
           _rupees(summary["total"]))
    )
    return state


def _show_orders(state: AgentState, db: Session, user_id: int) -> AgentState:
    q = db.query(Order).filter(Order.user_id == user_id)
    total_orders = q.count()
    orders = (
        q.order_by(Order.created_at.desc(), Order.id.desc())
        .limit(MAX_LISTED)
        .all()
    )
    if not orders:
        set_focus(state["session_id"], [])
        state["reply"] = ("You have not placed any orders yet. Once you do, I can "
                          "reorder any of them in one line.")
        state["suggested_actions"] = ["Show me my cart", "Show trending footwear"]
        state["audit_reasoning"] = "Read order history for user %s: none." % user_id
        return state

    snapshot, focus = [], []
    for n, order in enumerate(orders, start=1):
        items = _order_items(order)
        snapshot.append({
            "order_id": order.id,
            "items": items,
            "total_amount": order.total_amount,
            "status": order.status,
            "payment_method": order.payment_method,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        })
        focus.append(FocusItem(
            ordinal=n, kind=KIND_ORDER, ref_id=order.id,
            label=_order_label(order, items),
            extra={"total": order.total_amount, "item_count": len(items)},
        ))

    set_focus(state["session_id"], focus)
    state["focus_list"] = [f.to_dict() for f in focus]
    state["orders_snapshot"] = snapshot

    body = "\n".join(
        "%d. **Order #%d** - %s - %s - _%s_"
        % (f.ordinal, f.ref_id, _rupees(f.extra["total"]),
           "%d item%s" % (f.extra["item_count"], "" if f.extra["item_count"] == 1 else "s"),
           o.status)
        for f, o in zip(focus, orders)
    )
    state["reply"] = (
        "Here are your last %d order%s, newest first:\n\n%s\n\n"
        "Say \"put the 2nd one in my cart again\" and I will rebuild it.%s"
        % (len(orders), "" if len(orders) == 1 else "s", body,
           _truncation_note(total_orders, len(orders), "orders", which="most recent"))
    )
    state["suggested_actions"] = ["Put the 2nd one in cart again",
                                 "Open the first one", "Show me my cart"]
    state["audit_reasoning"] = (
        "Read order history for user %s: %d order(s) listed, ordinals 1-%d bound."
        % (user_id, len(orders), len(orders))
    )
    return state


# ── Mutations ───────────────────────────────────────────────────────────────

def _add_product(
    state: AgentState, db: Session, user_id: int, product: Product,
    quantity: int, reason: str, size: Optional[str] = None,
) -> AgentState:
    try:
        line, created, granted = cs.add_line(db, user_id, product, quantity, size)
    except CartError as exc:
        state["reply"] = "I could not add that: %s" % exc
        state["audit_reasoning"] = ("Refused cart add of product %s for user %s: %s"
                                   % (product.id, user_id, exc))
        state["suggested_actions"] = ["Show me my cart", "Find something similar"]
        state["reference_reason"] = reason
        return _refused(state, str(exc))

    short = "%s %s" % (product.brand, product.title)
    ref = FocusItem(1, KIND_CART_ITEM, line.id, short,
                    {"product_id": product.id, "quantity": line.quantity,
                     "size": line.size, "price": product.price})
    set_last_ref(state["session_id"], ref)

    shortfall = ""
    if granted < quantity:
        shortfall = " I could only add %d of the %d you asked for." % (granted, quantity)

    summary = cs.cart_summary(db, user_id)
    state["cart_snapshot"] = summary
    state["action_result"] = {
        "action": "cart_add", "product_id": product.id, "cart_item_id": line.id,
        "quantity": line.quantity, "added": granted, "created_line": created,
        "size": line.size,
    }
    state["reply"] = (
        "Added **%s** (size %s) to your bag at %s.%s Your bag is now %s, "
        "total **%s**."
        % (short, line.size, _rupees(product.price), shortfall,
           _bag_size(summary["line_count"], summary["item_count"]),
           _rupees(summary["total"]))
    )
    state["suggested_actions"] = ["Increase the quantity", "Show me my cart",
                                 "Proceed to checkout"]
    state["audit_reasoning"] = (
        "Added product %s x%d to cart for user %s (%s). Reference resolved by: %s. "
        "Line now at %d of max %d. Cart total %s."
        % (product.id, granted, user_id, short, reason, line.quantity,
           cs.MAX_QTY_PER_LINE, _rupees(summary["total"]))
    )
    state["rating_review_impact"] = (
        "Item carries %s★ across %s reviews." % (product.rating, product.review_count)
    )
    state["reference_reason"] = reason
    return state


def _reorder(
    state: AgentState, db: Session, user_id: int, order_id: int, reason: str,
    *, confirmed: bool = False,
) -> AgentState:
    order = db.query(Order).filter(Order.id == order_id,
                                   Order.user_id == user_id).first()
    if order is None:
        state["reply"] = "I could not find that order on your account any more."
        state["audit_reasoning"] = ("Refused reorder: order %s not found for user %s."
                                   % (order_id, user_id))
        return _refused(state, "order not found")

    wanted = _order_items(order)
    if not wanted:
        state["reply"] = ("Order #%d has no line items I can rebuild - it may predate "
                          "item tracking." % order.id)
        state["audit_reasoning"] = ("Refused reorder of order %s: items_json empty or "
                                    "unreadable." % order.id)
        return _refused(state, "order has no readable line items")

    products = {
        p.id: p for p in
        db.query(Product).filter(Product.id.in_([w["product_id"] for w in wanted])).all()
    }
    live = [(w, products[w["product_id"]]) for w in wanted
            if w["product_id"] in products and products[w["product_id"]].is_active]
    gone = [w for w in wanted if w["product_id"] not in products
            or not products[w["product_id"]].is_active]

    if not live:
        state["reply"] = ("None of the %d item%s from order #%d are still available."
                          % (len(wanted), "" if len(wanted) == 1 else "s", order.id))
        state["audit_reasoning"] = ("Refused reorder of order %s: all %d items inactive "
                                    "or delisted." % (order.id, len(wanted)))
        state["suggested_actions"] = ["Find similar items", "Show me my cart"]
        return _refused(state, "every item in that order is delisted")

    projected = sum(p.price * w["quantity"] for w, p in live)

    # ── The gate.  A reorder can be a five-figure action; above the threshold it
    # does not execute until the user says yes in the next turn.
    if projected >= CONFIRM_ABOVE_INR and not confirmed:
        listing = "\n".join(
            "- %s %s x%d - %s" % (p.brand, p.title, w["quantity"],
                                  _rupees(p.price * w["quantity"]))
            for w, p in live
        )
        set_pending(state["session_id"], {
            "action": "reorder", "order_id": order.id, "amount": projected,
            "reason": reason,
        })
        state["pending_confirmation"] = {
            "action": "reorder", "order_id": order.id, "amount": projected,
            "line_count": len(live),
            "prompt": "Add %d item%s from order #%d to your bag for %s?"
                      % (len(live), "" if len(live) == 1 else "s", order.id,
                         _rupees(projected)),
        }
        state["reply"] = (
            "Order #%d rebuilds to **%s** across %d item%s, which is above my "
            "%s auto-approve limit, so I will not add it without your go-ahead:\n\n%s\n\n"
            "Shall I add these to your bag?"
            % (order.id, _rupees(projected), len(live), "" if len(live) == 1 else "s",
               _rupees(CONFIRM_ABOVE_INR), listing)
        )
        state["suggested_actions"] = ["Yes, add them", "No, cancel"]
        state["audit_reasoning"] = (
            "Reorder of order %s (%s, %d items) exceeds the %s auto-approve ceiling. "
            "Held for explicit user confirmation; no cart mutation performed. "
            "Reference resolved by: %s."
            % (order.id, _rupees(projected), len(live), _rupees(CONFIRM_ABOVE_INR), reason)
        )
        state["reference_reason"] = reason
        return state

    added, refused = [], []
    for w, p in live:
        try:
            line, _created, granted = cs.add_line(db, user_id, p, w["quantity"],
                                                  w.get("size"))
            added.append((p, granted, line))
        except CartError as exc:
            refused.append("%s %s (%s)" % (p.brand, p.title, exc))

    set_pending(state["session_id"], None)
    summary = cs.cart_summary(db, user_id)
    state["cart_snapshot"] = summary

    if added:
        set_last_ref(state["session_id"], FocusItem(
            1, KIND_CART_ITEM, added[-1][2].id,
            "%s %s" % (added[-1][0].brand, added[-1][0].title),
            {"product_id": added[-1][0].id, "quantity": added[-1][2].quantity},
        ))

    notes = []
    if gone:
        notes.append("%d item%s from that order %s no longer available"
                     % (len(gone), "" if len(gone) == 1 else "s",
                        "is" if len(gone) == 1 else "are"))
    if refused:
        notes.append("could not add: %s" % "; ".join(refused))
    tail = (" Note: %s." % "; ".join(notes)) if notes else ""

    body = "\n".join("- %s %s x%d" % (p.brand, p.title, g) for p, g, _ in added)
    state["action_result"] = {
        "action": "reorder", "order_id": order.id,
        "added_product_ids": [p.id for p, _, _ in added],
        "skipped": len(gone) + len(refused),
    }
    state["reply"] = (
        "Rebuilt order #%d in your bag:\n\n%s\n\nYour bag is now %s, total "
        "**%s**.%s"
        % (order.id, body, _bag_size(summary["line_count"], summary["item_count"]),
           _rupees(summary["total"]), tail)
    )
    state["suggested_actions"] = ["Show me my cart", "Proceed to checkout",
                                 "Increase the quantity of the first one"]
    state["audit_reasoning"] = (
        "Reordered order %s for user %s: %d of %d line(s) added%s. Reference resolved "
        "by: %s. Cart total now %s."
        % (order.id, user_id, len(added), len(wanted),
           " (%s)" % "; ".join(notes) if notes else "", reason,
           _rupees(summary["total"]))
    )
    state["reference_reason"] = reason
    return state


def _update_qty(
    state: AgentState, db: Session, user_id: int, res: Resolution,
    qty_mode: str, qty_value: int,
) -> AgentState:
    item = res.item
    line, product = None, None

    if item.kind == KIND_CART_ITEM:
        rows = {i.id: (i, p) for i, p in cs.cart_rows(db, user_id)}
        line, product = rows.get(item.ref_id, (None, None))
    elif item.kind == KIND_PRODUCT:
        # "increase the quantity" while a search result is in focus: act on that
        # product's existing cart line if it has one.
        line = cs.find_line(db, user_id, item.ref_id)
        if line is not None:
            product = db.query(Product).filter(Product.id == line.product_id).first()
        else:
            product = db.query(Product).filter(Product.id == item.ref_id).first()
            if product is not None and qty_value > 0:
                return _add_product(state, db, user_id, product,
                                    qty_value if qty_mode == "set" else max(qty_value, 1),
                                    res.reason)

    if line is None or product is None:
        state["reply"] = ("**%s** is not in your bag, so there is no quantity to "
                          "change. Want me to add it?" % item.label)
        state["audit_reasoning"] = ("Refused quantity change: %s has no cart line for "
                                    "user %s." % (item.label, user_id))
        state["suggested_actions"] = ["Add it to my cart", "Show me my cart"]
        state["reference_reason"] = res.reason
        return _refused(state, "no cart line for that item")

    before = line.quantity
    target = qty_value if qty_mode == "set" else before + qty_value

    try:
        applied, note = cs.set_quantity(db, line, product, target)
    except CartError as exc:
        state["reply"] = "I could not change that quantity: %s" % exc
        state["audit_reasoning"] = ("Refused quantity change on cart line %s: %s"
                                    % (line.id, exc))
        state["reference_reason"] = res.reason
        return _refused(state, str(exc))

    short = "%s %s" % (product.brand, product.title)
    summary = cs.cart_summary(db, user_id)
    state["cart_snapshot"] = summary
    state["action_result"] = {
        "action": "cart_update_qty", "product_id": product.id,
        "cart_item_id": line.id if applied else None,
        "quantity_before": before, "quantity_after": applied, "note": note,
    }

    if applied == 0:
        set_last_ref(state["session_id"], None)
        state["reply"] = ("Quantity hit zero, so I removed **%s** from your bag. Bag "
                          "total is now **%s**." % (short, _rupees(summary["total"])))
    else:
        set_last_ref(state["session_id"], FocusItem(
            1, KIND_CART_ITEM, line.id, short,
            {"product_id": product.id, "quantity": applied},
        ))
        state["reply"] = (
            "**%s** is now **x%d** (was x%d)%s. Line total %s, bag total **%s**."
            % (short, applied, before, " - %s" % note if note else "",
               _rupees(product.price * applied), _rupees(summary["total"]))
        )
    state["suggested_actions"] = ["Show me my cart", "Increase it again",
                                 "Proceed to checkout"]
    state["audit_reasoning"] = (
        "Quantity on cart line %s (product %s) changed %d -> %d for user %s%s. "
        "Reference resolved by: %s. Cart total %s."
        % (line.id, product.id, before, applied, user_id,
           " (%s)" % note if note else "", res.reason, _rupees(summary["total"]))
    )
    state["reference_reason"] = res.reason
    return state


def _remove(state: AgentState, db: Session, user_id: int, res: Resolution) -> AgentState:
    item = res.item
    rows = {i.id: (i, p) for i, p in cs.cart_rows(db, user_id)}

    if item.kind == KIND_CART_ITEM and item.ref_id in rows:
        line, product = rows[item.ref_id]
    else:
        pid = item.ref_id if item.kind == KIND_PRODUCT else item.extra.get("product_id")
        match = next(((i, p) for i, p in rows.values() if p.id == pid), (None, None))
        line, product = match

    if line is None or product is None:
        state["reply"] = "**%s** is not in your bag, so there is nothing to remove." % item.label
        state["audit_reasoning"] = ("Refused removal: %s has no cart line for user %s."
                                    % (item.label, user_id))
        state["suggested_actions"] = ["Show me my cart"]
        state["reference_reason"] = res.reason
        return _refused(state, "that item is not in the cart")

    short = "%s %s" % (product.brand, product.title)
    removed_qty = line.quantity
    db.delete(line)
    db.commit()
    set_last_ref(state["session_id"], None)

    summary = cs.cart_summary(db, user_id)
    state["cart_snapshot"] = summary
    state["action_result"] = {"action": "cart_remove", "product_id": product.id,
                             "quantity_removed": removed_qty}
    state["reply"] = (
        "Removed **%s** (x%d) from your bag. %s"
        % (short, removed_qty,
           "Your bag is now empty." if not summary["items"]
           else "Bag is now %s, total **%s**."
                % (_bag_size(summary["line_count"], summary["item_count"]),
                   _rupees(summary["total"])))
    )
    state["suggested_actions"] = ["Show me my cart", "Find a replacement",
                                 "Proceed to checkout"]
    state["audit_reasoning"] = (
        "Removed cart line %s (product %s x%d) for user %s. Reference resolved by: %s. "
        "Cart total now %s."
        % (line.id, product.id, removed_qty, user_id, res.reason,
           _rupees(summary["total"]))
    )
    state["reference_reason"] = res.reason
    return state


def _clear(state: AgentState, db: Session, user_id: int,
           *, confirmed: bool = False) -> AgentState:
    summary = cs.cart_summary(db, user_id)
    if not summary["items"]:
        state["reply"] = "Your bag is already empty."
        state["audit_reasoning"] = "Clear-cart requested by user %s: already empty." % user_id
        return _refused(state, "cart was already empty")

    # Always gated: emptying a bag is not recoverable from the agent's side.
    if not confirmed:
        set_pending(state["session_id"], {"action": "clear_cart",
                                          "amount": summary["total"]})
        state["pending_confirmation"] = {
            "action": "clear_cart", "amount": summary["total"],
            "line_count": summary["line_count"],
            "prompt": "Empty your bag - %s, %s?"
                      % (_bag_size(summary["line_count"], summary["item_count"]),
                         _rupees(summary["total"])),
        }
        state["reply"] = (
            "That would empty your bag - **%s** worth **%s** - and I cannot undo "
            "it. Confirm and I will clear it."
            % (_bag_size(summary["line_count"], summary["item_count"]),
               _rupees(summary["total"]))
        )
        state["suggested_actions"] = ["Yes, clear my bag", "No, keep it"]
        state["audit_reasoning"] = (
            "Clear-cart held for confirmation for user %s: %d line(s), %s at risk. "
            "No mutation performed." % (user_id, summary["line_count"],
                                        _rupees(summary["total"]))
        )
        return state

    removed = cs.clear_cart(db, user_id)
    set_pending(state["session_id"], None)
    set_focus(state["session_id"], [])
    set_last_ref(state["session_id"], None)
    state["cart_snapshot"] = cs.cart_summary(db, user_id)
    state["action_result"] = {"action": "cart_clear", "lines_removed": removed}
    state["reply"] = ("Cleared your bag - %d line%s removed. Tell me what to look for "
                      "next." % (removed, "" if removed == 1 else "s"))
    state["suggested_actions"] = ["Show trending footwear", "What are my past orders"]
    state["audit_reasoning"] = ("Cleared cart for user %s after explicit confirmation: "
                                "%d line(s) removed." % (user_id, removed))
    return state


def _open(state: AgentState, db: Session, user_id: int, res: Resolution) -> AgentState:
    """Resolve "open the first one" into a client-side navigation."""
    item = res.item

    if item.kind == KIND_ORDER:
        path, what = "/profile", "order #%d" % item.ref_id
    else:
        pid = item.ref_id if item.kind == KIND_PRODUCT else item.extra.get("product_id")
        if not pid:
            return _ask_which(state, Resolution(reason="that item has no product page"),
                              "open anything")
        path, what = "/product/%d" % pid, item.label

        product = db.query(Product).filter(Product.id == pid).first()
        if product is not None:
            state["products"] = [_product_dict(product)]
            # Opening an item does NOT replace the focus list.  The user is still
            # looking at the same numbered list, so "the 2nd one" must keep
            # counting within it; the opened item becomes the implicit referent
            # instead, which is what makes a bare "add it to my cart" work next.
            set_last_ref(state["session_id"], FocusItem(
                item.ordinal, KIND_PRODUCT, product.id,
                "%s %s" % (product.brand, product.title),
                {"price": product.price},
            ))

    state["client_action"] = {"type": "navigate", "path": path,
                              "label": "Open %s" % what}
    state["action_result"] = {"action": "open_item", "kind": item.kind,
                              "ref_id": item.ref_id, "path": path}
    state["reply"] = "Opening **%s** for you now." % what
    state["suggested_actions"] = ["Add it to my cart", "Show me my cart"]
    state["audit_reasoning"] = ("Navigated user %s to %s. Reference resolved by: %s. "
                                "Read-only action, no money impact."
                                % (user_id, path, res.reason))
    state["reference_reason"] = res.reason
    return state


def _product_dict(p: Product) -> Dict[str, Any]:
    """Chat-card shape for a product.  Mirrors routers.products.format_product_dict;
    imported lazily to keep the agent package independent of the HTTP layer."""
    from ...routers.products import format_product_dict

    return format_product_dict(p)


# ── Confirmation handling ───────────────────────────────────────────────────

def _confirm(state: AgentState, db: Session, user_id: int) -> AgentState:
    pending = get_pending(state["session_id"])
    if not pending:
        state["reply"] = ("There is nothing waiting on your confirmation. What would "
                          "you like to do?")
        state["audit_reasoning"] = ("Confirmation received from user %s with no pending "
                                    "action; ignored." % user_id)
        state["suggested_actions"] = ["Show me my cart", "What are my past orders"]
        return _refused(state, "no action was pending")

    set_pending(state["session_id"], None)
    action = pending.get("action")

    if action == "reorder":
        return _reorder(state, db, user_id, int(pending["order_id"]),
                        "user confirmed the gated reorder (%s)"
                        % pending.get("reason", "reference resolved earlier"),
                        confirmed=True)
    if action == "clear_cart":
        return _clear(state, db, user_id, confirmed=True)

    state["reply"] = "That request expired - could you say it again?"
    state["audit_reasoning"] = ("Pending action %r for user %s was not executable."
                                % (action, user_id))
    return _refused(state, "pending action expired")


def _deny(state: AgentState, db: Session, user_id: int) -> AgentState:
    pending = get_pending(state["session_id"])
    set_pending(state["session_id"], None)
    if not pending:
        state["reply"] = "Nothing was pending, so nothing changed."
    else:
        state["reply"] = ("Cancelled - I have not touched your bag. %s"
                          % ("Order left as it was." if pending.get("action") == "reorder"
                             else "Your items are still there."))
    state["suggested_actions"] = ["Show me my cart", "Find something else"]
    state["audit_reasoning"] = ("User %s declined pending action %r. No mutation "
                                "performed." % (user_id, (pending or {}).get("action")))
    return state


# ── Node entrypoint ─────────────────────────────────────────────────────────

def _resolve_cart_then_product(message: str, session_id: str) -> Resolution:
    """
    Resolve against cart lines, falling back to products.

    The fallback exists because "increase the quantity" is legitimate while
    search results are on screen, not just the bag.  But it only applies when the
    cart attempt had *nothing to work with*: if cart items were in focus and the
    reference simply did not fit them ("the 5th one" of three lines), that is the
    real answer and retrying against products would replace a precise complaint
    with a vague one.
    """
    from ..reference import resolve

    res = resolve(message, session_id, kind=KIND_CART_ITEM)
    if res.ok or res.candidates:
        return res
    return resolve(message, session_id, kind=KIND_PRODUCT)


def cart_ops_node(state: AgentState) -> AgentState:
    """Execute one cart/order command against the conversation's focus frame."""
    user_id = state.get("user_id") or 1

    # Cart operations never move money themselves -- payment does.  Leaving these
    # at zero keeps the merchant revenue dashboards honest; the cart value goes
    # into the ledger metadata instead.
    state["money_amount"] = 0.0
    state["profit_impact"] = 0.0
    state.setdefault("focus_list", [])

    db = SessionLocal()
    try:
        state = _dispatch(state, db, user_id)
        # Record the resulting bag on *every* cart turn, including the ones that
        # changed nothing.  A declined row whose cart value equals the previous
        # row's is the proof that the refusal cost the user nothing; without it
        # the ledger says "declined" and leaves the reader to take that on trust.
        if state.get("cart_snapshot") is None:
            state["cart_snapshot"] = cs.cart_summary(db, user_id)
        return state
    finally:
        db.close()


def _dispatch(state: AgentState, db: Session, user_id: int) -> AgentState:
    """Route one parsed command to its executor.  Separated from the node so the
    node can attach the post-action cart snapshot to every outcome."""
    intent = state.get("intent", "")
    session_id = state.get("session_id") or "default"
    message = state.get("user_message", "")
    parsed: Optional[cmd.ParsedCommand] = (state.get("extracted_filters") or {}).get("_command")

    if intent == cmd.VIEW_CART:
        return _show_cart(state, db, user_id)
    if intent == cmd.VIEW_ORDERS:
        return _show_orders(state, db, user_id)
    if intent == cmd.CONFIRM:
        return _confirm(state, db, user_id)
    if intent == cmd.DENY:
        return _deny(state, db, user_id)
    if intent == cmd.CART_CLEAR:
        return _clear(state, db, user_id)

    if intent == cmd.CART_ADD:
        res = _resolve_for_add(message, session_id)
        if not res.ok:
            return _ask_which(state, res, "put anything in your bag")
        if res.item.kind == KIND_ORDER:
            return _reorder(state, db, user_id, res.item.ref_id, res.reason)
        if res.item.kind == KIND_CART_ITEM:
            # "add the 2nd one" with the bag on screen means one more of it.
            return _update_qty(state, db, user_id, res, "delta", 1)
        product = db.query(Product).filter(Product.id == res.item.ref_id).first()
        if product is None:
            return _ask_which(state, Resolution(reason="that product is no longer "
                                                        "in the catalog"),
                              "put anything in your bag")
        return _add_product(state, db, user_id, product, 1, res.reason)

    if intent == cmd.CART_UPDATE_QTY:
        res = _resolve_cart_then_product(message, session_id)
        if not res.ok:
            return _ask_which(state, res, "change a quantity")
        mode = parsed.qty_mode if parsed else "delta"
        value = parsed.qty_value if parsed and parsed.qty_value is not None else 1
        return _update_qty(state, db, user_id, res, mode or "delta", value)

    if intent == cmd.CART_REMOVE:
        if wants_all(message):
            return _clear(state, db, user_id)
        res = _resolve_cart_then_product(message, session_id)
        if not res.ok:
            return _ask_which(state, res, "remove anything")
        return _remove(state, db, user_id, res)

    if intent == cmd.OPEN_ITEM:
        from ..reference import resolve

        res = resolve(message, session_id)
        if not res.ok:
            return _ask_which(state, res, "open anything")
        return _open(state, db, user_id, res)

    # Unreachable via graph routing; defensive so a new intent cannot 500.
    state["reply"] = "I did not follow that. Could you rephrase?"
    state["audit_reasoning"] = "cart_ops_node reached with unhandled intent %r." % intent
    return state


def _resolve_for_add(message: str, session_id: str) -> Resolution:
    """
    Resolve the target of an add/reorder.

    Unlike the other verbs this one is kind-agnostic: a product, a past order and
    an existing bag line are all legitimate things to "add", and which one the
    user meant is decided by what is on screen.
    """
    from ..reference import resolve

    return resolve(message, session_id)
