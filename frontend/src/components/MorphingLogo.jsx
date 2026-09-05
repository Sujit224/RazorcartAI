import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const GLYPHS = ['Z', 'O', 'R', 'A', 'X', '8', '3', 'C', 'A', 'R', 'T', 'N', 'E', 'T'];

export const MorphingLogo = ({ onMorphTrigger }) => {
  const [displayText, setDisplayText] = useState('Razorcart');
  const [isZora, setIsZora] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    // Start morph sequence in sync with the 3s intro overlay
    const startTimer = setTimeout(() => {
      triggerMorph();
    }, 3000);

    return () => clearTimeout(startTimer);
  }, []);

  const triggerMorph = () => {
    if (isShuffling) return;
    setIsShuffling(true);

    if (onMorphTrigger) onMorphTrigger();

    // Step 1: Scramble letters
    let iterations = 0;
    const maxIterations = 14;

    const interval = setInterval(() => {
      iterations++;
      
      if (iterations < maxIterations) {
        const scrambled = Array(6)
          .fill(0)
          .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
          .join('');
        setDisplayText(scrambled);
      } else {
        clearInterval(interval);
        setDisplayText('ZORA');
        setIsZora(true);
        setIsShuffling(false);

        // Keep 'ZORA' displayed for 3.8s before smoothly transitioning back to 'Razorcart'
        setTimeout(() => {
          revertToRazorcart();
        }, 3800);
      }
    }, 70);
  };

  const revertToRazorcart = () => {
    setIsShuffling(true);
    let iterations = 0;
    const maxIterations = 10;

    const interval = setInterval(() => {
      iterations++;
      if (iterations < maxIterations) {
        const scrambled = Array(7)
          .fill(0)
          .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
          .join('');
        setDisplayText(scrambled);
      } else {
        clearInterval(interval);
        setDisplayText('Razorcart');
        setIsZora(false);
        setIsShuffling(false);
      }
    }, 60);
  };

  return (
    <div 
      className="flex items-baseline font-sans relative cursor-pointer group"
      onClick={triggerMorph}
      title="Click to replay ZORA animation"
    >
      {/* Dynamic Brand / ZORA Text */}
      <span 
        className={`font-black text-[22px] tracking-tight italic transition-all duration-300 select-none ${
          isZora 
            ? "text-[#0066cc]" 
            : "text-[#0b72e7] group-hover:text-[#0052cc]"
        }`}
      >
        {displayText}
      </span>

      {/* Suffix / Badge */}
      {isZora ? (
        <span className="inline-flex items-center ml-1.5 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-[#0066cc] bg-blue-50 rounded border border-blue-200">
          COPILOT
        </span>
      ) : (
        <span className="font-extrabold text-base text-[#0c2340] ml-1 tracking-tight">
          AI
        </span>
      )}
    </div>
  );
};
