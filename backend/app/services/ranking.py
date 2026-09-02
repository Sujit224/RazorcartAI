import math
from typing import List, Dict, Any, Optional

def compute_rating_review_score(rating: float, review_count: int) -> float:
    """
    Computes a Bayesian-inspired rating quality score incorporating both star rating
    and customer review volume (social proof).
    """
    # Normal base rating fraction (e.g., 4.6 / 5.0 = 0.92)
    base_rating_fraction = max(0.0, min(5.0, rating)) / 5.0
    
    # Review volume confidence factor between 0.65 and 1.0 (reaches 1.0 around 250+ reviews)
    review_factor = 0.65 + 0.35 * min(1.0, math.log(1 + max(0, review_count)) / math.log(250))
    
    return base_rating_fraction * review_factor

def rank_products(
    products: List[Any],
    user_city: Optional[str] = None,
    semantic_scores: Optional[Dict[int, float]] = None,
    sort_by: str = "smart_rank",
    has_query: bool = False
) -> List[Any]:
    """
    Ranks products according to smart multi-factor criteria.
    When a search query is active:
    - Search Relevance (80%) dominates
    - Customer Rating & Review Volume (12%) and Seller City Proximity (8%) act as subtle tie-breakers.
    When browsing without a search query:
    - Balanced multi-factor ranking (Rating 35%, City 25%, Base 40%).
    """
    semantic_scores = semantic_scores or {}
    user_city_normalized = (user_city or "").strip().lower()

    scored_items = []
    for p in products:
        sem_sim = semantic_scores.get(p.id, 0.5)
        rating_score = compute_rating_review_score(p.rating, p.review_count)
        
        is_local = bool(user_city_normalized and p.city.lower() == user_city_normalized)
        city_score = 1.0 if is_local else 0.0

        # Smart Multi-Factor Ranking
        if sort_by == "smart_rank":
            if has_query:
                # Search relevance is top priority (80%); rating & city are subtle tie-breakers
                final_score = (0.80 * sem_sim) + (0.12 * rating_score) + (0.08 * city_score)
            else:
                final_score = (0.40 * sem_sim) + (0.35 * rating_score) + (0.25 * city_score)
        elif sort_by == "rating_high":
            if has_query:
                final_score = (0.50 * rating_score) + (0.50 * sem_sim)
            else:
                final_score = (0.80 * rating_score) + (0.20 * sem_sim)
        elif sort_by == "price_low":
            final_score = -float(p.price)
        elif sort_by == "price_high":
            final_score = float(p.price)
        else:
            final_score = (0.80 * sem_sim) + (0.12 * rating_score) + (0.08 * city_score) if has_query else (0.40 * sem_sim) + (0.35 * rating_score) + (0.25 * city_score)

        # Dynamic badge highlighting rating & fast delivery
        badge_parts = []
        if p.rating >= 4.4 and p.review_count >= 50:
            badge_parts.append(f"★ {p.rating} ({p.review_count}+ reviews)")
        if is_local:
            badge_parts.append(f"⚡ Express from {p.city}")

        badge_text = " • ".join(badge_parts) if badge_parts else None

        scored_items.append({
            "product": p,
            "final_score": final_score,
            "is_local_seller": is_local,
            "rating_review_badge": badge_text,
            "rating_score": rating_score,
            "semantic_score": sem_sim
        })

    # Sort descending by final_score
    scored_items.sort(key=lambda x: x["final_score"], reverse=True)
    return scored_items
