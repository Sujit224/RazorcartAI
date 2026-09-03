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

    return found_indices[:3]

def _build_generic_comparison_response(products: List[Dict[str, Any]]) -> str:
    """Dynamically builds a side-by-side comparison table for ANY category of products."""
    if not products:
        return "Please specify which products you would like me to compare."

    if len(products) == 1:
        p = products[0]
        meta = p.get("product_meta") or {}
        if isinstance(meta, str):
            try: meta = json.loads(meta)
            except: meta = {}
        
        meta_bullets = "\n".join(f"- **{k.capitalize()}**: {v}" for k, v in meta.items() if isinstance(v, (str, int, float)) and k not in ["returnable", "return_window"])
        return (
            f"### Product Overview: **{p['brand']} {p['title']}**\n\n"
            f"- **Price**: Rs. {int(p['price']):,} ({p.get('discount_pct', 0)}% OFF MRP Rs. {int(p.get('original_price', p['price'])):,})\n"
            f"- **Rating**: {p.get('rating', 4.5)}/5.0 ({p.get('review_count', 0)} verified reviews)\n"
            f"- **Category**: {p.get('category', 'General')}\n"
            f"- **Merchant**: {p.get('merchant_name', 'Verified Seller')} (📍 {p.get('city', 'India')})\n"
            f"{meta_bullets}\n\n"
            f"**Description**: {p.get('description', '')}"
        )

    p1, p2 = products[0], products[1]
    p3 = products[2] if len(products) > 2 else None

    meta1 = p1.get("product_meta") or {}
    if isinstance(meta1, str):
        try: meta1 = json.loads(meta1)
        except: meta1 = {}

    meta2 = p2.get("product_meta") or {}
    if isinstance(meta2, str):
        try: meta2 = json.loads(meta2)
        except: meta2 = {}

    meta3 = {}
    if p3:
        meta3 = p3.get("product_meta") or {}
        if isinstance(meta3, str):
            try: meta3 = json.loads(meta3)
            except: meta3 = {}

    # Collect unique attribute keys across compared items
    all_keys = list(dict.fromkeys(list(meta1.keys()) + list(meta2.keys()) + (list(meta3.keys()) if p3 else [])))
    spec_keys = [k for k in all_keys if k not in ["returnable", "return_window", "merchant_id", "merchant_name", "warranty"]]

    table = (
        f"### Side-by-Side Comparison & Summary\n\n"
        f"| Feature / Specification | 1. **{p1['brand']} {p1['title']}** | 2. **{p2['brand']} {p2['title']}**" + (f" | 3. **{p3['brand']} {p3['title']}** |" if p3 else " |") + "\n"
        f"| :--- | :--- | :---" + (" | :--- |" if p3 else " |") + "\n"
        f"| **Price** | **Rs. {int(p1['price']):,}** ({p1.get('discount_pct', 0)}% OFF) | **Rs. {int(p2['price']):,}** ({p2.get('discount_pct', 0)}% OFF)" + (f" | **Rs. {int(p3['price']):,}** ({p3.get('discount_pct', 0)}% OFF) |" if p3 else " |") + "\n"
        f"| **Rating & Reviews** | ★ {p1.get('rating', 4.5)} ({p1.get('review_count', 0)} reviews) | ★ {p2.get('rating', 4.5)} ({p2.get('review_count', 0)} reviews)" + (f" | ★ {p3.get('rating', 4.5)} ({p3.get('review_count', 0)} reviews) |" if p3 else " |") + "\n"
        f"| **Department / Category** | {p1.get('category', '-')} | {p2.get('category', '-')}" + (f" | {p3.get('category', '-')} |" if p3 else " |") + "\n"
        f"| **Verified Seller** | {p1.get('merchant_name', 'Verified')} (📍 {p1.get('city', '')}) | {p2.get('merchant_name', 'Verified')} (📍 {p2.get('city', '')})" + (f" | {p3.get('merchant_name', 'Verified')} (📍 {p3.get('city', '')}) |" if p3 else " |") + "\n"
    )

    for k in spec_keys[:5]:
        v1 = meta1.get(k, "-")
        v2 = meta2.get(k, "-")
        v3 = meta3.get(k, "-") if p3 else None
        table += f"| **{k.replace('_', ' ').capitalize()}** | {v1} | {v2}" + (f" | {v3} |" if p3 else " |") + "\n"

    table += (
        f"\n#### Key Comparison Takeaways:\n"
        f"1. **{p1['brand']} {p1['title']}** is priced at **Rs. {int(p1['price']):,}** with a verified rating of **★ {p1.get('rating', 4.5)}**.\n"
        f"2. **{p2['brand']} {p2['title']}** is priced at **Rs. {int(p2['price']):,}** with a verified rating of **★ {p2.get('rating', 4.5)}**.\n"
        f"3. **Recommendation**: Both options offer stellar quality backed by authentic merchant guarantees. Choose **{p1['brand']}** for its specific design profile, or **{p2['brand']}** for value."
    )
    return table

