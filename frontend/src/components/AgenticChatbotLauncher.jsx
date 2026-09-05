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

      {/* Razorpay 'Ask ZORA' Widget Button */}
      <button
        onClick={() => { setAgentMode('standard'); setIsAgentOpen(true); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50/50 text-[#0c2340] border-2 border-[#00b386] rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer font-extrabold text-sm"
        title="Ask Agentic AI Copilot (ZORA)"
        aria-label="Ask ZORA"
      >
        <span className="w-4 h-4 text-[#00b386] flex items-center justify-center font-black text-base">✤</span>
        <span className="tracking-tight">Ask ZORA</span>
      </button>

    </div>
  );
};
