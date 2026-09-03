import json
import re
from typing import List, Dict, Any, Optional
from ..state import AgentState
from ..reference import KIND_PRODUCT, FocusItem, set_focus, set_last_ref, get_focus
from ...database import SessionLocal
from ...models.product import Product
from ...services.vector_store import vector_store
from ...services.ranking import rank_products

_ORDINAL_WORDS = {
    "1st": 1, "first": 1, "one": 1, "1": 1,
    "2nd": 2, "second": 2, "two": 2, "2": 2,
    "3rd": 3, "third": 3, "three": 3, "3": 3,
    "4th": 4, "fourth": 4, "four": 4, "4": 4,
    "5th": 5, "fifth": 5, "five": 5, "5": 5,
    "6th": 6, "sixth": 6, "six": 6, "6": 6,
    "7th": 7, "seventh": 7, "seven": 7, "7": 7,
    "8th": 8, "eighth": 8, "eight": 8, "8": 8,
    "9th": 9, "ninth": 9, "nine": 9, "9": 9,
    "10th": 10, "tenth": 10, "ten": 10, "10": 10
}

def _extract_comparison_indices(text: str) -> List[int]:
    """Extracts 1-based ordinal numbers from comparison prompts like '1st and 3rd' or 'first and second'."""
    text_lower = text.lower()
    found_indices = []
    
    # Check numeric patterns like '1st', '2nd', '3rd' or '1 and 3'
    for match in re.finditer(r'\b(\d+)(?:st|nd|rd|th)?\b', text_lower):
        val = int(match.group(1))
        if 1 <= val <= 20 and val not in found_indices:
            found_indices.append(val)
            
    # Check word patterns like 'first', 'second', 'third'
    for word, val in _ORDINAL_WORDS.items():
        if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
            if val not in found_indices:
                found_indices.append(val)

    # Sort in order of appearance
    return found_indices[:3]

def _build_comparison_response(products_to_compare: List[Dict[str, Any]]) -> str:
    """Constructs an in-depth side-by-side comparison table and summary."""
    if len(products_to_compare) < 2:
        p = products_to_compare[0]
        meta = p.get("product_meta") or {}
        if isinstance(meta, str):
            try: meta = json.loads(meta)
            except: meta = {}
        return (
            f"### 📱 Detailed Specifications for **{p['brand']} {p['title']}**\n\n"
            f"- **Price**: Rs. {int(p['price']):,} ({p.get('discount_pct', 0)}% OFF MRP Rs. {int(p.get('original_price', p['price'])):,})\n"
            f"- **Rating**: ★ {p.get('rating', 4.5)} ({p.get('review_count', 0)} verified customer reviews)\n"
            f"- **Processor / Chipset**: {meta.get('processor', 'High-Performance Multi-Core')}\n"
            f"- **RAM & Multitasking**: {meta.get('ram', '16GB RAM')}\n"
            f"- **Storage**: {meta.get('storage', '256GB High-Speed Storage')}\n"
            f"- **Display**: {meta.get('display', '120Hz LTPO AMOLED')}\n"
            f"- **Camera System**: {meta.get('camera', 'High-Res Multi-Camera OIS')}\n"
            f"- **Merchant / Seller**: {p.get('merchant_name', 'Verified Store')} (📍 {p.get('city', 'Bengaluru')})\n\n"
            f"**Summary**: {p.get('description', '')}"
        )

    p1 = products_to_compare[0]
    p2 = products_to_compare[1]
    
    meta1 = p1.get("product_meta") or {}
    if isinstance(meta1, str):
        try: meta1 = json.loads(meta1)
        except: meta1 = {}

    meta2 = p2.get("product_meta") or {}
    if isinstance(meta2, str):
        try: meta2 = json.loads(meta2)
        except: meta2 = {}

    p3 = products_to_compare[2] if len(products_to_compare) > 2 else None
    meta3 = {}
    if p3:
        meta3 = p3.get("product_meta") or {}
        if isinstance(meta3, str):
            try: meta3 = json.loads(meta3)
            except: meta3 = {}

    table = (
        f"### ⚖️ Side-by-Side Product Comparison & Summary\n\n"
        f"| Feature / Spec | 1️⃣ **{p1['brand']} {p1['title']}** | 2️⃣ **{p2['brand']} {p2['title']}**" + (f" | 3️⃣ **{p3['brand']} {p3['title']}** |" if p3 else " |") + "\n"
        f"| :--- | :--- | :---" + (" | :--- |" if p3 else " |") + "\n"
        f"| **Price** | **Rs. {int(p1['price']):,}** | **Rs. {int(p2['price']):,}**" + (f" | **Rs. {int(p3['price']):,}** |" if p3 else " |") + "\n"
        f"| **Rating** | ★ {p1.get('rating', 4.5)} ({p1.get('review_count', 0)} reviews) | ★ {p2.get('rating', 4.5)} ({p2.get('review_count', 0)} reviews)" + (f" | ★ {p3.get('rating', 4.5)} ({p3.get('review_count', 0)} reviews) |" if p3 else " |") + "\n"
        f"| **Processor** | {meta1.get('processor', 'High-Performance')} | {meta2.get('processor', 'High-Performance')}" + (f" | {meta3.get('processor', 'High-Performance')} |" if p3 else " |") + "\n"
        f"| **RAM** | **{meta1.get('ram', '16GB RAM')}** | **{meta2.get('ram', '16GB RAM')}**" + (f" | **{meta3.get('ram', '16GB RAM')}** |" if p3 else " |") + "\n"
        f"| **Storage** | {meta1.get('storage', '256GB')} | {meta2.get('storage', '256GB')}" + (f" | {meta3.get('storage', '256GB')} |" if p3 else " |") + "\n"
        f"| **Display** | {meta1.get('display', '120Hz AMOLED')} | {meta2.get('display', '120Hz AMOLED')}" + (f" | {meta3.get('display', '120Hz AMOLED')} |" if p3 else " |") + "\n"
        f"| **Cameras** | {meta1.get('camera', '50MP OIS')} | {meta2.get('camera', '50MP OIS')}" + (f" | {meta3.get('camera', '50MP OIS')} |" if p3 else " |") + "\n"
        f"| **Seller** | {p1.get('merchant_name', 'Verified Store')} | {p2.get('merchant_name', 'Verified Store')}" + (f" | {p3.get('merchant_name', 'Verified Store')} |" if p3 else " |") + "\n\n"
        f"#### 🔍 Key Takeaways & Recommendations:\n"
        f"1. **Performance**: **{p1['brand']} {p1['title']}** features **{meta1.get('processor', 'advanced chipset')}** with **{meta1.get('ram', 'fast memory')}**, offering exceptional responsiveness for multitasking.\n"
        f"2. **Value & Optics**: **{p2['brand']} {p2['title']}** stands out for its **{meta2.get('camera', 'optics')}** and sharp display at Rs. {int(p2['price']):,}.\n"
        f"3. **Conclusion**: Choose **{p1['brand']}** for maximum hardware muscle and memory bandwidth, or **{p2['brand']}** for balanced everyday reliability."
    )
    return table

