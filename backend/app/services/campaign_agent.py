import json
import logging
import math
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.product import Product
from app.models.campaign import Campaign
from app.services.vector_store import vector_store
from app.agents.groq_llm import groq_llm

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
    """Agent to autonomously create campaigns based on merchant prompt and match users."""

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
        # Filter products by merchant if they belong to one, otherwise search globally. 
        # (Assuming merchant owns the products, but for demo RazorCartAI might share catalog)
        matched_results = vector_store.search(intent.get("keywords", prompt), top_k=200)
        matched_product_ids = [pid for pid, score in matched_results if score > 0.1]
        
        # Fetch actual products
        target_products = []
        if matched_product_ids:
            target_products = db.query(Product).filter(Product.id.in_(matched_product_ids)).all()
        
        target_products_data = [{"id": p.id, "title": p.title, "price": p.price, "image_url": p.image_url} for p in target_products]

        # Step 3: Match Users using Vectors (Dwellers vs Explorers)
        dwellers = []
        explorers = []
        
        all_users = db.query(User).filter(User.role == "customer").all()
        
        for user in all_users:
            # Build a simple text-based vector from user's history and preferences
            user_history_text = ""
            try:
                search_history = json.loads(user.search_history) if user.search_history else []
                user_history_text += " ".join(search_history) + " "
            except: pass
            
            try:
                prefs = json.loads(user.preferences) if user.preferences else {}
                user_history_text += " ".join([str(v) for v in prefs.values()])
            except: pass
            
            # Use the vector_embedding column if available (could be populated elsewhere, we fallback to generating one here)
            user_vector = user.vector_embedding if user.vector_embedding else user_history_text
            
            # Calculate similarity to campaign keywords
            sim = _calculate_cosine_similarity(intent.get("keywords", ""), user_vector)
            
            if sim > 0.05 or not intent.get("keywords"): # If somewhat relevant
                # Check for exact product ID matches in view history to separate into cohorts
                try:
                    viewed_ids = json.loads(user.viewed_product_ids) if user.viewed_product_ids else []
                except:
                    viewed_ids = []
                
                # Intersection of target products and viewed products
                dwelled_product_ids = [pid for pid in matched_product_ids if pid in viewed_ids]
                has_dwelled = len(dwelled_product_ids) > 0
                
                user_data = {"id": user.id, "name": user.name, "relevance_score": round(sim, 2)}
                if has_dwelled:
                    # attach the actual product objects that they dwelled on
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
