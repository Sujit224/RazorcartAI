import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const AgenticChatbotLauncher = () => {
  const { isAgentOpen, setIsAgentOpen, setAgentMode } = useAgent();

  if (isAgentOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-fade-in group">
      
      {/* Experience in Agentic Mode Pill */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className="hidden sm:flex items-center gap-2 pl-4 pr-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#0c2340] rounded-full shadow-md border border-[#e2e8f0] hover:border-[#00b386] transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b386] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b386]" />
        </span>
        
        <span className="text-xs font-bold tracking-tight">
          Experience in Agentic Mode
        </span>

        <Sparkles className="w-3.5 h-3.5 text-[#00b386]" />
      </button>

      {/* Voice Mode Button */}
      <button
        onClick={() => { setAgentMode('voice'); setIsAgentOpen(true); }}
        className="flex items-center justify-center w-11 h-11 bg-white hover:bg-[#f0f7ff] text-[#0066cc] border-2 border-[#0066cc] rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Voice Shopping Mode"
        aria-label="ZORA Voice"
      >
        <span className="text-xl">🎙️</span>
      </button>

      {/* Razorpay 'Ask ZORA' Widget Button with Radiant Glow */}
      <div className="relative flex items-center">
        <span className="animate-ping absolute -inset-1 rounded-xl bg-emerald-400 opacity-30 pointer-events-none" />
        <button
          onClick={() => { setAgentMode('standard'); setIsAgentOpen(true); }}
          className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-white via-white to-emerald-50/40 hover:to-emerald-100/50 text-[#0c2340] border-2 border-[#00b386] rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer font-extrabold text-sm"
          title="Ask Agentic AI Copilot (ZORA)"
          aria-label="Ask ZORA"
        >
          <span className="w-4 h-4 text-[#00b386] flex items-center justify-center font-black text-base animate-pulse">✤</span>
          <span className="tracking-tight font-extrabold bg-gradient-to-r from-[#0c2340] to-[#00b386] bg-clip-text text-transparent">Ask ZORA</span>
        </button>
      </div>

    </div>
  );
};
