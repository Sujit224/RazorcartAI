import React from 'react';
import { Bot, Sparkles, ChevronRight, ArrowRight, Clock } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

export const HeroBanner = () => {
  const { setIsAgentOpen, sendMessage } = useAgent();

  return (
    <div className="mb-10 space-y-3.5 relative select-none">
      
      {/* ── 1. Top Orange Ticket Voucher Banner ("FLAT ₹300 OFF") ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Apply FLAT ₹300 OFF coupon discount to my order");
        }}
        className="w-full bg-[#f26a10] rounded-xl overflow-hidden text-white flex items-center justify-between shadow-sm relative border border-[#e05e07] cursor-pointer hover:opacity-95 transition-opacity"
      >
        {/* Left Side: FLAT ₹300 OFF */}
        <div className="flex-1 py-4 md:py-6 px-6 md:px-14 flex items-center justify-center md:justify-start">
          <h2 className="text-2xl md:text-5xl font-black tracking-tight uppercase drop-shadow-sm font-sans">
            FLAT ₹300 OFF
          </h2>
        </div>

        {/* Authentic Ticket Perforation Divider */}
        <div className="relative h-full self-stretch flex items-center justify-center px-1">
          {/* Top Notch Cutout */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full border-b border-[#e05e07]" />
          {/* Dotted Perforation Line */}
          <div className="h-full border-r-2 border-dashed border-white/70 mx-auto" />
          {/* Bottom Notch Cutout */}
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full border-t border-[#e05e07]" />
        </div>

        {/* Right Side: On Your 1st Purchase Via App */}
        <div className="py-4 md:py-6 px-6 md:px-14 text-center md:text-left flex flex-col justify-center">
          <p className="text-sm md:text-xl font-bold tracking-tight text-white">
            On Your 1<sup>st</sup> Purchase
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 justify-center md:justify-start">
            <span className="text-xs md:text-base font-semibold text-white/90">Via</span>
            <div className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-white/20">
              <span className="text-xs md:text-sm font-black italic tracking-tight text-white">Razorcart App!</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Full-Bleed Hero Showcase Banner ("BIG BRANDS BASH") ── */}
      <div className="w-full relative rounded-2xl overflow-hidden shadow-lg aspect-[16/6] min-h-[340px] md:min-h-[420px] flex flex-col justify-between border border-[#e2e8f0]">
        
        {/* Authentic Background Fashion Photo */}
        <img
          src="/myntra_hero_banner.jpg"
          alt="Big Brands Bash Fashion Festival"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Top & Middle Floating Badges */}
        <div className="relative z-10 p-5 md:p-10 flex items-start justify-between">
          
          {/* 3D Big Brands Bash Badge */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 md:p-5 rounded-2xl shadow-2xl border border-white/40 max-w-[180px] md:max-w-[220px]">
            <div className="text-center space-y-1">
              <span className="block text-[10px] md:text-xs font-black text-amber-600 tracking-wider uppercase">
                ⭐ SPECIAL EVENT ⭐
              </span>
              <div className="text-xl md:text-3xl font-black tracking-tight text-[#ff3f6c] leading-none uppercase drop-shadow-sm">
                BIG BRANDS
              </div>
              <div className="text-2xl md:text-4xl font-black tracking-tighter text-[#f26a10] leading-none uppercase drop-shadow-sm">
                BASH
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 bg-[#ff3f6c] text-white text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>LIVE NOW</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Floating Discount Typography */}
          <div className="text-right max-w-xs md:max-w-md space-y-1">
            <div className="text-4xl md:text-8xl font-black text-yellow-300 tracking-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] leading-none">
              50-80<span className="text-2xl md:text-5xl align-super font-black">%</span>
            </div>
            <div className="text-sm md:text-xl font-black text-yellow-200 uppercase tracking-widest drop-shadow-md">
              OFF
            </div>
            <p className="text-base md:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-tight">
              Irresistible Brands,<br />Best Prices
            </p>
          </div>

        </div>

        {/* Floating Him / Her Navigation Pills */}
        <div className="relative z-10 px-5 md:px-10 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsAgentOpen(true);
                sendMessage("Show top trending men's fashion and shoes");
              }}
              className="px-4 py-1.5 bg-white/95 hover:bg-white text-[#0c2340] hover:text-[#0066cc] font-extrabold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            >
              <span>Him</span>
              <span className="w-4 h-4 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[10px]">❯</span>
            </button>

            <button
              onClick={() => {
                setIsAgentOpen(true);
                sendMessage("Show top trending women's fashion and dresses");
              }}
              className="px-4 py-1.5 bg-white/95 hover:bg-white text-[#0c2340] hover:text-[#0066cc] font-extrabold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            >
              <span>Her</span>
              <span className="w-4 h-4 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[10px]">❯</span>
            </button>
          </div>
        </div>

        {/* Bottom Bank Sponsor Strip */}
        <div className="relative z-10 w-full bg-white border-t border-[#e2e8f0] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 md:gap-5">
            <span className="font-black text-red-600 tracking-wider text-xs md:text-sm">HSBC</span>
            <span className="text-slate-300">|</span>
            <span className="font-extrabold text-blue-900 tracking-tight text-xs md:text-sm">RBL BANK</span>
            <span className="text-slate-300">|</span>
            <span className="font-bold text-[#0c2340] text-xs md:text-sm">Get 10% Instant Discount*</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">T&C Apply*</span>
        </div>

        {/* Right Floating Vertical Ribbon Tab: "UPTO ₹300 OFF" */}
        <div 
          onClick={() => {
            setIsAgentOpen(true);
            sendMessage("Apply best available promo codes and extra ₹300 discount");
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#0c2340] hover:bg-[#0066cc] text-white py-4 px-2 rounded-l-xl shadow-2xl cursor-pointer transition-all transform hover:-translate-x-1 flex flex-col items-center gap-2 border-l border-y border-white/20"
          title="Click to apply extra discount coupon"
        >
          <span className="text-[10px] font-black tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
            UPTO ₹300 OFF
          </span>
          <span className="text-xs">◀</span>
        </div>

      </div>

      {/* ── 3. Bottom "WOW DEALS" Showcase Strip ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Show WOW DEALS with highest discounts and 4.5+ star customer ratings");
        }}
        className="w-full bg-[#fffbeb] rounded-2xl border border-[#fef08a] py-3.5 px-6 shadow-sm cursor-pointer hover:border-amber-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-2xl font-black text-[#f26a10] tracking-tight uppercase drop-shadow-xs font-sans">
            WOW DEALS
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-[#0c2340]">
          <span>Big Brands, Even Bigger Savings</span>
          <div className="w-5 h-5 rounded-full bg-[#0c2340] text-white flex items-center justify-center text-[10px] ml-1">
            ❯
          </div>
        </div>
      </div>

    </div>
  );
};
