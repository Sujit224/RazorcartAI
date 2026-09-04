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

# Category-specific merchant guardrail policies
CATEGORY_GUARDRAIL_POLICIES: Dict[str, Dict[str, Any]] = {
    "Smartphones": {
        "base_margin": 0.20,
        "max_discount_cap": 12.0,
        "bulk_bonus_cap": 5.0,
        "policy_description": "Electronics & Mobile Standard Margin (Max 12%, +5% for Bulk)"
    },
    "Electronics": {
        "base_margin": 0.22,
        "max_discount_cap": 15.0,
        "bulk_bonus_cap": 5.0,
        "policy_description": "Consumer Electronics Standard Margin (Max 15%)"
    },
    "Footwear": {
        "base_margin": 0.35,
        "max_discount_cap": 20.0,
        "bulk_bonus_cap": 5.0,
        "policy_description": "Footwear Margin Protection (Max 20%, +5% for Bulk)"
    },
    "Fashion": {
        "base_margin": 0.40,
        "max_discount_cap": 25.0,
        "bulk_bonus_cap": 10.0,
        "policy_description": "Apparel & Fashion Margin (Max 25%, +10% for Bulk)"
    },
    "Topwear": {
        "base_margin": 0.40,
        "max_discount_cap": 25.0,
        "bulk_bonus_cap": 10.0,
        "policy_description": "Topwear Apparel Margin (Max 25%)"
    },
    "Bottomwear": {
        "base_margin": 0.38,
        "max_discount_cap": 25.0,
        "bulk_bonus_cap": 10.0,
        "policy_description": "Bottomwear Margin (Max 25%)"
    },
    "Accessories": {
        "base_margin": 0.45,
        "max_discount_cap": 25.0,
        "bulk_bonus_cap": 10.0,
        "policy_description": "High Margin Accessories (Max 25%, +10% for Bulk)"
    },
    "Appliances": {
        "base_margin": 0.25,
        "max_discount_cap": 15.0,
        "bulk_bonus_cap": 5.0,
        "policy_description": "Home Appliances Standard (Max 15%)"
    },
    "Home & Kitchen": {
        "base_margin": 0.30,
        "max_discount_cap": 20.0,
        "bulk_bonus_cap": 5.0,
        "policy_description": "Home & Living Standard (Max 20%)"
    },
    "Luxury": {
        "base_margin": 0.15,
        "max_discount_cap": 0.0,
        "bulk_bonus_cap": 0.0,
        "policy_description": "Strict Zero-Discount Price Protection (0% Max)"
    },
    "Watches": {
        "base_margin": 0.20,
        "max_discount_cap": 5.0,
        "bulk_bonus_cap": 0.0,
        "policy_description": "Premium Timepieces MAP Protection (Max 5%)"
    }
}

