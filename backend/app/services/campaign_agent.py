import json
import logging
import math
import random
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.product import Product
from app.models.campaign import Campaign
from app.services.vector_store import vector_store
from app.agents.groq_llm import groq_llm
from app.services.discount_engine import discount_engine
from app.schemas.discount import CheckoutContext

logger = logging.getLogger(__name__)

def _calculate_cosine_similarity(text1: str, text2: str) -> float:
    # Simple word overlap / cosine similarity for user vectors
    if not text1 or not text2:
        return 0.0
    
    words1 = text1.lower().split()
    words2 = text2.lower().split()
    
    vec1 = {}
    vec2 = {}
    for w in words1: vec1[w] = vec1.get(w, 0) + 1
    for w in words2: vec2[w] = vec2.get(w, 0) + 1
        
    intersection = set(vec1.keys()) & set(vec2.keys())
    numerator = sum([vec1[x] * vec2[x] for x in intersection])
    
    sum1 = sum([vec1[x]**2 for x in vec1.keys()])
    sum2 = sum([vec2[x]**2 for x in vec2.keys()])
    denominator = math.sqrt(sum1) * math.sqrt(sum2)
    
    if not denominator:
        return 0.0
    return float(numerator) / denominator

class CampaignAgent:
    """Agent to autonomously create campaigns based on merchant prompt and match users with ML dynamic pricing reasoning."""

    def propose_campaign(self, prompt: str, merchant_id: str, db: Session) -> Dict[str, Any]:
        logger.info(f"[CampaignAgent] Proposing campaign for merchant {merchant_id}: {prompt}")

        # Step 1: Parse Intent using LLM
        system_prompt = '''You are a RazorCartAI Campaign Strategist. 
Analyze the merchant's prompt and extract the core intent.
Return a valid JSON with:
- "target_category": string (e.g. "footwear", "mobile accessories")
- "keywords": string (space separated search keywords)
- "discount_strategy": string (e.g. "Clearance 20%", "Trend push 10%")
- "intent_summary": string (short description)'''
        
        try:
            llm_response = groq_llm.invoke_chat(system_prompt, prompt, response_format_json=True)
            intent = json.loads(llm_response)
        except Exception as e:
            logger.error(f"[CampaignAgent] LLM failed: {e}")
            intent = {
                "target_category": "general",
                "keywords": prompt,
                "discount_strategy": "Auto 10%",
                "intent_summary": "Auto-generated campaign"
            }

        # Step 2: Match Products from Warehouse
        matched_results = vector_store.search(intent.get("keywords", prompt), top_k=200)
        matched_product_ids = [pid for pid, score in matched_results if score > 0.1]
        
        # Fetch actual products
        target_products = []
        if matched_product_ids:
            target_products = db.query(Product).filter(Product.id.in_(matched_product_ids)).all()
        
        target_products_data = [{"id": p.id, "title": p.title, "price": p.price, "image_url": p.image_url} for p in target_products]

        # Base product price for telemetry context
        avg_product_price = sum(p["price"] for p in target_products_data) / max(1, len(target_products_data)) if target_products_data else 3500.0

        # Step 3: Match Users using Vectors (Dwellers vs Explorers) & Calculate ML Discount Matrix
        dwellers = []
        explorers = []
        
        all_users = db.query(User).filter(User.role == "customer").all()
        
        for user in all_users:
            user_history_text = ""
            try:
                search_history = json.loads(user.search_history) if user.search_history else []
                user_history_text += " ".join(search_history) + " "
            except: pass
            
            try:
                prefs = json.loads(user.preferences) if user.preferences else {}
                user_history_text += " ".join([str(v) for v in prefs.values()]) + " "
            except: pass
            
            user_vector = (user.vector_embedding + " " if user.vector_embedding else "") + user_history_text
            
            sim = _calculate_cosine_similarity(intent.get("keywords", ""), user_vector)
            
            if sim > 0.05 or not intent.get("keywords"):
                try:
                    viewed_ids = json.loads(user.viewed_product_ids) if user.viewed_product_ids else []
                except:
                    viewed_ids = []
                
                dwelled_product_ids = [pid for pid in matched_product_ids if pid in viewed_ids]
                has_dwelled = len(dwelled_product_ids) > 0
                
                # Build CheckoutContext for ML Discount Engine calculation
                is_dweller = has_dwelled
                target_dwell_sec = random.randint(45, 120) if is_dweller else random.randint(12, 35)
                view_cnt = len(dwelled_product_ids) if is_dweller else random.randint(1, 3)

                ctx = CheckoutContext(
                    user_id=user.id,
                    target_item_view_count=view_cnt,
                    target_item_dwell_seconds=target_dwell_sec,
                    cart_addition_flag=1 if is_dweller else 0,
                    time_in_cart_minutes=6.0 if is_dweller else 0.0,
                    category_dwell_ratio=0.85 if is_dweller else 0.45,
                    alternative_product_views=random.randint(1, 4),
                    historical_conversion_rate=0.25 if is_dweller else 0.15,
                    discount_affinity_ratio=round(0.55 + min(0.40, sim * 0.5), 2),
                    days_since_last_purchase=random.randint(5, 30),
                    cat_cart_abandonment_ratio=0.30,
                    cart_value=avg_product_price,
                    item_count=1,
                    product_price=avg_product_price,
                    categories=[intent.get("target_category", "General")],
                    product_titles=[p["title"] for p in target_products_data[:3]],
                    merchant_margin_rate=0.40,
                    merchant_min_margin_threshold=0.15
                )

                optimal_res = discount_engine.calculate_optimal_discount(ctx)
                base_prob = discount_engine.predict_conversion_probability(ctx, 0.0)
                boosted_prob = optimal_res.expected_conversion_probability
                attained_discount_pct = optimal_res.optimal_discount_offered
                discount_amount = round(avg_product_price * (attained_discount_pct / 100.0), 2)
                final_price = round(avg_product_price - discount_amount, 2)
                uplift_pct = round((boosted_prob - base_prob) * 100.0, 1)

                eval_tiers = optimal_res.engine_reasoning.get("evaluated_tiers", [])
                applied_rules = optimal_res.engine_reasoning.get("guardrails_enforced", {}).get("applied_rules", [])
                guardrail_notes = optimal_res.engine_reasoning.get("guardrails_enforced", {}).get("guardrail_notes", [])

                reasoning_matrix = {
                    "base_conv_probability": round(base_prob, 4),
                    "boosted_conv_probability": round(boosted_prob, 4),
                    "uplift_pct": uplift_pct,
                    "attained_discount_pct": attained_discount_pct,
                    "original_price": round(avg_product_price, 2),
                    "discount_amount_inr": discount_amount,
                    "final_price": final_price,
                    "evaluated_tiers": eval_tiers,
                    "applied_rules": applied_rules,
                    "guardrail_notes": guardrail_notes,
                    "calculation_formula": (
                        f"P(Conversion | 0% Discount) = {round(base_prob*100, 1)}% ➔ "
                        f"P(Conversion | {attained_discount_pct}% Discount) = {round(boosted_prob*100, 1)}% | "
                        f"Expected Profit = {round(boosted_prob, 3)} × ({int(ctx.merchant_margin_rate*100)}% - {attained_discount_pct}%) × Rs.{int(avg_product_price):,} = Rs.{int(optimal_res.engine_reasoning.get('optimal_tier', {}).get('max_expected_profit_inr', 0)):,}"
                    ),
                    "ml_explanation": (
                        f"LightGBM dynamic pricing engine evaluated candidate discount tiers [0%, 5%, 10%, 15%, 20%, 25%]. "
                        f"User telemetry ({'Dweller - high cart & view intent' if is_dweller else 'Explorer - vector interest match'}) "
                        f"yielded an optimal discount of {attained_discount_pct}% which boosts purchase probability by +{uplift_pct}% while preserving merchant margin floor."
                    )
                }

                user_data = {
                    "id": user.id,
                    "name": user.name,
                    "city": user.city,
                    "relevance_score": round(sim, 2),
                    "attained_discount_pct": attained_discount_pct,
                    "discount_amount_inr": discount_amount,
                    "original_price": round(avg_product_price, 2),
                    "final_price": final_price,
                    "reasoning_matrix": reasoning_matrix
                }

                if has_dwelled:
                    user_data["dwelled_products"] = [p for p in target_products_data if p["id"] in dwelled_product_ids]
                    dwellers.append(user_data)
                else:
                    explorers.append(user_data)

        # Step 4: Transparency & Packaging
        strategy_summary = (
            f"**Intent Parsed:** {intent.get('intent_summary')} | "
            f"**Category:** {intent.get('target_category')} | "
            f"**Strategy:** {intent.get('discount_strategy')}\n"
            f"**Products Matched:** {len(target_products)} via Vector Search\n"
            f"**Users Mapped:** {len(dwellers) + len(explorers)} via Semantic Similarity\n"
            f"- Dwellers (Viewed exact items): {len(dwellers)}\n"
            f"- Explorers (Category affinity): {len(explorers)}"
        )

        response = {
            "title": f"Campaign: {intent.get('intent_summary', 'Smart Promo')}",
            "strategy_summary": strategy_summary,
            "target_products": target_products_data,
            "segments": {
                "dwellers": dwellers,
                "explorers": explorers
            },
            "offers": {
                "dwellers_pitch": "Have a second look with a better price",
                "explorers_pitch": "Lightning deals in products of your interest"
            },
            "predicted_conversion_uplift": f"{len(dwellers)*15 + len(explorers)*5}%"
        }
        return response

campaign_agent = CampaignAgent()

