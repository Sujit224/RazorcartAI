import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Store, TrendingUp, IndianRupee, Zap, RefreshCw,
  LogOut, ChevronLeft, ChevronRight, Package, Bot, Star, ShieldCheck,
  ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Building2,
  Users, Plus, Trash2, Search, Filter, X, ArrowRight, Eye, ShoppingBag,
  Clock, MapPin, Mail, AlertTriangle, Layers, Award, Tag, ExternalLink,
  Activity, Check, ArrowUpRight, Megaphone, Brain, Calculator
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
  Campaign: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CampaignAgent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const StatCard = ({ icon: Icon, label, value, sub, iconColor = 'text-[#2963FF]' }) => (
  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between cursor-pointer">
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#475569]">{label}</span>
        <Icon className={`w-5 h-5 ${iconColor} shrink-0 transition-transform group-hover:scale-110`} />
      </div>
      <p className="text-2xl md:text-3xl font-black text-[#0C1A2E] tracking-tight mt-3 mb-1.5">{value}</p>
    </div>
    {sub && (
      <div className="text-xs text-[#64748B] font-medium pt-1">
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

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [campaignPrompt, setCampaignPrompt] = useState('');
  const [proposedCampaign, setProposedCampaign] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [expandedDwellers, setExpandedDwellers] = useState(true);
  const [expandedExplorers, setExpandedExplorers] = useState(true);
  const [selectedReasoningUser, setSelectedReasoningUser] = useState(null);

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

  const fetchCampaigns = async () => {
    try {
      const res = await api.getMerchantCampaigns();
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
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
    <div className="min-h-screen bg-[#f1f5fa] text-[#0C1A2E] flex flex-col font-sans selection:bg-[#2963FF] selection:text-white">
      
      {/* ── Top Header (Clean Full-Width Nav) ────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] px-6 py-3 shadow-2xs">
        <div className="w-full flex items-center justify-between">
          
          {/* Brand Logo Only */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black italic tracking-tight select-none">
                <span className="text-[#0066CC]">Razorcart</span>
                <span className="text-[#0C1A2E] ml-1">AI</span>
              </span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 md:gap-3">
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#2963FF] bg-white hover:bg-slate-50 border border-[#e2e8f0] hover:border-blue-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#2963FF]" />
              <span>Storefront</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-[#475569] bg-[#f1f5fa] px-3 py-1.5 rounded-xl border border-[#e2e8f0]">
              <Mail className="w-3.5 h-3.5 text-[#94969f]" />
              <span>{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 border border-[#e2e8f0] hover:border-red-200 text-xs text-[#475569] hover:text-red-600 font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout with Literal Left Sidebar ────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-61px)]">
        
        {/* ── Literal Full-Height Left Sidebar ──────────────────────────────────── */}
        <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-[#e2e8f0] p-5 flex flex-col justify-between sticky top-[61px] md:h-[calc(100vh-61px)] overflow-y-auto space-y-6">
          
          <div className="space-y-6">
            {/* Portal Navigation List */}
            <nav className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-[#94969f] uppercase tracking-wider px-2.5 py-1 mb-1">
                Portal Navigation
              </p>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all text-left cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#2963FF] text-white shadow-sm'
                    : 'text-[#5c6f84] hover:bg-[#f1f5fa] hover:text-[#0C1A2E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Overview & Analytics</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                  activeTab === 'overview' ? 'bg-white/20 text-white' : 'bg-[#f1f5fa] text-[#5c6f84]'
                }`}>
                  Live
                </span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all text-left cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-[#2963FF] text-white shadow-sm'
                    : 'text-[#5c6f84] hover:bg-[#f1f5fa] hover:text-[#0C1A2E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" />
                  <span>Products Catalog</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-[#f1f5fa] text-[#0C1A2E]'
                }`}>
                  {dash?.total_products || '10k+'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all text-left cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#2963FF] text-white shadow-sm'
                    : 'text-[#5c6f84] hover:bg-[#f1f5fa] hover:text-[#0C1A2E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Customer Journeys</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2963FF]'
                }`}>
                  {dash?.total_customers || 'Buyers'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('campaigns')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all text-left cursor-pointer ${
                  activeTab === 'campaigns'
                    ? 'bg-[#2963FF] text-white shadow-sm'
                    : 'text-[#5c6f84] hover:bg-[#f1f5fa] hover:text-[#0C1A2E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4" />
                  <span>AI Campaigns</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                  activeTab === 'campaigns' ? 'bg-white/20 text-white border-transparent' : 'bg-blue-50 text-[#2963FF] border-blue-200'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  Auto
                </span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all text-left cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#2963FF] text-white shadow-sm'
                    : 'text-[#5c6f84] hover:bg-[#f1f5fa] hover:text-[#0C1A2E]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4" />
                  <span>Merchant Profile</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer Link */}
          <div className="pt-4 border-t border-[#e2e8f0]">
            <Link
              to="/"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#5c6f84] hover:text-[#2963FF] hover:bg-[#f1f5fa] transition-all"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#2963FF]" />
                <span>View Storefront</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#94969f]" />
            </Link>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-6 md:p-8 space-y-6 overflow-y-auto">

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW & ANALYTICS                                       */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Overview Header - Directly on Backdrop */}
              <div className="pt-1 pb-2">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[#8a99ad] text-xs font-mono">
                      &lt;merchant store/&gt;
                    </p>
                    <p className="text-[#008940] text-sm md:text-base font-bold tracking-tight">
                      {orgName}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0C1A2E]">
                      Merchant Operations & Telemetry
                    </h2>
                    <p className="text-xs md:text-sm text-[#5c6f84] max-w-xl font-medium pt-0.5">
                      Real-time telemetry for your product catalog, agentic revenue lift, and buyer interactions.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-4 py-2.5 rounded-xl bg-[#2963FF] hover:bg-[#1a4fd6] text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#e2e8f0] text-[#0C1A2E] font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
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
                  iconColor="text-[#2963FF]"
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
                />
                <StatCard
                  icon={RefreshCw}
                  label="Autonomous Recoveries"
                  value={dash?.total_recoveries || 0}
                  sub={<span className="font-medium text-[#2963FF]">Zero-dropoff checkout recovery</span>}
                  iconColor="text-[#2963FF]"
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
                />
              </div>

              {/* Chart: Revenue vs AI Profit AreaChart */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 md:p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#e2e8f0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2963FF]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#0C1A2E]">
                        Revenue vs AI Profit (Last 30 Days)
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        Visualizing autonomous margin contribution alongside gross revenue
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-auto text-[11px] font-mono font-bold uppercase tracking-wider text-[#5c6f84] bg-[#f1f5fa] px-3 py-1 rounded-lg border border-[#e2e8f0]">
                    30-Day Window
                  </span>
                </div>

                <ResponsiveContainer width="100%" height={290}>
                  <AreaChart
                    data={chart.length > 0 ? chart : [
                      { date: 'Day 1', revenue: 14000, ai_profit: 4500 },
                      { date: 'Day 5', revenue: 22000, ai_profit: 9200 },
                      { date: 'Day 10', revenue: 18000, ai_profit: 7800 },
                      { date: 'Day 15', revenue: 35000, ai_profit: 18500 },
                      { date: 'Day 20', revenue: 42000, ai_profit: 26000 },
                      { date: 'Day 25', revenue: 38000, ai_profit: 21000 },
                      { date: 'Day 30', revenue: 51000, ai_profit: 32000 },
                    ]}
                    margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2963FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#2963FF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorAiProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27AE60" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#27AE60" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f2" />

                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                        color: '#0C1A2E',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '10px 14px',
                      }}
                      formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                    />

                    <Legend
                      wrapperStyle={{ color: '#64748B', fontSize: 12, fontWeight: 700, paddingTop: 14 }}
                    />

                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2963FF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Total Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="ai_profit"
                      stroke="#27AE60"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAiProfit)"
                      name="AI Profit Lift"
                    />
                  </AreaChart>
                </ResponsiveContainer>
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

                        <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-extrabold text-[#2963FF]">
                          <span>Inspect Full Journey & Telemetry</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* TAB 4: AI CAMPAIGNS                                               */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {activeTab === 'campaigns' && (
            <div className="space-y-6">
              
              {/* Header - Directly on Backdrop */}
              <div className="space-y-1 pt-1 pb-1">
                <p className="text-[#008940] text-sm font-bold tracking-tight">
                  Autonomous Marketing Core
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-[#0C1A2E] tracking-tight">
                  Autonomous Flash Campaigns
                </h2>
                <p className="text-xs md:text-sm text-[#5c6f84] font-medium max-w-2xl">
                  Create targeted push campaigns instantly. AI handles inventory matching and audience vectors.
                </p>
              </div>

              {/* Campaign Composer Bar Box */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
                <h3 className="font-extrabold text-[#0C1A2E] text-xs uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2963FF]" />
                  Enter Campaign Prompt
                </h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={campaignPrompt}
                    onChange={(e) => setCampaignPrompt(e.target.value)}
                    placeholder="e.g., Clear excess monsoon footwear stock with 25% discount"
                    className="flex-1 px-4 py-3 bg-[#f1f5fa] border border-[#e2e8f0] rounded-xl text-sm font-semibold text-[#0C1A2E] focus:outline-none focus:border-[#2963FF] focus:bg-white transition-all placeholder:text-[#94969f]"
                    disabled={isProposing}
                  />
                  <button
                    onClick={async () => {
                      if (!campaignPrompt.trim()) return;
                      setIsProposing(true);
                      try {
                        const res = await api.proposeCampaign({ prompt: campaignPrompt });
                        setProposedCampaign(res.data.proposal);
                      } catch (err) {
                        alert("Failed to propose campaign");
                      } finally {
                        setIsProposing(false);
                      }
                    }}
                    disabled={isProposing || !campaignPrompt.trim()}
                    className="px-6 py-3 bg-[#2963FF] hover:bg-[#1a4fd6] text-white font-extrabold text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
                  >
                    {isProposing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bot className="w-4 h-4" />}
                    <span>Generate Strategy</span>
                  </button>
                </div>
              </div>

              {/* Proposal View */}
              {proposedCampaign && (
                <div className="space-y-4 animate-in fade-in pt-2">
                  <div className="space-y-0.5">
                    <p className="text-[#008940] text-xs font-bold">
                      AI Reasoning Matrix
                    </p>
                    <h3 className="text-lg font-extrabold text-[#0C1A2E]">
                      Proposed Strategy & Audience Matching
                    </h3>
                  </div>

                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-5">
                    <div className="text-xs text-[#334155] font-medium whitespace-pre-wrap leading-relaxed font-mono bg-[#f1f5fa] p-4 rounded-xl border border-[#e2e8f0]">
                      {proposedCampaign.strategy_summary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Matched Products */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-[#0C1A2E] uppercase tracking-wider">
                            Matched Inventory ({proposedCampaign.target_products?.length})
                          </h4>
                          <span className="text-[10px] text-[#2963FF] font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Vector Search
                          </span>
                        </div>
                        <div className="bg-[#f1f5fa] border border-[#e2e8f0] rounded-xl max-h-[260px] overflow-y-auto p-2 space-y-2">
                          {proposedCampaign.target_products?.map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-[#e2e8f0] shadow-2xs hover:border-blue-300 transition-all">
                              <img src={p.image_url} alt={p.title} className="w-10 h-10 object-cover rounded-lg border border-[#e2e8f0]" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#0C1A2E] truncate">{p.title}</p>
                                <p className="text-[11px] font-extrabold text-[#2963FF]">{fmt(p.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Target Cohorts */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-[#0C1A2E] uppercase tracking-wider">Target Cohorts</h4>
                        <div className="space-y-3">
                          
                          {/* Dwellers Cohort - Professional Blue Theme */}
                          <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-3.5 space-y-2">
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setExpandedDwellers(!expandedDwellers)}
                            >
                              <span className="text-xs font-extrabold text-[#0C1A2E] flex items-center gap-1.5 hover:text-[#2963FF] transition-colors">
                                <span className="w-2 h-2 rounded-full bg-[#2963FF]"></span>
                                Dwellers (Cart / View Match)
                                {expandedDwellers ? <ChevronUp className="w-3.5 h-3.5 text-[#2963FF]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#2963FF]" />}
                              </span>
                              <span className="text-[10px] font-extrabold bg-[#2963FF] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                                {proposedCampaign.segments?.dwellers?.length} Users
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-[#5c6f84]">
                              Pitch: <span className="font-bold text-[#2963FF]">"{proposedCampaign.offers?.dwellers_pitch}"</span>
                            </p>
                            
                            {expandedDwellers && proposedCampaign.segments?.dwellers?.length > 0 && (
                              <div className="mt-2 space-y-2 border-t border-blue-200/60 pt-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {proposedCampaign.segments.dwellers.map((user, idx) => (
                                  <div 
                                    key={idx} 
                                    className="bg-white rounded-xl p-3 border border-blue-100 space-y-2 hover:border-blue-300 transition-all shadow-2xs"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-extrabold text-[#0C1A2E]">{user.name}</span>
                                          {user.city && <span className="text-[10px] text-gray-500 font-medium">({user.city})</span>}
                                          <button type="button" onClick={() => handleOpenCustomer(user.id)} className="text-[#2963FF] hover:underline flex items-center gap-0.5 text-[10px] font-bold">
                                            #UID-{user.id}
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                                          ⚡ {user.attained_discount_pct || 15}% OFF
                                        </span>
                                        {user.original_price && (
                                          <span className="text-[11px] font-bold text-gray-700">
                                            <span className="line-through text-gray-400 mr-1">{fmt(user.original_price)}</span>
                                            <strong className="text-[#2963FF]">{fmt(user.final_price)}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {user.dwelled_products?.length > 0 && (
                                      <div className="space-y-1 mt-1">
                                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-[#5c6f84]">Products Viewed:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {user.dwelled_products.map((dp, i) => (
                                            <div key={i} className="flex items-center gap-1.5 bg-[#f1f5fa] border border-[#e2e8f0] rounded-md p-1 max-w-[150px]">
                                              <img src={dp.image_url} alt={dp.title} className="w-5 h-5 rounded object-cover border border-[#e2e8f0]" />
                                              <span className="text-[9px] font-semibold text-[#0C1A2E] truncate">{dp.title}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Reasoning & Probability Button */}
                                    {user.reasoning_matrix && (
                                      <div className="pt-1 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedReasoningUser({ ...user, cohort_label: 'Dweller (Cart / View Match)' })}
                                          className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#2963FF] hover:text-[#1a4fd6] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                                        >
                                          <Brain className="w-3.5 h-3.5" />
                                          <span>View ML Probabilities & Calculation</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Explorers Cohort - Emerald Green Highlight Accent */}
                          <div className="bg-[#E8F7F1]/50 border border-[#A8D5BF] rounded-xl p-3.5 space-y-2">
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setExpandedExplorers(!expandedExplorers)}
                            >
                              <span className="text-xs font-extrabold text-[#0C1A2E] flex items-center gap-1.5 hover:text-[#27AE60] transition-colors">
                                <span className="w-2 h-2 rounded-full bg-[#27AE60]"></span>
                                Explorers (Vector Affinity)
                                {expandedExplorers ? <ChevronUp className="w-3.5 h-3.5 text-[#27AE60]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#27AE60]" />}
                              </span>
                              <span className="text-[10px] font-extrabold bg-[#27AE60] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                                {proposedCampaign.segments?.explorers?.length} Users
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-[#5c6f84]">
                              Pitch: <span className="font-bold text-[#27AE60]">"{proposedCampaign.offers?.explorers_pitch}"</span>
                            </p>

                            {expandedExplorers && proposedCampaign.segments?.explorers?.length > 0 && (
                              <div className="mt-2 space-y-2 border-t border-[#A8D5BF]/60 pt-2.5 max-h-[300px] overflow-y-auto pr-1">
                                {proposedCampaign.segments.explorers.map((user, idx) => (
                                  <div 
                                    key={idx} 
                                    className="bg-white rounded-xl p-3 border border-emerald-100 space-y-2 hover:border-emerald-300 transition-all shadow-2xs"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-extrabold text-[#0C1A2E]">{user.name}</span>
                                          {user.city && <span className="text-[10px] text-gray-500 font-medium">({user.city})</span>}
                                          <button type="button" onClick={() => handleOpenCustomer(user.id)} className="text-[#27AE60] hover:underline flex items-center gap-0.5 text-[10px] font-bold">
                                            #UID-{user.id}
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                                          ⚡ {user.attained_discount_pct || 10}% OFF
                                        </span>
                                        {user.original_price && (
                                          <span className="text-[11px] font-bold text-gray-700">
                                            <span className="line-through text-gray-400 mr-1">{fmt(user.original_price)}</span>
                                            <strong className="text-[#27AE60]">{fmt(user.final_price)}</strong>
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Reasoning & Probability Button */}
                                    {user.reasoning_matrix && (
                                      <div className="pt-1 flex justify-end">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedReasoningUser({ ...user, cohort_label: 'Explorer (Vector Affinity)' })}
                                          className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#27AE60] hover:text-[#1e8548] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                        >
                                          <Brain className="w-3.5 h-3.5" />
                                          <span>View ML Probabilities & Calculation</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={async () => {
                          setIsLaunching(true);
                          try {
                            await api.launchCampaign({
                              title: proposedCampaign.title,
                              prompt: campaignPrompt,
                              strategy_summary: proposedCampaign.strategy_summary,
                              target_products: proposedCampaign.target_products,
                              segments: proposedCampaign.segments,
                              offers: proposedCampaign.offers
                            });
                            setCampaignPrompt('');
                            setProposedCampaign(null);
                            fetchCampaigns();
                          } catch (err) {
                            alert("Failed to launch");
                          } finally {
                            setIsLaunching(false);
                          }
                        }}
                        disabled={isLaunching}
                        className="px-6 py-3 bg-[#2963FF] hover:bg-[#1a4fd6] text-white font-extrabold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        {isLaunching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Launch Campaign to Storefront</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Campaigns List */}
              {campaigns.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-0.5">
                    <p className="text-[#008940] text-xs font-bold">
                      Execution History
                    </p>
                    <h3 className="text-lg font-extrabold text-[#0C1A2E]">
                      Active & Past Campaigns
                    </h3>
                  </div>

                  <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                    <div className="divide-y divide-[#e2e8f0]">
                      {campaigns.map(c => (
                        <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-[#0C1A2E]">{c.title}</h4>
                              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${c.status === 'active' ? 'bg-[#E8F7F1] text-[#27AE60] border-[#A8D5BF]' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{c.status}</span>
                            </div>
                            <p className="text-[11px] text-[#5c6f84] font-medium">Prompt: "{c.prompt}"</p>
                            <div className="flex items-center gap-3 text-[10px] font-semibold text-[#94969f] pt-1">
                              <span>{c.target_products?.length || 0} Products</span>
                              <span>•</span>
                              <span>{((c.segments?.dwellers?.length || 0) + (c.segments?.explorers?.length || 0))} Users Targeted</span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              if (window.confirm('Cancel this campaign?')) {
                                try {
                                  await api.deleteCampaign(c.id);
                                  fetchCampaigns();
                                } catch (e) {}
                              }
                            }}
                            className="px-3.5 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 5: MERCHANT PROFILE                                         */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">

              {/* Page heading */}
              <div className="pt-1 pb-2">
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0C1A2E]">Merchant Profile</h2>
                <p className="text-xs md:text-sm text-[#5c6f84] font-medium pt-1">Your store identity, verification status, and account details.</p>
              </div>

              {/* Store Identity Card */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs space-y-5">
                {/* Avatar + Name + Verified */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2963FF] to-[#1a4fd6] text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                    {orgName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-black text-[#0C1A2E]">{orgName}</h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#27AE60] bg-[#E8F7F1] px-2.5 py-1 rounded-lg border border-[#A8D5BF]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#27AE60]" />
                        Verified Merchant
                      </span>
                    </div>
                    <p className="text-sm text-[#5c6f84] font-medium mt-0.5">Enterprise Merchant</p>
                  </div>
                </div>

                <div className="border-t border-[#e2e8f0]" />

                {/* Info Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94969f] mb-1">Merchant ID</p>
                    <p className="text-sm font-black text-[#0C1A2E] font-mono">{dash?.merchant_id || 'merch_001'}</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94969f] mb-1">Location</p>
                    <p className="text-sm font-bold text-[#0C1A2E] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2963FF]" />
                      {dash?.merchant_city || 'Bengaluru, India'}
                    </p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94969f] mb-1">Email</p>
                    <p className="text-sm font-bold text-[#0C1A2E] flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#2963FF] shrink-0" />
                      {user.email || '—'}
                    </p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94969f] mb-1">Account Type</p>
                    <p className="text-sm font-bold text-[#0C1A2E]">Enterprise Merchant</p>
                  </div>
                </div>

                <div className="border-t border-[#e2e8f0]" />

                {/* Stats */}
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#94969f] mb-3">Store Stats</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#eef1f8] rounded-xl p-4 border border-blue-100 text-center">
                      <p className="text-2xl font-black text-[#2963FF]">{dash?.total_products ?? 0}</p>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5c6f84] mt-1 flex items-center justify-center gap-1">
                        <Package className="w-3.5 h-3.5" /> Products Listed
                      </p>
                    </div>
                    <div className="bg-[#E8F7F1] rounded-xl p-4 border border-green-100 text-center">
                      <p className="text-2xl font-black text-[#27AE60]">{dash?.total_customers ?? 0}</p>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5c6f84] mt-1 flex items-center justify-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Total Buyers
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#94969f] mb-3">Session</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>

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
                  {/* 3 AI IMPACT SPOTLIGHT CARDS                                 */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  <div className="space-y-3 bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#2963FF]" />
                        <h3 className="font-extrabold text-base text-[#0C1A2E]">
                          Customer Journey AI Impact Spotlights
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Live Multi-Agent Impact
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      
                      {/* 1. AI Recommended FBT Increased Revenue */}
                      <div className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border border-purple-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              AI Recommended FBT
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{customerDetails?.ai_impact_spotlights?.fbt?.avg_basket_lift_pct || 28.4}% Lift
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5c6f84]">FBT Increased Revenue</p>
                            <p className="text-2xl font-black text-purple-950 mt-0.5">
                              {fmt(customerDetails?.ai_impact_spotlights?.fbt?.total_fbt_revenue)}
                            </p>
                          </div>

                          <p className="text-xs text-[#5c6f84] font-medium mt-2 leading-relaxed">
                            Pitched high-affinity complementary items (accessories, shoe care, matched covers) accepted during checkout.
                          </p>

                          {/* Pitch item list */}
                          {customerDetails?.ai_impact_spotlights?.fbt?.pitches?.length > 0 && (
                            <div className="mt-3 space-y-1.5 pt-2 border-t border-purple-100">
                              {customerDetails.ai_impact_spotlights.fbt.pitches.slice(0, 2).map((p, idx) => (
                                <div key={idx} className="bg-white/90 border border-purple-100 rounded-lg p-2 flex items-center justify-between text-[11px]">
                                  <div className="min-w-0 pr-2">
                                    <p className="font-bold text-[#0C1A2E] truncate">{p.fbt_product}</p>
                                    <p className="text-[10px] text-[#5c6f84] truncate">Base: {p.main_product}</p>
                                  </div>
                                  <span className="font-black text-purple-700 shrink-0">{fmt(p.fbt_price)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Payment Failure Alternate Recoveries */}
                      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border border-amber-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 text-amber-700" />
                              Payment Recoveries
                            </span>
                            <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              {customerDetails?.ai_impact_spotlights?.payment_recovery?.recovered_count || 1} Saved
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5c6f84]">Recovered Revenue</p>
                            <p className="text-2xl font-black text-amber-950 mt-0.5">
                              {fmt(customerDetails?.ai_impact_spotlights?.payment_recovery?.recovered_revenue)}
                            </p>
                          </div>

                          <p className="text-xs text-[#5c6f84] font-medium mt-2 leading-relaxed">
                            Intercepted 504 gateway dropouts & card declines via alternate UPI QR codes and cart pruning.
                          </p>

                          {/* Recovery events list */}
                          {customerDetails?.ai_impact_spotlights?.payment_recovery?.events?.length > 0 && (
                            <div className="mt-3 space-y-1.5 pt-2 border-t border-amber-100">
                              {customerDetails.ai_impact_spotlights.payment_recovery.events.slice(0, 2).map((r, idx) => (
                                <div key={idx} className="bg-white/90 border border-amber-200 rounded-lg p-2 space-y-0.5 text-[11px]">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-red-600 truncate max-w-[130px]">{r.initial_failure}</span>
                                    <span className="font-bold text-emerald-700 shrink-0">{fmt(r.recovered_amount)}</span>
                                  </div>
                                  <p className="text-[10px] font-semibold text-amber-800 truncate">
                                    ⚡ Rail: {r.alternate_method}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. AI Recommended Campaign Sale */}
                      <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border border-blue-200 rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                              <Megaphone className="w-3 h-3 text-blue-600" />
                              AI Campaign Sale
                            </span>
                            <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                              +46.2% P(Conv)
                            </span>
                          </div>

                          <div className="mt-3">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5c6f84]">Campaign Sales Generated</p>
                            <p className="text-2xl font-black text-blue-950 mt-0.5">
                              {fmt(customerDetails?.ai_impact_spotlights?.campaign_sales?.total_campaign_sales)}
                            </p>
                          </div>

                          <p className="text-xs text-[#5c6f84] font-medium mt-2 leading-relaxed">
                            LightGBM model targeted customer with personalized discount tiers based on calculated price sensitivity.
                          </p>

                          {/* Campaign events list */}
                          {customerDetails?.ai_impact_spotlights?.campaign_sales?.events?.length > 0 && (
                            <div className="mt-3 space-y-1.5 pt-2 border-t border-blue-100">
                              {customerDetails.ai_impact_spotlights.campaign_sales.events.slice(0, 2).map((c, idx) => (
                                <div key={idx} className="bg-white/90 border border-blue-200 rounded-lg p-2 space-y-1 text-[11px]">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#0C1A2E] truncate max-w-[140px]">{c.campaign_title}</span>
                                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                      {c.discount_pct}% OFF
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-[#5c6f84]">
                                    <span>P(Conv): {(c.prob_before * 100).toFixed(0)}% → {(c.prob_after * 100).toFixed(0)}%</span>
                                    <span className="font-bold text-blue-700">{fmt(c.sales_amount)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

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
                  {/* CUSTOMER INSIGHTS & AI RECOMMENDATIONS                        */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
                      <Bot className="w-5 h-5 text-[#2963FF]" />
                      <h3 className="font-extrabold text-base text-[#0C1A2E]">
                        Customer AI Profile & FBT Recommendations
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Insights */}
                      <div className="bg-[#f9fafb] border border-[#e2e8f0] rounded-2xl p-4">
                        <h4 className="text-xs font-extrabold text-[#5c6f84] uppercase tracking-wider mb-3">Extracted Preferences</h4>
                        {Object.keys(customerDetails?.customer?.preferences || {}).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(customerDetails.customer.preferences).map(([k, v]) => (
                              <div key={k} className="flex justify-between items-center text-xs">
                                <span className="capitalize text-[#5c6f84]">{k}:</span>
                                <span className="font-bold text-[#0C1A2E] bg-white px-2 py-0.5 rounded border border-[#e2e8f0]">{v}</span>
                              </div>
                            ))}
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-[10px] font-semibold flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>Used by Autonomous Agents to personalize FBT Recommendations & Search Rankings.</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#94969f] italic">No specific preferences extracted yet.</p>
                        )}
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#5c6f84] uppercase tracking-wider mb-3">Predicted Interests (FBT Pool)</h4>
                        {customerDetails?.customer?.recommendations?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {customerDetails.customer.recommendations.map(rec => (
                              <div key={rec.id} className="bg-white border border-[#e2e8f0] rounded-xl p-2 flex items-center gap-2">
                                <img src={rec.image_url} alt={rec.title} className="w-10 h-10 object-cover rounded-lg border border-[#e2e8f0]" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-[#0C1A2E] truncate">{rec.title}</p>
                                  <p className="text-[10px] font-semibold text-[#27AE60]">{fmt(rec.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#94969f] italic">Not enough data to predict.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────────── */}
                  {/* ACTIVE CART & PRODUCT DWELLS                                  */}
                  {/* ───────────────────────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Cart */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#0C1A2E]">
                        <ShoppingBag className="w-4 h-4 text-[#2963FF]" />
                        <span>Active Cart Items ({customerDetails?.customer?.cart_items?.length || 0})</span>
                      </div>
                      <div className="flex-1 bg-[#f9fafb] border border-[#e2e8f0] rounded-xl p-3 overflow-y-auto max-h-[250px] space-y-2">
                        {customerDetails?.customer?.cart_items?.length > 0 ? (
                          customerDetails.customer.cart_items.map(ci => (
                            <div key={ci.id} className="bg-white border border-[#e2e8f0] p-2 rounded-lg flex items-center gap-3">
                              <img src={ci.image_url} alt={ci.title} className="w-10 h-10 object-cover rounded-md border border-[#e2e8f0]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#0C1A2E] truncate">{ci.title}</p>
                                <p className="text-[10px] text-[#5c6f84]">Qty: {ci.quantity} • {ci.size}</p>
                              </div>
                              <span className="font-bold text-xs text-[#0C1A2E]">{fmt(ci.price * ci.quantity)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#94969f] text-center italic py-4">Cart is currently empty.</p>
                        )}
                      </div>
                    </div>

                    {/* Product Dwells */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-[#0C1A2E]">
                        <Eye className="w-4 h-4 text-[#2963FF]" />
                        <span>Recent Product Dwells</span>
                      </div>
                      <div className="flex-1 bg-[#f9fafb] border border-[#e2e8f0] rounded-xl p-3 overflow-y-auto max-h-[250px] space-y-2">
                        {customerDetails?.customer?.viewed_products?.length > 0 ? (
                          customerDetails.customer.viewed_products.map(vp => (
                            <div key={vp.id} className="bg-white border border-[#e2e8f0] p-2 rounded-lg flex items-center gap-3">
                              <img src={vp.image_url} alt={vp.title} className="w-10 h-10 object-cover rounded-md border border-[#e2e8f0]" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#0C1A2E] truncate">{vp.title}</p>
                                <p className="text-[10px] text-[#5c6f84]">{vp.brand}</p>
                              </div>
                              <span className="text-[10px] font-semibold text-[#2963FF] bg-[#eef1f8] px-2 py-0.5 rounded border border-blue-200">Viewed</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-[#94969f] text-center italic py-4">No recent product views.</p>
                        )}
                      </div>
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

      {/* ML Dynamic Pricing & Probability Calculation Modal */}
      {selectedReasoningUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2963FF]">
                  <Brain className="w-5 h-5 text-[#2963FF]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0C1A2E]">
                    ML Dynamic Pricing & Probability Reasoning
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Target Customer: <strong className="text-slate-800">{selectedReasoningUser.name}</strong> (UID #{selectedReasoningUser.id}, {selectedReasoningUser.city || 'Bengaluru'}) • <span className="text-[#2963FF] font-bold">{selectedReasoningUser.cohort_label}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReasoningUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Discount Summary Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Attained Campaign Discount</span>
                <div className="text-2xl font-black text-emerald-700 flex items-baseline gap-2 mt-0.5">
                  ⚡ {selectedReasoningUser.attained_discount_pct}% OFF
                  <span className="text-sm font-bold text-emerald-600">(Save {fmt(selectedReasoningUser.discount_amount_inr)})</span>
                </div>
                <div className="text-xs font-medium text-slate-600 mt-1">
                  Original Price: <span className="line-through text-slate-400 mr-1.5">{fmt(selectedReasoningUser.original_price)}</span> ➔ Campaign Price: <strong className="text-[#2963FF] font-black">{fmt(selectedReasoningUser.final_price)}</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs">
                  Optimal Authorized Tier
                </span>
              </div>
            </div>

            {/* Key Probabilities Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Base P(Conversion)</p>
                <p className="text-xl font-black text-slate-700 mt-1">
                  {((selectedReasoningUser.reasoning_matrix?.base_conv_probability || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">At 0% Discount</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Boosted P(Conversion)</p>
                <p className="text-xl font-black text-[#2963FF] mt-1">
                  {((selectedReasoningUser.reasoning_matrix?.boosted_conv_probability || 0) * 100).toFixed(1)}%
                </p>
                <p className="text-[9px] text-blue-500 font-medium mt-0.5">At {selectedReasoningUser.attained_discount_pct}% Campaign Tier</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Predicted Conversion Uplift</p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  +{selectedReasoningUser.reasoning_matrix?.uplift_pct}%
                </p>
                <p className="text-[9px] text-emerald-500 font-medium mt-0.5">Net Likelihood Gain</p>
              </div>
            </div>

            {/* Candidate Discount Tiers Table */}
            {selectedReasoningUser.reasoning_matrix?.evaluated_tiers?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[#0C1A2E] uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#2963FF]" />
                  LightGBM Candidate Discount Tiers Evaluation Table
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                        <th className="p-2.5">Discount Tier</th>
                        <th className="p-2.5">LightGBM P(Conv)</th>
                        <th className="p-2.5">Effective Margin</th>
                        <th className="p-2.5">Expected Profit (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedReasoningUser.reasoning_matrix.evaluated_tiers.map((tier, tIdx) => {
                        const isOptimal = tier.discount_pct === selectedReasoningUser.attained_discount_pct;
                        return (
                          <tr key={tIdx} className={isOptimal ? 'bg-blue-50/80 font-bold text-[#2963FF]' : 'hover:bg-slate-50'}>
                            <td className="p-2.5 flex items-center gap-1.5">
                              {tier.discount_pct}%
                              {isOptimal && <span className="text-[9px] bg-[#2963FF] text-white px-1.5 py-0.5 rounded font-black">OPTIMAL TIER</span>}
                            </td>
                            <td className="p-2.5">{(tier.conversion_probability * 100).toFixed(1)}%</td>
                            <td className="p-2.5">{(tier.effective_margin_rate * 100).toFixed(1)}%</td>
                            <td className="p-2.5 font-bold">{fmt(tier.expected_profit_inr)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step-by-Step Mathematical Calculation Formula */}
            <div className="space-y-1.5 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs font-mono">
              <p className="font-bold text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Step-by-Step Mathematical Calculation Formula:
              </p>
              <p className="text-slate-300 leading-relaxed text-[11px] pt-1">
                {selectedReasoningUser.reasoning_matrix?.calculation_formula}
              </p>
            </div>

            {/* Enforced Rules */}
            {selectedReasoningUser.reasoning_matrix?.applied_rules?.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Merchant Guardrails & Policies Enforced:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReasoningUser.reasoning_matrix.applied_rules.map((rule, rIdx) => (
                    <span key={rIdx} className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-bold">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ML Explanation */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/80 text-xs space-y-1">
              <p className="font-bold text-[#2963FF] uppercase tracking-wider text-[10px]">AI Model Strategy & Reasoning Explanation:</p>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedReasoningUser.reasoning_matrix?.ml_explanation}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
