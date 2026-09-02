import React, { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const AgenticChatbotLauncher = () => {
  const { isAgentOpen, setIsAgentOpen } = useAgent();

  if (isAgentOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 animate-fade-in group">
      
      {/* Sleek White Theme Pill: "Experience in Agentic Mode" */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className="flex items-center gap-2.5 pl-4 pr-3.5 py-2.5 bg-white hover:bg-pink-50 text-[#282c3f] hover:text-[#ff3f6c] rounded-full shadow-lg border border-[#eaeaec] hover:border-[#ff3f6c] transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3f6c] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3f6c]" />
        </span>
        
        <span className="text-xs font-bold tracking-wide">
          Experience in Agentic Mode
        </span>

        <Sparkles className="w-3.5 h-3.5 text-[#ff3f6c]" />
      </button>

      {/* Solid Circular Chatbot Launcher Button */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className="w-14 h-14 rounded-full bg-[#ff3f6c] hover:bg-[#e62e5b] text-white flex items-center justify-center shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95 border-2 border-white"
        title="Experience in Agentic Mode • Razorcart AI Copilot"
        aria-label="Open Agentic AI Copilot"
      >
        <Bot className="w-7 h-7 text-white" />
      </button>

    </div>
  );
};
