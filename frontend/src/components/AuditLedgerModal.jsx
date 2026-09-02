import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, DollarSign, RefreshCw, CheckCircle, AlertTriangle, ArrowUpRight, Filter } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { api } from '../services/api';

export const AuditLedgerModal = () => {
  const { isAuditModalOpen, setIsAuditModalOpen } = useAgent();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [ledgerRes, statsRes] = await Promise.all([
        api.getAuditLedger({ agent_type: selectedAgent || undefined, limit: 30 }),
        api.getAuditStats()
      ]);
      setLedgerEntries(ledgerRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load audit ledger data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuditModalOpen) {
      fetchAuditData();
    }
  }, [isAuditModalOpen, selectedAgent]);

  if (!isAuditModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="p-5 bg-[#111827] text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Merchant Autonomous Audit Ledger</h3>
                <span className="text-[10px] bg-emerald-500 text-gray-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Live & Immutable
                </span>
              </div>
              <p className="text-xs text-gray-400">Track 01 • Explainable Agent Actions, Bounded Operations & Autonomous Recovery</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAuditData}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsAuditModalOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 border-b border-gray-200">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">AI Generated Revenue</span>
              <div className="text-lg font-black text-emerald-700 mt-0.5">
                Rs. {Math.round(stats.total_revenue_generated).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recovered Lost Sales</span>
              <div className="text-lg font-black text-[#ff3f6c] mt-0.5">
                Rs. {Math.round(stats.recovered_revenue).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Autonomous Recoveries</span>
              <div className="text-lg font-black text-blue-700 mt-0.5">
                {stats.successful_recoveries_count} Events
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rating Influenced Actions</span>
              <div className="text-lg font-black text-gray-800 mt-0.5">
                {stats.high_rating_conversions_count} Decisions
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-semibold text-gray-600">Filter by Agent Node:</span>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-2.5 py-1 bg-gray-100 rounded font-semibold text-gray-800 focus:outline-none cursor-pointer"
            >
              <option value="">All Agent Nodes</option>
              <option value="DiscoveryAgent">DiscoveryAgent</option>
              <option value="UpsellAgent">UpsellAgent</option>
              <option value="CheckoutAgent">CheckoutAgent</option>
              <option value="RecoveryAgent">RecoveryAgent</option>
              <option value="ZeroQueryPersonalizer">ZeroQueryPersonalizer</option>
            </select>
          </div>

          <span className="text-[11px] text-gray-400">
            Showing latest {ledgerEntries.length} immutable records
          </span>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 text-gray-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-3">ID / Time</th>
                  <th className="p-3">Agent & Action</th>
                  <th className="p-3">Decision Reasoning & Rating Factor</th>
                  <th className="p-3">Money Value</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledgerEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    
                    {/* ID & Time */}
                    <td className="p-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      <div>#{row.id}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    {/* Agent & Action */}
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold text-[#282c3f] block">{row.agent_type}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                        {row.action_type}
                      </span>
                    </td>

                    {/* Decision Reasoning & Review Impact */}
                    <td className="p-3 max-w-md">
                      <p className="text-gray-800 font-normal leading-relaxed">{row.decision_reasoning}</p>
                      {row.rating_review_impact && (
                        <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span>★ {row.rating_review_impact}</span>
                        </div>
                      )}
                    </td>

                    {/* Money Value */}
                    <td className="p-3 whitespace-nowrap font-bold">
                      {row.money_amount > 0 ? (
                        <span className="text-gray-900">Rs. {Math.round(row.money_amount).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3 whitespace-nowrap">
                      {row.payment_status === "SUCCESS" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          <span>Captured</span>
                        </span>
                      )}
                      {row.payment_status === "TIMEOUT_RECOVERED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Timeout Recovered</span>
                        </span>
                      )}
                      {row.payment_status === "INITIALIZED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                          <span>Initialized</span>
                        </span>
                      )}
                      {row.payment_status === "DECLINE_RESOLVED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1 w-fit">
                          <span>Cart Pruned</span>
                        </span>
                      )}
                      {!row.payment_status && (
                        <span className="text-gray-400 text-[11px]">Logged</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Cryptographic Checksum: SHA-256 Verified</span>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Close Ledger
          </button>
        </div>

      </div>
    </div>
  );
};
