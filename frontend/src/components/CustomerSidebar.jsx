import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import {
  User, Package, ShoppingBag, X, MapPin, Tag, ArrowRight,
  Store, ShieldCheck, LogOut, ChevronRight, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_COLOR = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  recovered_upi: 'bg-amber-50 text-amber-700 border-amber-200',
  price_held: 'bg-purple-50 text-purple-700 border-purple-200',
  pending: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function CustomerSidebar({ isOpen, onClose, onOpenCheckout }) {
  const navigate = useNavigate();
  const { currentUser, switchPersona, logout } = useAuth();
  const { cart, clearCart } = useCart();
  const cartItems = cart?.items || [];
  const totalAmount = cart?.total || cart?.subtotal || 0;
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders' | 'cart' | 'portals'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetchOrders();
    }
  }, [isOpen, activeTab, currentUser?.id]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getMyOrders(currentUser?.id || 1);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-100">
          
          {/* Header */}
          <div className="p-5 bg-white text-[#0c2340] flex items-center justify-between border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0066cc] flex items-center justify-center font-bold text-white text-lg shadow-sm">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-tight text-[#0c2340]">{currentUser?.name || 'Customer Account'}</h2>
                <p className="text-[11px] text-[#94969f] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#0066cc]" /> {currentUser?.city || 'Bengaluru'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-[#0c2340] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'orders', label: 'Orders', icon: Package, badge: orders.length },
              { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartItems.length },
              { id: 'portals', label: 'Portals', icon: Store },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                    isActive
                      ? 'border-[#0066cc] text-[#0066cc] bg-white font-extrabold shadow-sm'
                      : 'border-transparent hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-[#0066cc] text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-[#f0f7ff]/70 p-4 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-extrabold uppercase text-[#0066cc] tracking-wider block mb-1">
                    Zero-Query Personalization Persona
                  </span>
                  <p className="text-sm font-bold text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-semibold">City Proximity:</span>
                    <span className="font-extrabold text-[#0066cc] flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {currentUser?.city}
                    </span>
                  </div>
                </div>

                {/* Past Search History */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0066cc]" /> Interest Search History
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser?.search_history?.length > 0 ? (
                      currentUser.search_history.map((term, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 font-medium">
                          {term}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No search history recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Persona Switcher */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">
                    Switch Demo Customer Persona
                  </h3>
                  <div className="space-y-2">
                    {[
                      { id: 1, name: 'Priya Sharma', city: 'Bengaluru', style: 'Women Marathon & Road Running' },
                      { id: 2, name: 'Rahul Verma', city: 'Mumbai', style: 'Men White Sneakers & Sneaker Care' },
                    ].map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => switchPersona(persona.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          currentUser?.id === persona.id
                            ? 'border-[#0066cc] bg-[#f0f7ff]/50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{persona.name}</p>
                          <p className="text-[11px] text-gray-500">{persona.style} · {persona.city}</p>
                        </div>
                        {currentUser?.id === persona.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#0066cc]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign Out / Sign In Actions */}
                <div className="pt-4 border-t border-gray-100">
                  {currentUser ? (
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                        navigate('/');
                      }}
                      className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out of Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        navigate('/login');
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#0066cc] to-[#ff7034] hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <User className="w-4 h-4" />
                      <span>Sign In / Create Account</span>
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">My Orders</h3>
                  <button onClick={fetchOrders} className="text-xs text-[#0066cc] font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-gray-400">Loading order history...</div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600">No orders placed yet</p>
                    <p className="text-[11px] text-gray-400 mt-1">Complete a checkout to see orders listed here.</p>
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                        <div>
                          <span className="text-xs font-extrabold text-gray-900">Order #{ord.id}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {new Date(ord.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLOR[ord.status] || STATUS_COLOR.pending}`}>
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {ord.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700 font-medium truncate max-w-[220px]">
                              {item.quantity}x {item.title || item.name || 'Product'}
                            </span>
                            <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-500">Total Paid:</span>
                        <span className="font-extrabold text-gray-900 text-sm">₹{ord.total_amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── CART TAB ── */}
            {activeTab === 'cart' && (
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Shopping Cart</h3>

                {cartItems.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-600">Your cart is empty</p>
                    <p className="text-[11px] text-gray-400 mt-1">Browse products and add them to cart.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-3 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                          {item.product?.image_url && (
                            <img src={item.product.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.product?.title}</p>
                            <p className="text-[11px] text-gray-500 font-semibold">Qty: {item.quantity} × ₹{item.product?.price}</p>
                          </div>
                          <span className="text-xs font-extrabold text-[#0066cc]">
                            ₹{(item.product?.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-gray-600">Total:</span>
                        <span className="font-extrabold text-[#0066cc] text-lg">₹{totalAmount.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/cart');
                        }}
                        className="w-full py-3 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <span>View Full Bag & Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PORTALS TAB ── */}
            {activeTab === 'portals' && (
              <div className="space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                  Switch System Portal
                </span>

                <div className="space-y-3">
                  <button
                    onClick={() => { onClose(); navigate('/merchant/login'); }}
                    className="w-full p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm">
                        <Store className="w-4 h-4" /> Merchant Portal
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-purple-600/80">View store sales, AI-driven profit, and agent reasoning ledger.</p>
                  </button>

                  <button
                    onClick={() => { onClose(); navigate('/admin/login'); }}
                    className="w-full p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                        <ShieldCheck className="w-4 h-4" /> Razorpay Admin Portal
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-emerald-600/80">Cross-merchant reporting, global profit/day, and onboard merchants.</p>
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