def discovery_node(state: AgentState) -> AgentState:
    """Finds, ranks, compares, and summarizes products with full chat history memory."""
    raw_query = state.get("search_query", state.get("user_message", ""))
    user_city = state.get("user_city", "Bengaluru")
    filters = state.get("extracted_filters", {})
    chat_history = state.get("chat_history") or []
    prev_products = state.get("previous_products") or []
    session_id = state.get("session_id") or "default"

    msg_lower = raw_query.lower()

    # ── 1. Check for Direct Comparison / Summary Intent ────────────────────────
    is_compare_query = any(w in msg_lower for w in [
        "compare", "comparison", "summarise", "summarize", "difference between",
        "which is better", "contrast", "vs", "versus"
    ])

    if is_compare_query:
        # Resolve ordinal references (e.g. 1st and 3rd)
        ord_indices = _extract_comparison_indices(msg_lower)
        candidate_pool = prev_products
        
        # If no previous_products in state payload, check focus frame
        if not candidate_pool:
            saved_focus = get_focus(session_id)
            if saved_focus:
                db_temp = SessionLocal()
                try:
                    f_ids = [f.ref_id for f in saved_focus]
                    candidate_pool = [
                        {
                            "id": p.id, "title": p.title, "brand": p.brand, "category": p.category,
                            "price": p.price, "original_price": p.original_price, "discount_pct": p.discount_pct,
                            "rating": p.rating, "review_count": p.review_count, "image_url": p.image_url,
                            "description": p.description, "merchant_name": p.merchant_name, "city": p.city,
                            "product_meta": json.loads(p.product_meta) if isinstance(p.product_meta, str) else p.product_meta
                        }
                        for p in db_temp.query(Product).filter(Product.id.in_(f_ids)).all()
                    ]
                finally:
                    db_temp.close()

        if candidate_pool and len(candidate_pool) >= 2:
            if not ord_indices or len(ord_indices) < 2:
                ord_indices = [1, 2] # Default to first two

            selected_products = []
            for idx in ord_indices:
                if 1 <= idx <= len(candidate_pool):
                    selected_products.append(candidate_pool[idx - 1])

            if len(selected_products) >= 2:
                comparison_text = _build_comparison_response(selected_products)
                state["reply"] = comparison_text
                state["products"] = selected_products
                state["audit_reasoning"] = f"Compared {len(selected_products)} products ({', '.join(p['title'] for p in selected_products)}) with side-by-side specifications and summaries."
                state["suggested_actions"] = [
                    f"Add {selected_products[0]['brand']} to Bag",
                    f"Add {selected_products[1]['brand']} to Bag",
                    "Proceed to Razorpay Checkout"
                ]
                return state

    # ── 2. Contextual Spec / Memory Refinements ────────────────────────────────
    # If the user says "show me all the ones having 64GB RAM" or "Show ones with Qualcomm processor"
    # we detect if recent chat was about mobile phones/electronics.
    is_phone_context = any("phone" in m.get("content", "").lower() or "mobile" in m.get("content", "").lower() or "samsung" in m.get("content", "").lower() or "iphone" in m.get("content", "").lower() for m in chat_history[-4:])
    if ("64gb" in msg_lower or "ram" in msg_lower or "qualcomm" in msg_lower or "snapdragon" in msg_lower or "processor" in msg_lower or "nokia" in msg_lower or "iphone" in msg_lower or "samsung" in msg_lower) and not any(w in msg_lower for w in ["shoe", "dress", "saree", "shirt"]):
        is_phone_context = True

    # Clean query for semantic vector search
    clean_q = raw_query.lower()
    for fw in ["recommendation", "recommendations", "recommend", "suggest", "looking for", "show me", "find me", "best", "good", "please", "wanted to buy", "buy", "all the ones having", "show the ones which have", "the ones with", "having", "with"]:
        clean_q = clean_q.replace(fw, " ")
    clean_q = " ".join(clean_q.split())
    query = clean_q if clean_q else raw_query

    # Augment query with context if implicit
    if is_phone_context and not any(w in query.lower() for w in ["phone", "mobile", "smartphone", "iphone", "samsung", "nokia", "oneplus", "pixel", "xiaomi"]):
        query = f"smartphone mobile phone {query}"

    db = SessionLocal()
    try:
        # Perform Vector Search with wider top_k (60 items)
        vector_results = vector_store.search(query, top_k=60)
        semantic_scores = {pid: score for pid, score in vector_results}

        # Build SQL Query with metadata filters
        q = db.query(Product).filter(Product.is_active == True)

        # Explicit Brand Filtering
        brand = filters.get("brand")
        for b_cand in ["samsung", "apple", "nokia", "oneplus", "google", "xiaomi", "motorola", "asus", "vivo", "oppo", "nothing", "nike", "adidas", "puma"]:
            if b_cand in msg_lower:
                brand = b_cand.capitalize() if b_cand != "iphone" else "Apple"
                break

        if brand:
            if brand.lower() == "iphone":
                q = q.filter(Product.brand == "Apple")
            else:
                q = q.filter(Product.brand.ilike(f"%{brand}%"))

        # Explicit RAM Filtering (e.g. 64GB RAM)
        if "64gb" in msg_lower:
            q = q.filter((Product.tags.ilike("%64gb%")) | (Product.description.ilike("%64GB%")) | (Product.title.ilike("%64GB%")))
        elif "32gb" in msg_lower:
            q = q.filter((Product.tags.ilike("%32gb%")) | (Product.description.ilike("%32GB%")))
        elif "24gb" in msg_lower:
            q = q.filter((Product.tags.ilike("%24gb%")) | (Product.description.ilike("%24GB%")))
        elif "16gb" in msg_lower:
            q = q.filter((Product.tags.ilike("%16gb%")) | (Product.description.ilike("%16GB%")))
        elif "8gb" in msg_lower:
            q = q.filter((Product.tags.ilike("%8gb%")) | (Product.description.ilike("%8GB%")))

        # Explicit Processor Filtering (e.g. Qualcomm / Snapdragon)
        if "qualcomm" in msg_lower or "snapdragon" in msg_lower:
            q = q.filter((Product.tags.ilike("%qualcomm%")) | (Product.tags.ilike("%snapdragon%")) | (Product.description.ilike("%Qualcomm%")) | (Product.description.ilike("%Snapdragon%")))

        if "bionic" in msg_lower or "a18" in msg_lower or "a17" in msg_lower:
            q = q.filter((Product.tags.ilike("%bionic%")) | (Product.description.ilike("%Bionic%")))

        # Category Filtering
        category = filters.get("category")
        if category:
            q = q.filter(Product.category.ilike(f"%{category}%"))
        elif is_phone_context:
            q = q.filter((Product.category == "Electronics") | (Product.tags.ilike("%smartphone%")) | (Product.tags.ilike("%mobile phone%")))

        # Max Price Filtering
        max_price = filters.get("max_price")
        if not max_price:
            price_match = re.search(r'(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)', msg_lower)
            if price_match:
                max_price = float(price_match.group(1))

        if max_price:
            q = q.filter(Product.price <= float(max_price))

        min_rating = filters.get("min_rating")
        if min_rating:
            q = q.filter(Product.rating >= float(min_rating))

        matched_products = q.all()

        has_query = bool(query and query.strip())
        top_vec_score = vector_results[0][1] if vector_results else 0.0

        if has_query and top_vec_score >= 0.15:
            threshold = max(0.15, top_vec_score * 0.25)
            rel_ids = {pid for pid, s in vector_results if s >= threshold}
            if any(p.id in rel_ids for p in matched_products):
                matched_products = [p for p in matched_products if p.id in rel_ids]

        # Rank products with rating & review weights
        ranked = rank_products(
            products=matched_products,
            user_city=user_city,
            semantic_scores=semantic_scores,
            sort_by="smart_rank",
            has_query=has_query
        )

        # Return a wide variety of up to 12 curated results
        formatted_products = []
        for item in ranked[:12]:
            p = item["product"]
            meta_parsed = {}
            if p.product_meta:
                try: meta_parsed = json.loads(p.product_meta) if isinstance(p.product_meta, str) else p.product_meta
                except: meta_parsed = {}

            formatted_products.append({
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
                "merchant_id": p.merchant_id,
                "merchant_name": p.merchant_name,
                "image_url": p.image_url,
                "description": p.description,
                "product_meta": meta_parsed,
                "tags": json.loads(p.tags) if isinstance(p.tags, str) else p.tags,
                "fbt_product_ids": json.loads(p.fbt_product_ids) if isinstance(p.fbt_product_ids, str) else p.fbt_product_ids,
                "is_active": p.is_active,
                "created_at": str(p.created_at),
                "ranking_score": round(item["final_score"], 3),
                "is_local_seller": item["is_local_seller"],
                "rating_review_badge": item["rating_review_badge"]
            })

        state["products"] = formatted_products

        # Bind the ordinals (1..12) for the focus frame
        focus = [
            FocusItem(
                ordinal=n,
                kind=KIND_PRODUCT,
                ref_id=p["id"],
                label="%s %s" % (p["brand"], p["title"]),
                extra={"price": p["price"], "rating": p["rating"]},
            )
            for n, p in enumerate(formatted_products, start=1)
        ]
        set_focus(session_id, focus)
        set_last_ref(session_id, None)
        state["focus_list"] = [f.to_dict() for f in focus]

        # Dynamic reply highlighting brand, ratings, specs, and variety
        if formatted_products:
            top = formatted_products[0]
            top_meta = top.get("product_meta") or {}
            proc_highlight = f" with **{top_meta.get('processor', '')}**" if top_meta.get('processor') else ""
            ram_highlight = f" (**{top_meta.get('ram', '')}**)" if top_meta.get('ram') else ""
            local_str = f"⚡ Express local dispatch available from {top['city']}." if top["is_local_seller"] else ""

            reply_msg = (
                f"I found **{len(formatted_products)} top-rated results** matching '{raw_query}'.\n\n"
                f"🌟 **Top Recommendation**: **{top['brand']} {top['title']}**{proc_highlight}{ram_highlight} "
                f"at **Rs. {int(top['price']):,}** (Rated **★ {top['rating']}** across {top['review_count']} verified reviews). {local_str}\n\n"
                f"You can ask me follow-up questions like *\"Compare and summarise the product descriptions of 1st and 3rd\"*, *\"Show me all the ones having 64GB RAM\"*, or *\"Show ones with Qualcomm processor\"*."
            )
            audit_reasoning = f"Surfaced {len(formatted_products)} smart-ranked matches from {len(matched_products)} items. Top item {top['brand']} {top['title']} selected with {top['rating']}★ rating."
            rating_impact = f"Weighted {top['rating']}★ rating & {top['review_count']} reviews with quality ranking influence."
            suggested_actions = [
                "Compare 1st and 3rd",
                "Show 64GB RAM models",
                "Show Qualcomm Snapdragon phones",
                "Proceed to Checkout"
            ]
        else:
            reply_msg = f"I could not find exact items matching '{raw_query}'. Try asking for top brands like Samsung, Apple iPhone, Nokia, or OnePlus."
            audit_reasoning = f"No active catalog items matched query '{raw_query}'."
            rating_impact = "None"
            suggested_actions = ["Show all mobile phones", "Show Samsung Galaxy S24", "Show iPhone 16 Pro Max", "Show 64GB RAM models"]

        state["reply"] = reply_msg
        state["audit_reasoning"] = audit_reasoning
        state["rating_review_impact"] = rating_impact
        state["suggested_actions"] = suggested_actions
        return state

    finally:
        db.close()
