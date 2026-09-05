import json
from langchain_core.messages import ToolMessage
from ..state import AgentState
from ..reference import KIND_PRODUCT, FocusItem, set_focus, get_focus
from ...database import SessionLocal
from ...models.product import Product
from .cart_ops import _show_cart, _show_orders, _add_product, _remove, _update_qty, _clear
from .discovery import discovery_node, _build_generic_comparison_response, _extract_comparison_indices

def _resolve_products_from_context(state: AgentState, db, indices=None, pids=None, name=None) -> list:
    """Helper to resolve products from current session context (previous_products / focus) or DB."""
    session_id = state.get("session_id", "default")
    prev_products = state.get("previous_products") or []
    
    # If not in previous_products, check persisted session focus
    if not prev_products:
        saved_focus = get_focus(session_id)
        if saved_focus:
            f_ids = [f.ref_id for f in saved_focus]
            prods_db = db.query(Product).filter(Product.id.in_(f_ids)).all()
            prod_map = {p.id: p for p in prods_db}
            prev_products = [
                {
                    "id": p.id, "title": p.title, "brand": p.brand, "category": p.category,
                    "price": p.price, "original_price": p.original_price, "discount_pct": p.discount_pct,
                    "rating": p.rating, "review_count": p.review_count, "image_url": p.image_url,
                    "description": p.description, "merchant_name": p.merchant_name, "city": p.city,
                    "product_meta": json.loads(p.product_meta) if isinstance(p.product_meta, str) else p.product_meta
                }
                for p in [prod_map[f.ref_id] for f in saved_focus if f.ref_id in prod_map]
            ]
            
    resolved = []
    
    if indices:
        for idx in indices:
            if isinstance(idx, int) and 1 <= idx <= len(prev_products):
                resolved.append(prev_products[idx - 1])
                
    if pids:
        db_prods = db.query(Product).filter(Product.id.in_(pids)).all()
        for p in db_prods:
            resolved.append({
                "id": p.id, "title": p.title, "brand": p.brand, "category": p.category,
                "price": p.price, "original_price": p.original_price, "discount_pct": p.discount_pct,
                "rating": p.rating, "review_count": p.review_count, "image_url": p.image_url,
                "description": p.description, "merchant_name": p.merchant_name, "city": p.city,
                "product_meta": json.loads(p.product_meta) if isinstance(p.product_meta, str) else p.product_meta
            })
            
    if name and not resolved:
        p = db.query(Product).filter(Product.title.ilike(f"%{name}%")).first()
        if p:
            resolved.append({
                "id": p.id, "title": p.title, "brand": p.brand, "category": p.category,
                "price": p.price, "original_price": p.original_price, "discount_pct": p.discount_pct,
                "rating": p.rating, "review_count": p.review_count, "image_url": p.image_url,
                "description": p.description, "merchant_name": p.merchant_name, "city": p.city,
                "product_meta": json.loads(p.product_meta) if isinstance(p.product_meta, str) else p.product_meta
            })
            
    return resolved

