import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  ShieldCheck, Users, Store, IndianRupee, TrendingUp, Bot, RefreshCw,
  LogOut, Plus, X, ChevronLeft, ChevronRight, Star, Building2, ArrowLeft,
  Sparkles, CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_BADGE = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TIMEOUT_RECOVERED: 'bg-amber-50 text-amber-700 border-amber-200',
  DECLINE_RESOLVED: 'bg-blue-50 text-blue-700 border-blue-200',
};

const StatCard = ({ icon: Icon, label, value, sub, bgLight = 'bg-emerald-50', textColor = 'text-emerald-700', borderColor = 'border-emerald-200' }) => (
  <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5c6f84]">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgLight} ${textColor} border ${borderColor} transition-transform group-hover:scale-105`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-2xl md:text-3xl font-black text-[#0c2340] tracking-tight mb-2">{value}</p>
    {sub && <p className="text-xs text-[#5c6f84] font-medium">{sub}</p>}
  </div>
);

// ─── Onboard Modal ────────────────────────────────────────────────────────────
function OnboardModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', merchant_name: '', city: 'Bengaluru', password: 'merchant123' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api.onboardMerchant(form);
      onSuccess();
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to onboard merchant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-[#0c2340]">Onboard New Merchant</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {err && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-semibold">{err}</div>
        )}
        <form onSubmit={submit} className="space-y-4">
          {[
            { key: 'name', label: 'Contact Name', placeholder: 'Arjun Mehta' },
            { key: 'merchant_name', label: 'Store / Brand Name', placeholder: 'FashionHub Delhi' },
            { key: 'email', label: 'Email Address', placeholder: 'arjun@store.com', type: 'email' },
            { key: 'city', label: 'Operating City', placeholder: 'Bengaluru' },
            { key: 'password', label: 'Initial Password', placeholder: 'merchant123', type: 'password' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-[11px] font-bold text-[#5c6f84] uppercase tracking-wider mb-1.5 block">{label}</label>
              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 bg-white border border-[#d4d5d9] rounded-lg text-[#0c2340] text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-600 transition-colors"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors shadow-md mt-6 cursor-pointer"
          >
            {loading ? 'Onboarding...' : 'Onboard Merchant'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Merchant Drill-Down Panel ────────────────────────────────────────────────
function MerchantDrillDown({ merchant, onClose }) {
  const [stats, setStats] = useState(null);
  const [txns, setTxns] = useState({ transactions: [], total: 0 });
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          api.getMerchantStats(merchant.merchant_id),
          api.getMerchantTransactionsAdmin(merchant.merchant_id, 1),
        ]);
        setStats(s.data);
        setTxns(t.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [merchant.merchant_id]);

  const loadPage = async (p) => {
    const res = await api.getMerchantTransactionsAdmin(merchant.merchant_id, p);
    setTxns(res.data);
    setPage(p);
  };

  const totalPages = Math.ceil((txns.total || 0) / 25);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-3xl bg-white border-l border-[#e2e8f0] shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-[#5c6f84] hover:text-[#0c2340]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-[#0c2340] text-base leading-tight">{merchant.merchant_name}</h2>
            <p className="text-xs text-[#5c6f84]">{merchant.email} · {merchant.city}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
              <p className="text-[11px] font-bold text-[#5c6f84] uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-xl font-black text-[#0c2340]">{fmt(stats?.total_revenue)}</p>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">AI-Generated Profit</p>
              <p className="text-xl font-black text-emerald-700">{fmt(stats?.total_ai_profit)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
              <p className="text-[11px] font-bold text-[#5c6f84] uppercase tracking-wider mb-1">Profit Impact</p>
              <p className="text-xl font-black text-[#0c2340]">{fmt(stats?.total_profit_impact)}</p>
            </div>
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200 shadow-sm">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Recoveries</p>
              <p className="text-xl font-black text-amber-700">{stats?.total_recoveries || 0}</p>
            </div>
          </div>

          {/* Per-merchant chart */}
          {stats?.daily_chart?.length > 0 && (
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#0c2340] mb-4">Revenue vs AI Profit — 30 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.daily_chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" />
                  <XAxis dataKey="date" tick={{ fill: '#5c6f84', fontSize: 10, fontWeight: 600 }} tickLine={false} stroke="#e2e8f0" />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#5c6f84', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} stroke="#e2e8f0" />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0c2340', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="ai_profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="AI Profit" strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
              <h3 className="text-sm font-extrabold text-[#0c2340]">Transaction Log</h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">{txns.total} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#f9fafb] text-[10px] font-bold text-[#5c6f84] uppercase tracking-wider border-b border-[#e2e8f0]">
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Agent</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">AI Profit</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {txns.transactions?.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr
                        className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}
                      >
                        <td className="px-4 py-3 text-[#5c6f84] font-mono whitespace-nowrap">
                          {new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {t.agent_type?.replace('Agent', '')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0c2340]">
                          {t.money_amount > 0 ? fmt(t.money_amount) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#059669]">
                          {t.profit_from_ai > 0 ? fmt(t.profit_from_ai) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {t.payment_status ? (
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${STATUS_BADGE[t.payment_status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                              {t.payment_status.replace(/_/g, ' ')}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                      {expandedRow === t.id && (
                        <tr className="bg-emerald-50/40">
                          <td colSpan={5} className="px-5 py-3">
                            <p className="text-[11px] text-[#5c6f84] leading-relaxed">{t.decision_reasoning}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0] bg-white">
                <span className="text-xs text-[#5c6f84] font-semibold">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => loadPage(page - 1)}
                    className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={page >= totalPages} onClick={() => loadPage(page + 1)}
                    className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-gray-50 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_user') || '{}'); } catch { return {}; }
  });
  const [dash, setDash] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboard, setShowOnboard] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  useEffect(() => {
    if (!user?.role || user.role !== 'admin') navigate('/admin/login');
  }, [user]);

  const loadData = async () => {
    try {
      const [d, m] = await Promise.all([
        api.getAdminDashboard(30),
        api.getAllMerchants(),
      ]);
      setDash(d.data);
      setMerchants(m.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('rc_token');
    localStorage.removeItem('rc_user');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf8f9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#0c2340] font-bold text-sm">Loading Admin Console…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf8f9] text-[#0c2340] flex flex-col font-sans">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#e2e8f0] px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black italic tracking-tight select-none">
                <span className="text-[#0066CC]">Razorcart</span>
                <span className="text-[#0c2340] ml-1">AI</span>
              </span>
            </Link>

            <span className="hidden sm:inline-block text-gray-300">|</span>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-[#0c2340] text-sm md:text-base leading-tight">Razorpay Admin</h1>
                <p className="text-[11px] text-emerald-700 font-semibold">Global Platform Analytics</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              to="/"
              className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#5c6f84] hover:text-[#0066cc] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Storefront</span>
            </Link>

            <button
              onClick={() => setShowOnboard(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Onboard Merchant</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-600 font-extrabold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1300px] w-full mx-auto px-4 md:px-8 py-8 space-y-8 flex-1">
        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <StatCard
            icon={Store}
            label="Total Merchants"
            value={dash?.total_merchants || 0}
            sub={`${dash?.total_customers || 0} active shoppers`}
            bgLight="bg-emerald-50"
            textColor="text-emerald-700"
            borderColor="border-emerald-200"
          />
          <StatCard
            icon={IndianRupee}
            label="Global Revenue"
            value={fmt(dash?.total_revenue)}
            sub="Successful merchant transactions"
            bgLight="bg-purple-50"
            textColor="text-purple-700"
            borderColor="border-purple-200"
          />
          <StatCard
            icon={Bot}
            label="Total AI Profit"
            value={fmt(dash?.total_ai_profit)}
            sub="Across all connected stores"
            bgLight="bg-[#f0f7ff]"
            textColor="text-[#0066cc]"
            borderColor="border-blue-200"
          />
          <StatCard
            icon={RefreshCw}
            label="Total Recoveries"
            value={dash?.total_recoveries || 0}
            sub={`${fmt(dash?.recovered_revenue)} GMV saved`}
            bgLight="bg-amber-50"
            textColor="text-amber-700"
            borderColor="border-amber-200"
          />
        </div>

        {/* Global Profit/Day Chart */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 md:p-7 shadow-sm">
          <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-[#0c2340]">Global Revenue & AI Profit — Last 30 Days</h2>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Platform Overview
            </span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dash?.daily_chart || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f2" />
              <XAxis dataKey="date" tick={{ fill: '#5c6f84', fontSize: 11, fontWeight: 600 }} tickLine={false} stroke="#e2e8f0" />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#5c6f84', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} stroke="#e2e8f0" />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, color: '#0c2340', fontSize: 12, fontWeight: 700, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ color: '#5c6f84', fontSize: 12, fontWeight: 700, paddingTop: 10 }} />
              <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[4, 4, 0, 0]} opacity={0.9} />
              <Bar dataKey="ai_profit" fill="#7c3aed" name="AI Profit" radius={[4, 4, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Merchants Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[#e2e8f0] gap-2 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="font-extrabold text-[#0c2340] text-base">Onboarded Merchants</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                {merchants.length} merchants
              </span>
            </div>
            <p className="text-xs text-[#5c6f84] font-semibold">Click a row for drill-down audit →</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#f9fafb] text-[11px] font-extrabold text-[#5c6f84] uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="px-5 py-3.5">Merchant</th>
                  <th className="px-5 py-3.5">City</th>
                  <th className="px-5 py-3.5 text-right">Revenue</th>
                  <th className="px-5 py-3.5 text-right">AI Profit</th>
                  <th className="px-5 py-3.5 text-center">Transactions</th>
                  <th className="px-5 py-3.5 text-center">Recoveries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {merchants.map((m) => (
                  <tr
                    key={m.merchant_id}
                    onClick={() => setSelectedMerchant(m)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-[#0c2340] group-hover:text-emerald-700 transition-colors">{m.merchant_name}</p>
                          <p className="text-xs text-[#5c6f84] font-mono">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#5c6f84] text-sm">{m.city}</td>
                    <td className="px-5 py-4 text-right font-black text-[#0c2340]">{fmt(m.total_revenue)}</td>
                    <td className="px-5 py-4 text-right font-black text-[#059669]">{fmt(m.total_ai_profit)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-lg border border-gray-200">{m.total_transactions}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${m.total_recoveries > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {m.total_recoveries}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-5 px-4 md:px-8 text-center text-xs text-[#94969f] mt-12">
        <div className="max-w-[1300px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0c2340]">RazorCartAI</span>
            <span>•</span>
            <span>Razorpay Administrator Governance</span>
          </div>
          <p className="text-[11px] text-[#94969f]">Multi-Merchant Settlement & Settlement Assurance</p>
        </div>
      </footer>

      {/* Modals & Panels */}
      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onSuccess={() => { setShowOnboard(false); loadData(); }}
        />
      )}
      {selectedMerchant && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedMerchant(null)} />
          <MerchantDrillDown merchant={selectedMerchant} onClose={() => setSelectedMerchant(null)} />
        </>
      )}
    </div>
  );
}

