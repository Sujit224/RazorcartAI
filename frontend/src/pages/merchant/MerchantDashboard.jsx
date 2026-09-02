import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Store, TrendingUp, IndianRupee, Zap, RefreshCw,
  LogOut, ChevronLeft, ChevronRight, Package, Bot, Star, ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api';

// ─── Helper ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pct = (ai, total) => total > 0 ? ((ai / total) * 100).toFixed(1) + '%' : '0%';

const STATUS_BADGE = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  TIMEOUT_RECOVERED: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DECLINE_RESOLVED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  INITIALIZED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const StatCard = ({ icon: Icon, label, value, sub, color = '#7c3aed' }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/8 transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-extrabold text-white mb-1">{value}</p>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function MerchantDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_user') || '{}'); } catch { return {}; }
  });
  const [dash, setDash] = useState(null);
  const [chart, setChart] = useState([]);
  const [txns, setTxns] = useState({ transactions: [], total: 0, page: 1 });
  const [loadingDash, setLoadingDash] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!user?.role || user.role !== 'merchant') {
      navigate('/merchant/login');
    }
  }, [user]);

  // Fetch dashboard
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

  const loadPage = async (p) => {
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
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-bold">Loading Merchant Dashboard…</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((txns.total || 0) / 20);

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg leading-tight">{dash?.merchant_name || 'Merchant Portal'}</h1>
            <p className="text-xs text-purple-400 font-bold">Merchant Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-semibold hidden md:block">{user.email}</span>
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
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(dash?.total_revenue)}
            sub="Successful payments" color="#7c3aed" />
          <StatCard icon={Bot} label="AI-Generated Profit" value={fmt(dash?.total_ai_profit)}
            sub={`${pct(dash?.total_ai_profit, dash?.total_revenue)} of revenue`} color="#10b981" />
          <StatCard icon={RefreshCw} label="Recoveries" value={dash?.total_recoveries || 0}
            sub="Saved failed payments" color="#f59e0b" />
          <StatCard icon={TrendingUp} label="Today's Revenue" value={fmt(dash?.today_revenue)}
            sub={`AI profit: ${fmt(dash?.today_ai_profit)}`} color="#ff3f6c" />
        </div>

        {/* Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-extrabold text-white">Revenue vs AI Profit — Last 30 Days</h2>
          </div>
          {chart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              No chart data yet — transactions will appear here in real time.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1c2b', border: '1px solid #ffffff15', borderRadius: 12, color: '#fff' }}
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Total Revenue" />
                <Line type="monotone" dataKey="ai_profit" stroke="#10b981" strokeWidth={2.5} dot={false} name="AI Profit" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transaction Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-purple-400" />
              <h2 className="font-extrabold text-white">Transaction Audit Ledger</h2>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-full font-bold border border-purple-500/30">
                {txns.total} entries
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Immutable Audit Trail</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Timestamp</th>
                  <th className="px-5 py-3 text-left">Agent</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">AI Profit</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.transactions?.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr
                      className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setExpandedRow(expandedRow === t.id ? null : t.id)}
                    >
                      <td className="px-5 py-3 text-gray-400 text-xs font-mono whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                          {t.agent_type?.replace('Agent', '')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-300 font-medium max-w-[160px] truncate">
                        {t.action_type}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-white">
                        {t.money_amount > 0 ? fmt(t.money_amount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-emerald-400">
                        {t.profit_from_ai > 0 ? fmt(t.profit_from_ai) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        {t.payment_status ? (
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_BADGE[t.payment_status] || STATUS_BADGE.INITIALIZED}`}>
                            {t.payment_status.replace(/_/g, ' ')}
                          </span>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                    </tr>
                    {expandedRow === t.id && (
                      <tr className="bg-purple-900/10">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">AI Reasoning</span>
                              <p className="text-xs text-gray-300 mt-1 leading-relaxed">{t.decision_reasoning}</p>
                            </div>
                            {t.rating_review_impact && (
                              <div>
                                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                  <Star className="w-3 h-3" /> Rating Impact
                                </span>
                                <p className="text-xs text-gray-400 mt-1">{t.rating_review_impact}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => loadPage(page - 1)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page >= totalPages} onClick={() => loadPage(page + 1)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
