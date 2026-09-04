import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Store, TrendingUp, IndianRupee, Zap, RefreshCw,
  LogOut, ChevronLeft, ChevronRight, Package, Bot, Star, ShieldCheck,
  ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Building2,
  Users, Plus, Trash2, Search, Filter, X, ArrowRight, Eye, ShoppingBag,
  Clock, MapPin, Mail, AlertTriangle, Layers, Award, Tag, ExternalLink,
  Activity, Check, ArrowUpRight
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Formatting Helpers ────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pct = (ai, total) => total > 0 ? ((ai / total) * 100).toFixed(1) + '%' : '0%';

const STATUS_BADGE = {
  SUCCESS: 'bg-[#E8F7F1] text-[#27AE60] border-[#A8D5BF]',
  TIMEOUT_RECOVERED: 'bg-amber-50 text-amber-700 border-amber-200',
  DECLINE_RESOLVED: 'bg-blue-50 text-blue-700 border-blue-200',
  INITIALIZED: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  recovered_upi: 'bg-amber-50 text-amber-700 border-amber-200',
};

const AGENT_BADGE = {
  Discovery: 'bg-[#eef1f8] text-[#2963FF] border-blue-200',
  DiscoveryAgent: 'bg-[#eef1f8] text-[#2963FF] border-blue-200',
  Bundle: 'bg-purple-50 text-purple-700 border-purple-200',
  UpsellAgent: 'bg-purple-50 text-purple-700 border-purple-200',
  Negotiation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  NegotiationAgent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Recovery: 'bg-amber-50 text-amber-700 border-amber-200',
  RecoveryAgent: 'bg-amber-50 text-amber-700 border-amber-200',
  CheckoutAgent: 'bg-blue-50 text-blue-700 border-blue-200',
  ZeroQueryPersonalizer: 'bg-teal-50 text-teal-700 border-teal-200',
};