def tool_executor_node(state: AgentState) -> dict:
    messages = state.get("messages", [])
    if not messages:
        return {}
        
    last_message = messages[-1]
    if not hasattr(last_message, "tool_calls") or not last_message.tool_calls:
        return {}
        
    tool_messages = []
    session_id = state.get("session_id", "default")
    
    for tool_call in last_message.tool_calls:
        name = tool_call["name"]
        args = tool_call["args"]
        tool_id = tool_call["id"]
        
        print(f"\n🔧 TOOL CALL: {name}")
        print(f"📦 ARGS: {json.dumps(args, indent=2)}")
        
        result_content = "Tool executed successfully."
        
        try:
            db = SessionLocal()
            user_id = state.get("user_id")
            
            if name == "view_cart":
                state = _show_cart(state, db, user_id)
                result_content = json.dumps(state.get("cart_snapshot", {}))
                
            elif name == "get_latest_orders":
                state = _show_orders(state, db, user_id)
                result_content = json.dumps(state.get("orders_snapshot", []))
                
            elif name == "recommend_products":
                state["intent"] = "discovery"
                state["search_query"] = args.get("query", "")
                state["extracted_filters"] = {
                    "brand": args.get("brand"),
                    "department": args.get("department"),
                    "category": args.get("category"),
                    "color": args.get("color"),
                    "min_price": args.get("min_price"),
                    "max_price": args.get("max_price"),
                    "min_rating": args.get("min_rating")
                }
                state = discovery_node(state)
                result_content = f"Found {len(state.get('products', []))} products."
                
            elif name == "get_product_details":
                idx = args.get("product_index")
                pid = args.get("product_id")
                pname = args.get("product_name")
                
                indices = [idx] if idx is not None else None
                pids = [pid] if pid is not None else None
                
                prods = _resolve_products_from_context(state, db, indices=indices, pids=pids, name=pname)
                
                if prods:
                    p = prods[0]
                    meta = p.get("product_meta") or {}
                    if isinstance(meta, str):
                        try: meta = json.loads(meta)
                        except: meta = {}
                        
                    meta_specs = []
                    for k, v in meta.items():
                        if k not in ["returnable", "return_window", "merchant_id", "merchant_name", "department"] and isinstance(v, (str, int, float)):
                            meta_specs.append(f"- **{k.replace('_', ' ').capitalize()}**: {v}")
                    specs_str = "\n".join(meta_specs) if meta_specs else "- Standard specifications apply."
                    
                    details_md = (
                        f"### {p['brand']} {p['title']}\n\n"
                        f"💰 **Price**: Rs. {int(p['price']):,} ({p.get('discount_pct', 0)}% OFF MRP Rs. {int(p.get('original_price', p['price'])):,})\n"
                        f"⭐ **Rating**: {p.get('rating', 4.5)}/5.0 ({p.get('review_count', 0)} verified reviews)\n"
                        f"🏬 **Seller**: {p.get('merchant_name', 'Verified Merchant')} (📍 {p.get('city', 'India')})\n\n"
                        f"#### Technical Specifications:\n{specs_str}\n\n"
                        f"#### Detailed Description:\n{p.get('description', 'High performance product.')}"
                    )
                    state["reply"] = details_md
                    state["products"] = [p]
                    state["focus_list"] = [FocusItem(1, KIND_PRODUCT, p["id"], p["title"], {})]
                    set_focus(session_id, [FocusItem(1, KIND_PRODUCT, p["id"], p["title"], {})])
                    state["suggested_actions"] = [
                        f"Add {p['title']} to Cart",
                        "Compare with other options",
                        "Checkout now"
                    ]
                    result_content = f"Retrieved details for {p['brand']} {p['title']} (ID: {p['id']})."
                else:
                    state["reply"] = "I couldn't locate that specific product. Please specify a valid item number or name."
                    result_content = "Product not found."
                    
            elif name == "compare_products":
                indices = args.get("product_indices") or []
                pids = args.get("product_ids") or []
                pnames = args.get("product_names") or []
                
                # If no indices provided, try to extract from user query
                if not indices and not pids and not pnames:
                    indices = _extract_comparison_indices(state.get("user_message", ""))
                    
                prods = _resolve_products_from_context(state, db, indices=indices, pids=pids)
                
                # Fallback to top 2 if still empty
                if not prods:
                    prev_prods = state.get("previous_products") or []
                    if len(prev_prods) >= 2:
                        prods = prev_prods[:2]
                        
                if prods:
                    state["reply"] = _build_generic_comparison_response(prods)
                    state["products"] = prods
                    state["intent"] = "discovery"
                    focus_items = [FocusItem(i, KIND_PRODUCT, p["id"], p["title"], {}) for i, p in enumerate(prods, 1)]
                    state["focus_list"] = focus_items
                    set_focus(session_id, focus_items)
                    state["suggested_actions"] = [f"Add #{i} to Cart" for i in range(1, len(prods)+1)]
                    result_content = f"Compared {len(prods)} products successfully."
                else:
                    state["reply"] = "Please select at least two items from your search results to compare."
                    result_content = "No products found to compare."
                    
            elif name == "manage_cart":
                action = args.get("action")
                from ..reference import Resolution, FocusItem, KIND_PRODUCT
                
                pid = args.get("product_id")
                idx = args.get("product_index")
                qty = args.get("quantity") or 1
                
                # If product_index was passed instead of product_id, resolve product_id
                if not pid and idx:
                    prods = _resolve_products_from_context(state, db, indices=[idx])
                    if prods:
                        pid = prods[0]["id"]
                
                if action == "add" and pid:
                    product = db.query(Product).filter(Product.id == pid).first()
                    if product:
                        state = _add_product(state, db, user_id, product, qty, "tool invocation")
                        result_content = f"Added {product.title} to cart."
                elif action == "remove" and pid:
                    res = Resolution(item=FocusItem(1, KIND_PRODUCT, pid, str(pid), {}), reason="tool")
                    state = _remove(state, db, user_id, res)
                    result_content = f"Removed item {pid} from cart."
                elif action == "update" and pid:
                    res = Resolution(item=FocusItem(1, KIND_PRODUCT, pid, str(pid), {}), reason="tool")
                    state = _update_qty(state, db, user_id, res, "set", qty)
                    result_content = f"Updated item {pid} quantity to {qty}."
                elif action == "clear":
                    state = _clear(state, db, user_id, confirmed=True)
                    result_content = "Cart cleared."
                    
            elif name == "checkout":
                state["intent"] = "checkout"
                result_content = "Triggered checkout intent."
                
        except Exception as e:
            result_content = f"Error: {str(e)}"
            print(f"❌ ERROR in tool {name}: {e}")
        finally:
            if 'db' in locals():
                db.close()
                
        print(f"📤 TOOL OUTPUT: {result_content}")
        tool_messages.append(ToolMessage(content=result_content, tool_call_id=tool_id))
        
    state_updates = state.copy()
    state_updates["messages"] = tool_messages
    return state_updates

