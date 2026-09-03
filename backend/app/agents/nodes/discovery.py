import json
from typing import List, Dict, Any
from ..state import AgentState
from ..reference import KIND_PRODUCT, FocusItem, set_focus, set_last_ref
from ...database import SessionLocal
from ...models.product import Product
from ...services.vector_store import vector_store
from ...services.ranking import rank_products

def discovery_node(state: AgentState) -> AgentState:
    """Finds and ranks products based on vector similarity, customer ratings/reviews, and seller city."""
    raw_query = state.get("search_query", state.get("user_message", ""))
    user_city = state.get("user_city", "Bengaluru")
    filters = state.get("extracted_filters", {})

    # Strip conversational filler phrases for cleaner vector retrieval
    clean_q = raw_query.lower()
    for fw in ["recommendation", "recommendations", "recommend", "suggest", "looking for", "show me", "find me", "best", "good", "please", "wanted to buy", "buy"]:
        clean_q = clean_q.replace(fw, " ")
    clean_q = " ".join(clean_q.split())
    query = clean_q if clean_q else raw_query

    db = SessionLocal()
    try:
        # Perform Vector Search
        vector_results = vector_store.search(query, top_k=25)
        semantic_scores = {pid: score for pid, score in vector_results}

        # Build SQL Query with metadata filters
        q = db.query(Product).filter(Product.is_active == True)

        brand = filters.get("brand")
        if brand:
            q = q.filter(Product.brand.ilike(f"%{brand}%"))

        gender = filters.get("gender")
        if gender:
            q = q.filter(Product.gender.in_([gender, "Unisex"]))

        category = filters.get("category")
        if category:
            q = q.filter(Product.category.ilike(f"%{category}%"))

        color = filters.get("color")
        if color:
            q = q.filter(Product.color.ilike(f"%{color}%"))

        max_price = filters.get("max_price")
        if max_price:
            q = q.filter(Product.price <= float(max_price))

        min_rating = filters.get("min_rating")
        if min_rating:
            q = q.filter(Product.rating >= float(min_rating))

        matched_products = q.all()

        has_query = bool(query and query.strip())
        top_vec_score = vector_results[0][1] if vector_results else 0.0

        if has_query and top_vec_score >= 0.20:
            threshold = max(0.20, top_vec_score * 0.35)
            rel_ids = {pid for pid, s in vector_results if s >= threshold}
            matched_products = [p for p in matched_products if p.id in rel_ids]
        elif has_query and top_vec_score < 0.20:
            # Query has no relevant matches in the catalog (e.g. electronics, appliances)
            matched_products = []

        # Rank products with rating & review weights
        ranked = rank_products(
            products=matched_products,
            user_city=user_city,
            semantic_scores=semantic_scores,
            sort_by="smart_rank",
            has_query=has_query
        )

        formatted_products = []
        for item in ranked[:8]:
            p = item["product"]
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
                "image_url": p.image_url,
                "description": p.description,
                "tags": json.loads(p.tags) if isinstance(p.tags, str) else p.tags,
                "fbt_product_ids": json.loads(p.fbt_product_ids) if isinstance(p.fbt_product_ids, str) else p.fbt_product_ids,
                "is_active": p.is_active,
                "created_at": str(p.created_at),
                "ranking_score": round(item["final_score"], 3),
                "is_local_seller": item["is_local_seller"],
                "rating_review_badge": item["rating_review_badge"]
            })

        state["products"] = formatted_products

        # Bind the ordinals the user is about to see.  Without this, "open the
        # first one" in the very next turn has nothing to resolve against -- the
        # numbering exists only in the rendered chat bubble, so it has to be
        # recorded server-side at the moment it is produced.
        session_id = state.get("session_id") or "default"
        focus = [
            FocusItem(
                ordinal=n,
                kind=KIND_PRODUCT,
                ref_id=p["id"],
                label="%s %s" % (p["brand"], p["title"]),
                extra={"price": p["price"], "rating": p["rating"]},
            )
            for n, p in enumerate(formatted_products[:10], start=1)
        ]
        set_focus(session_id, focus)
        # A fresh search invalidates "it" -- the previous turn's item is no
        # longer what the user is looking at.
        set_last_ref(session_id, None)
        state["focus_list"] = [f.to_dict() for f in focus]

        # Build dynamic reply highlighting ratings and reviews
        if formatted_products:
            top = formatted_products[0]
            local_str = f"⚡ Express dispatch available from {top['city']}." if top["is_local_seller"] else ""
            reply_msg = (
                f"I found {len(formatted_products)} curated matches for '{query}'. "
                f"Top pick: **{top['brand']} {top['title']}** (Rated **{top['rating']}★** across **{top['review_count']} verified reviews** for Rs. {int(top['price'])}). "
                f"{local_str}"
            )
            audit_reasoning = f"Smart-ranked {len(matched_products)} items. Top item {top['brand']} {top['title']} selected with {top['rating']}★ rating and {top['review_count']} reviews (score: {top['ranking_score']})."
            rating_impact = f"Weighted {top['rating']}★ rating & {top['review_count']} reviews with quality ranking influence."
            suggested_actions = [
                "Add the first one to my bag",
                "Open the first one",
                "Show me my cart"
            ]
        else:
            reply_msg = (
                f"We currently don't have matching products for '{query}' in our catalog. "
                "RazorCartAI currently specializes in **Fashion, Apparel & Lifestyle** (Footwear, Topwear, Bottomwear, Ethnic Wear, Sportswear & Accessories). "
                "Would you like to explore our latest fashion collections or top-rated footwear?"
            )
            audit_reasoning = f"No catalog matches found for out-of-scope query '{query}' (max relevance {top_vec_score:.2f} < 0.20)."
            rating_impact = "No matching items to rank."
            suggested_actions = [
                "Show trending Footwear",
                "Show Topwear & Shirts",
                "Browse All Collections"
            ]

        state["reply"] = reply_msg
        state["audit_reasoning"] = audit_reasoning
        state["rating_review_impact"] = rating_impact
        state["suggested_actions"] = suggested_actions

    finally:
        db.close()

    return state