# Brands / Products with Strict Zero-Discount Policy (Brand MAP protection)
STRICT_ZERO_DISCOUNT_BRANDS = [
    "apple",
    "rolex",
    "dyson",
    "playstation",
    "limited edition",
    "exclusive drop",
    "flagship"
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
        Evaluates discrete discount tiers [0%, 5%, 10%, 15%, 20%, 25%] with dynamic merchant guardrails:
        1. Product & Category specific caps (e.g. Luxury vs Fashion).
        2. Strict Zero-Discount Policy (e.g. Apple, Rolex, Limited Drops).
        3. Bulk Purchase Volume Incentives (higher ceiling for item_count >= 3 or cart_value >= 10,000).
        4. New Customer Trust Booster (gives highest allowable discount for new visitors on large carts).
        """
        guardrail_notes = []
        applied_rules = []

        # ── 1. Category Guardrails Resolution ──
        category_caps = []
        for cat in context.categories:
            policy = CATEGORY_GUARDRAIL_POLICIES.get(cat)
            if policy:
                category_caps.append(policy["max_discount_cap"])
                applied_rules.append(f"Category '{cat}': {policy['policy_description']}")
        
        # Default ceiling from margin floor
        margin_floor_ceiling = max(0.0, (context.merchant_margin_rate - context.merchant_min_margin_threshold) * 100.0)
        
        if category_caps:
            base_category_cap = min(category_caps)
            max_allowed_discount = min(margin_floor_ceiling, base_category_cap)
        else:
            max_allowed_discount = margin_floor_ceiling

        # ── 2. Strict Zero-Discount Product Inspection ──
        has_zero_discount_item = False
        zero_item_reason = ""

        # Check titles passed or categories
        combined_text = " ".join((context.product_titles or []) + (context.categories or [])).lower()
        for brand in STRICT_ZERO_DISCOUNT_BRANDS:
            if brand in combined_text:
                has_zero_discount_item = True
                zero_item_reason = f"Brand '{brand.capitalize()}' is under strict Minimum Advertised Price (MAP) policy. 0.0% discount authorized."
                break

        if has_zero_discount_item:
            max_allowed_discount = 0.0
            guardrail_notes.append(f"[MSRP Price Protected] {zero_item_reason}")
            applied_rules.append("Strict Zero-Discount MAP Policy Enforced")

        # ── 3. Bulk Purchase Volume Incentive ──
        is_bulk_purchase = (context.item_count >= 3) or (context.cart_value >= 10000.0)
        if is_bulk_purchase and not has_zero_discount_item:
            bulk_bonus = 5.0 if context.item_count >= 3 else 3.0
            # Ensure bulk bonus doesn't violate minimum margin threshold
            new_ceiling = min(margin_floor_ceiling, max_allowed_discount + bulk_bonus)
            if new_ceiling > max_allowed_discount:
                max_allowed_discount = new_ceiling
            guardrail_notes.append(f"[Bulk Volume Incentive] Authorized +{bulk_bonus}% volume allowance for basket size ({context.item_count} items, Rs. {int(context.cart_value):,}).")
            applied_rules.append(f"Bulk Purchase Volume Bonus (+{bulk_bonus}%)")

        # ── 4. New Customer Trust Acquisition Booster ──
        is_new_user = (
            context.is_new_customer is True or 
            context.days_since_last_purchase == 0 or 
            (context.user_action_count <= 3 and context.historical_conversion_rate <= 0.25)
        )
        is_high_intent_cart = context.cart_value >= 2500.0 or context.item_count >= 2
        
        trust_booster_applied = False
        if is_new_user and is_high_intent_cart and not has_zero_discount_item:
            # Grant maximum safe discount up to merchant margin floor to secure trust and LTV
            trust_booster_applied = True
            max_allowed_discount = margin_floor_ceiling
            guardrail_notes.append("[New Customer Trust Booster] First-time high-value buyer detected. Authorized maximum allowable discount to secure brand trust & prevent first-time dropoff.")
            applied_rules.append("New Customer Acquisition / Trust Booster")

        # ── 5. Evaluate Candidate Discount Tiers ──
        candidate_tiers = [0.0, 5.0, 10.0, 15.0, 20.0, 25.0]
        tier_breakdowns = []
        best_discount = 0.0
        max_expected_profit = -float("inf")
        best_conv_prob = 0.0

        for tier in candidate_tiers:
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

        # Guardrail: If trust booster is active, prioritize winning the customer at the highest safe authorized tier
        if trust_booster_applied and max_allowed_discount > 0.0:
            best_discount = round(max_allowed_discount, 1)
            matching_tier = next((t for t in tier_breakdowns if t["discount_pct"] == best_discount), None)
            if matching_tier:
                best_conv_prob = matching_tier["conversion_probability"]
                max_expected_profit = matching_tier["expected_profit_inr"]
        elif not has_zero_discount_item:
            # Guardrail: If optimal discount yields less profit than 0% tier, offer 0.0%
            zero_tier_profit = next((t["expected_profit_inr"] for t in tier_breakdowns if t["discount_pct"] == 0.0), 0.0)
            if max_expected_profit <= zero_tier_profit:
                best_discount = 0.0
        else:
            best_discount = 0.0

        engine_reasoning = {
            "model_type": "LightGBM Profit Optimizer" if self.model else "Probabilistic Elasticity Optimizer",
            "evaluated_tiers": tier_breakdowns,
            "optimal_tier": {
                "discount_pct": round(best_discount, 1),
                "max_expected_profit_inr": round(max_expected_profit, 2),
                "expected_conversion_probability": round(best_conv_prob, 4)
            },
            "guardrails_enforced": {
                "merchant_gross_margin": f"{context.merchant_margin_rate * 100:.1f}%",
                "min_margin_floor": f"{context.merchant_min_margin_threshold * 100:.1f}%",
                "hard_discount_ceiling": f"{round(max_allowed_discount, 1):.1f}%",
                "applied_rules": applied_rules,
                "guardrail_notes": guardrail_notes
            }
        }

        return OptimalDiscountResponse(
            optimal_discount_offered=round(best_discount, 1),
            max_authorized_discount=round(max_allowed_discount, 1),
            expected_conversion_probability=round(best_conv_prob, 4),
            engine_reasoning=engine_reasoning
        )

discount_engine = DiscountOptimizationEngine()

