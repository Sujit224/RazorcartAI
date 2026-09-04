import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
from ..schemas.discount import CheckoutContext, OptimalDiscountResponse

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "dynamic_pricing_lgbm.pkl"

LGBM_FEATURE_COLUMNS: List[str] = [
    'discount_offered',
    'target_item_view_count',
    'target_item_dwell_seconds',
    'cart_addition_flag',
    'time_in_cart_minutes',
    'category_dwell_ratio',
    'alternative_product_views',
    'historical_cat_conversion',
    'discount_affinity_ratio',
    'days_since_last_purchase',
    'cat_cart_abandonment_ratio',
    'cart_value',
    'cart_item_count',
    'product_price',
    'profit_margin_pct'
]

class DiscountOptimizationEngine:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        """Loads the LightGBM/Scikit-Learn model if present, otherwise provides mathematical fallback."""
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                print(f"[DiscountEngine] Successfully loaded LightGBM model from {MODEL_PATH}")
            except Exception as e:
                print(f"[DiscountEngine] Failed to load model: {e}. Utilizing probabilistic fallback.")
        else:
            print(f"[DiscountEngine] Model not found at {MODEL_PATH}. Using probabilistic profit-maximizer.")

    def predict_conversion_probability(self, context: CheckoutContext, discount_pct: float) -> float:
        """Infers conversion probability using LightGBM model across 15 telemetry features."""
        if self.model is not None:
            try:
                # Prepare price heuristics
                prod_price = context.product_price if context.product_price else (context.cart_value / max(1, context.item_count))
                margin_pct = context.merchant_margin_rate * 100.0 if context.merchant_margin_rate <= 1.0 else context.merchant_margin_rate
                
                # Construct 15-feature DataFrame matching model schema
                feature_row = {
                    'discount_offered': float(discount_pct / 100.0),
                    'target_item_view_count': int(context.target_item_view_count),
                    'target_item_dwell_seconds': float(context.target_item_dwell_seconds),
                    'cart_addition_flag': int(context.cart_addition_flag),
                    'time_in_cart_minutes': float(context.time_in_cart_minutes),
                    'category_dwell_ratio': float(context.category_dwell_ratio),
                    'alternative_product_views': int(context.alternative_product_views),
                    'historical_cat_conversion': float(context.historical_conversion_rate),
                    'discount_affinity_ratio': float(context.discount_affinity_ratio),
                    'days_since_last_purchase': float(context.days_since_last_purchase),
                    'cat_cart_abandonment_ratio': float(context.cat_cart_abandonment_ratio),
                    'cart_value': float(context.cart_value),
                    'cart_item_count': int(context.item_count),
                    'product_price': float(prod_price),
                    'profit_margin_pct': float(margin_pct)
                }

                df = pd.DataFrame([feature_row], columns=LGBM_FEATURE_COLUMNS)
                probs = self.model.predict_proba(df)[0]
                
                # Probability of positive conversion (class 1)
                prob_conv = probs[1] if len(probs) > 1 else probs[0]
                return float(np.clip(prob_conv, 0.01, 0.99))
            except Exception as e:
                print(f"[DiscountEngine Warning] LightGBM inference error: {e}. Falling back to elasticity math.")
        
        # Exact mathematical conversion curve based on price elasticity & historical rate
        base_rate = context.historical_conversion_rate
        elasticity_lift = (discount_pct / 100.0) * 1.8
        price_penalty = max(0.0, (context.competitor_price_ratio - 1.0) * 0.5)
        raw_prob = base_rate + elasticity_lift - price_penalty
        return float(np.clip(raw_prob, 0.05, 0.95))

    def calculate_optimal_discount(self, context: CheckoutContext) -> OptimalDiscountResponse:
        """
        Evaluates discrete discount tiers [0%, 5%, 10%, 15%, 20%]
        Calculates: Expected Profit = Conversion_Prob * (Margin - Discount) * Cart_Value
        Subject to Merchant Guardrail: Margin - Discount >= min_margin_threshold
        """
        candidate_tiers = [0.0, 5.0, 10.0, 15.0, 20.0]
        max_allowed_discount = max(0.0, (context.merchant_margin_rate - context.merchant_min_margin_threshold) * 100.0)
        
        tier_breakdowns = []
        best_discount = 0.0
        max_expected_profit = -float("inf")
        best_conv_prob = 0.0

        for tier in candidate_tiers:
            # Enforce merchant guardrails
            if tier > max_allowed_discount:
                continue

            conv_prob = self.predict_conversion_probability(context, tier)
            effective_margin_rate = context.merchant_margin_rate - (tier / 100.0)
            expected_profit = conv_prob * (effective_margin_rate * context.cart_value)

            tier_info = {
                "discount_pct": tier,
                "conversion_probability": round(conv_prob, 4),
                "effective_margin_rate": round(effective_margin_rate, 4),
                "expected_profit_inr": round(expected_profit, 2)
            }
            tier_breakdowns.append(tier_info)

            if expected_profit > max_expected_profit:
                max_expected_profit = expected_profit
                best_discount = tier
                best_conv_prob = conv_prob

        # Guardrail: If optimal discount yields less profit than 0% tier, offer 0.0%
        zero_tier_profit = next((t["expected_profit_inr"] for t in tier_breakdowns if t["discount_pct"] == 0.0), 0.0)
        if max_expected_profit <= zero_tier_profit:
            best_discount = 0.0

        engine_reasoning = {
            "model_type": "LightGBM Profit Optimizer" if self.model else "Probabilistic Elasticity Optimizer",
            "evaluated_tiers": tier_breakdowns,
            "optimal_tier": {
                "discount_pct": best_discount,
                "max_expected_profit_inr": round(max_expected_profit, 2),
                "expected_conversion_probability": round(best_conv_prob, 4)
            },
            "guardrails_enforced": {
                "merchant_gross_margin": f"{context.merchant_margin_rate * 100:.1f}%",
                "min_margin_floor": f"{context.merchant_min_margin_threshold * 100:.1f}%",
                "hard_discount_ceiling": f"{max_allowed_discount:.1f}%"
            }
        }

        return OptimalDiscountResponse(
            optimal_discount_offered=best_discount,
            max_authorized_discount=max_allowed_discount,
            expected_conversion_probability=best_conv_prob,
            engine_reasoning=engine_reasoning
        )

discount_engine = DiscountOptimizationEngine()
