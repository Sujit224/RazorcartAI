import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Bot,
  UserPlus,
  LogIn,
  Building,
  MapPin,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PORTALS = [
  {
    key: 'customer',
    label: 'Customer',
    icon: ShoppingBag,
    color: '#ff3f6c',
    bgActive: 'bg-[#ff3f6c] text-white',
    textActive: 'text-[#ff3f6c]',
    borderActive: 'border-[#ff3f6c]',
    lightBg: 'bg-pink-50',
    description: 'Shop 10,000+ fashion, electronics, and lifestyle products',
    redirect: '/',
    demoEmail: 'priya@razorcart.ai',
    demoPass: 'password123',
    demoName: 'Priya Sharma',
    demoCity: 'Bengaluru',
  },
  {
    key: 'merchant',
    label: 'Merchant',
    icon: Store,
    color: '#7c3aed',
    bgActive: 'bg-purple-600 text-white',
    textActive: 'text-purple-600',
    borderActive: 'border-purple-600',
    lightBg: 'bg-purple-50',
    description: 'Manage store catalog, transactions, and live AI ledger audit',
    redirect: '/merchant/dashboard',
    demoEmail: 'merchant@razorcart.ai',
    demoPass: 'merchant123',
    demoName: 'Arjun Mehta',
    demoMerchantName: 'RazorCart Official Store',
    demoCity: 'Bengaluru',
  },
  {
    key: 'admin',
    label: 'Razorpay Admin',
    icon: ShieldCheck,
    color: '#059669',
    bgActive: 'bg-emerald-600 text-white',
    textActive: 'text-emerald-600',
    borderActive: 'border-emerald-600',
    lightBg: 'bg-emerald-50',
    description: 'Oversee merchant settlements, system revenue & compliance',
    redirect: '/admin/dashboard',
    demoEmail: 'admin@razorpay.ai',
    demoPass: 'admin123',
    demoName: 'Razorpay Admin',
    demoCity: 'Mumbai',
    demoCode: 'RAZORPAY_ADMIN_2026',
  },
];

const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Gurugram"];

