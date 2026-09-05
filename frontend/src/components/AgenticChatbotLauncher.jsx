import React from 'react';
import { Bot, Mic, Sparkles } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const AgenticChatbotLauncher = () => {
  const { isAgentOpen, setIsAgentOpen, setAgentMode } = useAgent();

  if (isAgentOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 animate-fade-in group">
      
      {/* Experience in Agentic Mode Pill */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className="hidden sm:flex items-center gap-2 pl-3.5 pr-3 py-2 bg-white hover:bg-slate-50 text-[#0c2340] rounded-lg shadow-md border border-[#cbd5e1] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066cc] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066cc]" />
        </span>
        
        <span className="text-xs font-bold tracking-tight text-[#0c2340]">
          Agentic Mode
        </span>

        <Bot className="w-3.5 h-3.5 text-[#0066cc]" />
      </button>

      {/* Voice Mode Button */}
      <button
        onClick={() => { setAgentMode('voice'); setIsAgentOpen(true); }}
        className="flex items-center justify-center w-10 h-10 bg-white hover:bg-[#f0f7ff] text-[#0066cc] border border-[#cbd5e1] hover:border-[#0066cc] rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        title="Voice Shopping Mode"
        aria-label="ZORA Voice"
      >
        <Mic className="w-4 h-4 text-[#0066cc]" />
      </button>

      {/* Ask ZORA Widget Button */}
      <button
        onClick={() => { setAgentMode('standard'); setIsAgentOpen(true); }}
        className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] hover:bg-[#0052cc] text-white rounded-lg shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer font-bold text-sm"
        title="Ask Agentic AI Copilot (ZORA)"
        aria-label="Ask ZORA"
      >
        <Bot className="w-4 h-4 text-white" />
        <span className="tracking-tight font-bold">Ask ZORA</span>
      </button>

    </div>
  );
};
