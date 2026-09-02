import React from 'react';
import { Bot, Sparkles, ChevronRight, ArrowRight, Clock } from 'lucide-react';
import { useAgent } from '../context/AgentContext';
import { RazorcartLogo } from './Navbar';

export const HeroBanner = () => {
  const { setIsAgentOpen, sendMessage } = useAgent();

  return (
    <div className="mb-10 space-y-4 relative">
      
      {/* ── 1. Top Orange Coupon Banner ("FLAT ₹400 OFF") ── */}
      <div className="w-full bg-[#f26a10] rounded-sm overflow-hidden text-white flex items-center justify-between shadow-sm relative border border-[#e05e07]">
        {/* Left Side: FLAT ₹400 OFF */}
        <div className="flex-1 py-4 md:py-6 px-6 md:px-12 flex items-center justify-center md:justify-start">
          <h2 className="text-2xl md:text-5xl font-black tracking-tight uppercase drop-shadow-sm">
            FLAT ₹400 OFF
          </h2>
        </div>

        {/* Authentic Ticket Perforation Divider */}
        <div className="relative h-full self-stretch flex items-center justify-center px-1">
          {/* Top Notch */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full" />
          {/* Dotted Line */}
          <div className="h-full border-r-2 border-dashed border-white/60 mx-auto" />
          {/* Bottom Notch */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full" />
        </div>

        {/* Right Side: On Your 1st Purchase Via App */}
        <div className="py-4 md:py-6 px-6 md:px-12 text-center md:text-left flex flex-col justify-center">
          <p className="text-sm md:text-xl font-bold tracking-tight text-white/95">
            On Your 1<sup>st</sup> Purchase
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 justify-center md:justify-start">
            <span className="text-xs md:text-base font-semibold text-white/90">Via</span>
            <div className="bg-white/10 px-2.5 py-0.5 rounded flex items-center">
              <span className="text-xs md:text-sm font-black italic tracking-tight text-white">Razorcart App!</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Main Hero Banner ("BIG BRANDS BASH - 50-80% OFF") ── */}
      <div className="w-full relative rounded-sm overflow-hidden shadow-md bg-sky-200 aspect-[16/6.5] min-h-[320px] md:min-h-[400px] flex flex-col justify-between">
        
        {/* Background Fashion Photo */}
        <img
          src="/myntra_hero_banner.jpg"
          alt="Myntra Big Brands Bash"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Floating Left Badge: BIG BRANDS BASH */}
        <div className="relative z-10 p-4 md:p-8 flex items-start">
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-200">
            <div className="text-center">
              <span className="block text-xs md:text-sm font-black text-amber-500 tracking-wider uppercase">
                ⭐ SPECIAL EVENT ⭐
              </span>
              <div className="text-xl md:text-3xl font-black tracking-tight text-[#ff3f6c] leading-none uppercase">
                BIG BRANDS
              </div>
              <div className="text-2xl md:text-4xl font-black tracking-tighter text-[#f26a10] leading-none uppercase -mt-0.5">
                BASH
              </div>
              <div className="mt-2 inline-flex items-center gap-1 bg-[#ff3f6c] text-white text-[10px] md:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>• LIVE NOW</span>
              </div>
            </div>
          </div>
        </div>



        {/* Right Floating Typography: 50-80% OFF */}
        <div className="absolute right-4 md:right-12 top-6 md:top-12 z-10 text-right max-w-xs md:max-w-sm">
          <div className="text-4xl md:text-7xl font-black text-yellow-300 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] leading-none">
            50-80<span className="text-2xl md:text-4xl align-super font-extrabold">%</span>
          </div>
          <div className="text-xs md:text-sm font-black text-yellow-200 uppercase tracking-widest -mt-1 drop-shadow">
            OFF
          </div>
          <p className="text-sm md:text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow">
            Irresistible Brands,<br />Best Prices
          </p>
        </div>

        {/* Bottom Bank Sponsor Strip */}
        <div className="relative z-10 w-full bg-white border-t border-gray-200 px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-red-600 tracking-wider">HSBC</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-blue-900 tracking-tight">RBL BANK</span>
            <span className="text-gray-300">|</span>
            <span className="font-bold text-[#282c3f]">Get 10% Instant Discount*</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">T&C Apply*</span>
        </div>

        {/* Right Floating Vertical Ribbon: UPTO ₹300 OFF */}
        <div 
          onClick={() => {
            setIsAgentOpen(true);
            sendMessage("Apply best available coupons including ₹300 OFF discount");
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#282c3f] hover:bg-[#ff3f6c] text-white py-3 px-1.5 rounded-l-md shadow-2xl cursor-pointer transition-all transform hover:-translate-x-1 flex flex-col items-center gap-2"
          title="Click to apply extra discount coupon"
        >
          <span className="text-[9px] font-black tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
            UPTO ₹300 OFF
          </span>
          <span className="text-xs">◀</span>
        </div>

      </div>

      {/* ── 3. Sub-banner ("OPENING HOURS | Only 2 Hrs | 12 AM - 2 AM") ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Show flash opening hours deals and limited time discounts");
        }}
        className="w-full bg-sky-50 rounded-sm border border-sky-200 py-3 px-4 shadow-sm cursor-pointer hover:border-sky-300 transition-colors flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-600 animate-pulse" />
          <h3 className="text-lg md:text-xl font-black text-sky-700 tracking-tight uppercase drop-shadow-sm font-sans">
            OPENING HOURS
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-extrabold text-[#282c3f]">
          <span>Only 2 Hrs</span>
          <span className="text-gray-300">|</span>
          <span className="text-[#ff3f6c]">12 AM - 2 AM</span>
          <div className="w-5 h-5 rounded-full bg-[#282c3f] text-white flex items-center justify-center text-xs ml-1">
            ❯
          </div>
        </div>
      </div>

    </div>
  );
};
