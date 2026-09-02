import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, Star, ShoppingBag, CreditCard, ShieldAlert, ArrowRight, CheckCircle2, Zap, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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
        <div className="p-4 bg-white text-[#282c3f] flex items-center justify-between border-b border-[#eaeaec]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ff3f6c] flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base tracking-tight text-[#282c3f]">Razorcart AI Copilot</h3>
                <span className="text-[10px] font-bold bg-pink-50 border border-pink-200 text-[#ff3f6c] px-1.5 py-0.5 rounded uppercase">Agentic AI</span>
              </div>
              <p className="text-[11px] text-[#94969f]">Agentic Commerce • Bounded & Explainable</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="text-[11px] font-semibold text-[#14958f] bg-teal-50 border border-teal-200 px-2.5 py-1 rounded hover:bg-teal-100 transition-colors"
            >
              Audit Trail
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 text-gray-500 hover:text-[#282c3f] rounded-full hover:bg-gray-100 transition-colors"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              aria-label="Toggle Fullscreen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsAgentOpen(false)}
              className="p-1.5 text-gray-500 hover:text-[#282c3f] rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Banner Strip */}
        <div className="bg-white px-4 py-2 border-b border-[#eaeaec] flex items-center justify-between text-xs">
          <div className="text-[#282c3f]">
            Shopping as <strong className="text-[#282c3f]">{currentUser?.name}</strong> in <strong className="text-[#ff3f6c]">{currentUser?.city}</strong>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2 py-0.5 rounded">
            Rating-Aware Engine
          </span>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#ff3f6c] text-white rounded-tr-none font-medium'
                    : 'bg-white border border-[#eaeaec] text-[#282c3f] rounded-tl-none'
                }`}
              >
                {/* Render Text / Markdown formatted message */}
                <div className="whitespace-pre-line font-normal">
                  {msg.text}
                </div>

                {/* Embedded Products Carousel in Chat */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#eaeaec] space-y-2">
                    <p className="text-[11px] font-bold text-[#94969f] uppercase tracking-wider">Top Rated Recommendations</p>
                    <div className="space-y-2">
                      {msg.products.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleViewProduct(p.id)}
                          className="bg-white border border-[#eaeaec] p-2.5 rounded-lg flex items-center justify-between gap-3 hover:border-[#ff3f6c] hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <img src={p.image_url} alt={p.title} className="w-12 h-12 object-cover rounded bg-white group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-[#282c3f] group-hover:text-[#ff3f6c] transition-colors truncate">
                              {p.brand} {p.title}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                              <span>★ {p.rating}</span>
                              <span className="text-[#94969f] font-normal">({p.review_count} reviews)</span>
                              {p.is_local_seller && <span className="text-[10px] text-emerald-600 font-semibold">• Fast {p.city}</span>}
                            </div>
                            <div className="text-xs font-bold text-[#282c3f] mt-0.5">Rs. {Math.round(p.price).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p.id, 1, "UK 8");
                              }}
                              className="p-2 bg-[#ff3f6c] hover:bg-[#e62e5b] text-white rounded text-xs font-bold shadow-sm transition-colors"
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
                  <div className="mt-3 pt-3 border-t border-[#eaeaec] bg-pink-50/30 p-2.5 rounded-lg">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#ff3f6c] mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Frequently Bought Together</span>
                    </div>
                    <div className="space-y-2">
                      {msg.fbt_products.map((cp) => (
                        <div
                          key={cp.id}
                          onClick={() => handleViewProduct(cp.id)}
                          className="bg-white p-2 rounded border border-[#eaeaec] hover:border-[#ff3f6c] flex items-center justify-between gap-2 cursor-pointer transition-all group"
                        >
                          <img src={cp.image_url} alt={cp.title} className="w-10 h-10 object-cover rounded group-hover:scale-105 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#282c3f] group-hover:text-[#ff3f6c] truncate transition-colors">{cp.brand} {cp.title}</p>
                            <div className="text-[11px] font-semibold text-gray-600">
                              Rs. {Math.round(cp.price).toLocaleString()} • <span className="text-emerald-700">★ {cp.rating} ({cp.review_count})</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(cp.id, 1, "Standard");
                            }}
                            className="px-2.5 py-1 bg-[#ff3f6c] hover:bg-[#e62e5b] text-white text-[10px] font-bold rounded shadow-sm transition-colors"
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
                  <div className="mt-3 pt-3 border-t border-gray-100 bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Razorpay Test Mode Order Ready</span>
                    </div>
                    <p className="text-xs text-gray-700 font-semibold mb-2">
                      Order Total: <strong className="text-emerald-700">Rs. {Math.round(msg.checkout_data.amount).toLocaleString()}</strong>
                    </p>
                    <button
                      onClick={() => triggerDirectCheckout(msg.checkout_data)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded shadow-sm flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                    >
                      <span>Pay Now with Razorpay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Embedded Timeout Recovery UI (Pillar 8) */}
                {msg.recovery_data?.type === "TIMEOUT_UPI_FALLBACK" && (
                  <div className="mt-3 pt-3 border-t border-amber-200 bg-amber-50 p-3 rounded-lg border border-amber-300">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 mb-1">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <span>Autonomous Payment Recovery Active</span>
                    </div>
                    <p className="text-xs text-amber-800 mb-2">
                      Gateway timeout intercepted. Price is locked for <strong>15 minutes</strong>.
                    </p>
                    <div className="bg-white p-2.5 rounded border border-amber-200 text-center mb-2">
                      <p className="text-[11px] font-bold text-gray-600 mb-1">Scan Dynamic UPI QR</p>
                      <div className="w-32 h-32 mx-auto bg-gray-900 p-2 rounded flex items-center justify-center text-white text-[10px] font-mono text-center">
                        [ DYNAMIC UPI QR : VPA {msg.recovery_data.upi_info?.vpa} ]
                      </div>
                      <p className="text-xs font-bold text-[#282c3f] mt-1.5">Amount: Rs. {Math.round(msg.recovery_data.amount).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => sendMessage("Payment confirmed via dynamic UPI QR")}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded transition-colors"
                    >
                      I have completed UPI Payment
                    </button>
                  </div>
                )}

                {/* Embedded Cart Pruning / Insufficient Funds Negotiation (Pillar 9) */}
                {msg.recovery_data?.type === "CART_PRUNING_NEGOTIATION" && (
                  <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded-lg border border-blue-300">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 mb-1">
                      <ShieldAlert className="w-4 h-4 text-blue-600" />
                      <span>Agentic Cart Negotiation Offer</span>
                    </div>
                    <div className="text-xs text-blue-900 space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span>Original Cart Total:</span>
                        <span className="line-through text-gray-500">Rs. {Math.round(msg.recovery_data.original_total).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-700 text-sm">
                        <span>Negotiated Budget Total:</span>
                        <span>Rs. {Math.round(msg.recovery_data.new_total).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 pt-1">
                        Removed lowest priority accessory: <strong>{msg.recovery_data.removed_item?.title}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => triggerDirectCheckout({ amount: msg.recovery_data.new_total, razorpay_order_id: "order_pruned_retry" })}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Accept & Pay Rs. {Math.round(msg.recovery_data.new_total).toLocaleString()}</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

              </div>

              {/* Suggested Action Chips */}
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleActionClick(act)}
                      className="text-[11px] font-semibold bg-white hover:bg-pink-50 border border-gray-200 hover:border-pink-300 text-[#282c3f] hover:text-[#ff3f6c] px-2.5 py-1 rounded-full transition-all shadow-sm"
                    >
                      {act}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white p-3 rounded-2xl w-fit border border-gray-200 shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4 text-[#ff3f6c] animate-spin" />
              <span>Analyzing catalog ratings & LangGraph state...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-[#eaeaec] flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about 4.5★ shoes, reviews, pairing, or checkout..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-[#eaeaec] rounded-lg text-xs md:text-sm text-[#282c3f] placeholder-gray-400 focus:outline-none focus:border-[#ff3f6c] transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-2.5 bg-[#ff3f6c] hover:bg-[#e62e5b] text-white rounded-lg disabled:opacity-40 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
