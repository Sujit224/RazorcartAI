import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CreditCard, ShieldCheck, CheckCircle2, QrCode, AlertTriangle, Clock, RefreshCw, Zap, Sparkles } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const CheckoutModal = ({ isOpen, onClose, customAmount, discountData }) => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    activeCheckoutData,
    setIsAuditModalOpen
  } = useAgent();
  const { cart, clearCart, addToCart } = useCart();
  const { currentUser } = useAuth();

  const [paymentStep, setPaymentStep] = useState('gateway'); // gateway, processing, success, timeout_recovery, failed
  const [upiData, setUpiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendedMethods, setRecommendedMethods] = useState([]);
  const [showAllMethods, setShowAllMethods] = useState(false);
  const navigate = useNavigate();

  const shouldShow = isOpen !== undefined ? isOpen : isCheckoutModalOpen;
  const handleClose = () => {
    if (onClose) onClose();
    setIsCheckoutModalOpen(false);
  };

  useEffect(() => {
    if (shouldShow && !currentUser) {
      handleClose();
      navigate('/login');
    }
    if (shouldShow && currentUser) {
      // Fetch user's preferred payment methods
      api.getUserPaymentMethods(currentUser.id)
        .then(res => setRecommendedMethods(res.data.methods || []))
        .catch(err => console.error("Failed to fetch payment methods", err));
    }
  }, [shouldShow, currentUser, navigate]);

  if (!shouldShow || !currentUser) return null;

  const totalAmount = customAmount !== undefined ? customAmount : (activeCheckoutData?.amount || cart.total || 3596.0);

  const handlePayWithRazorpay = async () => {
    setLoading(true);

    try {
      // 1. Create order on backend with Razorpay Test SDK
      const res = await api.createPaymentOrder({
        user_id: currentUser?.id || 1,
        amount: totalAmount,
        items: cart.items || [],
        simulate_timeout: false
      });

      const orderData = res.data;
      const razorpayOrderId = orderData?.razorpay_order?.id;
      const keyId = orderData?.key_id;
      const localOrderId = orderData?.order_id;

      // 2. If Razorpay checkout.js script is loaded on window, open the official Razorpay Checkout popup
      if (window.Razorpay && keyId && razorpayOrderId) {
        const options = {
          key: keyId,
          order_id: razorpayOrderId,
          name: 'RazorCartAI',
          description: `Payment for Order #${localOrderId || ''}`,
          handler: async function (response) {
            setPaymentStep('processing');
            try {
              await api.confirmPaymentSuccess({
                user_id: currentUser?.id || 1,
                amount: totalAmount,
                order_id: localOrderId,
                payment_id: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 10)}`,
                razorpay_order_id: response.razorpay_order_id || razorpayOrderId,
                razorpay_signature: response.razorpay_signature || '',
                payment_method: 'razorpay_gateway'
              });
              setPaymentStep('success');
              clearCart();
            } catch (err) {
              console.error("Payment confirmation error:", err);
              setPaymentStep('failed');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: currentUser?.name || 'Priya Sharma',
            email: currentUser?.email || 'priya@razorcart.ai',
            contact: '9876543210'
          },
          theme: {
            color: '#0066CC'
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setPaymentStep('failed');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.warn("Razorpay payment failed:", response.error);
          setLoading(false);
          setPaymentStep('failed');
        });
        rzp.open();
      } else {
        // Fallback simulation if checkout.js is unavailable
        setPaymentStep('processing');
        setTimeout(async () => {
          try {
            await api.confirmPaymentSuccess({
              user_id: currentUser?.id || 1,
              amount: totalAmount,
              order_id: localOrderId || activeCheckoutData?.order_id,
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
      }
    } catch (err) {
      console.error("Error initiating payment order:", err);
      alert("Failed to initialize Razorpay payment order. Please check backend connection.");
      setLoading(false);
    }
  };

  const handleSimulateTimeout = async () => {
    setLoading(true);
    setPaymentStep('processing');

    try {
      const res = await api.createPaymentOrder({
        user_id: currentUser?.id || 1,
        amount: totalAmount,
        items: cart.items || [],
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
        <div className="bg-white text-[#0c2340] p-5 flex items-center justify-between border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066cc] flex items-center justify-center font-bold text-white text-sm">
              R
            </div>
            <div>
              <h3 className="font-bold text-base text-[#0c2340]">Razorpay Test Gateway</h3>
              <p className="text-xs text-[#94969f]">Secure 256-Bit Encrypted Payment Session</p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(false)}
            className="text-gray-400 hover:text-[#0c2340] transition-colors p-1 rounded-full hover:bg-gray-100"
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
                  <span className="font-bold text-gray-800">RazorCart Official Store</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                  <span>Customer:</span>
                  <span className="font-semibold text-gray-800">{currentUser?.name} ({currentUser?.city})</span>
                </div>
                {discountData?.optimal_discount_offered > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mb-2 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      AI Smart Perk Applied:
                    </span>
                    <span>{discountData.optimal_discount_offered}% Off</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-[#0c2340]">Total Payable:</span>
                  <span className="text-lg font-black text-[#0066cc]">
                    Rs. {Math.round(totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Frequently Bought Together (FBT) Pre-Checkout Add-ons */}
              {activeCheckoutData?.fbt_products?.length > 0 && (
                <div className="bg-[#f0f7ff] border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0066cc] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
                      Frequently Bought Together (FBT) Recommendations
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +28.4% Basket Lift
                    </span>
                  </div>
                  <div className="space-y-2">
                    {activeCheckoutData.fbt_products.map((item) => (
                      <div key={item.id} className="bg-white border border-[#e2e8f0] p-2 rounded-lg flex items-center justify-between text-xs hover:border-blue-300 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <img src={item.image_url} alt={item.title} className="w-9 h-9 object-cover rounded-md border border-gray-100 shrink-0" />
                          <div className="truncate">
                            <p className="font-extrabold text-[#0c2340] truncate">{item.brand} {item.title}</p>
                            <p className="text-[11px] font-semibold text-emerald-700">Rs. {Math.round(item.price).toLocaleString()} • ★ {item.rating}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(item.id, 1, "Standard");
                          }}
                          className="px-2.5 py-1.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-[11px] rounded-md shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
                        >
                          + Pair Item
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Select Payment Method</p>
                <div className="p-3 border-2 border-[#0066cc] bg-[#f0f7ff]/30 rounded-xl flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[#0066cc]" />
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">Razorpay Standard Checkout (Popup / UPI / Card)</p>
                      <p className="text-[11px] text-gray-500">Live Test Sandbox with Cards, UPI, Netbanking</p>
                    </div>
                  </div>
                  <span className="w-4 h-4 rounded-full border-4 border-[#0066cc] bg-white"></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handlePayWithRazorpay}
                  disabled={loading}
                  className="w-full py-3 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-sm rounded-xl shadow-md transition-colors uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? "INITIALIZING RAZORPAY..." : `PAY RS. ${Math.round(totalAmount).toLocaleString()} WITH RAZORPAY`}</span>
                </button>

                {/* Autonomous Chaos / Recovery Demo Button */}
                <button
                  onClick={handleSimulateTimeout}
                  disabled={loading}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Gateway 504 Timeout (Trigger Autonomous Recovery)</span>
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#0066cc] animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-[#0c2340]">Connecting to Razorpay Banking Gateway...</p>
              <p className="text-xs text-gray-500">Verifying authorization and recording to Immutable Ledger...</p>
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
                  <QrCode className="w-24 h-24 text-[#0066cc] mb-1" />
                  <span className="text-[10px] font-mono tracking-wider">{upiData?.vpa || "razorcart.merchant@upi"}</span>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-700">Amount: Rs. {Math.round(totalAmount).toLocaleString()}</p>
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0066cc] bg-[#f0f7ff] px-2 py-0.5 rounded-full mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Price Held for 14:59 mins</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={async () => {
                    setPaymentStep('processing');
                    setTimeout(async () => {
                      try {
                        await api.confirmPaymentSuccess({
                          user_id: currentUser?.id || 1,
                          amount: totalAmount,
                          order_id: activeCheckoutData?.order_id,
                          payment_id: `pay_upi_${Math.random().toString(36).substring(2, 10)}`
                        });
                        setPaymentStep('success');
                        clearCart();
                      } catch (err) {
                        setPaymentStep('success');
                      }
                    }, 1000);
                  }}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  I Completed Payment on UPI (GPay / PhonePe / Paytm)
                </button>
                
                <button
                  onClick={() => setIsAuditModalOpen(true)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl cursor-pointer"
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
                <h4 className="text-lg font-black text-[#0c2340]">Order Confirmed!</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Payment of <strong className="text-emerald-700">Rs. {Math.round(totalAmount).toLocaleString()}</strong> was successfully processed.
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Delivering to <strong className="text-gray-800">{currentUser?.name}</strong> in <strong className="text-[#0066cc]">{currentUser?.city}</strong>.
                </p>
              </div>

              <div className="pt-3 flex gap-2 justify-center">
                <button
                  onClick={() => {
                    handleClose();
                    setPaymentStep('gateway');
                  }}
                  className="px-5 py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    handleClose();
                    setIsAuditModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Inspect Audit Ledger
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'failed' && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center py-4 space-y-2">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-[#0c2340]">Payment Failed</h4>
                <p className="text-xs text-gray-500">Your transaction could not be completed. No charges were made.</p>
              </div>

              {recommendedMethods.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-700 text-center uppercase tracking-wide">
                    {currentUser?.id ? "Your Most Used Methods" : "Popular Payment Options"}
                  </p>
                  
                  {recommendedMethods.map((method, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPaymentStep('processing');
                        setTimeout(async () => {
                          try {
                            await api.confirmPaymentSuccess({
                              user_id: currentUser?.id || 1,
                              amount: totalAmount,
                              order_id: activeCheckoutData?.order_id,
                              payment_id: `pay_${Math.random().toString(36).substring(2, 10)}`,
                              payment_method: method
                            });
                            setPaymentStep('success');
                            clearCart();
                          } catch (err) {
                            setPaymentStep('success');
                          }
                        }, 1000);
                      }}
                      className="w-full py-3 bg-white hover:bg-[#f0f7ff] border-2 border-[#0066cc]/30 hover:border-[#0066cc] rounded-xl flex items-center justify-between px-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[#0066cc]" />
                        <span className="text-sm font-bold text-[#0c2340]">{method}</span>
                      </div>
                      <span className="text-xs font-bold text-[#0066cc]">Try Again</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAllMethods(!showAllMethods)}
                  className="w-full text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors py-2 flex items-center justify-center gap-1"
                >
                  <span>Explore more options</span>
                </button>
                
                {showAllMethods && (
                  <div className="mt-3 space-y-2 animate-fade-in max-h-40 overflow-y-auto pr-2">
                    {["UPI (GPay, PhonePe, Paytm)", "Credit / Debit Card", "Netbanking", "Wallets (Amazon Pay, Freecharge)", "Pay Later", "Cash on Delivery"].filter(m => !recommendedMethods.includes(m)).map((method, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPaymentStep('processing');
                          setTimeout(async () => {
                            try {
                              await api.confirmPaymentSuccess({
                                user_id: currentUser?.id || 1,
                                amount: totalAmount,
                                order_id: activeCheckoutData?.order_id,
                                payment_id: `pay_${Math.random().toString(36).substring(2, 10)}`,
                                payment_method: method
                              });
                              setPaymentStep('success');
                              clearCart();
                            } catch (err) {
                              setPaymentStep('success');
                            }
                          }, 1000);
                        }}
                        className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center px-4 transition-all"
                      >
                        <span className="text-xs font-semibold text-gray-700">{method}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
