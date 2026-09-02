import uuid
import time
from typing import Dict, Any, Optional
import razorpay
from ..config import settings

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = settings.RAZORPAY_KEY_SECRET
        self.mock_mode = settings.RAZORPAY_MOCK_MODE
        
        try:
            if not self.key_id.startswith("rzp_test_mock"):
                self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            else:
                self.client = None
        except Exception:
            self.client = None

    def create_order(self, amount: float, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        """Creates a Razorpay Order in paise (amount * 100)."""
        amount_paise = int(amount * 100)
        receipt_id = receipt or f"rc_rcpt_{int(time.time())}"

        if self.client and not self.mock_mode:
            try:
                order_data = {
                    "amount": amount_paise,
                    "currency": currency,
                    "receipt": receipt_id,
                    "payment_capture": 1
                }
                return self.client.order.create(data=order_data)
            except Exception as e:
                # Fallback to test mode simulator
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
