import uuid
import time
from typing import Dict, Any, Optional
import razorpay
from ..config import settings

class RazorpayService:
    @property
    def key_id(self) -> str:
        return settings.RAZORPAY_KEY_ID

    @property
    def key_secret(self) -> str:
        return settings.RAZORPAY_KEY_SECRET

    @property
    def mock_mode(self) -> bool:
        return settings.RAZORPAY_MOCK_MODE

    def get_client(self) -> Optional[razorpay.Client]:
        if not self.key_id.startswith("rzp_test_mock") and not self.mock_mode:
            try:
                return razorpay.Client(auth=(self.key_id, self.key_secret))
            except Exception as e:
                print(f"[Razorpay Client Error] Failed to init client: {e}")
        return None

    def create_order(self, amount: float, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        """Creates a Razorpay Order in paise (amount * 100)."""
        amount_paise = int(round(amount * 100))
        receipt_id = receipt or f"rc_rcpt_{int(time.time())}"

        client = self.get_client()
        if client:
            try:
                order_data = {
                    "amount": amount_paise,
                    "currency": currency,
                    "receipt": receipt_id,
                    "payment_capture": 1
                }
                order = client.order.create(data=order_data)
                print(f"[Razorpay SDK] Successfully created live test order: {order.get('id')} for amount Rs. {amount}")
                return order
            except Exception as e:
                print(f"[Razorpay SDK Warning] Live client failed: {e}. Falling back to test sandbox.")

        # Test Mode Simulated Order
        mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
        return {
            "id": mock_order_id,
            "entity": "order",
            "amount": amount_paise,
            "amount_paid": 0,
            "amount_due": amount_paise,
            "currency": currency,
            "receipt": receipt_id,
            "status": "created",
            "attempts": 0,
            "created_at": int(time.time()),
            "checkout_url": f"https://api.razorpay.com/v1/checkout/{mock_order_id}"
        }

    def generate_upi_fallback(self, amount: float, order_id: str, merchant_vpa: str = "razorcart.merchant@upi") -> Dict[str, Any]:
        """Generates dynamic UPI QR and fallback details upon gateway timeout/error."""
        upi_string = f"upi://pay?pa={merchant_vpa}&pn=RazorCartAI%20Merchant&am={amount:.2f}&cu=INR&tr={order_id}&tn=Order%20Payment"
        return {
            "fallback_method": "UPI_DYNAMIC_QR",
            "vpa": merchant_vpa,
            "amount": amount,
            "upi_intent_uri": upi_string,
            "qr_data": upi_string,
            "price_hold_minutes": 15,
            "instruction": "Scan with GPay, PhonePe, or Paytm. Your price is held for 15 minutes."
        }

razorpay_service = RazorpayService()
