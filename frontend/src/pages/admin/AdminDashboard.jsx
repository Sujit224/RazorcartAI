import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import {
  ShieldCheck, Users, Store, IndianRupee, TrendingUp, Bot, RefreshCw,
  LogOut, Plus, X, ChevronLeft, ChevronRight, Star, Building2, ArrowLeft
} from 'lucide-react';
import { api } from '../../services/api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const STATUS_BADGE = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  TIMEOUT_RECOVERED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DECLINE_RESOLVED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const StatCard = ({ icon: Icon, label, value, sub, color = '#059669' }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-all">
    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: color + '20' }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <p className="text-2xl font-extrabold text-white mb-1">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1c2b] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-extrabold text-white">Onboard New Merchant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {err && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">{err}</div>
        )}
        <form onSubmit={submit} className="space-y-4">
          {[
            { key: 'name', label: 'Contact Name', placeholder: 'Arjun Mehta' },
            { key: 'merchant_name', label: 'Store / Brand Name', placeholder: 'FashionHub Delhi' },
            { key: 'email', label: 'Email', placeholder: 'arjun@store.com', type: 'email' },
            { key: 'city', label: 'City', placeholder: 'Bengaluru' },
            { key: 'password', label: 'Initial Password', placeholder: 'merchant123', type: 'password' },
          ].map(({ key, label, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{label}</label>
              <input
                type={type}
                required
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm disabled:opacity-50 transition-colors shadow-md"
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
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-3xl bg-[#0f0f1a] border-l border-white/10 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Building2 className="w-5 h-5 text-emerald-400" />
        <div>
          <h2 className="font-extrabold text-white">{merchant.merchant_name}</h2>
          <p className="text-xs text-gray-400">{merchant.email} · {merchant.city}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-xl font-extrabold text-white">{fmt(stats?.total_revenue)}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">AI-Generated Profit</p>
              <p className="text-xl font-extrabold text-emerald-400">{fmt(stats?.total_ai_profit)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profit Impact</p>
              <p className="text-xl font-extrabold text-white">{fmt(stats?.total_profit_impact)}</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Recoveries</p>
              <p className="text-xl font-extrabold text-amber-400">{stats?.total_recoveries || 0}</p>
            </div>
          </div>

          {/* Per-merchant chart */}
          {stats?.daily_chart?.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-extrabold text-white mb-4">Revenue vs AI Profit — 30 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.daily_chart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1c2b', border: '1px solid #ffffff15', borderRadius: 10, color: '#fff', fontSize: 12 }}
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={false} name="Revenue" />
                  <Line type="monotone" dataKey="ai_profit" stroke="#10b981" strokeWidth={2} dot={false} name="AI Profit" strokeDasharray="4 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Transaction Log</h3>
              <span className="text-xs bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/25 font-bold">{txns.total} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-left">Time</th>
                    <th className="px-4 py-2.5 text-left">Agent</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-right">AI Profit</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.transactions?.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr
                        className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}
                      >
                        <td className="px-4 py-2.5 text-gray-500 font-mono whitespace-nowrap">
                          {new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {t.agent_type?.replace('Agent', '')}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-white">
                          {t.money_amount > 0 ? fmt(t.money_amount) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-400">
                          {t.profit_from_ai > 0 ? fmt(t.profit_from_ai) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {t.payment_status ? (
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${STATUS_BADGE[t.payment_status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                              {t.payment_status.replace(/_/g, ' ')}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                      {expandedRow === t.id && (
                        <tr className="bg-emerald-900/10">
                          <td colSpan={5} className="px-5 py-3">
                            <p className="text-[11px] text-gray-400 leading-relaxed">{t.decision_reasoning}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => loadPage(page - 1)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button disabled={page >= totalPages} onClick={() => loadPage(page + 1)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">
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
      <div className="min-h-screen bg-[#0a0f0e] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">Loading Admin Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f0e] text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-[#0a0f0e]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg leading-tight">Razorpay Admin</h1>
            <p className="text-xs text-emerald-400 font-bold">Global Platform Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOnboard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Merchant</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Store} label="Total Merchants" value={dash?.total_merchants || 0}
            sub={`${dash?.total_customers || 0} customers`} color="#059669" />
          <StatCard icon={IndianRupee} label="Global Revenue" value={fmt(dash?.total_revenue)}
            sub="Successful payments" color="#10b981" />
          <StatCard icon={Bot} label="Total AI Profit" value={fmt(dash?.total_ai_profit)}
            sub="Across all merchants" color="#7c3aed" />
          <StatCard icon={RefreshCw} label="Total Recoveries" value={dash?.total_recoveries || 0}
            sub={`${fmt(dash?.recovered_revenue)} saved`} color="#f59e0b" />
        </div>

        {/* Global Profit/Day Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Global Revenue & AI Profit — Last 30 Days</h2>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dash?.daily_chart || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0f1a15', border: '1px solid #ffffff15', borderRadius: 12, color: '#fff' }}
                formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#059669" name="Revenue" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="ai_profit" fill="#7c3aed" name="AI Profit" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Merchants Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="font-extrabold text-white">Onboarded Merchants</h2>
              <span className="text-xs bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                {merchants.length} merchants
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold">Click a row for drill-down →</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Merchant</th>
                  <th className="px-5 py-3 text-left">City</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">AI Profit</th>
                  <th className="px-5 py-3 text-center">Transactions</th>
                  <th className="px-5 py-3 text-center">Recoveries</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr
                    key={m.merchant_id}
                    onClick={() => setSelectedMerchant(m)}
                    className="border-t border-white/5 hover:bg-emerald-500/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
                          <Store className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-extrabold text-white group-hover:text-emerald-400 transition-colors">{m.merchant_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm">{m.city}</td>
                    <td className="px-5 py-4 text-right font-extrabold text-white">{fmt(m.total_revenue)}</td>
                    <td className="px-5 py-4 text-right font-extrabold text-emerald-400">{fmt(m.total_ai_profit)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded-lg border border-white/10">{m.total_transactions}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${m.total_recoveries > 0 ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
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

      {/* Modals & Panels */}
      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onSuccess={() => { setShowOnboard(false); loadData(); }}
        />
      )}
      {selectedMerchant && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMerchant(null)} />
          <MerchantDrillDown merchant={selectedMerchant} onClose={() => setSelectedMerchant(null)} />
        </>
      )}
    </div>
  );
}
