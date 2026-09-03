import React from 'react';
import { Bot, Sparkles, ChevronRight, ArrowRight, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const HeroBanner = () => {
  const { setIsAgentOpen, sendMessage } = useAgent();

  return (
    <div className="mb-10 space-y-4 relative">
      
      {/* ── 1. Top Royal Blue Promotional Banner ── */}
      <div className="w-full bg-[#0066cc] rounded-2xl overflow-hidden text-white flex items-center justify-between shadow-sm relative border border-[#0052a3]">
        {/* Left Side: FLAT ₹400 OFF */}
        <div className="flex-1 py-5 md:py-6 px-6 md:px-12 flex items-center justify-center md:justify-start">
          <div className="space-y-0.5">
            <span className="text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-[#00b386] bg-white/10 px-2.5 py-0.5 rounded-md">
              ⚡ Instant Checkout Offer
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight uppercase">
              FLAT ₹400 INSTANT DISCOUNT
            </h2>
          </div>
        </div>

        {/* Perforation Divider */}
        <div className="relative h-full self-stretch hidden md:flex items-center justify-center px-1">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8fafc] rounded-full" />
          <div className="h-full border-r-2 border-dashed border-white/40 mx-auto" />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#f8fafc] rounded-full" />
        </div>

        {/* Right Side: On Your 1st Purchase */}
        <div className="py-5 md:py-6 px-6 md:px-12 text-center md:text-left flex flex-col justify-center">
          <p className="text-sm md:text-lg font-bold tracking-tight text-white/95">
            On Your 1<sup>st</sup> Purchase
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 justify-center md:justify-start">
            <span className="text-xs md:text-sm font-medium text-white/80">Secured via</span>
            <div className="bg-white/15 px-2.5 py-0.5 rounded-md flex items-center">
              <span className="text-xs md:text-sm font-extrabold tracking-tight text-white">Razorpay Test Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Hero Showcase Banner ── */}
      <div className="w-full relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#0c2340] via-[#182c4f] to-[#0066cc] min-h-[300px] md:min-h-[360px] flex flex-col justify-between p-6 md:p-12 text-white">
        
        {/* Floating Left Content */}
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#00b386]/20 border border-[#00b386] text-[#00b386] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Agent Commerce Engine</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Next-Generation AI Shopping & Instant Payments
          </h1>

          <p className="text-xs md:text-sm text-slate-300 font-medium max-w-md">
            Smart semantic discovery, autonomous bundling, and zero-dropoff payment recovery powered by Razorpay.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsAgentOpen(true);
                sendMessage("Find the best running shoes with 4.5+ rating in Bengaluru");
              }}
              className="px-5 py-2.5 bg-[#00b386] hover:bg-[#009973] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore With Copilot</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
              <ShieldCheck className="w-4 h-4 text-[#00b386]" />
              <span>Immutable Audit Ledger Active</span>
            </div>
          </div>
        </div>

        {/* Bottom Bank Strip */}
        <div className="relative z-10 w-full bg-white/95 backdrop-blur-md rounded-xl border border-white/20 px-4 md:px-6 py-2.5 mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0c2340]">
          <div className="flex items-center gap-4">
            <span className="font-black text-[#0066cc] tracking-wider">RAZORPAY TEST MODE</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-[#0c2340]">UPI • Cards • Netbanking</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-[#00b386]">Instant 504 Timeout Fallback</span>
          </div>
          <span className="text-[11px] text-[#5c6f84] font-semibold">100% Sandbox Safe</span>
        </div>
      </div>

      {/* ── 3. Sub-banner: Express Opening Hours ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Show flash opening hours deals and limited time discounts");
        }}
        className="w-full bg-[#f0f7ff] rounded-2xl border border-[#e2e8f0] py-3 px-5 shadow-sm cursor-pointer hover:border-[#0066cc]/40 transition-colors flex flex-col sm:flex-row items-center justify-between gap-2 text-center"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#0066cc]" />
          <h3 className="text-xs md:text-sm font-black text-[#0c2340] tracking-tight uppercase">
            OPENING HOURS • LIMITED TIME EXCLUSIVE OFFERS
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#0c2340]">
          <span className="bg-white px-2.5 py-0.5 rounded-md border border-[#e2e8f0] text-[#0066cc]">Only 2 Hrs Remaining</span>
          <span className="text-[#00b386] font-black">12 AM - 2 AM</span>
          <ChevronRight className="w-4 h-4 text-[#0066cc]" />
        </div>
      </div>

    </div>
  );
};