const StatCard = ({ icon: Icon, label, value, sub, iconColor = 'text-[#2963FF]', iconBg = 'bg-[#2963FF]/10' }) => (
  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 shadow-sm hover:border-gray-300 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5c6f84]">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} border border-[#e2e8f0]`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-black text-[#0C1A2E] tracking-tight mb-2">{value}</p>
    {sub && (
      <div className="flex items-center gap-1.5 text-xs text-[#5c6f84]">
        {sub}
      </div>
    )}
  </div>
);

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_user') || '{}'); } catch { return {}; }
  });

  // Active Tab state: 'overview' | 'products' | 'users'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview state
  const [dash, setDash] = useState(null);
  const [chart, setChart] = useState([]);
  const [txns, setTxns] = useState({ transactions: [], total: 0, page: 1 });
  const [loadingDash, setLoadingDash] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  // Products state
  const [productsData, setProductsData] = useState({ products: [], total: 0, page: 1, categories: [] });
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategory, setProdCategory] = useState('ALL');
  const [prodPage, setProdPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [addFormLoading, setAddFormLoading] = useState(false);
  const [addFormSuccess, setAddFormSuccess] = useState('');

  // New product form state
  const initialNewProduct = {
    title: '',
    brand: '',
    category: 'Footwear',
    gender: 'Unisex',
    price: '',
    original_price: '',
    discount_pct: 0,
    stock: 25,
    color: '',
    city: 'Bengaluru',
    image_url: '',
    description: '',
    tags: '',
  };
  const [newProduct, setNewProduct] = useState(initialNewProduct);

  // Users / Customers state
  const [customersData, setCustomersData] = useState({ customers: [], total_customers: 0 });
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingCustomerDetails, setLoadingCustomerDetails] = useState(false);
  const [actionHistoryFilter, setActionHistoryFilter] = useState('ALL');
  const [expandedTimelineId, setExpandedTimelineId] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!user?.role || user.role !== 'merchant') {
      navigate('/merchant/login');
    }
  }, [user]);

  // Load Dashboard Data
  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, t] = await Promise.all([
          api.getMerchantDashboard(),
          api.getMerchantDailyChart(30),
          api.getMerchantTransactions(1),
        ]);
        setDash(d.data);
        setChart(c.data);
        setTxns(t.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/merchant/login');
        }
      } finally {
        setLoadingDash(false);
      }
    };
    load();
  }, []);

  // Fetch Products
  const fetchProducts = async (p = 1, query = prodSearch, cat = prodCategory) => {
    setLoadingProducts(true);
    try {
      const res = await api.getMerchantProducts({
        page: p,
        per_page: 15,
        query: query || undefined,
        category: cat !== 'ALL' ? cat : undefined,
      });
      setProductsData(res.data);
      setProdPage(p);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts(prodPage, prodSearch, prodCategory);
    }
  }, [activeTab, prodPage, prodCategory]);

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.getMerchantCustomers();
      setCustomersData(res.data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchCustomers();
    }
  }, [activeTab]);

  // Fetch Customer Deep-Dive details
  const handleOpenCustomer = async (userId) => {
    setSelectedCustomerId(userId);
    setLoadingCustomerDetails(true);
    try {
      const res = await api.getMerchantCustomerDetails(userId);
      setCustomerDetails(res.data);
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setLoadingCustomerDetails(false);
    }
  };

  const handleCloseCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerDetails(null);
    setActionHistoryFilter('ALL');
  };

  // Add Product Submit
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddFormLoading(true);
    setAddFormSuccess('');
    try {
      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        original_price: newProduct.original_price ? parseFloat(newProduct.original_price) : parseFloat(newProduct.price),
        discount_pct: parseInt(newProduct.discount_pct || 0),
        stock: parseInt(newProduct.stock || 20),
        tags: newProduct.tags ? newProduct.tags.split(',').map((t) => t.trim()) : [],
      };
      await api.addMerchantProduct(payload);
      setAddFormSuccess('Product created and indexed into vector catalog.');
      setTimeout(() => {
        setIsAddModalOpen(false);
        setNewProduct(initialNewProduct);
        setAddFormSuccess('');
        fetchProducts(1, '', 'ALL');
      }, 1000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add product');
    } finally {
      setAddFormLoading(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteMerchantProduct(productToDelete.id);
      setProductToDelete(null);
      fetchProducts(prodPage, prodSearch, prodCategory);
      const d = await api.getMerchantDashboard();
      setDash(d.data);
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const loadTxnPage = async (p) => {
    try {
      const res = await api.getMerchantTransactions(p);
      setTxns(res.data);
      setPage(p);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem('rc_token');
    localStorage.removeItem('rc_user');
    navigate('/merchant/login');
  };

  if (loadingDash) {
    return (
      <div className="min-h-screen bg-white text-[#0C1A2E] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#2963FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#5c6f84] font-extrabold text-xs uppercase tracking-wider">Loading Merchant Dashboard...</p>
        </div>
      </div>
    );
  }

  const orgName = dash?.merchant_name || user?.merchant_name || 'RazorCart Official Store';
  const totalTxnPages = Math.ceil((txns.total || 0) / 20);
  const totalProdPages = Math.ceil((productsData.total || 0) / 15);

  const filteredCustomers = customersData.customers?.filter((c) => {
    if (!customerSearch.trim()) return true;
    const s = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#0C1A2E] flex flex-col font-sans selection:bg-[#2963FF] selection:text-white">
      
      {/* ── Top Header (Clean Myntra-Style Light Nav) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          
          {/* Brand & Merchant Organization */}
          <div className="flex items-center gap-3 md:gap-5">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black italic tracking-tight select-none">
                <span className="text-[#0066CC]">Razorcart</span>
                <span className="text-[#0C1A2E] ml-1">AI</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block text-[#d4d5d9]">|</span>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gray-50 border border-[#e2e8f0] flex items-center justify-center text-[#2963FF] shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-[#0C1A2E] text-sm md:text-base leading-tight">
                    {orgName}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#27AE60] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#A8D5BF]">
                    <CheckCircle2 className="w-3 h-3 text-[#27AE60]" />
                    Verified Merchant
                  </span>
                </div>
                <p className="text-[11px] text-[#5c6f84] font-medium flex items-center gap-2">
                  <span className="font-mono text-[#0C1A2E] font-bold">ID: {dash?.merchant_id || 'merch_001'}</span>
                  <span>•</span>
                  <span>{dash?.merchant_city || 'Bengaluru, India'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#5c6f84] hover:text-[#2963FF] bg-[#f5f5f6] hover:bg-gray-100 border border-[#e2e8f0] px-3.5 py-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Storefront</span>
            </Link>

            <span className="text-xs text-[#5c6f84] font-mono hidden lg:block bg-[#f5f5f6] px-3 py-1.5 rounded-xl border border-[#e2e8f0]">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-600 font-extrabold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout with Sidebar ────────────────────────────────────────── */}
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          
          {/* Organization Profile Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#f5f5f6] border border-[#e2e8f0] text-[#2963FF] flex items-center justify-center font-black text-lg">
                {orgName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-[#0C1A2E] truncate">{orgName}</h3>
                <p className="text-[11px] text-[#5c6f84] truncate font-medium">Enterprise Merchant</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#e2e8f0] grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#f9fafb] p-2.5 rounded-xl border border-[#e2e8f0]">
                <p className="text-[10px] uppercase font-extrabold text-[#94969f]">Products</p>
                <p className="text-sm font-black text-[#0C1A2E]">{dash?.total_products || 0}</p>
              </div>
              <div className="bg-[#f9fafb] p-2.5 rounded-xl border border-[#e2e8f0]">
                <p className="text-[10px] uppercase font-extrabold text-[#94969f]">Buyers</p>
                <p className="text-sm font-black text-[#2963FF]">{dash?.total_customers || 0}</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="bg-white border border-[#e2e8f0] rounded-2xl p-2.5 shadow-sm space-y-1.5">
            <p className="text-[10px] font-extrabold text-[#94969f] uppercase tracking-wider px-3 py-1.5">
              Portal Navigation
            </p>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#2963FF] text-white shadow-sm'
                  : 'text-[#5c6f84] hover:bg-[#f5f5f6] hover:text-[#0C1A2E]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4" />
                <span>Overview & Analytics</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                activeTab === 'overview' ? 'bg-black/15 text-white' : 'bg-[#f5f5f6] text-[#5c6f84]'
              }`}>
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#2963FF] text-white shadow-sm'
                  : 'text-[#5c6f84] hover:bg-[#f5f5f6] hover:text-[#0C1A2E]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products Catalog</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                activeTab === 'products' ? 'bg-black/15 text-white' : 'bg-gray-100 text-[#0C1A2E]'
              }`}>
                {dash?.total_products || '10k+'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#2963FF] text-white shadow-sm'
                  : 'text-[#5c6f84] hover:bg-[#f5f5f6] hover:text-[#0C1A2E]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Customer Journeys</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                activeTab === 'users' ? 'bg-black/15 text-white' : 'bg-[#eef1f8] text-[#2963FF]'
              }`}>
                {dash?.total_customers || 'Buyers'}
              </span>
            </button>
          </nav>

          {/* Autonomous Engine Status Box */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-[#0C1A2E] font-extrabold text-xs">
              <Bot className="w-4 h-4 text-[#2963FF]" />
              <span>Multi-Agent Core Active</span>
            </div>
            <p className="text-[11px] text-[#5c6f84] leading-relaxed font-normal">
              Autonomous agents continually drive discovery ranking, FBT bundling, dynamic price locks, and gateway timeout recoveries.
            </p>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW & ANALYTICS                                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Top Banner Card */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 bg-[#f5f5f6] border border-[#e2e8f0] px-3 py-1 rounded-full text-xs font-bold text-[#5c6f84]">
                      <Store className="w-3.5 h-3.5 text-[#2963FF]" />
                      <span>{orgName}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0C1A2E]">
                      Merchant Operations & Telemetry
                    </h2>
                    <p className="text-xs md:text-sm text-[#5c6f84] max-w-xl font-medium">
                      Real-time telemetry for your product catalog, agentic revenue lift, and buyer interactions.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-4 py-2.5 rounded-xl bg-[#2963FF] hover:bg-[#1a4fd6] text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#e2e8f0] text-[#0C1A2E] font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Customers</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <StatCard
                  icon={IndianRupee}
                  label="Total Gross Revenue"
                  value={fmt(dash?.total_revenue)}
                  sub={<span className="font-medium text-[#5c6f84]">Completed customer checkouts</span>}
                  iconColor="text-[#0C1A2E]"
                  iconBg="bg-gray-100"
                />
                <StatCard
                  icon={Bot}
                  label="AI-Generated Profit"
                  value={fmt(dash?.total_ai_profit)}
                  sub={
                    <span className="inline-flex items-center gap-1 font-extrabold text-[#27AE60] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#A8D5BF]">
                      <Check className="w-3.5 h-3.5 text-[#27AE60]" />
                      {pct(dash?.total_ai_profit, dash?.total_revenue)} of gross revenue
                    </span>
                  }
                  iconColor="text-[#27AE60]"
                  iconBg="bg-[#E8F7F1]"
                />
                <StatCard
                  icon={RefreshCw}
                  label="Autonomous Recoveries"
                  value={dash?.total_recoveries || 0}
                  sub={<span className="font-medium text-amber-700">Zero-dropoff checkout recovery</span>}
                  iconColor="text-amber-700"
                  iconBg="bg-amber-50"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Today's Revenue"
                  value={fmt(dash?.today_revenue)}
                  sub={
                    <span className="font-medium text-[#5c6f84]">
                      AI profit: <span className="font-bold text-[#2963FF]">{fmt(dash?.today_ai_profit)}</span>
                    </span>
                  }
                  iconColor="text-[#2963FF]"
                  iconBg="bg-[#eef1f8]"
                />
              </div>

              {/* Chart: Revenue vs AI Profit */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 md:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#e2e8f0] gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-[#e2e8f0] flex items-center justify-center text-[#2963FF]">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0C1A2E]">
                        Revenue vs AI Profit (Last 30 Days)
                      </h2>
                      <p className="text-xs text-[#94969f]">
                        Visualizing autonomous margin contribution alongside gross revenue
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto text-[11px] font-mono font-bold uppercase tracking-wider text-[#5c6f84] bg-[#f5f5f6] px-3 py-1 rounded-md border border-[#e2e8f0]">
                    30-Day Window
                  </span>
                </div>

                {chart.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-[#94969f] text-sm">
                    <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                    <p>No transactions yet — telemetry data will populate in real time.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chart} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#5c6f84', fontSize: 11, fontWeight: 600 }}
                        tickLine={false}
                        stroke="#e2e8f0"
                      />
                      <YAxis
                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        tick={{ fill: '#5c6f84', fontSize: 11, fontWeight: 600 }}
                        tickLine={false}
                        axisLine={false}
                        stroke="#e2e8f0"
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                          color: '#0C1A2E',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                        formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                      />
                      <Legend
                        wrapperStyle={{ color: '#5c6f84', fontSize: 12, fontWeight: 700, paddingTop: 10 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2963FF"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#2963FF' }}
                        activeDot={{ r: 5 }}
                        name="Total Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="ai_profit"
                        stroke="#059669"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#059669' }}
                        activeDot={{ r: 5 }}
                        name="AI Profit"
                        strokeDasharray="5 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Transaction Audit Ledger */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[#e2e8f0] gap-2 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-[#e2e8f0] flex items-center justify-center text-[#2963FF]">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-[#0C1A2E] text-base">Transaction Audit Ledger</h2>
                      <p className="text-[11px] text-[#94969f]">Full agentic decision trail for every transaction</p>
                    </div>
                    <span className="ml-2 text-xs bg-[#f5f5f6] text-[#0C1A2E] px-2.5 py-0.5 rounded-full font-extrabold border border-[#e2e8f0]">
                      {txns.total} entries
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-[#27AE60] font-bold bg-[#E8F7F1] px-3 py-1 rounded-full border border-[#A8D5BF] self-start sm:self-auto">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#27AE60]" />
                    <span>Immutable Ledger Verified</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-[#f9fafb] text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider border-b border-[#e2e8f0]">
                        <th className="px-5 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5">Agent</th>
                        <th className="px-5 py-3.5">Action</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                        <th className="px-5 py-3.5 text-right">AI Profit</th>
                        <th className="px-5 py-3.5 text-left">Status</th>
                        <th className="px-5 py-3.5 text-center">Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {txns.transactions?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-[#94969f] text-xs">
                            No transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        txns.transactions?.map((t) => {
                          const agentClean = t.agent_type?.replace('Agent', '') || 'System';
                          const isExpanded = expandedRow === t.id;

                          return (
                            <React.Fragment key={t.id}>
                              <tr
                                className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                                onClick={() => setExpandedRow(isExpanded ? null : t.id)}
                              >
                                <td className="px-5 py-4 text-[#5c6f84] text-xs font-mono whitespace-nowrap">
                                  {new Date(t.timestamp).toLocaleString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md border ${
                                      AGENT_BADGE[t.agent_type] || AGENT_BADGE[agentClean] || 'bg-gray-100 text-[#0C1A2E] border-gray-200'
                                    }`}
                                  >
                                    {agentClean}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-xs font-semibold text-[#0C1A2E] max-w-[200px] truncate">
                                  {t.action_type}
                                </td>
                                <td className="px-5 py-4 text-right font-black text-[#0C1A2E]">
                                  {t.money_amount > 0 ? fmt(t.money_amount) : '—'}
                                </td>
                                <td className="px-5 py-4 text-right font-black text-[#27AE60]">
                                  {t.profit_from_ai > 0 ? fmt(t.profit_from_ai) : '—'}
                                </td>
                                <td className="px-5 py-4">
                                  {t.payment_status ? (
                                    <span
                                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                        STATUS_BADGE[t.payment_status] || STATUS_BADGE.INITIALIZED
                                      }`}
                                    >
                                      {t.payment_status.replace(/_/g, ' ')}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <button
                                    type="button"
                                    className="text-[#94969f] hover:text-[#0C1A2E] transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 mx-auto" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 mx-auto" />
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-[#fbfafd] border-b border-[#e2e8f0]">
                                  <td colSpan={7} className="px-6 py-4">
                                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm space-y-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-[#2963FF]">
                                          <Bot className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-extrabold text-[#2963FF] uppercase tracking-wider">
                                          Autonomous Agent Reasoning
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#5c6f84] leading-relaxed font-normal bg-[#f9fafb] p-3 rounded-lg border border-[#e2e8f0]">
                                        {t.decision_reasoning || 'Transaction recorded without additional agent metadata.'}
                                      </p>
                                      {t.rating_review_impact && (
                                        <div className="flex items-center gap-2 pt-1 text-xs text-amber-700">
                                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                          <span className="font-bold">Customer Rating Impact:</span>
                                          <span className="text-[#5c6f84]">{t.rating_review_impact}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {totalTxnPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-white">
                    <span className="text-xs text-[#5c6f84] font-semibold">
                      Page {page} of {totalTxnPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={page <= 1}
                        onClick={() => loadTxnPage(page - 1)}
                        className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 text-[#0C1A2E] disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={page >= totalTxnPages}
                        onClick={() => loadTxnPage(page + 1)}
                        className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 text-[#0C1A2E] disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PRODUCTS CATALOG MANAGEMENT                                */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Products Header Bar */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#0C1A2E]">Product Catalog</h2>
                    <span className="text-xs font-mono font-bold bg-[#f5f5f6] text-[#0C1A2E] px-2.5 py-0.5 rounded-md border border-[#e2e8f0]">
                      {productsData.total} Total Items
                    </span>
                  </div>
                  <p className="text-xs text-[#5c6f84] font-medium mt-0.5">
                    Manage store catalog items, add new merchandise, and sync with RAG vector search.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-[#94969f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search title, brand..."
                      value={prodSearch}
                      onChange={(e) => {
                        setProdSearch(e.target.value);
                        fetchProducts(1, e.target.value, prodCategory);
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF] transition-all"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={prodCategory}
                    onChange={(e) => {
                      setProdCategory(e.target.value);
                      fetchProducts(1, prodSearch, e.target.value);
                    }}
                    className="py-2 px-3 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#5c6f84] focus:outline-none focus:border-[#2963FF] cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {productsData.categories?.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Add Product Button */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2963FF] hover:bg-[#1a4fd6] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                {loadingProducts ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-[#2963FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-bold text-[#5c6f84]">Loading catalog products...</p>
                  </div>
                ) : productsData.products?.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-bold text-[#0C1A2E]">No products found</p>
                    <p className="text-xs text-[#94969f]">Try adjusting your search or category filter.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-[#f9fafb] text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider border-b border-[#e2e8f0]">
                          <th className="px-5 py-3.5">Product</th>
                          <th className="px-5 py-3.5">Category</th>
                          <th className="px-5 py-3.5">Gender</th>
                          <th className="px-5 py-3.5 text-right">Price</th>
                          <th className="px-5 py-3.5 text-center">Stock</th>
                          <th className="px-5 py-3.5 text-center">Rating</th>
                          <th className="px-5 py-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e2e8f0]">
                        {productsData.products?.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                            {/* Product Info */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image_url}
                                  alt={p.title}
                                  className="w-12 h-14 object-cover rounded-lg border border-[#e2e8f0] bg-[#f5f5f6] shrink-0"
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80';
                                  }}
                                />
                                <div className="min-w-0 max-w-[280px]">
                                  <p className="font-bold text-xs text-[#0C1A2E] truncate">{p.title}</p>
                                  <p className="text-[11px] text-[#2963FF] font-black uppercase tracking-wider">{p.brand}</p>
                                  <p className="text-[10px] text-[#94969f] font-mono">ID #{p.id}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold text-[#5c6f84] bg-[#f5f5f6] px-2.5 py-1 rounded-md border border-[#e2e8f0]">
                                {p.category}
                              </span>
                            </td>

                            {/* Gender */}
                            <td className="px-5 py-3.5 text-xs text-[#5c6f84] font-medium">
                              {p.gender}
                            </td>

                            {/* Price */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="font-black text-sm text-[#0C1A2E]">
                                {fmt(p.price)}
                              </div>
                              {p.discount_pct > 0 && (
                                <div className="text-[10px] text-[#27AE60] font-extrabold">
                                  {p.discount_pct}% OFF
                                </div>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="px-5 py-3.5 text-center">
                              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                                p.stock > 10 ? 'bg-[#E8F7F1] text-[#27AE60] border border-[#A8D5BF]' : 'bg-red-50 text-red-600 border border-red-200'
                              }`}>
                                {p.stock} units
                              </span>
                            </td>

                            {/* Rating */}
                            <td className="px-5 py-3.5 text-center">
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{p.rating}</span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => setProductToDelete(p)}
                                title="Delete Product"
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalProdPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-white">
                    <span className="text-xs text-[#5c6f84] font-semibold">
                      Showing Page {prodPage} of {totalProdPages} ({productsData.total} products)
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={prodPage <= 1}
                        onClick={() => fetchProducts(prodPage - 1, prodSearch, prodCategory)}
                        className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 text-[#0C1A2E] disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        disabled={prodPage >= totalProdPages}
                        onClick={() => fetchProducts(prodPage + 1, prodSearch, prodCategory)}
                        className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 text-[#0C1A2E] disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: USERS / CUSTOMERS & AI REVENUE JOURNEY                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              
              {/* Customers Header Bar */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#0C1A2E]">Razorcart Buyers & Action Telemetry</h2>
                    <span className="text-xs font-mono font-bold bg-[#eef1f8] text-[#2963FF] px-2.5 py-0.5 rounded-md border border-blue-200">
                      {customersData.total_customers} Verified Customers
                    </span>
                  </div>
                  <p className="text-xs text-[#5c6f84] font-medium mt-0.5">
                    Click on any customer to inspect their action history and see how Razorcart AI boosted revenue at every stage.
                  </p>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-[#94969f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, email, city..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF] transition-all"
                  />
                </div>
              </div>

              {/* Customers Directory Cards */}
              {loadingCustomers ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-[#e2e8f0]">
                  <div className="w-8 h-8 border-3 border-[#2963FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-[#5c6f84]">Loading customer buyer profiles...</p>
                </div>
              ) : filteredCustomers?.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-[#e2e8f0] text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-[#0C1A2E]">No customers found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredCustomers?.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleOpenCustomer(c.id)}
                      className="bg-white border border-[#e2e8f0] hover:border-[#2963FF]/40 hover:shadow-md rounded-2xl p-5 md:p-6 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        
                        {/* Top Profile Bar */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#eef1f8] border border-blue-200 text-[#2963FF] font-black text-lg flex items-center justify-center">
                              {c.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-[#0C1A2E] text-sm group-hover:text-[#2963FF] transition-colors">
                                  {c.name}
                                </h3>
                                <span className="text-[10px] font-mono text-[#5c6f84] bg-[#f5f5f6] px-2 py-0.5 rounded-md border border-[#e2e8f0]">
                                  UID #{c.id}
                                </span>
                              </div>
                              <p className="text-xs text-[#5c6f84] font-medium">{c.email}</p>
                              <p className="text-[11px] text-[#94969f] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{c.city}</span>
                              </p>
                            </div>
                          </div>

                          <span className="p-2 rounded-xl bg-[#f5f5f6] text-[#5c6f84] group-hover:text-white group-hover:bg-[#2963FF] transition-all border border-[#e2e8f0]">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 bg-[#f9fafb] p-3 rounded-xl border border-[#e2e8f0] text-center">
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-[#94969f]">Gross Spend</p>
                            <p className="text-sm font-black text-[#0C1A2E]">{fmt(c.total_spend)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-[#27AE60]">AI Revenue Lift</p>
                            <p className="text-sm font-black text-[#27AE60]">+{fmt(c.ai_profit_lift)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-extrabold text-[#5c6f84]">Actions</p>
                            <p className="text-sm font-black text-[#0C1A2E]">{c.total_actions}</p>
                          </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#5c6f84]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0C1A2E]">Latest:</span>
                            <span className="bg-[#f5f5f6] text-[#0C1A2E] font-mono font-bold px-2 py-0.5 rounded-md text-[10px] border border-[#e2e8f0]">
                              {c.latest_action}
                            </span>
                          </div>
                          {c.recoveries_count > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <RefreshCw className="w-3 h-3" />
                              {c.recoveries_count} Recovered
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-extrabold text-[#2963FF]">
                        <span>Inspect Full Journey & Telemetry</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* CUSTOMER JOURNEY & STAGE-BY-STAGE REVENUE DRILL-DOWN MODAL          */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-[#0C1A2E]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-white border-b border-[#e2e8f0] text-[#0C1A2E] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#eef1f8] border border-blue-200 flex items-center justify-center text-[#2963FF] font-black text-lg">
                  {customerDetails?.customer?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#0C1A2E] leading-tight">
                      {customerDetails?.customer?.name || 'Customer Profile'}
                    </h2>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#eef1f8] text-[#2963FF] px-2 py-0.5 rounded-md border border-blue-200">
                      Razorcart Verified Buyer
                    </span>
                  </div>
                  <p className="text-xs text-[#5c6f84] font-medium">
                    {customerDetails?.customer?.email} • {customerDetails?.customer?.city}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseCustomer}
                className="w-8 h-8 rounded-lg bg-[#f5f5f6] hover:bg-gray-200 flex items-center justify-center text-[#5c6f84] transition-colors cursor-pointer border border-[#e2e8f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loadingCustomerDetails ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-4 border-[#2963FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#5c6f84]">Reconstructing Customer Journey & Telemetry...</p>
                </div>
              ) : (
                <>
                  {/* Revenue Metrics Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    <div className="bg-[#f9fafb] border border-[#e2e8f0] rounded-2xl p-4">
                      <p className="text-[10px] font-extrabold uppercase text-[#94969f]">Gross Customer Spend</p>
                      <p className="text-xl md:text-2xl font-black text-[#0C1A2E] mt-1">
                        {fmt(customerDetails?.metrics?.total_spend)}
                      </p>
                      <p className="text-[11px] text-[#5c6f84] mt-0.5">Across store purchases</p>
                    </div>

                    <div className="bg-[#E8F7F1]/70 border border-[#A8D5BF] rounded-2xl p-4">
                      <p className="text-[10px] font-extrabold uppercase text-emerald-800">AI-Attributed Revenue Lift</p>
                      <p className="text-xl md:text-2xl font-black text-[#27AE60] mt-1">
                        +{fmt(customerDetails?.metrics?.total_ai_profit)}
                      </p>
                      <p className="text-[11px] font-extrabold text-[#27AE60] mt-0.5">
                        {customerDetails?.metrics?.ai_lift_percentage}% lift via agents
                      </p>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                      <p className="text-[10px] font-extrabold uppercase text-amber-800">Recovered Revenue</p>
                      <p className="text-xl md:text-2xl font-black text-amber-700 mt-1">
                        {fmt(customerDetails?.metrics?.recovered_revenue)}
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                        {customerDetails?.metrics?.recovered_orders_count} abandoned checkouts saved
                      </p>
                    </div>

                    <div className="bg-[#f9fafb] border border-[#e2e8f0] rounded-2xl p-4">
                      <p className="text-[10px] font-extrabold uppercase text-[#94969f]">Lifetime Agent Events</p>
                      <p className="text-xl md:text-2xl font-black text-[#0C1A2E] mt-1">
                        {customerDetails?.metrics?.total_actions_count} Actions
                      </p>
                      <p className="text-[11px] text-[#5c6f84] mt-0.5">Logged in Immutable Ledger</p>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* STAGE-BY-STAGE REVENUE INCREASE BREAKDOWN                      */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#2963FF]" />
                        <h3 className="font-extrabold text-base text-[#0C1A2E]">
                          How Razorcart Increased Revenue at Every Stage
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#5c6f84] bg-[#f5f5f6] px-2.5 py-1 rounded-md border border-[#e2e8f0]">
                        4-Stage Autonomous Funnel
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerDetails?.revenue_stages?.map((stg) => (
                        <div
                          key={stg.stage_number}
                          className="bg-[#f9fafb] border border-[#e2e8f0] rounded-2xl p-4 space-y-3 hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-[#2963FF] text-white font-black text-xs flex items-center justify-center">
                                {stg.stage_number}
                              </span>
                              <h4 className="font-extrabold text-xs text-[#0C1A2E]">{stg.stage_name}</h4>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-[#5c6f84] bg-white px-2.5 py-0.5 rounded-md border border-[#e2e8f0]">
                              {stg.agent}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] space-y-1">
                            <p className="text-xs font-extrabold text-[#0C1A2E]">{stg.headline}</p>
                            <p className="text-[11px] text-[#5c6f84] leading-relaxed font-normal">
                              {stg.impact_description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-[#5c6f84] font-medium">
                              Actions Executed: <strong className="text-[#0C1A2E]">{stg.action_count}</strong>
                            </span>
                            {stg.revenue_lift > 0 && (
                              <span className="font-black text-[#27AE60] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#A8D5BF]">
                                Impact: +{fmt(stg.revenue_lift)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* COMPLETED ORDERS FOR THIS CUSTOMER                            */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  {customerDetails?.orders?.length > 0 && (
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#0C1A2E]">
                        <ShoppingBag className="w-4 h-4 text-[#2963FF]" />
                        <span>Completed Purchases ({customerDetails.orders.length})</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customerDetails.orders.map((ord) => (
                          <div key={ord.id} className="bg-[#f9fafb] border border-[#e2e8f0] rounded-xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-[#0C1A2E]">Order #{ord.id}</span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${STATUS_BADGE[ord.status] || STATUS_BADGE.SUCCESS}`}>
                                {ord.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs font-black text-[#0C1A2E]">
                              Total: {fmt(ord.total_amount)}
                            </div>
                            <div className="text-[11px] text-[#5c6f84]">
                              Payment: <span className="font-semibold text-[#0C1A2E]">{ord.payment_method}</span>
                              {ord.recovery_type && <span className="text-amber-700 font-bold ml-1">({ord.recovery_type})</span>}
                            </div>
                            {ord.items?.length > 0 && (
                              <div className="space-y-1 pt-1 border-t border-[#e2e8f0]">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-[11px] text-[#5c6f84]">
                                    <span className="truncate max-w-[200px] text-[#0C1A2E]">{it.title}</span>
                                    <span className="font-bold text-[#0C1A2E]">{fmt(it.price)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* FULL CHRONOLOGICAL ACTION HISTORY TIMELINE                    */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
                      <div>
                        <h3 className="font-extrabold text-base text-[#0C1A2E]">
                          Complete Chronological Action History
                        </h3>
                        <p className="text-xs text-[#94969f]">
                          Every search, recommendation, checkout attempt, and recovery event recorded in real time
                        </p>
                      </div>

                      {/* Filter buttons */}
                      <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                        {['ALL', 'DiscoveryAgent', 'UpsellAgent', 'CheckoutAgent', 'RecoveryAgent'].map((flt) => (
                          <button
                            key={flt}
                            onClick={() => setActionHistoryFilter(flt)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              actionHistoryFilter === flt
                                ? 'bg-[#2963FF] text-white'
                                : 'bg-[#f5f5f6] text-[#5c6f84] hover:bg-gray-200 border border-[#e2e8f0]'
                            }`}
                          >
                            {flt.replace('Agent', '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-2.5">
                      {customerDetails?.action_history
                        ?.filter((act) => actionHistoryFilter === 'ALL' || act.agent_type === actionHistoryFilter)
                        ?.map((act) => {
                          const isExpanded = expandedTimelineId === act.id;
                          return (
                            <div
                              key={act.id}
                              className="border border-[#e2e8f0] rounded-xl p-3.5 hover:border-gray-300 transition-all bg-[#f9fafb]"
                            >
                              <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedTimelineId(isExpanded ? null : act.id)}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 ${
                                      AGENT_BADGE[act.agent_type] || 'bg-gray-100 text-[#0C1A2E] border-gray-200'
                                    }`}
                                  >
                                    {act.agent_type?.replace('Agent', '')}
                                  </span>
                                  <span className="font-bold text-xs text-[#0C1A2E] truncate">
                                    {act.action_type}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  {act.money_amount > 0 && (
                                    <span className="font-black text-xs text-[#0C1A2E]">
                                      {fmt(act.money_amount)}
                                    </span>
                                  )}
                                  {act.profit_from_ai > 0 && (
                                    <span className="font-black text-xs text-[#27AE60] bg-[#E8F7F1] px-2 py-0.5 rounded border border-[#A8D5BF]">
                                      +{fmt(act.profit_from_ai)} AI
                                    </span>
                                  )}
                                  <span className="text-[11px] text-[#94969f] font-mono hidden sm:inline">
                                    {new Date(act.timestamp).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  <button type="button" className="text-[#94969f] hover:text-[#0C1A2E]">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Agent Decision Reasoning */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2 bg-white p-3 rounded-lg">
                                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#2963FF]">
                                    <Bot className="w-3.5 h-3.5" />
                                    <span>Agent Decision Logic:</span>
                                  </div>
                                  <p className="text-xs text-[#5c6f84] leading-relaxed font-normal">
                                    {act.decision_reasoning}
                                  </p>
                                  {act.rating_review_impact && (
                                    <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                      <span>{act.rating_review_impact}</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#f9fafb] border-t border-[#e2e8f0] flex items-center justify-between shrink-0">
              <span className="text-xs text-[#94969f]">
                Telemetry recorded via Razorcart Autonomous Multi-Agent Core
              </span>
              <button
                onClick={handleCloseCustomer}
                className="px-5 py-2 bg-white hover:bg-gray-100 text-[#0C1A2E] font-extrabold text-xs rounded-xl border border-[#e2e8f0] transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ADD PRODUCT MODAL                                                  */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-[#0C1A2E]">
            
            <div className="px-6 py-4 bg-white border-b border-[#e2e8f0] text-[#0C1A2E] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2963FF]" />
                <h3 className="font-extrabold text-base text-[#0C1A2E]">Add New Catalog Product</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#f5f5f6] hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer border border-[#e2e8f0] text-[#5c6f84]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
              {addFormSuccess && (
                <div className="p-3 bg-[#E8F7F1] border border-[#A8D5BF] text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#27AE60]" />
                  <span>{addFormSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Air Zoom Max Pro Running Shoes"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nike, Puma, Adidas"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#5c6f84] focus:outline-none focus:border-[#2963FF]"
                  >
                    <option value="Footwear">Footwear</option>
                    <option value="Topwear">Topwear</option>
                    <option value="Bottomwear">Bottomwear</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Ethnic Wear">Ethnic Wear</option>
                    <option value="Sportswear">Sportswear</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Gender *</label>
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#5c6f84] focus:outline-none focus:border-[#2963FF]"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 3999"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Original Price (MRP)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4999"
                    value={newProduct.original_price}
                    onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Color / Variant</label>
                  <input
                    type="text"
                    placeholder="e.g. Triple Black"
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Description</label>
                <textarea
                  rows="3"
                  placeholder="Detailed product features, materials, and technology..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-[#5c6f84] uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="running, lightweight, cushion, marathon"
                  value={newProduct.tags}
                  onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f5f5f6] border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0C1A2E] placeholder-[#94969f] focus:outline-none focus:bg-white focus:border-[#2963FF]"
                />
              </div>

              <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#e2e8f0] text-[#5c6f84] hover:bg-[#f5f5f6] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addFormLoading}
                  className="px-6 py-2 bg-[#2963FF] hover:bg-[#1a4fd6] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {addFormLoading ? 'Adding & Indexing...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION MODAL                                           */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-[#0C1A2E]">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-[#0C1A2E]">Delete Product?</h3>
              <p className="text-xs text-[#5c6f84]">
                Are you sure you want to remove <strong className="text-[#0C1A2E]">"{productToDelete.title}"</strong> from your store catalog?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="py-2.5 rounded-xl border border-[#e2e8f0] text-[#5c6f84] hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e2e8f0] py-5 px-4 md:px-8 text-center text-xs text-[#94969f] mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0C1A2E]">{orgName}</span>
            <span>•</span>
            <span>Merchant Business Suite</span>
          </div>
          <p className="text-[11px] text-[#94969f]">Powered by Autonomous Multi-Agent Commerce Core</p>
        </div>
      </footer>
    </div>
  );
}
