import React from 'react';
import { Mic, Volume2, AlertCircle } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

const rupees = (n) => `Rs. ${Math.round(n || 0).toLocaleString()}`;

export const ZoraVoiceView = () => {
  const {
    isListening,
    isSpeaking,
    speechTranscript,
    voiceError,
    messages,
    respondToGate
  } = useAgent();

  const lastMsg = messages[messages.length - 1];
  const pendingConf = lastMsg?.pending_confirmation;
  const products = lastMsg?.products || [];

  return (
    <div className="flex-1 flex flex-col bg-[#051124] text-white overflow-hidden relative">
      {/* Background Visualizer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className={`w-64 h-64 rounded-full bg-[#0066cc] blur-3xl transition-transform duration-1000 ${isSpeaking ? 'scale-150 animate-pulse' : (isListening ? 'scale-110' : 'scale-75')}`} />
      </div>

      <div className="relative z-10 flex-1 w-full overflow-y-auto p-6 text-center hide-scrollbar">
        <div className="flex flex-col items-center justify-center min-h-full space-y-8 py-2">
        
        {/* Status Orb */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isSpeaking ? 'bg-[#0066cc] animate-bounce shadow-[0_0_40px_rgba(0,102,204,0.6)]' : (isListening ? 'bg-emerald-500 animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-slate-800')}`}>
          {isSpeaking ? <Volume2 className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
        </div>
        
        {/* Status Text */}
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-extrabold tracking-tight">
            {voiceError ? 'Microphone Error' : (isSpeaking ? 'ZORA is speaking...' : (isListening ? 'Listening...' : 'Tap mic to start'))}
          </h2>
          
          {voiceError ? (
            <p className="text-red-400 text-sm font-medium">{voiceError}</p>
          ) : (
            <p className="text-slate-300 min-h-[3rem] italic text-sm font-semibold">
              {speechTranscript ? `"${speechTranscript}"` : (isListening ? 'Say "Find shoes" or "Checkout"' : '')}
            </p>
          )}
        </div>

        {/* Fallback Confirmation Card */}
        {pendingConf && (
          <div className="mt-6 w-full max-w-sm bg-slate-800/90 backdrop-blur-md border border-amber-500/50 rounded-2xl p-4 text-left shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold mb-3 text-sm uppercase tracking-wider">
              <AlertCircle className="w-5 h-5" />
              <span>Voice Confirmation Required</span>
            </div>
            
            {pendingConf.id && (
              <div className="flex gap-3 mb-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/50">
                <img src={pendingConf.image_url} alt={pendingConf.title} className="w-16 h-16 object-cover rounded-lg bg-white" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white line-clamp-1">{pendingConf.brand} {pendingConf.title}</div>
                  <div className="text-emerald-400 font-black text-sm mt-0.5">{rupees(pendingConf.price)}</div>
                  <div className="text-[10px] text-amber-400 mt-1 font-bold bg-amber-400/10 w-fit px-1.5 py-0.5 rounded">{pendingConf.action_verb}</div>
                </div>
              </div>
            )}
            
            <p className="text-sm font-bold text-amber-50 mb-4">{pendingConf.prompt}</p>
            
            <div className="flex gap-2">
              <button onClick={() => respondToGate(true)} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl shadow-lg transition-colors cursor-pointer">
                Say "Yes"
              </button>
              <button onClick={() => respondToGate(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border border-slate-600 shadow-md transition-colors cursor-pointer">
                Say "No"
              </button>
            </div>
          </div>
        )}

        {/* Ordinal Products for Voice Selection */}
        {!pendingConf && products.length > 0 && (
          <div className="w-full max-w-sm animate-fade-in">
             <div className="flex overflow-x-auto gap-3 pb-4 snap-x hide-scrollbar">
               {products.map((p, idx) => (
                 <div key={p.id} className="snap-center shrink-0 w-32 bg-slate-800/90 backdrop-blur-md rounded-xl p-2.5 border border-slate-700 relative shadow-xl">
                   <div className="absolute -top-2 -left-2 w-7 h-7 bg-[#0066cc] rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 border-slate-900 text-white">#{idx + 1}</div>
                   <img src={p.image_url} alt={p.title} className="w-full h-24 object-cover rounded-lg mb-2 bg-white" />
                   <div className="text-[10px] font-bold text-slate-300 line-clamp-1 truncate">{p.brand} {p.title}</div>
                   <div className="text-xs font-black text-emerald-400 mt-0.5">{rupees(p.price)}</div>
                 </div>
               ))}
             </div>
             <p className="text-xs text-slate-400 italic font-medium mt-1">Try saying "Show me the 1st one" or "Add #2 to cart"</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
