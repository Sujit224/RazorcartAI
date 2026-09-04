from fastapi import APIRouter
from ..schemas.discount import CheckoutContext, OptimalDiscountResponse
from ..services.discount_engine import discount_engine

router = APIRouter(prefix="", tags=["Discount Negotiation Engine"])

@router.post("/calculate_optimal_discount", response_model=OptimalDiscountResponse)
def calculate_optimal_discount_endpoint(context: CheckoutContext):
    """
    Computes mathematical discount limit and returns expected profit breakdown
    for complete merchant observability.
    """
    return discount_engine.calculate_optimal_discount(context)
