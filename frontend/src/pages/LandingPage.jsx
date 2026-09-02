import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  Bot,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  ChevronRight,
  Users,
  Compass,
  LogIn
} from 'lucide-react';
import { RazorcartLogo } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage({ onExploreGuest }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handlePortalClick = (portalKey) => {
    if (portalKey === 'customer') {
      navigate('/login');
    } else if (portalKey === 'merchant') {
      navigate('/merchant/login');
    } else if (portalKey === 'admin') {
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col font-sans selection:bg-[#ff3f6c] selection:text-white relative overflow-hidden">
      
      {/* ── Ambient Background Glows ────────────────────────────────────────── */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-[#ff3f6c]/25 via-purple-600/20 to-blue-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[45%] -left-48 w-[600px] h-[600px] bg-purple-700/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute top-[60%] -right-48 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[180px] pointer-events-none" />

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070913]/80 border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div>
              <span className="text-2xl font-black italic tracking-tight text-white">
                <span className="text-[#FF3F6C]">Razorcart</span>AI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-extrabold uppercase tracking-wider text-gray-300">
                v2.1
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-300">
            <a href="#portals" className="hover:text-white transition-colors">Role Portals</a>
            <a href="#features" className="hover:text-white transition-colors">Agentic Core</a>
            <a href="#catalog" className="hover:text-white transition-colors">10,000 Catalog</a>
            <a href="#architecture" className="hover:text-white transition-colors">Tech Stack</a>
          </nav>

          <div className="flex items-center gap-3">
            {onExploreGuest && (
              <button
                onClick={onExploreGuest}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Compass className="w-3.5 h-3.5 text-[#ff3f6c]" />
                <span>Guest Storefront</span>
              </button>
            )}
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#ff3f6c] to-[#ff7034] hover:opacity-95 text-white shadow-lg shadow-[#ff3f6c]/25 transition-all transform hover:scale-[1.02]"
            >
              <span>Sign In / Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Hero Section ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1300px] w-full mx-auto px-4 md:px-8 pt-12 pb-24 relative z-10 flex flex-col items-center text-center">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 mb-8 backdrop-blur-md animate-fade-in shadow-xl">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span>Next-Gen Agentic E-Commerce Platform</span>
          <span className="w-1 h-1 rounded-full bg-gray-500" />
          <span className="text-[#FF3F6C]">Razorpay Verified</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl mb-6">
          Autonomous <span className="bg-gradient-to-r from-[#FF3F6C] via-pink-400 to-[#FF7034] bg-clip-text text-transparent">AI Commerce</span> with Instant Multi-Role Control.
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed font-medium">
          Experience full-spectrum commerce powered by a 10,000-item TF-IDF vector engine, LangGraph AI Copilot, live Merchant Ledger Audit, and Razorpay Admin Analytics.
        </p>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF3F6C] to-[#FF7034] hover:opacity-95 text-white font-extrabold text-sm uppercase tracking-wider shadow-2xl shadow-[#FF3F6C]/30 flex items-center justify-center gap-2.5 transform hover:scale-[1.02] transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Launch Login / Sign Up Portal</span>
          </button>
          
          {onExploreGuest && (
            <button
              onClick={onExploreGuest}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer backdrop-blur-md"
            >
              <Compass className="w-4 h-4 text-[#FF3F6C]" />
              <span>Browse 10,000 Products (Guest)</span>
            </button>
          )}
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl mb-20">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-white">10,000+</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Catalog Products</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-[#FF3F6C]">12</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Store Departments</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-purple-400">&lt; 1.5ms</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Vector Search Latency</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Live Audit Ledger</div>
          </div>
        </div>

        {/* ── 3 Role Portal Gateways ────────────────────────────────────────── */}
        <div id="portals" className="w-full text-left pt-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Select Your Portal & Get Started
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">
              Unified authentication with dedicated dashboards for Shoppers, Store Merchants, and Razorpay Administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Customer Card */}
            <div
              onClick={() => handlePortalClick('customer')}
              className="group bg-[#111422] border border-white/10 hover:border-[#FF3F6C]/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF3F6C]/10 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FF3F6C]/15 border border-[#FF3F6C]/30 flex items-center justify-center text-[#FF3F6C] mb-5 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  Shopper Experience
                </div>
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-[#FF3F6C] transition-colors">
                  Customer Portal
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Shop across 12 departments (Electronics, Fashion, Appliances & more). Search with pure TF-IDF vector speed, discover personalized zero-query feeds, and chat with the AI shopping copilot.
                </p>
                <ul className="space-y-2 text-xs text-gray-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF3F6C]" />
                    <span>10,000+ Multi-Category items</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF3F6C]" />
                    <span>Personalized Vector Recommendation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF3F6C]" />
                    <span>Razorpay Test Payments</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF3F6C] to-[#FF7034] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover:opacity-95">
                <span>Sign In as Customer</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 2. Merchant Card */}
            <div
              onClick={() => handlePortalClick('merchant')}
              className="group bg-[#111422] border border-white/10 hover:border-purple-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  Store Management
                </div>
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-purple-400 transition-colors">
                  Merchant Hub
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Track store sales telemetry in real time, monitor AI-assisted upsell margins, approve refunds, and inspect the double-entry immutable audit ledger.
                </p>
                <ul className="space-y-2 text-xs text-gray-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Real-time Sales & Order Fulfilment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Autonomous Upsell Profit Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Cryptographic Audit Ledger</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover:opacity-95">
                <span>Sign In as Merchant</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 3. Razorpay Admin Card */}
            <div
              onClick={() => handlePortalClick('admin')}
              className="group bg-[#111422] border border-white/10 hover:border-emerald-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  System Governance
                </div>
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  Razorpay Admin Console
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  Multi-merchant dispute resolution, global GMV and take-rate analytics, regulatory compliance, transaction settlement, and chaos testing simulations.
                </p>
                <ul className="space-y-2 text-xs text-gray-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Global GMV & Merchant Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Audit Ledger Verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Razorpay Settlement Gateway</span>
                  </li>
                </ul>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg group-hover:opacity-95">
                <span>Sign In as Admin</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

        {/* ── Key Features / Agentic Capabilities ──────────────────────────── */}
        <div id="features" className="w-full text-left pt-8 mb-20 border-t border-white/10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Engineered with Agentic AI Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">
              Combining cutting-edge vector search with multi-agent orchestration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <Bot className="w-6 h-6 text-[#FF3F6C] mb-3" />
              <h4 className="font-extrabold text-sm text-white mb-1">LangGraph Multi-Agent Copilot</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Autonomous agent handles product discovery, cross-sell bundles, cart checkout, and payment recovery.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <Zap className="w-6 h-6 text-yellow-400 mb-3" />
              <h4 className="font-extrabold text-sm text-white mb-1">Sublinear TF-IDF Vector Space</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sub-millisecond cosine retrieval across 10,000 products with plural stemming and token boost.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <TrendingUp className="w-6 h-6 text-purple-400 mb-3" />
              <h4 className="font-extrabold text-sm text-white mb-1">80% Relevance-First Ranking</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Search queries enforce strict relevance prioritization with subtle seller city proximity tie-breaking.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <Lock className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="font-extrabold text-sm text-white mb-1">Razorpay Verified Integration</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                End-to-end sandbox payments, automatic currency conversion, and instant transaction webhook audit.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4 md:px-8 bg-black/40 text-xs text-gray-500">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">RazorcartAI</span>
            <span>•</span>
            <span>Autonomous Agentic E-Commerce Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 cursor-pointer" onClick={() => navigate('/login')}>Sign In</span>
            <span className="hover:text-gray-300 cursor-pointer" onClick={() => navigate('/merchant/login')}>Merchant Portal</span>
            <span className="hover:text-gray-300 cursor-pointer" onClick={() => navigate('/admin/login')}>Admin Portal</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
