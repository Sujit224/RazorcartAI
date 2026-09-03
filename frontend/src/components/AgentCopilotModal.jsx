import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, Star, ShoppingBag, CreditCard, ShieldAlert, ArrowRight, CheckCircle2, Zap, Maximize2, Minimize2, ExternalLink, MapPin, ArrowUpRight } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import { MarkdownMessage } from './MarkdownMessage';

export const AgentCopilotModal = () => {
  const navigate = useNavigate();
  const {
    isAgentOpen,
    setIsAgentOpen,
    messages,
    loading,
    sendMessage,
    triggerDirectCheckout,
    setIsAuditModalOpen
  } = useAgent();
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isAgentOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleActionClick = (actionText) => {
    if (actionText === "Complete Razorpay Payment" || actionText.includes("Pay Now")) {
      triggerDirectCheckout();
    } else if (actionText.includes("Timeout (Chaos")) {
      sendMessage("Gateway Timeout 504 occurred", "SIMULATE_TIMEOUT");
    } else if (actionText.includes("Decline (Chaos") || actionText.includes("Insufficient Funds")) {
      sendMessage("Card declined insufficient funds", "SIMULATE_INSUFFICIENT_FUNDS");
    } else {
      sendMessage(actionText);
    }
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className={`w-full ${isFullScreen ? 'max-w-full' : 'max-w-lg'} bg-white h-full shadow-2xl flex flex-col transition-all duration-300`}>
        
        {/* Copilot Header */}
        <div className="p-4.5 bg-white text-[#0c2340] flex items-center justify-between border-b border-[#e2e8f0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0066cc] flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-[#0c2340]">Razorcart AI Copilot</h3>
                <span className="text-[10px] font-bold bg-[#f0f7ff] border border-[#0066cc]/20 text-[#0066cc] px-2 py-0.5 rounded-md uppercase tracking-wider">
                  RAY
                </span>
              </div>
              <p className="text-xs text-[#5c6f84] font-medium">Autonomous Commerce • Bounded & Explainable</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-xs font-bold text-[#00b386] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Audit Trail
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-[#5c6f84] hover:text-[#0c2340] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              aria-label="Toggle Fullscreen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsAgentOpen(false)}
              className="p-2 text-[#5c6f84] hover:text-[#0c2340] rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Banner Strip */}
        <div className="bg-[#f8fafc] px-5 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#0c2340]">
            <MapPin className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Shopping as <strong className="text-[#0c2340] font-bold">{currentUser?.name}</strong> in <strong className="text-[#0066cc] font-bold">{currentUser?.city}</strong></span>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-md">
            Rating-Aware Engine
          </span>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#0066cc] text-white rounded-tr-none font-medium'
                    : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0c2340] rounded-tl-none'
                }`}
              >
                {/* Render Text / Markdown formatted message */}
                <MarkdownMessage content={msg.text} isUser={msg.sender === 'user'} />

                {/* Embedded Products Carousel in Chat */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2.5">
                    <p className="text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider">Top Rated Recommendations</p>
                    <div className="space-y-2">
                      {msg.products.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleViewProduct(p.id)}
                          className="bg-white border border-[#e2e8f0] p-3 rounded-xl flex items-center justify-between gap-3 hover:border-[#0066cc] hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <img src={p.image_url} alt={p.title} className="w-12 h-14 object-cover rounded-lg bg-slate-50 group-hover:scale-105 transition-transform shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-xs text-[#0c2340] group-hover:text-[#0066cc] transition-colors truncate">
                              {p.brand} {p.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold mt-0.5">
                              <span>★ {p.rating}</span>
                              <span className="text-[#5c6f84] font-normal">({p.review_count} reviews)</span>
                              {p.is_local_seller && <span className="text-[10px] text-emerald-600 font-bold">• Fast {p.city}</span>}
                            </div>
                            <div className="text-xs font-black text-[#0c2340] mt-0.5">Rs. {Math.round(p.price).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p.id, 1, "UK 8");
                              }}
                              className="p-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                              title="Add to Bag"
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded FBT Complementary Items */}
                {msg.fbt_products && msg.fbt_products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#e2e8f0] bg-[#f0f7ff]/50 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0066cc] mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Frequently Bought Together</span>
                    </div>
                    <div className="space-y-2">
                      {msg.fbt_products.map((cp) => (
                        <div
                          key={cp.id}
                          onClick={() => handleViewProduct(cp.id)}
                          className="bg-white p-2.5 rounded-xl border border-[#e2e8f0] hover:border-[#0066cc] flex items-center justify-between gap-2 cursor-pointer transition-all group"
                        >
                          <img src={cp.image_url} alt={cp.title} className="w-10 h-10 object-cover rounded-lg group-hover:scale-105 transition-transform shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-[#0c2340] group-hover:text-[#0066cc] truncate transition-colors">{cp.brand} {cp.title}</p>
                            <div className="text-[11px] font-semibold text-[#5c6f84]">
                              Rs. {Math.round(cp.price).toLocaleString()} • <span className="text-emerald-700 font-bold">★ {cp.rating} ({cp.review_count})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(cp.id, 1, "Standard");
                            }}
                            className="px-3 py-1.5 bg-[#0066cc] hover:bg-[#0052a3] text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            + Pair
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Embedded Direct Checkout Trigger */}
                {msg.checkout_data && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 bg-emerald-50/80 p-3.5 rounded-xl border">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Razorpay Test Mode Order Ready</span>
                    </div>
                    <p className="text-xs text-emerald-800 font-semibold mb-2">
                      Order Total: <strong className="text-emerald-900 font-black">Rs. {Math.round(msg.checkout_data.amount).toLocaleString()}</strong>
                    </p>
                    <button
                      onClick={() => triggerDirectCheckout(msg.checkout_data)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      <span>Pay Now with Razorpay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Embedded Timeout Recovery UI */}
                {msg.recovery_data?.type === "TIMEOUT_UPI_FALLBACK" && (
                  <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 p-3.5 rounded-xl border border-amber-300">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 mb-1">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Autonomous Payment Recovery Active</span>
                    </div>
                    <p className="text-xs text-amber-800 mb-2 font-medium">
                      Gateway timeout intercepted. Price is locked for <strong>15 minutes</strong>.
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-center mb-2 shadow-inner">
                      <p className="text-[11px] font-extrabold text-slate-700 mb-1">Scan Dynamic UPI QR</p>
                      <div className="w-32 h-32 mx-auto bg-slate-900 p-2 rounded-lg flex items-center justify-center text-white text-[10px] font-mono text-center">
                        [ DYNAMIC UPI QR : VPA {msg.recovery_data.upi_info?.vpa} ]
                      </div>
                      <p className="text-xs font-black text-[#0c2340] mt-1.5">Amount: Rs. {Math.round(msg.recovery_data.amount).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => sendMessage("Payment confirmed via dynamic UPI QR")}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      I have completed UPI Payment
                    </button>
                  </div>
                )}

                {/* Embedded Cart Pruning / Insufficient Funds Negotiation */}
                {msg.recovery_data?.type === "CART_PRUNING_NEGOTIATION" && (
                  <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3.5 rounded-xl border border-blue-300">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 mb-1">
                      <ShieldAlert className="w-4 h-4 text-blue-600" />
                      <span>Agentic Cart Negotiation Offer</span>
                    </div>
                    <div className="text-xs text-blue-900 space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span>Original Cart Total:</span>
                        <span className="line-through text-slate-500">Rs. {Math.round(msg.recovery_data.original_total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-700 text-sm">
                        <span>Negotiated Budget Total:</span>
                        <span>Rs. {Math.round(msg.recovery_data.new_total).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 font-medium">
                        Removed lowest priority accessory: <strong>{msg.recovery_data.removed_item?.title}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => triggerDirectCheckout({ amount: msg.recovery_data.new_total, razorpay_order_id: "order_pruned_retry" })}
                      className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Accept & Pay Rs. {Math.round(msg.recovery_data.new_total).toLocaleString()}</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>

              {/* Enhanced Prompt Action Chips */}
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2.5 max-w-[92%]">
                  {msg.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act)}
                      className="text-xs font-bold bg-white hover:bg-[#f0f7ff] text-[#0c2340] hover:text-[#0066cc] border border-[#e2e8f0] hover:border-[#0066cc] px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>{act}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#5c6f84] group-hover:text-[#0066cc]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#5c6f84] bg-[#f8fafc] p-3 rounded-2xl w-fit border border-[#e2e8f0] shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-[#0066cc] animate-spin" />
              <span>Analyzing catalog ratings & LangGraph state...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#e2e8f0] flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Ask about 4.5★ shoes, reviews, pairing, or checkout..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs md:text-sm text-[#0c2340] placeholder-[#5c6f84] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
