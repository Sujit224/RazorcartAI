import React, { useState, useEffect } from 'react';
import { ArrowRight, X, Bot, Mic } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

const GLYPHS = ['Z', 'O', 'R', 'A', 'X', '8', '3', 'C', 'A', 'R', 'T', 'N', 'E', 'T', 'I', 'O'];

export const ZoraIntroGuide = () => {
  const { isAgentOpen, setIsAgentOpen, setAgentMode } = useAgent();
  const [stage, setStage] = useState('idle'); // 'idle' -> 'center_stage' (at 3s) -> 'swooping' -> 'spotlight' -> 'dismissed'
  const [displayText, setDisplayText] = useState('Razorcart');
  const [isZoraText, setIsZoraText] = useState(false);
  const [beamPos, setBeamPos] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });

  useEffect(() => {
    if (isAgentOpen) {
      setStage('dismissed');
      return;
    }

    // Set initial coordinates
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
    // 1. Website opens normally for 3.0 seconds.
    // 2. At 3.0s: Clean translucent white backdrop appears.
    const t1 = setTimeout(() => {
      setStage('center_stage');
      
      // Start letter scramble into ZORA inside the backdrop
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
      }, 75);
    }, 3000);

    // 3. At 6.2s: Dissolve backdrop and swoop down to bot icon
    const t2 = setTimeout(() => {
      setStage('swooping');
    }, 6200);

    // 4. At 7.8s: Land at the bot icon and open the spotlight callout
    const t3 = setTimeout(() => {
      setStage('spotlight');
    }, 7800);

    // 5. At 20s: Auto-dismiss callout if untouched
    const t4 = setTimeout(() => {
      setStage(s => s === 'spotlight' ? 'dismissed' : s);
    }, 20000);

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
      {/* ── Phase 1: Clean Full-Screen White Backdrop with Central Shuffle ── */}
      {(stage === 'center_stage' || stage === 'morphing') && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none transition-all duration-700 animate-fade-in">
          
          {/* Skip button */}
          <button
            onClick={() => setStage('spotlight')}
            className="absolute top-6 right-6 text-xs font-semibold text-gray-500 hover:text-gray-900 px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Skip Intro ✕
          </button>

          {/* Central Logo & Shuffle */}
          <div className="flex flex-col items-center justify-center gap-4 max-w-md">
            
            {/* Professional Brand Slash Monogram */}
            <div className="w-16 h-16 rounded-xl bg-[#0066cc] p-3.5 shadow-lg flex items-center justify-center">
              <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
                <path d="M32 20L10 95H34L48 50H78L88 20H32Z" fill="white" />
                <path d="M52 50L30 100H56L68 62H96L108 30H76L68 50H52Z" fill="#99ccff" />
              </svg>
            </div>

            {/* Clean Monospace / Sans Shuffling Text */}
            <div className="flex items-baseline justify-center gap-2 mt-1">
              <h1 
                className={`text-5xl md:text-6xl font-extrabold italic tracking-tight transition-all duration-300 ${
                  isZoraText
                    ? "text-[#0066cc]"
                    : "text-[#0c2340]"
                }`}
              >
                {displayText}
              </h1>

              {isZoraText ? (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold tracking-wider text-[#0066cc] bg-blue-50 rounded border border-blue-200">
                  COPILOT
                </span>
              ) : (
                <span className="text-2xl font-extrabold text-[#0c2340]">
                  AI
                </span>
              )}
            </div>

            {/* Subtext description */}
            <p className="text-sm font-medium text-gray-600 mt-2 max-w-sm leading-relaxed">
              {isZoraText ? (
                <span>
                  Meet <strong className="text-[#0c2340] font-bold">ZORA</strong> — Experience Razorcart in <strong className="text-[#0066cc] font-bold">Agentic Mode</strong>.
                </span>
              ) : (
                <span>Initializing Razorcart Multi-Agent Commerce Engine...</span>
              )}
            </p>

            {/* Clean Loading Indicator */}
            <div className="flex items-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse delay-150" />
              <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse delay-300" />
            </div>

          </div>
        </div>
      )}

      {/* ── Phase 2: Clean Trajectory Beam to Bot Icon ── */}
      {stage === 'swooping' && (
        <div className="fixed inset-0 pointer-events-none z-45 overflow-hidden">
          <svg className="w-full h-full absolute inset-0">
            {/* Guide Trail */}
            <path
              d={pathD}
              fill="none"
              stroke="#0066cc"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="opacity-40 animate-pulse"
            />

            {/* Leading Orb */}
            <circle r="6" fill="#0066cc">
              <animateMotion
                path={pathD}
                dur="1.4s"
                fill="freeze"
                repeatCount="1"
                keyPoints="0;1"
                keyTimes="0;1"
              />
            </circle>
          </svg>
        </div>
      )}

      {/* ── Phase 3: Professional Spotlight Callout at the Chatbot Icon ── */}
      {stage === 'spotlight' && (
        <div className="fixed bottom-22 right-4 sm:right-8 z-50 max-w-[390px] w-[calc(100vw-32px)] pointer-events-auto animate-fade-in">
          <div className="relative bg-white p-5 rounded-xl shadow-xl border border-[#cbd5e1] text-[#0c2340]">

            {/* Dismiss button */}
            <button
              onClick={() => setStage('dismissed')}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss guide"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#0c2340] text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066cc] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Agentic Copilot
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">Ready</span>
                </div>

                <h4 className="text-[15px] font-bold text-[#0c2340] leading-snug">
                  Experience Razorcart in Agentic Mode
                </h4>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Search 10,000+ items, compare specs, negotiate discounts and checkout directly with ZORA.
                </p>

                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    onClick={() => { setAgentMode('standard'); setIsAgentOpen(true); setStage('dismissed'); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#0066cc] hover:bg-[#0052cc] text-white text-xs font-bold py-2.5 px-3.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Launch ZORA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => { setAgentMode('voice'); setIsAgentOpen(true); setStage('dismissed'); }}
                    className="flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-[#0c2340] text-xs font-bold py-2.5 px-3 rounded-lg border border-gray-300 transition-all active:scale-95 cursor-pointer"
                    title="Voice Shopping Mode"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>Voice</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Solid Pointer Arrow pointing down to the Ask ZORA launcher */}
            <div className="absolute -bottom-2 right-14 w-4 h-4 bg-white border-b border-r border-[#cbd5e1] transform rotate-45 z-20" />
          </div>
        </div>
      )}
    </>
  );
};
