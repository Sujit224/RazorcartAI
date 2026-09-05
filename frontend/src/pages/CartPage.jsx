import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';
import { Navbar } from '../components/Navbar';
import { CustomerSidebar } from '../components/CustomerSidebar';
import { AgenticChatbotLauncher } from '../components/AgenticChatbotLauncher';
import { AgentCopilotModal } from '../components/AgentCopilotModal';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  ShoppingBag, Trash2, ArrowRight, ShieldCheck, MapPin, Zap,
  Plus, CheckCircle2, ArrowLeft, Bot, Sparkles, AlertCircle,
  Percent, ChevronDown, ChevronUp, Loader2, Award, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

export default function CartPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart, removeFromCart, addToCart, clearCart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // AI Discount Negotiator State
  const [discountData, setDiscountData] = useState(null);
  const [showAuditReasoning, setShowAuditReasoning] = useState(false);

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  
  const discountPct = discountData?.optimal_discount_offered || 0;
  const negotiatedDiscountAmount = (subtotal * discountPct) / 100.0;
  const total = Math.max(0, (cart?.total || subtotal) - negotiatedDiscountAmount);

  const int = (val) => Math.round(Number(val || 0));

  const handleNegotiateDiscount = async () => {
    if (cartItems.length === 0) return;
    setIsNegotiating(true);
    setNegotiateStatus(null);
    try {
      const categories = [...new Set(cartItems.map(i => i.product?.category).filter(Boolean))];
      const productTitles = cartItems.map(i => i.product?.title).filter(Boolean);
      const productIds = cartItems.map(i => i.product?.id || i.product_id).filter(Boolean);

      const res = await api.calculateOptimalDiscount({
        user_id: currentUser?.id || 1,
        cart_value: subtotal,
        item_count: cartItems.length,
        categories: categories.length > 0 ? categories : ["General"],
        product_titles: productTitles,
        product_ids: productIds,
        customer_loyalty_tier: currentUser?.loyalty_tier || "Gold",
        historical_conversion_rate: 0.45,
        merchant_margin_rate: 0.35,
        competitor_price_ratio: 1.05,
        merchant_min_margin_threshold: 0.10,
        is_new_customer: currentUser?.id ? false : true
      });

      setDiscountData(res.data);
      if (res.data.optimal_discount_offered > 0) {
        setNegotiateStatus('success');
      } else {
        setNegotiateStatus('zero_discount');
      }
    } catch (err) {
      console.error("Discount negotiation error:", err);
      setNegotiateStatus('error');
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleAskAgentForCart = () => {
    setIsAgentOpen(true);
    sendMessage("Can you review my cart items, negotiate any available discounts with the merchant engine, and assist with checkout?");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-[#0c2340] flex flex-col font-sans">
      <Navbar
        onSearch={(q) => navigate(`/?search=${encodeURIComponent(q)}`)}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="ALL"
        setSelectedCategory={() => {}}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-8 py-8">
        
        {/* Stepper Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl md:text-2xl font-black text-[#0c2340] tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#0066cc]" />
              <span>SHOPPING BAG</span>
              <span className="text-sm font-bold text-gray-500 font-mono">({cart.item_count || 0} Items)</span>
            </h1>
          </div>

          {/* Stepper Steps */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
            <span className="text-[#0066cc] border-b-2 border-[#0066cc] pb-1">1. BAG</span>
            <span className="text-gray-300">-----------</span>
            <span className="text-gray-400">2. ADDRESS</span>
            <span className="text-gray-300">-----------</span>
            <span className="text-gray-400">3. PAYMENT</span>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart View */
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm max-w-md mx-auto my-8">
            <div className="w-20 h-20 bg-[#f0f7ff] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <ShoppingBag className="w-10 h-10 text-[#0066cc]" />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">Your Shopping Bag is empty</h2>
            <p className="text-xs text-gray-500 mb-6">Explore our latest sneakers, athletic apparel, and accessories.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          /* Cart Items Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Cart Items & FBT Pairings */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Delivery Address Banner */}
              <div className="bg-[#f0f7ff]/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#0066cc]" />
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      Deliver to: <span className="text-[#0066cc]">{currentUser?.name}</span> ({currentUser?.city})
                    </p>
                    <p className="text-[11px] text-gray-500">Express local seller dispatch priority active</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                  Express Active
                </span>
              </div>

              {/* Cart Items List */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                <div className="p-4 bg-gray-50/80 flex items-center justify-between text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                  <span>Selected Products</span>
                  <button onClick={clearCart} className="text-red-500 hover:underline">Clear Bag</button>
                </div>

                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 md:p-5 flex items-start gap-4">
                    {/* Image */}
                    {item.product?.image_url && (
                      <img
                        src={item.product.image_url}
                        alt=""
                        className="w-20 h-24 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-sm text-[#0c2340] tracking-tight">
                            {item.product?.brand}
                          </h3>
                          <p className="text-xs text-[#5c6f84] truncate mt-0.5 font-normal">
                            {item.product?.title}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Size & Qty */}
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Size: {item.size || 'UK 8'}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Qty: {item.quantity}</span>
                      </div>

                      {/* Price Row */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="font-extrabold text-sm text-[#0c2340]">
                          Rs. {int(item.product?.price * item.quantity)}
                        </span>
                        {item.product?.original_price > item.product?.price && (
                          <span className="text-xs text-gray-400 line-through">
                            Rs. {int(item.product?.original_price * item.quantity)}
                          </span>
                        )}
                        {item.product?.rating && (
                          <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.product.rating} ★
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Frequently Bought Together (FBT) Recommendations */}
              {cart?.fbt_recommendations?.length > 0 && (
                <div className="bg-purple-50/80 rounded-2xl p-5 border border-purple-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#0066cc]" /> Frequently Bought Together
                    </span>
                    <span className="text-[10px] bg-purple-200/60 text-purple-900 font-bold px-2 py-0.5 rounded-full">AI Suggested</span>
                  </div>

                  <div className="space-y-2">
                    {cart.fbt_recommendations.map((fbt) => (
                      <div key={fbt.id} className="bg-white p-3 rounded-xl border border-purple-100 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {fbt.image_url && (
                            <img src={fbt.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{fbt.title}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-extrabold text-[#0066cc]">Rs. {int(fbt.price)}</span>
                              <span className="text-gray-500">• {fbt.rating} ★</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(fbt.id, 1, "Standard")}
                          className="px-3.5 py-1.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs rounded-lg shadow transition-colors shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Copilot Cart Advisory Banner */}
              <div className="p-4 bg-white rounded-2xl flex items-center justify-between gap-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900">Ask AI Copilot about Cart Optimization</h4>
                    <p className="text-[11px] text-gray-500">Negotiate prices or ask for failure recovery advice.</p>
                  </div>
                </div>
                <button
                  onClick={handleAskAgentForCart}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-extrabold rounded-xl transition-all shrink-0"
                >
                  Ask AI
                </button>
              </div>

            </div>

            {/* Right Column: Price Details & AI Negotiator & Checkout Button */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Price Details Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 sticky top-24">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 pb-3 border-b border-gray-100">
                  Price Details ({cartItems.length} Items)
                </h3>

                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Total MRP:</span>
                    <span className="font-bold text-gray-900">Rs. {int(cart.subtotal * 1.15)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Bag Discount:</span>
                    <span className="font-bold text-emerald-600">- Rs. {int((cart.subtotal * 1.15) - subtotal)}</span>
                  </div>

                  {discountPct > 0 && (
                    <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        AI Negotiated ({discountPct}%):
                      </span>
                      <span>- Rs. {int(negotiatedDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span>Convenience / Shipping Fee:</span>
                    <span className="font-extrabold text-emerald-600 uppercase">FREE</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-gray-900">Total Amount:</span>
                  <span className="text-xl font-black text-[#0066cc]">Rs. {int(total)}</span>
                </div>

                {/* Main Checkout Button */}
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-4 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout (Rs. {int(total)})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secured by Razorpay Test Gateway</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            <span className="font-extrabold text-[#0c2340]">RazorCartAI</span> • Agentic AI E-Commerce Platform
          </div>
          <div className="flex items-center gap-4">
            <span>LangGraph Multi-Agent Engine</span>
            <span>•</span>
            <span>Razorpay Gateway Test Mode</span>
          </div>
        </div>
      </footer>

      {/* Overlays */}
      <CustomerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <AgenticChatbotLauncher />
      <AgentCopilotModal />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customAmount={total}
        discountData={discountData}
      />
    </div>
  );
}
