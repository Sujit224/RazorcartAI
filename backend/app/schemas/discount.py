from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CheckoutContext(BaseModel):
    user_id: Optional[int] = 101
    cart_value: float = Field(..., description="Total cart value in INR", example=4999.0)
    item_count: int = Field(default=1, description="Number of items in cart")
    categories: List[str] = Field(default_factory=list, description="List of product categories present in cart", example=["Smartphones", "Accessories"])
    customer_loyalty_tier: str = Field(default="Gold", description="Silver, Gold, Platinum")
    historical_conversion_rate: float = Field(default=0.45, ge=0.0, le=1.0)
    merchant_margin_rate: float = Field(default=0.30, ge=0.0, le=1.0, description="Gross profit margin %")
    competitor_price_ratio: float = Field(default=1.05, description="Our Price / Competitor Price")
    merchant_min_margin_threshold: float = Field(default=0.10, description="Minimum acceptable margin after discount")

    # Guardrail contextual triggers
    product_ids: List[int] = Field(default_factory=list, description="IDs of products in cart for individual product guardrail lookup")
    product_titles: List[str] = Field(default_factory=list, description="Product titles in cart")
    is_new_customer: Optional[bool] = Field(default=None, description="True if new visitor with minimal prior actions")
    user_action_count: int = Field(default=1, description="Number of actions (clicks, searches, views) by user in this session")

    # Exact LightGBM 15-feature telemetry fields (with defaults for non-telemetry requests)
    target_item_view_count: int = Field(default=3, description="Views on the target item")
    target_item_dwell_seconds: float = Field(default=120.0, description="Time spent browsing target item")
    cart_addition_flag: int = Field(default=1, description="1 if item is actively in cart, 0 otherwise")
    time_in_cart_minutes: float = Field(default=4.5, description="Minutes item has resided in current session cart")
    category_dwell_ratio: float = Field(default=0.65, description="Ratio of session time spent in target category")
    alternative_product_views: int = Field(default=2, description="Alternative products viewed in same category")
    discount_affinity_ratio: float = Field(default=0.30, description="Customer responsiveness to historical discounts")
    days_since_last_purchase: float = Field(default=12.0, description="Days since user last transacted")
    cat_cart_abandonment_ratio: float = Field(default=0.28, description="Historical category abandonment baseline")
    product_price: Optional[float] = Field(default=None, description="Price of primary item (defaults to cart_value / item_count)")

class DiscountTierReasoning(BaseModel):
    discount_pct: float
    expected_conversion_rate: float
    unit_profit_margin: float
    expected_profit: float

class OptimalDiscountResponse(BaseModel):
    optimal_discount_offered: float = Field(..., description="Calculated optimal discount percentage (e.g. 5.0, 10.0, 0.0)")
    max_authorized_discount: float
    expected_conversion_probability: float
    engine_reasoning: Dict[str, Any] = Field(..., description="Tier-by-tier mathematical profit maximization breakdown")
