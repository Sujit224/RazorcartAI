
import os
import json
from typing import Optional, Dict, Any, List
from groq import Groq
from ..config import settings
from ..services.category_matcher import resolve_category_from_query

class GroqLLMClient:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.model = settings.GROQ_MODEL
        self.client = Groq(api_key=self.api_key) if self.api_key else None

    def invoke_chat(self, system_prompt: str, user_message: str, response_format_json: bool = False) -> str:
        """Call Groq LLM (e.g. LLaMA 3.3 70B) with automatic JSON or text parsing."""
        if not self.client:
            # Fallback to local heuristic intelligence if no Groq API Key provided yet
            return self._heuristic_fallback(system_prompt, user_message, response_format_json)

        try:
            kwargs: Dict[str, Any] = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.2,
                "max_tokens": 1024,
            }
            if response_format_json:
                kwargs["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Groq LLM Warning] Groq API call error: {e}. Utilizing fallback engine.")
            return self._heuristic_fallback(system_prompt, user_message, response_format_json)

    def _heuristic_fallback(self, system_prompt: str, user_message: str, response_format_json: bool) -> str:
        """Robust NLP extraction when GROQ_API_KEY is not configured in local environment."""
        msg = user_message.lower()
        
        # Check for intent
        intent = "discovery"
        if any(w in msg for w in ["checkout", "buy", "pay", "order", "place order"]):
            intent = "checkout"
        elif any(w in msg for w in ["timeout", "gateway error", "server error", "payment stuck"]):
            intent = "recovery_timeout"
        elif any(w in msg for w in ["insufficient", "decline", "budget", "too expensive", "not enough money", "cant afford"]):
            intent = "recovery_funds"
        elif any(w in msg for w in ["pair", "match", "complement", "together", "socks", "cleaner"]):
            intent = "fbt_upsell"

        # Extract filters
        brand = None
        for b in ["nike", "puma", "adidas", "levi's", "roadster", "crep"]:
            if b in msg:
                brand = b.capitalize() if b != "levi's" else "Levi's"
                break

        gender = None
        if "women" in msg or "woman" in msg or "girls" in msg:
            gender = "Women"
        elif "men" in msg or "man" in msg or "boys" in msg:
            gender = "Men"

        category, department = resolve_category_from_query(msg)

        color = None
        for c in ["pink", "coral", "white", "black", "lime", "blue", "navy"]:
            if c in msg:
                color = c.capitalize()
                break

        # Max price heuristic
        import re
        max_price = None
        price_match = re.search(r'(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)', msg)
        if price_match:
            max_price = float(price_match.group(1))

        if response_format_json:
            return json.dumps({
                "intent": intent,
                "filters": {
                    "brand": brand,
                    "gender": gender,
                    "category": category,
                    "department": department,
                    "color": color,
                    "max_price": max_price,
                    "min_rating": 4.0 if "good" in msg or "best" in msg or "rated" in msg else None
                },
                "search_query": user_message,
                "conversational_reply": f"Found the top-rated {brand or 'fashion'} matches with verified customer reviews and ratings."
            })
        
        return f"Here are the top-rated recommendations based on your preferences with verified customer reviews."

groq_llm = GroqLLMClient()