def discovery_node(state: AgentState) -> AgentState:
    """
    Completely generalized, domain-agnostic discovery and ranking engine.
    Works seamlessly across all 12 store departments (Fashion, Electronics, Home, Kitchen, Appliances, etc.).
    """
    raw_query = state.get("search_query", state.get("user_message", ""))
    user_city = state.get("user_city", "Bengaluru")
    filters = state.get("extracted_filters", {}) or {}
    prev_products = state.get("previous_products") or []
    session_id = state.get("session_id") or "default"

    msg_lower = state.get("user_message", "").lower()

    # ── 1. Check for Product Comparison Intent ──────────────────────────────
    is_compare = any(w in msg_lower for w in [
        "compare", "comparison", "summarise", "summarize", "difference between",
        "which is better", "contrast", "vs", "versus"
    ])

    if is_compare:
        ord_indices = _extract_comparison_indices(msg_lower)
        candidate_pool = prev_products

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

        if candidate_pool:
            if not ord_indices or len(ord_indices) < 2:
                ord_indices = [1, 2]

            selected = [candidate_pool[i - 1] for i in ord_indices if 1 <= i <= len(candidate_pool)]
            if selected:
                state["reply"] = _build_generic_comparison_response(selected)
                state["products"] = selected
                state["audit_reasoning"] = f"Generated generalized comparison for {len(selected)} items."
                state["suggested_actions"] = [
                    f"Add {selected[0]['brand']} to Bag",
                    f"Add {selected[1]['brand'] if len(selected) > 1 else selected[0]['brand']} to Bag",
                    "Proceed to Checkout"
                ]
                return state

    # ── 2. Generalized Attribute & Vector Search ─────────────────────────────
    # Extract Price Range (between X and Y, from X to Y, under X, above Y)
    min_price = filters.get("min_price")
    max_price = filters.get("max_price")

    if not min_price and not max_price:
        range_match = re.search(r'(?:between|from)?\s*(?:rs\.?|inr|₹)?\s*(\d+)\s*(?:-|to|and)\s*(?:rs\.?|inr|₹)?\s*(\d+)', msg_lower)
        if range_match:
            val1 = float(range_match.group(1))
            val2 = float(range_match.group(2))
            min_price = min(val1, val2)
            max_price = max(val1, val2)
        else:
            under_match = re.search(r'(?:under|below|less than|within|around|upto|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+)', msg_lower)
            if under_match:
                max_price = float(under_match.group(1))
            above_match = re.search(r'(?:above|over|more than|exceeding|from)\s*(?:rs\.?|inr|₹)?\s*(\d+)', msg_lower)
            if above_match:
                min_price = float(above_match.group(1))

    # Clean semantic search query
    clean_q = raw_query.lower()
    for fw in ["recommendation", "recommendations", "recommend", "suggest", "looking for", "show me", "find me", "help me find", "help me", "best", "good", "cool", "great", "latest", "new", "hot", "nice", "awesome", "please", "wanted to buy", "buy", "all the ones having", "show the ones which have", "the ones with", "having", "with"]:
        clean_q = re.sub(r'\b' + re.escape(fw) + r'\b', ' ', clean_q, flags=re.I)

    # Strip price range clauses
    clean_q = re.sub(r'(?:between|from)?\s*(?:rs\.?|inr|₹)?\s*\d+\s*(?:-|to|and)\s*(?:rs\.?|inr|₹)?\s*\d+\s*(?:/|-)?', ' ', clean_q, flags=re.I)
    clean_q = re.sub(r'(?:under|below|less than|within|around|upto|up to|above|over|more than)\s*(?:rs\.?|inr|₹)?\s*\d+\s*(?:/|-|k)?', ' ', clean_q, flags=re.I)
    clean_q = re.sub(r'(?:rs\.?|inr|₹)\s*\d+', ' ', clean_q, flags=re.I)
    clean_q = re.sub(r'\b\d{3,6}\s*(?:/|-)?\b', ' ', clean_q)
    clean_q = " ".join(clean_q.split())
    query = clean_q if clean_q else raw_query

    db = SessionLocal()
    try:
        # Perform Vector Search across entire catalog
        vector_results = vector_store.search(query, top_k=100)
        semantic_scores = {pid: score for pid, score in vector_results}

        # Build Dynamic SQL Query based on extracted generic filters
        q = db.query(Product).filter(Product.is_active == True)

        # Dynamic Brand Filter
        brand = filters.get("brand")
        if brand:
            q = q.filter(Product.brand.ilike(f"%{brand}%"))

        # Canonical Category & Department Filter (LLM + Regex Ontology Scoping)
        from ...services.category_matcher import resolve_category_from_query
        from sqlalchemy import or_

        extracted_cat = filters.get("category")
        canon_cat, canon_dept = resolve_category_from_query(raw_query, extracted_cat)

        if canon_cat or canon_dept:
            cat_conditions = []
            if canon_cat:
                cat_clean = canon_cat.strip().lower()
                cat_stem = cat_clean.rstrip('s')
                cat_conditions.extend([
                    Product.category.ilike(f"%{cat_clean}%"),
                    Product.category.ilike(f"%{cat_stem}%"),
                    Product.tags.ilike(f"%{cat_clean}%"),
                    Product.tags.ilike(f"%{cat_stem}%"),
                ])
            if canon_dept:
                cat_conditions.extend([
                    Product.department.ilike(f"%{canon_dept}%"),
                ])
            if cat_conditions:
                q = q.filter(or_(*cat_conditions))

        # Dynamic Gender Filter
        gender = filters.get("gender")
        if gender:
            q = q.filter(Product.gender.in_([gender, "Unisex"]))

        # Dynamic Color Filter
        color = filters.get("color")
        if color:
            q = q.filter(Product.color.ilike(f"%{color}%"))

        # Dynamic Price Range Filtering (min_price & max_price)
        if min_price:
            q = q.filter(Product.price >= float(min_price))
        if max_price:
            q = q.filter(Product.price <= float(max_price))

        # Dynamic Rating Filtering
        min_rating = filters.get("min_rating")
        if min_rating:
            q = q.filter(Product.rating >= float(min_rating))

        # Dynamic Spec / Keyword Filtering
        spec_keywords = filters.get("spec_keywords") or []
        if isinstance(spec_keywords, list):
            for kw in spec_keywords:
                if kw and len(kw.strip()) > 1:
                    kw_clean = kw.strip()
                    q = q.filter(
                        (Product.title.ilike(f"%{kw_clean}%")) |
                        (Product.tags.ilike(f"%{kw_clean}%")) |
                        (Product.description.ilike(f"%{kw_clean}%")) |
                        (Product.product_meta.ilike(f"%{kw_clean}%"))
                    )

        matched_products = q.all()

        has_query = bool(query and query.strip())
        top_vec_score = vector_results[0][1] if vector_results else 0.0

        if has_query and top_vec_score >= 0.04:
            threshold = max(0.04, top_vec_score * 0.35)
            rel_ids = {pid for pid, s in vector_results if s >= threshold}
            if any(p.id in rel_ids for p in matched_products):
                matched_products = [p for p in matched_products if p.id in rel_ids]

        # Graceful fallback: If strict price filter returned 0, show closest category options
        is_relaxed_fallback = False
        if not matched_products and vector_results:
            fallback_q = db.query(Product).filter(Product.is_active == True)
            if category:
                cat_clean = category.strip().lower().rstrip('s')
                fallback_q = fallback_q.filter((Product.category.ilike(f"%{cat_clean}%")) | (Product.tags.ilike(f"%{cat_clean}%")))
            elif brand:
                fallback_q = fallback_q.filter(Product.brand.ilike(f"%{brand}%"))
            matched_products = fallback_q.limit(12).all()
            if matched_products:
                is_relaxed_fallback = True

        # Multi-factor smart ranking (quality, reviews, seller proximity)
        ranked = rank_products(
            products=matched_products,
            user_city=user_city,
            semantic_scores=semantic_scores,
            sort_by="smart_rank",
            has_query=has_query
        )

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

        # Set Focus List
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

        if formatted_products:
            top = formatted_products[0]
            local_str = f"⚡ Express dispatch available from {top['city']}." if top["is_local_seller"] else ""
            if is_relaxed_fallback:
                reply_msg = (
                    f"I couldn't find exact items within that specific budget range, but here are the **top-rated {category or 'closest'} alternatives** from our catalog:\n\n"
                    f"🌟 **Top Recommendation**: **{top['brand']} {top['title']}** at **Rs. {int(top['price']):,}** "
                    f"(Rated **★ {top['rating']}** across {top['review_count']} reviews). {local_str}"
                )
            else:
                price_context = f" between Rs. {int(min_price):,} - Rs. {int(max_price):,}" if (min_price and max_price) else (f" under Rs. {int(max_price):,}" if max_price else "")
                reply_msg = (
                    f"I found **{len(formatted_products)} top-rated results** matching your query{price_context}.\n\n"
                    f"🌟 **Top Pick**: **{top['brand']} {top['title']}** "
                    f"at **Rs. {int(top['price']):,}** (Rated **★ {top['rating']}** across {top['review_count']} verified reviews). {local_str}\n\n"
                    f"Ask me to *\"Compare 1st and 3rd\"*, refine by brand, budget, or specifications."
                )
            audit_reasoning = f"Evaluated {len(matched_products)} candidates across quality, rating weights, and vector relevance. Top pick: {top['brand']} {top['title']}."
            rating_impact = f"Weighted {top['rating']}★ rating & {top['review_count']} reviews with quality ranking influence."
            suggested_actions = [
                "Compare 1st and 2nd",
                "Show under ₹10,000",
                "Show highest rated",
                "Proceed to Checkout"
            ]
        else:
            reply_msg = f"I could not find exact items matching '{raw_query}'. Try broadening your search or exploring popular categories."
            audit_reasoning = f"No active catalog items matched query '{raw_query}'."
            rating_impact = "None"
            suggested_actions = ["Show top electronics", "Show running shoes", "Show trending fashion", "Show home appliances"]

        state["reply"] = reply_msg
        state["audit_reasoning"] = audit_reasoning
        state["rating_review_impact"] = rating_impact
        state["suggested_actions"] = suggested_actions
        return state

    finally:
        db.close()
