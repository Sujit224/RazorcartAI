import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Package, MapPin, Tag, ArrowRight, Store, ShieldCheck,
  CreditCard, Sparkles, CheckCircle2, RefreshCw, ChevronRight,
  Clock, Heart, ShoppingBag, Lock, Smartphone, Mail, Edit3, Truck, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { AgenticChatbotLauncher } from '../components/AgenticChatbotLauncher';
import { AgentCopilotModal } from '../components/AgentCopilotModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { DemoChaosPanel } from '../components/DemoChaosPanel';

const STATUS_COLOR = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  recovered_upi: 'bg-amber-50 text-amber-700 border-amber-200',
  price_held: 'bg-purple-50 text-purple-700 border-purple-200',
  pending: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, switchPersona, updateUserCity, logout } = useAuth();
  const { cart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'persona' | 'addresses' | 'payments' | 'portals'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [selectedCity, setSelectedCity] = useState(currentUser?.city || 'Bengaluru');

  const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'];

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchRecommendations();
  }, [currentUser?.id]);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await api.getPersonalizedFeed(currentUser?.id || 1);
      setRecommendations(res.data.slice(0, 4) || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

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

  const handleCitySave = (city) => {
    setSelectedCity(city);
    updateUserCity(city);
    setEditingCity(false);
  };

  const navMenuItems = [
    { id: 'overview', label: 'Overview', icon: User, badge: null },
    { id: 'orders', label: 'Orders & Returns', icon: Package, badge: orders.length || null },
    { id: 'persona', label: 'Zero-Query AI Persona', icon: Sparkles, badge: 'Vector AI' },
    { id: 'addresses', label: 'Addresses', icon: MapPin, badge: null },
    { id: 'payments', label: 'Payment & Wallet', icon: CreditCard, badge: null },
    { id: 'portals', label: 'System Portals', icon: Store, badge: 'Merchant/Admin' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0c2340] flex flex-col font-sans">
      {/* Universal Myntra Navbar */}
      <Navbar
        onSearch={(q) => navigate(`/?search=${encodeURIComponent(q)}`)}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="ALL"
        setSelectedCategory={(cat) => navigate(`/?category=${cat}`)}
      />

      {/* Main Container */}
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 py-8 flex-1">
        
        {/* Breadcrumb */}
        <div className="text-xs text-[#94969f] mb-6 flex items-center gap-1.5 font-normal">
          <Link to="/" className="hover:text-[#0066cc] transition-colors">Home</Link>
          <span>/</span>
          <span className="font-bold text-[#0c2340]">My Account</span>
          <span>/</span>
          <span className="capitalize font-semibold text-[#5c6f84]">{activeTab}</span>
        </div>

        {/* Account Grid: Left Sidebar + Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Sidebar Navigation with Exact Myntra Typography ── */}
          <div className="md:col-span-4 lg:col-span-3 bg-white border border-[#e2e8f0] py-4 sticky top-24">
            
            {/* Account Header */}
            <div className="px-5 pb-3 border-b border-[#e2e8f0]">
              <h1 className="text-lg font-bold text-[#0c2340]">Account</h1>
              <p className="text-xs text-[#94969f] mt-0.5">{currentUser?.name}</p>
            </div>

            {/* Overview */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-5 py-2 text-[15px] transition-colors ${
                  activeTab === 'overview'
                    ? 'text-[#14958f] font-bold border-l-4 border-[#14958f] bg-teal-50/20'
                    : 'text-[#0c2340] font-normal hover:text-[#0066cc] border-l-4 border-transparent'
                }`}
              >
                Overview
              </button>
            </div>

            <div className="border-b border-[#e2e8f0] mx-5 my-2" />

            {/* ORDERS */}
            <div>
              <div className="px-5 pt-1 pb-1 text-[11px] font-normal uppercase tracking-wider text-[#94969f]">
                ORDERS
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-5 py-1.5 text-[15px] transition-colors flex items-center justify-between ${
                  activeTab === 'orders'
                    ? 'text-[#14958f] font-bold border-l-4 border-[#14958f] bg-teal-50/20'
                    : 'text-[#0c2340] font-normal hover:text-[#0066cc] border-l-4 border-transparent'
                }`}
              >
                <span>Orders & Returns</span>
                {orders.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                    {orders.length}
                  </span>
                )}
              </button>
            </div>

            <div className="border-b border-[#e2e8f0] mx-5 my-2" />

            {/* Logout Button */}
            <div className="px-5 py-1">
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

          </div>

          {/* ── Right Content Area ── */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">

            {/* ══ 1. OVERVIEW TAB ══ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Profile Overview Banner */}
                <div className="bg-white p-6 md:p-8 border border-[#e2e8f0]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e2e8f0]">
                    <div>
                      <span className="text-[11px] font-normal uppercase tracking-widest text-[#0066cc] block mb-1">
                        Verified Customer Profile
                      </span>
                      <h1 className="text-2xl font-bold text-[#0c2340] tracking-tight">{currentUser?.name}</h1>
                      <p className="text-xs text-[#94969f] mt-0.5">Myntra • RazorCart AI Member since 2026</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AI Preference Active</span>
                      </span>
                      <button
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean Personal Information Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    <div className="border-b border-[#e2e8f0] pb-3 space-y-1">
                      <span className="text-[11px] font-normal text-[#94969f] uppercase tracking-wider block">Full Name</span>
                      <p className="text-[15px] font-semibold text-[#0c2340]">{currentUser?.name}</p>
                    </div>

                    <div className="border-b border-[#e2e8f0] pb-3 space-y-1">
                      <span className="text-[11px] font-normal text-[#94969f] uppercase tracking-wider block">Email Address</span>
                      <p className="text-[15px] font-semibold text-[#0c2340]">{currentUser?.email}</p>
                    </div>

                    <div className="border-b border-[#e2e8f0] pb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-normal text-[#94969f] uppercase tracking-wider block">Delivery City (Proximity Engine)</span>
                        <button
                          onClick={() => setEditingCity(!editingCity)}
                          className="text-xs text-[#0066cc] font-semibold hover:underline"
                        >
                          {editingCity ? 'Cancel' : 'Change City'}
                        </button>
                      </div>
                      
                      {editingCity ? (
                        <div className="flex items-center gap-2 mt-2">
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="text-xs p-1.5 border border-gray-300 rounded bg-white font-semibold text-gray-800 focus:outline-none focus:border-[#0066cc]"
                          >
                            {cities.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleCitySave(selectedCity)}
                            className="px-3 py-1 bg-[#0066cc] text-white text-xs font-bold rounded shadow-sm hover:bg-[#0052a3]"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <p className="text-[15px] font-semibold text-[#0c2340] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#0066cc]" />
                          <span>{currentUser?.city || 'Bengaluru'}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-2">Express Hub</span>
                        </p>
                      )}
                    </div>

                    <div className="border-b border-[#e2e8f0] pb-3 space-y-1">
                      <span className="text-[11px] font-normal text-[#94969f] uppercase tracking-wider block">Account Type</span>
                      <p className="text-[15px] font-semibold text-[#0c2340] capitalize">{currentUser?.role || 'Customer'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Metric Action Cards (No Icon Boxes) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div
                    onClick={() => setActiveTab('orders')}
                    className="bg-white p-5 border border-[#e2e8f0] hover:border-[#0c2340] cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-normal uppercase tracking-wider text-[#94969f]">Orders Summary</span>
                      <span className="text-sm font-bold text-[#0066cc]">{orders.length} Placed</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[16px] text-[#0c2340] group-hover:text-[#0066cc] transition-colors flex items-center justify-between">
                        <span>Orders & Returns</span>
                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform">❯</span>
                      </h4>
                      <p className="text-xs text-[#94969f] mt-1 font-normal">Track shipments, return or reorder</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setActiveTab('persona')}
                    className="bg-white p-5 border border-[#e2e8f0] hover:border-[#0c2340] cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-normal uppercase tracking-wider text-[#94969f]">AI Personalization</span>
                      <span className="text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Active Vectors</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[16px] text-[#0c2340] group-hover:text-[#0066cc] transition-colors flex items-center justify-between">
                        <span>Zero-Query Persona</span>
                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform">❯</span>
                      </h4>
                      <p className="text-xs text-[#94969f] mt-1 font-normal">Taste vector & search weights</p>
                    </div>
                  </div>

                  <div
                    onClick={() => navigate('/cart')}
                    className="bg-white p-5 border border-[#e2e8f0] hover:border-[#0c2340] cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-normal uppercase tracking-wider text-[#94969f]">Current Bag</span>
                      <span className="text-sm font-bold text-[#0c2340]">{cart?.item_count || 0} Items</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[16px] text-[#0c2340] group-hover:text-[#0066cc] transition-colors flex items-center justify-between">
                        <span>Shopping Bag</span>
                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform">❯</span>
                      </h4>
                      <p className="text-xs text-[#94969f] mt-1 font-normal">Proceed to secure checkout</p>
                    </div>
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* RECOMMENDED FOR YOU (BASED ON INTERESTS)                      */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="bg-white border border-[#e2e8f0] p-6 mt-6">
                  <div className="flex items-center justify-between mb-4 border-b border-[#e2e8f0] pb-3">
                    <h3 className="font-bold text-lg text-[#0c2340] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#2963FF]" />
                      Recommended for You
                    </h3>
                    <span className="text-[11px] font-semibold text-[#5c6f84] uppercase tracking-wider bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      Based on your FBT Profile
                    </span>
                  </div>

                  {loadingRecommendations ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-[#2963FF] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : recommendations.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {recommendations.map(rec => (
                        <div key={rec.id} onClick={() => navigate(`/product/${rec.id}`)} className="group cursor-pointer">
                          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 border border-[#e2e8f0] mb-3">
                            <img src={rec.image_url} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#0c2340] line-clamp-1 group-hover:text-[#0066cc] transition-colors">{rec.title}</h4>
                            <p className="text-[11px] text-[#94969f] mb-1">{rec.brand}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-[#0c2340]">₹{rec.price}</span>
                              {rec.original_price > rec.price && (
                                <span className="text-gray-400 line-through">₹{rec.original_price}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 italic">More activity needed for personalized recommendations.</p>
                  )}
                </div>

              </div>
            )}

            {/* ══ 2. ORDERS TAB ══ */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="bg-white p-6 border border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[#0c2340] tracking-tight">Order History & Returns</h2>
                    <p className="text-xs text-[#94969f] mt-0.5">All transactions processed through Razorpay Gateway</p>
                  </div>
                  <button
                    onClick={fetchOrders}
                    className="px-3 py-1.5 bg-white border border-[#e2e8f0] hover:border-[#0c2340] text-[#0c2340] text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="bg-white p-12 border border-[#e2e8f0] text-center text-gray-400 text-xs animate-pulse">
                    Loading your orders and tracking status...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white p-12 border border-[#e2e8f0] text-center">
                    <h3 className="font-bold text-base text-[#0c2340]">No Orders Found</h3>
                    <p className="text-xs text-[#94969f] mt-1 max-w-sm mx-auto">
                      You haven't placed any orders with this persona yet. Shop top rated fashion and test checkout!
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="mt-5 px-6 py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="bg-white border border-[#e2e8f0] space-y-4 p-5">
                      
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0c2340]">Order #{ord.id}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[ord.status] || STATUS_COLOR.pending}`}>
                              {ord.status.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#94969f] block mt-0.5">
                            Placed on {new Date(ord.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-[#94969f] block">Total Amount</span>
                          <span className="text-base font-bold text-[#0c2340]">₹{ord.total_amount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Items Ordered */}
                      <div className="space-y-3">
                        {ord.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-white border border-[#e2e8f0] rounded">
                            <div>
                              <p className="font-bold text-xs text-[#0c2340]">{item.title || item.name || 'Product'}</p>
                              <p className="text-[11px] text-[#94969f]">Qty: {item.quantity} × ₹{item.price}</p>
                            </div>
                            <span className="font-bold text-xs text-[#0c2340]">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Actions */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Delivering to {currentUser?.city} ({currentUser?.name})</span>
                        </div>
                        <button
                          onClick={() => {
                            setIsAgentOpen(true);
                            sendMessage(`Show order status and delivery updates for Order #${ord.id}`);
                          }}
                          className="px-3.5 py-1.5 bg-white border border-blue-200 text-[#0066cc] font-bold rounded hover:bg-[#f0f7ff] transition-colors"
                        >
                          Ask AI Agent
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}

            {/* ══ 3. ZERO-QUERY PERSONA TAB ══ */}
            {activeTab === 'persona' && (
              <div className="space-y-6">
                
                {/* Persona Engine Overview */}
                <div className="bg-white p-6 border border-[#e2e8f0] space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0c2340] tracking-tight">Zero-Query Composite Vector AI</h2>
                    <p className="text-xs text-[#94969f]">Semantic taste profile, review weightings, and real-time city seller boosting</p>
                  </div>

                  <div className="p-4 bg-white rounded border border-[#e2e8f0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0066cc] uppercase tracking-wider">Active Demo Persona</span>
                      <span className="text-[10px] bg-white border border-blue-200 font-bold px-2 py-0.5 rounded text-[#0c2340]">
                        User ID: {currentUser?.id}
                      </span>
                    </div>
                    <p className="text-base font-bold text-[#0c2340]">{currentUser?.name}</p>
                    <p className="text-xs text-[#5c6f84]">{currentUser?.email} • Based in {currentUser?.city}</p>
                  </div>
                </div>

                {/* Interest History Vector Tags */}
                <div className="bg-white p-6 border border-[#e2e8f0] space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94969f]">
                    Recorded Search Vector Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentUser?.search_history?.length > 0 ? (
                      currentUser.search_history.map((term, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white hover:border-[#0066cc] hover:text-[#0066cc] text-[#0c2340] text-xs rounded-full border border-[#e2e8f0] font-semibold transition-colors">
                          {term}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No search history recorded yet.</p>
                    )}
                  </div>
                </div>

                {/* Switch Persona Selection */}
                <div className="bg-white p-6 border border-[#e2e8f0] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94969f]">
                    Switch Demo Customer Persona
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 1, name: 'Priya Sharma', city: 'Bengaluru', style: 'Women Marathon & Road Running' },
                      { id: 2, name: 'Rahul Verma', city: 'Mumbai', style: 'Men White Sneakers & Sneaker Care' },
                    ].map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => switchPersona(persona.id)}
                        className={`text-left p-4 rounded border transition-all flex items-start justify-between ${
                          currentUser?.id === persona.id
                            ? 'border-[#0066cc] bg-[#f0f7ff]/20'
                            : 'border-[#e2e8f0] hover:border-gray-400'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[#0c2340]">{persona.name}</p>
                          <p className="text-xs text-[#94969f] mt-0.5">{persona.style}</p>
                          <p className="text-[11px] font-bold text-[#0066cc] mt-2">📍 {persona.city}</p>
                        </div>
                        {currentUser?.id === persona.id && (
                          <CheckCircle2 className="w-5 h-5 text-[#0066cc]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ══ 4. ADDRESSES TAB ══ */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="bg-white p-6 border border-[#e2e8f0]">
                  <h2 className="text-xl font-bold text-[#0c2340] tracking-tight">Saved Delivery Addresses</h2>
                  <p className="text-xs text-[#94969f] mt-0.5">Matched with local seller inventory for same-day express delivery</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 border border-[#0066cc] relative space-y-2">
                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase bg-[#0066cc] text-white px-2 py-0.5 rounded">
                      Default
                    </span>
                    <p className="font-bold text-sm text-[#0c2340]">{currentUser?.name}</p>
                    <p className="text-xs text-[#5c6f84] leading-relaxed">
                      Flat 402, Green Glen Layout, Outer Ring Road<br />
                      {currentUser?.city}, 560103
                    </p>
                    <p className="text-xs text-[#5c6f84] font-semibold pt-1">Mobile: +91 98765 43210</p>
                    <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Express delivery available from {currentUser?.city} sellers</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ 5. PAYMENTS & WALLET TAB ══ */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="bg-white p-6 border border-[#e2e8f0]">
                  <h2 className="text-xl font-bold text-[#0c2340] tracking-tight">Payment & Agentic Wallet</h2>
                  <p className="text-xs text-[#94969f] mt-0.5">Razorpay Test Gateway with Autonomous 504 Timeout & UPI recovery</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 border border-[#e2e8f0] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0c2340]">Razorpay Direct Gateway</span>
                      <CreditCard className="w-4 h-4 text-[#0c2340]" />
                    </div>
                    <p className="text-xs text-[#7e818c] leading-relaxed">
                      Instant checkout with Cards, Netbanking, UPI, and Wallet integration.
                    </p>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                      256-Bit Encrypted
                    </span>
                  </div>

                  <div className="bg-white p-5 border border-[#e2e8f0] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#0c2340]">Dynamic Price-Lock Protection</span>
                      <Clock className="w-4 h-4 text-[#0c2340]" />
                    </div>
                    <p className="text-xs text-[#7e818c] leading-relaxed">
                      15-minute price hold automatically engaged upon any gateway timeout.
                    </p>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                      Price Protection Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ══ 6. SYSTEM PORTALS TAB ══ */}
            {activeTab === 'portals' && (
              <div className="space-y-4">
                <div className="bg-white p-6 border border-[#e2e8f0]">
                  <h2 className="text-xl font-bold text-[#0c2340] tracking-tight">System Portal Navigation</h2>
                  <p className="text-xs text-[#94969f] mt-0.5">Switch between Customer Storefront, Merchant Dashboard, and Admin Portal</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => navigate('/merchant/login')}
                    className="bg-white p-5 border border-[#e2e8f0] hover:border-[#0c2340] cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-[#7c3aed]">Merchant</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-sm text-[#0c2340]">Merchant Partner Dashboard</h3>
                    <p className="text-xs text-[#94969f]">Order fulfilling, stock controls, autonomous pricing, and transaction history.</p>
                  </div>

                  <div
                    onClick={() => navigate('/admin/login')}
                    className="bg-white p-5 border border-[#e2e8f0] hover:border-[#0c2340] cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-emerald-700">Razorpay Admin</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="font-bold text-sm text-[#0c2340]">Razorpay Admin Portal</h3>
                    <p className="text-xs text-[#94969f]">Merchant onboarding, system-wide GMV analytics, and fee configuration.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Floating Overlays */}
      <AgenticChatbotLauncher />
      <AgentCopilotModal />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}
