import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, CheckCircle2, QrCode, AlertTriangle, Clock, RefreshCw, Zap } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const CheckoutModal = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    activeCheckoutData,
    setIsAuditModalOpen
  } = useAgent();
  const { cart, clearCart } = useCart();
  const { currentUser } = useAuth();

  const [paymentStep, setPaymentStep] = useState('gateway'); // gateway, processing, success, timeout_recovery
  const [upiData, setUpiData] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isCheckoutModalOpen) return null;

  const totalAmount = activeCheckoutData?.amount || cart.total || 3596.0;

  const handlePaySuccess = async () => {
    setLoading(true);
    setPaymentStep('processing');

    setTimeout(async () => {
      try {
        await api.confirmPaymentSuccess({
          user_id: currentUser?.id || 1,
          amount: totalAmount,
          order_id: activeCheckoutData?.order_id,
          payment_id: `pay_test_${Math.random().toString(36).substring(2, 10)}`
        });
        setPaymentStep('success');
        clearCart();
      } catch (err) {
        console.error("Payment confirmation error:", err);
        setPaymentStep('success');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  const handleSimulateTimeout = async () => {
    setLoading(true);
    setPaymentStep('processing');

    try {
      const res = await api.createPaymentOrder({
        user_id: currentUser?.id || 1,
        amount: totalAmount,
        items: cart.items,
        simulate_timeout: true
      });
      setUpiData(res.data.fallback);
      setPaymentStep('timeout_recovery');
    } catch (err) {
      console.error("Timeout simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in">
        
        {/* Modal Header */}
        <div className="bg-white text-[#282c3f] p-5 flex items-center justify-between border-b border-[#eaeaec]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ff3f6c] flex items-center justify-center font-bold text-white text-sm">
              R
            </div>
            <div>
              <h3 className="font-bold text-base text-[#282c3f]">Razorpay Test Gateway</h3>
              <p className="text-xs text-[#94969f]">Secure 256-Bit Encrypted Payment Session</p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="text-gray-400 hover:text-[#282c3f] transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {paymentStep === 'gateway' && (
            <div className="space-y-5">
              {/* Order Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span>Merchant:</span>
                  <span className="font-bold text-gray-800">RazorCartAI Official Store</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                  <span>Customer:</span>
                  <span className="font-semibold text-gray-800">{currentUser?.name} ({currentUser?.city})</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-[#282c3f]">Total Payable:</span>
                  <span className="text-lg font-black text-[#ff3f6c]">
                    Rs. {Math.round(totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Select Payment Method</p>
                <div className="p-3 border-2 border-emerald-500 bg-emerald-50/40 rounded-xl flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">Razorpay Direct Test Card / UPI</p>
                      <p className="text-[11px] text-gray-500">Auto-authorized sandbox simulation</p>
                    </div>
                  </div>
                  <span className="w-4 h-4 rounded-full border-4 border-emerald-600 bg-white"></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePaySuccess}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>PAY RS. {Math.round(totalAmount).toLocaleString()}</span>
                </button>

                {/* Hackathon Chaos Button */}
                <button
                  onClick={handleSimulateTimeout}
                  disabled={loading}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Gateway 504 Timeout (Trigger Agentic Recovery)</span>
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#ff3f6c] animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-[#282c3f]">Contacting Razorpay Banking Switch...</p>
              <p className="text-xs text-gray-500">Verifying customer rating token & test ledger entry...</p>
            </div>
          )}

          {paymentStep === 'timeout_recovery' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">
                    HTTP 504 Gateway Delay Intercepted by Agent
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your cart price is <strong>locked for 15 minutes</strong>. Scan the dynamic UPI QR below to bypass server delays instantly.
                  </p>
                </div>
              </div>

              {/* Dynamic QR Display */}
              <div className="bg-white p-4 border border-gray-200 rounded-xl text-center shadow-inner">
                <div className="w-40 h-40 mx-auto bg-gray-900 rounded-lg p-3 flex flex-col items-center justify-center text-white text-center">
                  <QrCode className="w-24 h-24 text-pink-400 mb-1" />
                  <span className="text-[10px] font-mono tracking-wider">{upiData?.vpa || "razorcart.merchant@upi"}</span>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-700">Amount: Rs. {Math.round(totalAmount).toLocaleString()}</p>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Price Held for 14:59 mins</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handlePaySuccess}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors"
                >
                  I Completed Payment on UPI (GPay / PhonePe / Paytm)
                </button>
                
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl"
                >
                  View Recovery in Merchant Audit Ledger
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-[#282c3f]">Order Confirmed!</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Payment of <strong className="text-emerald-700">Rs. {Math.round(totalAmount).toLocaleString()}</strong> was successfully processed.
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Delivering to <strong className="text-gray-800">{currentUser?.name}</strong> in <strong className="text-[#ff3f6c]">{currentUser?.city}</strong>.
                </p>
              </div>

              <div className="pt-3 flex gap-2 justify-center">
                <button
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setPaymentStep('gateway');
                  }}
                  className="px-5 py-2.5 bg-[#ff3f6c] hover:bg-[#e62e5b] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    setIsAuditModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-lg transition-colors"
                >
                  Inspect Audit Ledger
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
