import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, CheckCircle2, ArrowRight, Percent, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { Navbar } from '../components/Navbar';
import { CheckoutModal } from '../components/CheckoutModal';

const rupees = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

export default function NegotiatePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { cart } = useCart();
  
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountData, setDiscountData] = useState(null);

  const cartItems = cart?.items || [];
  const cartSubtotal = cart?.subtotal || 0;
  
  // Calculate final total based on any active discount
  const discountPct = discountData?.discount_pct || 0;
  const negotiatedDiscountAmount = (cartSubtotal * discountPct) / 100.0;
  const total = Math.max(0, (cart?.total || cartSubtotal) - negotiatedDiscountAmount);

  // Initialize greeting on open
  useEffect(() => {
    if (messages.length === 0 && cartItems.length > 0) {
      setMessages([
        {
          sender: 'merchant_ai',
          text: `Hello! I am the automated **Merchant Price Negotiator** for your cart (${cartItems.length} items, total **${rupees(cartSubtotal)}**). Let me know your desired budget or discount reason (e.g. bulk order, wholesale, first purchase), and I will evaluate our seller margin guardrails to authorize the best possible deal.`,
          discount_pct: 0,
          discount_amount: 0,
          new_total: cartSubtotal,
          can_apply: false
        }
      ]);
    } else if (messages.length === 0 && cartItems.length === 0) {
       setMessages([
         {
           sender: 'merchant_ai',
           text: "Your cart is empty. Please add items before negotiating.",
           can_apply: false
         }
       ]);
    }
  }, [cartItems.length, cartSubtotal, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading || cartItems.length === 0) return;

    setInputText('');
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const categories = [...new Set(cartItems.map(i => i.product?.category).filter(Boolean))];
      const productTitles = cartItems.map(i => `${i.product?.brand || ''} ${i.product?.title || ''}`.trim()).filter(Boolean);
      const productIds = cartItems.map(i => i.product?.id || i.product_id).filter(Boolean);

      const res = await api.negotiateDiscountChat({
        user_id: currentUser?.id || 1,
        user_message: textToSend,
        cart_value: cartSubtotal,
        item_count: cartItems.length || 1,
        categories: categories.length > 0 ? categories : ["General"],
        product_titles: productTitles,
        product_ids: productIds,
        customer_loyalty_tier: currentUser?.loyalty_tier || "Gold",
        is_new_customer: false,
        chat_history: newMessages.map(m => ({ sender: m.sender, text: m.text }))
      });

      const data = res.data;
      setMessages(prev => [
        ...prev,
        {
          sender: 'merchant_ai',
          text: data.reply,
          discount_pct: data.discount_pct,
          discount_amount: data.discount_amount,
          new_total: data.new_total,
          can_apply: data.can_apply,
          reasoning: data.reasoning
        }
      ]);
    } catch (err) {
      console.error("Negotiation error:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'merchant_ai',
          text: "I was unable to connect to the merchant pricing engine. Please try again.",
          discount_pct: 0,
          discount_amount: 0,
          new_total: cartSubtotal,
          can_apply: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };


  const suggestedPrompts = [
    "Can you give me a 15% bulk discount?",
    "Can you do a flat 10% discount for Gold tier?",
    `Can you round off the total to ${rupees(cartSubtotal * 0.85)}?`,
    "What is the best offer on my cart today?"
  ];

  const userInitial = currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar
        searchQuery=""
        setSearchQuery={() => {}}
        onSearch={(q) => navigate(`/?search=${encodeURIComponent(q)}`)}
      />

      <main className="flex-1 max-w-[800px] w-full mx-auto p-4 md:p-8 flex flex-col">
        
        <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-black text-[#0c2340] flex items-center gap-2">
               <Sparkles className="w-6 h-6 text-purple-600" />
               Merchant Price Negotiator
             </h1>
             <p className="text-sm text-gray-500 mt-1">Bulk Purchase & Wholesale Discount Engine</p>
           </div>
           <button
             onClick={() => navigate('/cart')}
             className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50"
           >
             Back to Cart
           </button>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-[600px]">

        {/* Header */}
        <div className="bg-[#f8fafc] p-4 md:px-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0c2340]">AI Margin Negotiator</h3>
              <p className="text-xs text-purple-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Seller Guardrails Active
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cart Total</p>
            <p className="font-black text-lg text-[#0c2340]">{rupees(cartSubtotal)}</p>
          </div>
        </div>

        {/* Cart Quick Summary Strip */}
        <div className="bg-[#f8fafc] px-5 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between text-xs">
          <span className="text-[#5c6f84] font-medium">
            Cart: <strong className="text-[#0c2340] font-bold">{cartItems.length} items</strong> • Original: <strong className="text-[#0c2340] font-bold">{rupees(cartSubtotal)}</strong>
          </span>
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
            Tier: {currentUser?.loyalty_tier || "Gold"}
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse self-end' : 'flex-row self-start'} max-w-[92%]`}
              >
                {/* Avatar Icon */}
                {isUser ? (
                  <div
                    className="w-7 h-7 rounded-full bg-[#0047fb] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs select-none"
                    title={currentUser?.name || "User"}
                  >
                    {userInitial}
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full bg-[#f0f7ff] border border-[#bfdbfe] flex items-center justify-center shrink-0 mt-0.5 shadow-xs select-none"
                    title="Merchant AI"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#0066cc]" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                  <div
                    className={`p-4 rounded-lg text-xs md:text-sm leading-relaxed shadow-sm w-full ${
                      isUser
                        ? 'bg-[#eef5ff] border border-[#bfdbfe] text-[#0c2340] rounded-tr-none font-normal'
                        : 'bg-white border border-[#e2e8f0] text-[#0c2340] rounded-tl-none font-normal'
                    }`}
                  >
                    <MarkdownMessage content={msg.text} isUser={isUser} />

                    {/* Interactive Apply Discount Card */}
                    {msg.can_apply && msg.discount_pct > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-[#e2e8f0] bg-[#f0f7ff] p-3 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-[#0066cc] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#0066cc]" />
                            {msg.discount_pct}% Merchant Discount Authorized
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            Save {rupees(msg.discount_amount)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs text-[#0c2340] mb-3">
                          <span>New Checkout Total:</span>
                          <span className="text-sm font-black text-[#0066cc]">{rupees(msg.new_total)}</span>
                        </div>

                        {/* Apply & Continue CTA */}
                        <button
                          type="button"
                          onClick={() => handleApplyDiscount(msg)}
                          className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Apply Discount & Continue to Checkout</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#5c6f84] bg-[#f8fafc] p-3 rounded-xl w-fit border border-[#e2e8f0] shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 text-[#0066cc] animate-spin" />
              <span>Merchant AI is evaluating margin guardrails & price curves...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-wrap gap-1.5 overflow-x-auto">
          {suggestedPrompts.map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-[11px] font-semibold text-[#0066cc] bg-white hover:bg-[#f0f7ff] border border-[#0066cc] px-3 py-1 rounded-full transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3.5 bg-white border-t border-[#e2e8f0] flex items-center gap-2">
          <input
            type="text"
            placeholder="Propose your offer, budget, or request a discount..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs md:text-sm text-[#0c2340] placeholder-[#5c6f84] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customAmount={total}
        discountData={discountData}
      />
    </main>
    </div>
  );
}
