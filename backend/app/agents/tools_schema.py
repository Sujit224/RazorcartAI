from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import Optional, List

class ViewCartInput(BaseModel):
    pass

@tool("view_cart", args_schema=ViewCartInput)
def view_cart() -> str:
    """View the items currently in the user's cart."""
    pass

class GetLatestOrdersInput(BaseModel):
    pass

@tool("get_latest_orders", args_schema=GetLatestOrdersInput)
def get_latest_orders() -> str:
    """Retrieve the user's recent order history."""
    pass

class RecommendProductsInput(BaseModel):
    query: str = Field(..., description="The semantic search query for products.")
    brand: Optional[str] = Field(None, description="The brand of the product (e.g. Nike, Apple).")
    department: Optional[str] = Field(None, description="Department like Electronics, Fashion, etc.")
    category: Optional[str] = Field(None, description="Sub-category like Footwear, Smartphones.")
    color: Optional[str] = Field(None, description="Color of the product.")
    max_price: Optional[float] = Field(None, description="Maximum price user is willing to pay.")
    min_rating: Optional[float] = Field(None, description="Minimum rating.")

@tool("recommend_products", args_schema=RecommendProductsInput)
def recommend_products(query: str, brand: Optional[str] = None, department: Optional[str] = None, category: Optional[str] = None, color: Optional[str] = None, max_price: Optional[float] = None, min_rating: Optional[float] = None) -> str:
    """Search and recommend products based on user filters and preferences."""
    pass

class ManageCartInput(BaseModel):
    action: str = Field(..., description="Action to perform: 'add', 'remove', 'update', 'clear'.")
    product_id: Optional[int] = Field(None, description="The ID of the product to act upon.")
    quantity: Optional[int] = Field(None, description="The quantity to add or update to.")

@tool("manage_cart", args_schema=ManageCartInput)
def manage_cart(action: str, product_id: Optional[int] = None, quantity: Optional[int] = None) -> str:
    """Manage the user's cart by adding, removing, updating items or clearing the cart."""
    pass

class CheckoutInput(BaseModel):
    pass

@tool("checkout", args_schema=CheckoutInput)
def checkout() -> str:
    """Initiate the checkout process for the items in the cart."""
    pass

class GetProductDetailsInput(BaseModel):
    product_index: Optional[int] = Field(None, description="The 1-based index of the product from the current list (e.g. 1 for 1st, 2 for 2nd, 9 for 9th, 10 for 10th).")
    product_id: Optional[int] = Field(None, description="The unique database ID of the product if known.")
    product_name: Optional[str] = Field(None, description="The title or brand name of the product.")

@tool("get_product_details", args_schema=GetProductDetailsInput)
def get_product_details(product_index: Optional[int] = None, product_id: Optional[int] = None, product_name: Optional[str] = None) -> str:
    """Explore and retrieve full specifications, descriptions, pricing, reviews, and merchant details for a specific product."""
    pass

class CompareProductsInput(BaseModel):
    product_indices: Optional[List[int]] = Field(None, description="The 1-based indices of products from the current list to compare (e.g. [9, 10] or [1, 2, 3]).")
    product_ids: Optional[List[int]] = Field(None, description="List of product database IDs to compare.")
    product_names: Optional[List[str]] = Field(None, description="List of product titles or names to compare.")

@tool("compare_products", args_schema=CompareProductsInput)
def compare_products(product_indices: Optional[List[int]] = None, product_ids: Optional[List[int]] = None, product_names: Optional[List[str]] = None) -> str:
    """Compare specifications, prices, ratings, and features side-by-side for selected products from the recommended list or catalog."""
    pass

AVAILABLE_TOOLS = [
    view_cart,
    get_latest_orders,
    recommend_products,
    get_product_details,
    compare_products,
    manage_cart,
    checkout
]
