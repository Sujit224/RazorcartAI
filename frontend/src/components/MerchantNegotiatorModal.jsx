import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, CheckCircle2, ArrowRight, Percent, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MarkdownMessage } from './MarkdownMessage';

const rupees = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

export const MerchantNegotiatorModal = ({
  isOpen,
  onClose,
  cart,
  onApplyDiscount,
  activeDiscount = null
}) => {
  const { currentUser } = useAuth();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const cartItems = cart?.items || [];
  const cartSubtotal = cart?.subtotal || 0;

  // Initialize greeting on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'merchant_ai',
          text: `Hello! I am the automated **Merchant Price Negotiator** for your cart (${cartItems.length} items, total **${rupees(cartSubtotal)}**). Let me know your desired budget or discount reason (e.g. bulk order, first purchase), and I will evaluate our seller margin guardrails to authorize the best possible deal.`,
          discount_pct: 0,
          discount_amount: 0,
          new_total: cartSubtotal,
          can_apply: false
        }
      ]);
    }
  }, [isOpen, cartItems.length, cartSubtotal, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || loading) return;

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
          text: "I was unable to connect to the merchant pricing engine. Please try again or proceed with standard pricing.",
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

  const handleApplyAndContinue = (discountPct, discountAmount, newTotal) => {
    if (onApplyDiscount) {
      onApplyDiscount({
        optimal_discount_offered: discountPct,
        discount_amount: discountAmount,
        new_total: newTotal
      });
    }
    onClose();
  };

  const suggestedPrompts = [
    "Can you give me a 15% bulk discount?",
    "Can you do a flat 10% discount for Gold tier?",
    `Can you round off the total to ${rupees(cartSubtotal * 0.85)}?`,
    "What is the best offer on my cart today?"
  ];

  const userInitial = currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] h-[650px] border border-[#e2e8f0] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0066cc] flex items-center justify-center text-white shadow-xs">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-[#0c2340]">Merchant Price Negotiator</h3>
                <span className="text-[10px] font-bold bg-[#eff6ff] text-[#0066cc] border border-[#bfdbfe] px-2 py-0.5 rounded-md">
                  Live Guardrails
                </span>
              </div>
              <p className="text-xs text-[#5c6f84]">Real-time margin evaluation & personalized discount authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5c6f84] hover:text-[#0c2340] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
                          onClick={() => handleApplyAndContinue(msg.discount_pct, msg.discount_amount, msg.new_total)}
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
    </div>
  );
};
