import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Bot, Zap, Sparkle } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

const GLYPHS = ['Z', 'O', 'R', 'A', 'X', '7', '9', 'C', 'A', 'R', 'T', '⚡', '✨', '✦'];

export const ZoraIntroGuide = () => {
  const { isAgentOpen, setIsAgentOpen, setAgentMode } = useAgent();
  const [stage, setStage] = useState('center_stage'); // 'center_stage' | 'morphing' | 'swooping' | 'spotlight' | 'dismissed'
  const [displayText, setDisplayText] = useState('Razorcart');
  const [isZoraText, setIsZoraText] = useState(false);
  const [beamPos, setBeamPos] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });

  useEffect(() => {
    if (isAgentOpen) {
      setStage('dismissed');
      return;
    }

    // Set initial positions
    const updateCoords = () => {
      setBeamPos({
        startX: window.innerWidth / 2,
        startY: window.innerHeight / 2 - 20,
        endX: window.innerWidth - 80,
        endY: window.innerHeight - 45
      });
    };
    updateCoords();
    window.addEventListener('resize', updateCoords);

    // ── Timeline:
    // 0.4s: Start letter scramble in center
    const t1 = setTimeout(() => {
      let iter = 0;
      const maxIter = 14;
      const interval = setInterval(() => {
        iter++;
        if (iter < maxIter) {
          const scrambled = Array(6)
            .fill(0)
            .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
            .join('');
          setDisplayText(scrambled);
        } else {
          clearInterval(interval);
          setDisplayText('ZORA');
          setIsZoraText(true);
        }
      }, 70);
    }, 400);

    // 2.6s: Dismiss full screen white backdrop and swoop down to bot icon
    const t2 = setTimeout(() => {
      setStage('swooping');
    }, 2600);

    // 4.2s: Land at the bot icon and open the spotlight callout
    const t3 = setTimeout(() => {
      setStage('spotlight');
    }, 4200);

    // 16s: Auto-dismiss callout if untouched
    const t4 = setTimeout(() => {
      setStage(s => s === 'spotlight' ? 'dismissed' : s);
    }, 16000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isAgentOpen]);

  if (stage === 'dismissed' || isAgentOpen) return null;

  // Bézier swoop trajectory from center screen to bottom right launcher
  const p0 = { x: beamPos.startX, y: beamPos.startY };
  const p1 = { x: window.innerWidth * 0.65, y: window.innerHeight * 0.55 };
  const p2 = { x: window.innerWidth * 0.85, y: window.innerHeight * 0.8 };
  const p3 = { x: beamPos.endX, y: beamPos.endY };
  const pathD = `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;

  return (
    <>
      {/* ── Phase 1: Full-Screen White Backdrop with Central Shuffle ── */}
      {(stage === 'center_stage' || stage === 'morphing') && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none transition-all duration-700 animate-fade-in">
          
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/50 via-blue-100/40 to-cyan-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Skip button */}
          <button
            onClick={() => setStage('spotlight')}
            className="absolute top-6 right-6 text-xs font-bold text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Skip Intro ✕
          </button>

          {/* Central Logo & Shuffle */}
          <div className="flex flex-col items-center justify-center gap-4 max-w-md">
            
            {/* Slash Icon Mark */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B72E7] to-[#0052CC] p-3 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                <path d="M32 20L10 95H34L48 50H78L88 20H32Z" fill="white" />
                <path d="M52 50L30 100H56L68 62H96L108 30H76L68 50H52Z" fill="#80BFFF" />
              </svg>
            </div>

            {/* Scrambling Text Title */}
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <h1 
                className={`text-5xl md:text-6xl font-black italic tracking-tight transition-all duration-300 ${
                  isZoraText
                    ? "bg-gradient-to-r from-[#00b386] via-[#0066cc] to-[#00d2ff] bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(0,179,134,0.35)] scale-110"
                    : "text-[#0b72e7]"
                }`}
              >
                {displayText}
              </h1>

              {isZoraText ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black tracking-widest text-[#00b386] bg-emerald-50 rounded-lg border border-emerald-300 animate-bounce shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#00b386]" />
                  COPILOT
                </span>
              ) : (
                <span className="text-2xl font-black text-[#0c2340]">
                  AI
                </span>
              )}
            </div>

            {/* Subtext description */}
            <p className="text-sm md:text-base font-semibold text-gray-600 mt-2 max-w-sm leading-relaxed transition-opacity duration-500">
              {isZoraText ? (
                <span className="text-[#0c2340] font-bold">
                  Meet <strong className="text-[#00b386] font-extrabold">ZORA</strong> — Experience the best of Razorcart in <span className="text-[#0066cc] font-extrabold">Agentic Mode</span>.
                </span>
              ) : (
                <span>Initializing Razorcart Multi-Agent Commerce Engine...</span>
              )}
            </p>

            {/* Animated Loading Dots */}
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00b386] animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066cc] animate-pulse delay-150" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] animate-pulse delay-300" />
            </div>

          </div>
        </div>
      )}

      {/* ── Phase 2: Starlight Energy Beam Directed to Bot Icon ── */}
      {stage === 'swooping' && (
        <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
          <svg className="w-full h-full absolute inset-0">
            <defs>
              <linearGradient id="introBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066cc" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#00b386" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="1" />
              </linearGradient>
              <filter id="introGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing Motion Path */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#introBeamGrad)"
              strokeWidth="3.5"
              strokeDasharray="8 8"
              className="opacity-60 animate-pulse"
            />

            {/* Glowing Leading Orb */}
            <circle r="9" fill="#00f0ff" filter="url(#introGlow)">
              <animateMotion
                path={pathD}
                dur="1.4s"
                fill="freeze"
                repeatCount="1"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>

            {/* Particle Trail */}
            <circle r="5" fill="#00b386" filter="url(#introGlow)">
              <animateMotion
                path={pathD}
                dur="1.4s"
                begin="0.1s"
                fill="freeze"
                repeatCount="1"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
          </svg>
        </div>
      )}

      {/* ── Phase 3: Spotlight Callout at the Chatbot Icon ── */}
      {stage === 'spotlight' && (
        <div className="fixed bottom-22 right-6 sm:right-8 z-45 max-w-sm w-[90vw] pointer-events-auto animate-fade-in">
          <div className="relative bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border-2 border-[#00b386] text-[#0c2340] overflow-hidden group">
            {/* Top glowing bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0066cc] via-[#00b386] to-[#00f0ff]" />

            {/* Dismiss button */}
            <button
              onClick={() => setStage('dismissed')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00b386] to-[#0066cc] text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>

              <div className="flex-1 pr-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#00b386] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Agentic Copilot
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">ZORA is ready</span>
                </div>

                <h4 className="text-sm font-extrabold text-[#0c2340] leading-snug">
                  Experience the best of Razorcart in Agentic Mode!
                </h4>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Search 10,000+ items, compare specs, negotiate pricing & 1-click checkout with ZORA.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => { setAgentMode('standard'); setIsAgentOpen(true); setStage('dismissed'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#00b386] hover:bg-[#009970] text-white text-xs font-black py-2 px-3 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>Launch ZORA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => { setAgentMode('voice'); setIsAgentOpen(true); setStage('dismissed'); }}
                    className="flex items-center justify-center gap-1 bg-[#f0f7ff] hover:bg-[#e0efff] text-[#0066cc] text-xs font-bold py-2 px-2.5 rounded-lg border border-blue-200 transition-all cursor-pointer"
                    title="Voice Shopping Mode"
                  >
                    <span>🎙️ Voice</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow down to the Launcher */}
            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white border-b-2 border-r-2 border-[#00b386] transform rotate-45" />
          </div>
        </div>
      )}
    </>
  );
};