export default function LoginPage({ initialPortal = 'customer' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');
  const [activePortal, setActivePortal] = useState(initialPortal);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [merchantName, setMerchantName] = useState('');
  const [adminCode, setAdminCode] = useState('');

  // UI state
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const portal = PORTALS.find((p) => p.key === activePortal) || PORTALS[0];

  useEffect(() => {
    if (location.pathname.includes('merchant')) {
      setActivePortal('merchant');
    } else if (location.pathname.includes('admin')) {
      setActivePortal('admin');
    }
  }, [location.pathname]);

  const handlePortalSwitch = (key) => {
    setActivePortal(key);
    setError('');
    setSuccessMsg('');
  };

  const fillDemo = () => {
    if (authMode === 'login') {
      setEmail(portal.demoEmail);
      setPassword(portal.demoPass);
    } else {
      setName(portal.demoName);
      setEmail(`demo.${portal.key}.${Date.now().toString().slice(-4)}@razorcart.ai`);
      setPassword('password123');
      setCity(portal.demoCity);
      if (portal.key === 'merchant') {
        setMerchantName(`${portal.demoName}'s Flagship Store`);
      } else if (portal.key === 'admin') {
        setAdminCode('RAZORPAY_ADMIN_2026');
      }
    }
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        const user = await login(email, password, activePortal);
        setSuccessMsg(`Welcome back, ${user.name}!`);
        setTimeout(() => {
          navigate(portal.redirect);
        }, 500);
      } else {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          city,
          role: activePortal,
          merchant_name: activePortal === 'merchant' ? merchantName.trim() : undefined,
          admin_code: activePortal === 'admin' ? adminCode.trim() : undefined,
        };

        const user = await register(payload);
        setSuccessMsg(`Account created for ${user.name}!`);
        setTimeout(() => {
          navigate(portal.redirect);
        }, 600);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f9] text-[#282c3f] flex flex-col font-sans">
      
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#eaeaec] px-4 md:px-8 py-3.5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-black italic tracking-tight select-none">
              <span className="text-[#FF3F6C]">Razorcart</span>
              <span className="text-[#282c3f] ml-1">AI</span>
            </span>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-[#535766] hover:text-[#ff3f6c] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </Link>
        </div>
      </header>

      {/* ── Main Form Container ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[460px]">

          {/* Role Portal Tabs */}
          <div className="bg-white p-1 rounded-xl border border-[#eaeaec] shadow-sm grid grid-cols-3 gap-1 mb-5">
            {PORTALS.map((p) => {
              const Icon = p.icon;
              const isActive = activePortal === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePortalSwitch(p.key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? p.bgActive + ' shadow-sm'
                      : 'text-[#535766] hover:text-[#282c3f] hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#eaeaec] rounded-2xl shadow-xl p-7 md:p-9 relative">
            
            {/* Top Banner & Mode Toggle */}
            <div className="flex items-start justify-between pb-5 border-b border-[#eaeaec] mb-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest block mb-0.5" style={{ color: portal.color }}>
                  {portal.label} Portal
                </span>
                <h2 className="text-xl font-bold text-[#282c3f]">
                  {authMode === 'login' ? `Sign In` : `Create Account`}
                </h2>
                <p className="text-xs text-[#94969f] mt-0.5 max-w-[240px]">
                  {portal.description}
                </p>
              </div>

              {/* Mode Switcher Pills */}
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-[#282c3f] shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setError(''); setSuccessMsg(''); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-[#282c3f] shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Sign Up Fields */}
              {authMode === 'signup' && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 block">
                      {activePortal === 'merchant' ? 'Owner / Manager Full Name' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={portal.demoName}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm placeholder-gray-400 focus:outline-none focus:border-[#ff3f6c] transition-colors"
                    />
                  </div>

                  {/* Merchant Store Name */}
                  {activePortal === 'merchant' && (
                    <div>
                      <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-purple-600" />
                        <span>Store / Brand Name</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        placeholder="e.g. Apex Tech & Lifestyle"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm placeholder-gray-400 focus:outline-none focus:border-purple-600 transition-colors"
                      />
                    </div>
                  )}

                  {/* City Selection */}
                  {activePortal !== 'admin' && (
                    <div>
                      <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#ff3f6c]" />
                        <span>Operating City</span>
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm focus:outline-none focus:border-[#ff3f6c] transition-colors"
                      >
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Admin Authorization Code */}
                  {activePortal === 'admin' && (
                    <div>
                      <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Admin Authorization Passcode</span>
                      </label>
                      <input
                        type="password"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="RAZORPAY_ADMIN_2026"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-600 transition-colors"
                      />
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">Demo Code: RAZORPAY_ADMIN_2026</p>
                    </div>
                  )}
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 block">
                  {activePortal === 'admin' ? 'Official Admin Email' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={portal.demoEmail}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm placeholder-gray-400 focus:outline-none focus:border-[#ff3f6c] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-bold text-[#535766] uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-[#d4d5d9] rounded-lg text-[#282c3f] text-sm placeholder-gray-400 focus:outline-none focus:border-[#ff3f6c] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: portal.color }}
                className="w-full py-3.5 rounded-lg text-white font-extrabold text-sm uppercase tracking-wider shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? `Sign In as ${portal.label}` : `Create ${portal.label} Account`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Autofill Demo Credentials */}
            <div className="mt-5 pt-4 border-t border-[#eaeaec]">
              <button
                type="button"
                onClick={fillDemo}
                className="w-full py-2 px-3 text-xs font-bold text-[#535766] hover:text-[#282c3f] bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Auto-fill Demo Credentials ({portal.label})</span>
              </button>
            </div>

          </div>

          {/* Demo Account Reference Cards */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {PORTALS.map((p) => (
              <div
                key={p.key}
                onClick={() => {
                  setActivePortal(p.key);
                  setEmail(p.demoEmail);
                  setPassword(p.demoPass);
                  setAuthMode('login');
                }}
                className={`bg-white rounded-xl p-3 border transition-all cursor-pointer shadow-sm ${
                  activePortal === p.key ? 'border-[#ff3f6c] ring-1 ring-[#ff3f6c]' : 'border-[#eaeaec] hover:border-gray-300'
                }`}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: p.color }}>
                  {p.label}
                </p>
                <p className="text-[10px] text-gray-700 font-mono truncate">{p.demoEmail}</p>
                <p className="text-[10px] text-gray-400 font-mono">{p.demoPass}</p>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#eaeaec] py-4 px-4 text-center text-xs text-[#94969f]">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-[#282c3f]">RazorCartAI</span>
          <span>•</span>
          <span>Agentic Multi-Role Commerce Platform</span>
        </div>
      </footer>

    </div>
  );
}
