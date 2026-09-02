import React, { useState } from 'react';
import { PlayCircle, ShieldAlert, Zap, Users, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';

export const DemoChaosPanel = () => {
  const { currentUser, switchPersona } = useAuth();
  const { sendMessage, setIsAgentOpen, setIsAuditModalOpen } = useAgent();
  const [collapsed, setCollapsed] = useState(false);

  const handleTriggerTimeoutChaos = () => {
    setIsAgentOpen(true);
    sendMessage("Simulating Razorpay Gateway 504 Timeout during checkout.", "SIMULATE_TIMEOUT");
  };

  const handleTriggerFundsChaos = () => {
    setIsAgentOpen(true);
    sendMessage("Simulating Card Decline / Insufficient Funds on shopping bag.", "SIMULATE_INSUFFICIENT_FUNDS");
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs md:max-w-sm bg-gradient-to-br from-[#1e2330] via-[#282c3f] to-[#111319] text-white rounded-2xl shadow-2xl border border-pink-500/30 overflow-hidden agent-pulse-glow">
      
      {/* Panel Header */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 bg-black/40 flex items-center justify-between cursor-pointer border-b border-white/10 hover:bg-black/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff3f6c] animate-ping" />
          <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-[#ff3f6c] to-[#ff905a] bg-clip-text text-transparent">
            Track 01 Demo & Chaos Center
          </span>
        </div>
        {collapsed ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {!collapsed && (
        <div className="p-3.5 space-y-3 text-xs">
          
          {/* Persona Switcher Quick Action */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3 text-pink-400" />
              <span>Persona & Zero-Query Engine</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => switchPersona(1)}
                className={`p-1.5 rounded text-[11px] font-bold border transition-colors ${
                  currentUser?.id === 1 
                    ? "bg-[#ff3f6c] border-[#ff3f6c] text-white" 
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                🏃 Priya (Bengaluru)
              </button>
              <button
                onClick={() => switchPersona(2)}
                className={`p-1.5 rounded text-[11px] font-bold border transition-colors ${
                  currentUser?.id === 2 
                    ? "bg-[#ff3f6c] border-[#ff3f6c] text-white" 
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                👟 Rahul (Mumbai)
              </button>
            </div>
          </div>

          {/* Autonomous Failure Recovery Triggers */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Autonomous Failure Recovery</span>
            </p>
            <div className="space-y-1.5">
              <button
                onClick={handleTriggerTimeoutChaos}
                className="w-full text-left p-2 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-between transition-colors"
              >
                <span>⚡ Trigger 504 Timeout Recovery (UPI + Lock)</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleTriggerFundsChaos}
                className="w-full text-left p-2 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex items-center justify-between transition-colors"
              >
                <span>💳 Trigger Card Decline / Cart Pruning</span>
                <PlayCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Audit Ledger Trigger */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Open Merchant Audit Ledger</span>
          </button>

        </div>
      )}

    </div>
  );
};
