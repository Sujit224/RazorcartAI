import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Bot, Sparkles, Star, ShoppingBag, CreditCard, ShieldAlert, ArrowRight, CheckCircle2, Zap, Maximize2, Minimize2, ExternalLink, MapPin, ArrowUpRight, Minus, Plus, Trash2, PackageCheck, Info, Lock, Mic, MicOff } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import { ZoraVoiceView } from './ZoraVoiceView';
import { MarkdownMessage } from './MarkdownMessage';

const rupees = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

export const AgentCopilotModal = () => {
  const navigate = useNavigate();
  const {
    isAgentOpen,
    setIsAgentOpen,
    messages,
    loading,
    sendMessage,
    respondToGate,
    triggerDirectCheckout,
    setIsAuditModalOpen,
    agentMode,
    setAgentMode,
    toggleVoiceMode,
    toggleMic,
    isListening,
    speechTranscript
  } = useAgent();
  const { addToCart, updateQuantity, removeFromCart } = useCart();
  const { currentUser } = useAuth();

  const [inputText, setInputText] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync spoken transcript to input text box in real-time
  useEffect(() => {
    if (speechTranscript) {
      setInputText(speechTranscript);
    }
  }, [speechTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isAgentOpen && !currentUser) {
      setIsAgentOpen(false);
      navigate('/login');
    }
  }, [isAgentOpen, currentUser, navigate, setIsAgentOpen]);

  if (!isAgentOpen || !currentUser) return null;

  // Only the newest message's gate is live. An older bubble's buttons would post
  // a "yes" against whatever is pending *now*, which is a different action than
  // the one the user is looking at.
  const lastIdx = messages.length - 1;
  const lastCartMsgIdx = messages.reduce((last, m, idx) => (m.cart_snapshot ? idx : last), -1);

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
    } else if (actionText === "Negotiate Bulk Order") {
      setIsAgentOpen(false);
      navigate('/negotiate');
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
        <div className="p-4 bg-white text-[#0c2340] flex items-center justify-between border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066cc] flex items-center justify-center text-white font-black shadow-xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-[#0c2340] flex items-center gap-1.5 leading-none">
                ZORA
                <span className="text-[10px] font-black text-[#0066cc] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                  Copilot
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Text Chat & Voice Input</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Segmented Toggle (Chat vs Voice) */}
            <div className="flex items-center bg-[#f1f5f9] rounded-lg p-0.5 border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setAgentMode('standard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  agentMode === 'standard' ? 'bg-white text-[#0066cc] shadow-xs' : 'text-[#5c6f84] hover:text-[#0c2340]'
                }`}
                title="Switch to Text Chat"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgentMode('voice');
                  if (!isListening) toggleMic();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  agentMode === 'voice' ? 'bg-white text-[#0066cc] shadow-xs' : 'text-[#5c6f84] hover:text-[#0c2340]'
                }`}
                title="Switch to Voice Mode"
              >
                <Mic className={`w-3.5 h-3.5 ${agentMode === 'voice' && isListening ? 'text-red-500 animate-pulse' : ''}`} />
                <span className="hidden sm:inline">Voice</span>
              </button>
            </div>

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
        </div>

        {agentMode === 'voice' ? (
          <ZoraVoiceView />
        ) : (
          <>
            {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const userInitial = currentUser?.name ? currentUser.name.trim().charAt(0).toUpperCase() : 'U';

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
                    title="ZORA"
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
                    {/* Render Text / Markdown formatted message */}
                    <MarkdownMessage content={msg.text} isUser={isUser} />

                {/* Why the agent thought "the 2nd one" meant what it acted on.
                    Shown, not merely logged: a misresolved reference is cheap to
                    correct here and expensive to correct after it has been paid
                    for. */}
                {msg.reference_reason && (
                  <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-[#5c6f84] font-medium bg-white border border-[#e2e8f0] px-2.5 py-2 rounded-lg">
                    <Info className="w-3.5 h-3.5 text-[#0066cc] shrink-0 mt-px" />
                    <span>Resolved as: {msg.reference_reason}</span>
                  </div>
                )}

                {/* Embedded Products Grid / Carousel in Chat with Full Variety */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-[#e2e8f0] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider">
                        Curated Matches ({msg.products.length} Items Available)
                      </p>
                      <span className="text-[10px] text-[#0066cc] font-bold">Say "Compare 1st and 3rd"</span>
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {msg.products.map((p, pIdx) => {
                        const meta = p.product_meta || {};
                        const proc = meta.processor || '';
                        const ram = meta.ram || '';
                        return (
                          <div
                            key={p.id || pIdx}
                            onClick={() => handleViewProduct(p.id)}
                            className="bg-white border border-[#e2e8f0] p-3 rounded-lg flex items-center justify-between gap-3.5 hover:border-[#0047fb] hover:shadow-sm transition-all cursor-pointer group"
                          >
                            {/* Fixed Thumbnail Image Container */}
                            <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                              <img
                                src={p.image_url}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-1 left-1 bg-[#0c2340]/90 backdrop-blur-xs text-white text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center shadow-xs">
                                {pIdx + 1}
                              </span>
                            </div>

                            {/* Details Container */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs text-[#0c2340] group-hover:text-[#0047fb] transition-colors line-clamp-1">
                                {p.brand} {p.title}
                              </div>

                              {/* Specs Pill Chips */}
                              {(proc || ram) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {proc && (
                                    <span className="text-[9px] font-bold bg-[#f0f7ff] text-[#0066cc] px-1.5 py-0.5 rounded-md border border-blue-100 truncate max-w-[170px]">
                                      ⚡ {proc}
                                    </span>
                                  )}
                                  {ram && (
                                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                      💾 {ram}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold mt-1">
                                <span>★ {p.rating}</span>
                                <span className="text-[#5c6f84] font-normal">({p.review_count} reviews)</span>
                                {p.is_local_seller && <span className="text-[10px] text-emerald-600 font-bold">• Fast {p.city}</span>}
                              </div>
                              <div className="text-xs font-black text-[#0c2340] mt-0.5">Rs. {Math.round(p.price).toLocaleString()}</div>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(p.id, 1, "Standard");
                                }}
                                className="p-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-xl text-xs font-bold shadow-xs hover:scale-105 transition-all cursor-pointer"
                                title="Add to Bag"
                              >
                                <ShoppingBag className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
                          className="bg-white p-2.5 rounded-lg border border-[#e2e8f0] hover:border-[#0047fb] flex items-center justify-between gap-2 cursor-pointer transition-all group shadow-sm"
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

                {/* Bag lines, numbered to match the ordinals the agent just used.
                    Rendered only when the turn was actually about the bag --
                    every cart turn carries a snapshot for the badge, and drawing
                    the whole bag under an unrelated reply would be noise. */}
                {msg.cart_snapshot?.items?.length > 0 &&
                 ['view_cart', 'cart_add', 'cart_update_qty', 'cart_remove',
                  'cart_clear', 'confirm', 'deny'].includes(msg.intent) && (
                  <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider">Your Bag</p>
                      <span className="text-[11px] font-bold text-[#0c2340]">
                        {msg.cart_snapshot.line_count} item{msg.cart_snapshot.line_count === 1 ? '' : 's'}
                        {msg.cart_snapshot.item_count !== msg.cart_snapshot.line_count &&
                          ` • ${msg.cart_snapshot.item_count} units`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {msg.cart_snapshot.items.slice(0, 8).map((row, rIdx) => (
                        <div
                          key={row.item_id}
                          className="bg-white border border-[#e2e8f0] p-2.5 rounded-lg flex items-center gap-2.5 shadow-sm"
                        >
                          <span className="w-5 h-5 shrink-0 rounded-md bg-[#f0f7ff] text-[#0066cc] text-[10px] font-black flex items-center justify-center">
                            {rIdx + 1}
                          </span>
                          <img
                            src={row.image_url}
                            alt={row.title}
                            onClick={() => handleViewProduct(row.product_id)}
                            className="w-10 h-12 object-cover rounded-lg bg-slate-50 shrink-0 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              onClick={() => handleViewProduct(row.product_id)}
                              className="font-extrabold text-xs text-[#0c2340] hover:text-[#0066cc] truncate cursor-pointer transition-colors"
                            >
                              {row.brand} {row.title}
                            </div>
                            <div className="text-[11px] text-[#5c6f84] font-semibold">
                              {rupees(row.price)} × {row.quantity} = <strong className="text-[#0c2340]">{rupees(row.line_total)}</strong>
                              {row.size && ` • ${row.size}`}
                            </div>
                          </div>
                          {/* Only the newest cart snapshot's controls are live: an older
                              snapshot's item_id may already be gone from the bag. */}
                          {idx === lastCartMsgIdx && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetId = row.item_id || row.id;
                                  if (targetId) {
                                    if (row.quantity <= 1) {
                                      await removeFromCart(targetId);
                                    } else {
                                      await updateQuantity(targetId, row.quantity - 1);
                                    }
                                  }
                                }}
                                className="p-1.5 border border-[#e2e8f0] rounded-lg text-[#5c6f84] hover:border-[#0066cc] hover:text-[#0066cc] transition-colors cursor-pointer"
                                title={row.quantity === 1 ? "Remove from bag" : "One fewer"}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetId = row.item_id || row.id;
                                  if (targetId) {
                                    await updateQuantity(targetId, row.quantity + 1);
                                  }
                                }}
                                className="p-1.5 border border-[#e2e8f0] rounded-lg text-[#5c6f84] hover:border-[#0066cc] hover:text-[#0066cc] transition-colors cursor-pointer"
                                title="One more"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetId = row.item_id || row.id;
                                  if (targetId) {
                                    await removeFromCart(targetId);
                                  }
                                }}
                                className="p-1.5 border border-[#e2e8f0] rounded-lg text-[#5c6f84] hover:border-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove from bag"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#0c2340] pt-1">
                      <span className="text-[#5c6f84]">
                        Subtotal {rupees(msg.cart_snapshot.subtotal)}
                        {msg.cart_snapshot.shipping_fee > 0
                          ? ` + ${rupees(msg.cart_snapshot.shipping_fee)} shipping`
                          : ' • free shipping'}
                      </span>
                      <span className="font-black">{rupees(msg.cart_snapshot.total)}</span>
                    </div>
                  </div>
                )}

                {/* Past orders, numbered so "put the 2nd one in cart again" has
                    something visible to count against. */}
                {msg.orders_snapshot?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2.5">
                    <p className="text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider">Your Orders</p>
                    <div className="space-y-2">
                      {msg.orders_snapshot.map((o, oIdx) => (
                        <div key={o.order_id} className="bg-white border border-[#e2e8f0] p-3 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 shrink-0 rounded-md bg-[#f0f7ff] text-[#0066cc] text-[10px] font-black flex items-center justify-center">
                              {oIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-extrabold text-xs text-[#0c2340]">
                                Order #{o.order_id}
                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#5c6f84]">{o.status}</span>
                              </div>
                              <div className="text-[11px] text-[#5c6f84] font-semibold truncate">
                                {o.items?.map(it => `${it.brand} ${it.title}`.trim()).join(', ') || 'no items'}
                              </div>
                            </div>
                            <div className="text-xs font-black text-[#0c2340] shrink-0">{rupees(o.total_amount)}</div>
                          </div>
                          {idx === lastIdx && (
                            <button
                              type="button"
                              onClick={() => sendMessage(`Put order #${o.order_id} in my cart again`)}
                              className="mt-2 w-full py-1.5 border border-[#e2e8f0] hover:border-[#0066cc] hover:text-[#0066cc] text-[#5c6f84] text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Reorder this</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* The gate. This is what makes a money action *gated* rather
                    than merely logged: the agent has computed the change and is
                    holding it, unexecuted, until the user says yes. */}
                {msg.pending_confirmation && (
                  <div className="mt-3 bg-amber-50 border border-amber-300 p-3.5 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 mb-1">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Waiting for your approval</span>
                    </div>
                    <p className="text-xs text-amber-900 font-semibold mb-1">
                      {msg.pending_confirmation.prompt}
                    </p>
                    {msg.pending_confirmation.amount > 0 && (
                      <p className="text-[11px] text-amber-800 font-medium mb-2.5">
                        {msg.pending_confirmation.action === 'clear_cart'
                          ? `Nothing has been removed yet — ${rupees(msg.pending_confirmation.amount)} is still in your bag.`
                          : `Nothing has been added yet — this would put ${rupees(msg.pending_confirmation.amount)} in your bag.`}
                      </p>
                    )}
                    {idx === lastIdx ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => respondToGate(true)}
                          disabled={loading}
                          className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Yes, go ahead</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToGate(false)}
                          disabled={loading}
                          className="flex-1 py-2 bg-white border border-amber-300 hover:bg-amber-100 disabled:opacity-40 text-amber-900 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          No, cancel
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 font-bold italic">
                        This approval request is no longer active.
                      </p>
                    )}
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
                    <div className="flex flex-wrap gap-2 mt-3 max-w-[95%]">
                      {msg.suggested_actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(act)}
                          className="text-xs md:text-sm font-semibold text-[#0066cc] bg-white hover:bg-[#f0f7ff] border-2 border-[#0066cc] px-4 py-1.5 rounded-full transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-95"
                        >
                          <span>{act}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#5c6f84] bg-[#f8fafc] p-3 rounded-2xl w-fit border border-[#e2e8f0] shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-[#0066cc] animate-spin" />
              <span>Checking out the inventory...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Speech-to-Text Microphone Button */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-[#e2e8f0] flex flex-col gap-2">
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-red-50 text-red-700 text-xs font-extrabold rounded-xl border border-red-200 animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                <span>Microphone Active — Speak your prompt...</span>
              </div>
              <button
                type="button"
                onClick={toggleMic}
                className="text-[10px] bg-red-100 hover:bg-red-200 text-red-800 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
              >
                Stop Mic
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={isListening ? "Listening to your voice..." : "Ask about 4.5★ shoes, reviews, pairing, or checkout..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs md:text-sm text-[#0c2340] placeholder-[#5c6f84] focus:bg-white focus:outline-none focus:border-[#0066cc] transition-all font-medium"
            />

            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-md animate-pulse'
                  : 'bg-[#f8fafc] hover:bg-[#f0f7ff] text-[#0066cc] border-[#e2e8f0] hover:border-[#0066cc]'
              }`}
              title={isListening ? "Stop Microphone" : "Speak prompt using Microphone"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#0066cc]" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-3 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        </>
        )}

      </div>
    </div>
  );
};
