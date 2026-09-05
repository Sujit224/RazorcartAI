import React from 'react';
import { Bot, Mic, MessageSquare } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const AgenticChatbotLauncher = () => {
  const { isAgentOpen, setIsAgentOpen, agentMode, setAgentMode, toggleMic, isListening } = useAgent();

  if (isAgentOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center bg-white/95 backdrop-blur-md border border-[#cbd5e1] rounded-full p-1.5 shadow-xl hover:shadow-2xl transition-all duration-300 gap-2 group animate-fade-in">
      
      {/* Mode Segmented Toggle Pill (Voice vs Chat) */}
      <div className="flex items-center bg-[#f1f5f9] rounded-full p-1 border border-[#e2e8f0]">
        <button
          type="button"
          onClick={() => setAgentMode('standard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
            agentMode === 'standard'
              ? 'bg-white text-[#0066cc] font-extrabold shadow-sm'
              : 'text-[#5c6f84] hover:text-[#0c2340] font-semibold'
          }`}
          title="Chat Mode (Text Copilot)"
          aria-label="Chat Mode"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setAgentMode('voice')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer ${
            agentMode === 'voice'
              ? 'bg-white text-[#0066cc] font-extrabold shadow-sm'
              : 'text-[#5c6f84] hover:text-[#0c2340] font-semibold'
          }`}
          title="Voice Mode (Microphone Input)"
          aria-label="Voice Mode"
        >
          <Mic className={`w-3.5 h-3.5 ${agentMode === 'voice' && isListening ? 'text-red-500 animate-pulse' : ''}`} />
          <span>Voice</span>
        </button>
      </div>

      {/* Single Launcher Action Button */}
      <button
        type="button"
        onClick={() => {
          setIsAgentOpen(true);
          if (agentMode === 'voice' && !isListening) {
            toggleMic();
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] hover:bg-[#0052cc] text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        title={agentMode === 'voice' ? "Speak to ZORA Copilot" : "Ask ZORA AI Copilot"}
        aria-label="Ask ZORA Launcher"
      >
        {agentMode === 'voice' ? (
          <Mic className="w-4 h-4 text-white animate-pulse" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
        <span className="tracking-tight font-extrabold">Ask ZORA</span>
      </button>

    </div>
  );
};
