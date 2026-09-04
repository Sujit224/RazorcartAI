import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ChevronRight, ChevronLeft, Pause, Play } from 'lucide-react';
import { useAgent } from '../context/AgentContext';

const BANNER_SLIDES = [
  {
    id: 'fashion-big-brands',
    image: '/blue_hero_banner.jpg',
    tag: '⭐ SPECIAL EVENT ⭐',
    tagColor: 'text-[#00b386]',
    brandTitle1: 'BIG BRANDS',
    brandTitle2: 'BASH',
    brandColor: 'text-[#0047fb]',
    brandColor2: 'text-[#0038c7]',
    statusBadge: 'LIVE NOW',
    statusBadgeBg: 'bg-[#00b386]',
    discountNumber: '50-80',
    discountUnit: '%',
    discountSubtitle: 'OFF',
    discountAccentColor: 'text-sky-200',
    headline: 'Irresistible Brands,',
    subHeadline: 'Best Prices',
    bankOffers: [
      { name: 'HSBC', color: 'text-red-600' },
      { name: 'RBL BANK', color: 'text-blue-900' },
      { name: 'Get 10% Instant Discount*', color: 'text-[#0c2340]' }
    ],
    agentPrompt: 'Show Big Brands Bash deals with 50-80% discount across top luxury & fashion brands'
  },
  {
    id: 'electronics-tech-fest',
    image: '/banner_tech_blue.jpg',
    tag: '⚡ TECH REVOLUTION ⚡',
    tagColor: 'text-sky-400',
    brandTitle1: 'MEGA TECH',
    brandTitle2: 'FEST',
    brandColor: 'text-[#0047fb]',
    brandColor2: 'text-blue-700',
    statusBadge: 'NEW LAUNCHES',
    statusBadgeBg: 'bg-gradient-to-r from-sky-500 to-blue-600',
    discountNumber: 'UP TO 65',
    discountUnit: '%',
    discountSubtitle: 'OFF',
    discountAccentColor: 'text-cyan-200',
    headline: 'Next-Gen Gadgets,',
    subHeadline: 'Smart Laptops & Audio',
    bankOffers: [
      { name: 'HDFC BANK', color: 'text-blue-700' },
      { name: 'ICICI BANK', color: 'text-orange-600' },
      { name: 'Flat ₹3,000 Cashback on Electronics*', color: 'text-[#0c2340]' }
    ],
    agentPrompt: 'Show top electronics, flagship smartphones, laptops and headphones on sale'
  },
  {
    id: 'sports-fitness-expo',
    image: '/banner_sports_blue.jpg',
    tag: '🏃 PRO ATHLETICS 🏃',
    tagColor: 'text-emerald-400',
    brandTitle1: 'VELOCITY',
    brandTitle2: 'SPORTS',
    brandColor: 'text-[#0047fb]',
    brandColor2: 'text-blue-800',
    statusBadge: 'TOP RATED',
    statusBadgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    discountNumber: 'FLAT 50',
    discountUnit: '%',
    discountSubtitle: 'OFF',
    discountAccentColor: 'text-emerald-200',
    headline: 'Aerodynamic Bikes,',
    subHeadline: 'Running Shoes & Gym Gear',
    bankOffers: [
      { name: 'AXIS BANK', color: 'text-rose-900' },
      { name: 'SBI CARD', color: 'text-blue-800' },
      { name: 'Zero Cost EMI + 10% Off*', color: 'text-[#0c2340]' }
    ],
    agentPrompt: 'Show sports gear, running shoes, cycling equipment and fitness accessories'
  }
];

export const HeroBanner = () => {
  const { setIsAgentOpen, sendMessage } = useAgent();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const SLIDE_DURATION = 4500; // 4.5 seconds per slide

  // Automatic slide rotation
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [isPaused, currentSlideIndex]);

  const handlePrevSlide = (e) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  };

  const handleNextSlide = (e) => {
    e?.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length);
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
    setTouchStartX(null);
  };

  const currentSlide = BANNER_SLIDES[currentSlideIndex];

  const handleSlideClick = (slide) => {
    setIsAgentOpen(true);
    sendMessage(slide.agentPrompt);
  };

  return (
    <div className="mb-10 space-y-3.5 relative select-none">
      
      {/* ── 1. Top Blue Ticket Voucher Banner ("FLAT ₹300 OFF") ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Apply FLAT ₹300 OFF coupon discount to my order");
        }}
        className="w-full bg-[#0047fb] rounded-xl overflow-hidden text-white flex items-center justify-between shadow-sm relative border border-[#0038c7] cursor-pointer hover:opacity-95 transition-opacity"
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
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full border-b border-[#0038c7]" />
          {/* Dotted Perforation Line */}
          <div className="h-full border-r-2 border-dashed border-white/70 mx-auto" />
          {/* Bottom Notch Cutout */}
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-white rounded-full border-t border-[#0038c7]" />
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

      {/* ── 2. Main Full-Bleed 3-Slide Automatic Carousel Banner (Blue Theme) ── */}
      <div 
        className="w-full relative rounded-2xl overflow-hidden shadow-xl aspect-[16/6] min-h-[360px] md:min-h-[440px] flex flex-col justify-between border border-[#e2e8f0] group cursor-pointer transition-all duration-300"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => handleSlideClick(currentSlide)}
      >
        
        {/* Carousel Background Images with smooth Crossfade Transition */}
        {BANNER_SLIDES.map((slide, index) => {
          const isActive = index === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-0 scale-100' : 'opacity-0 -z-10 scale-105 pointer-events-none'
              } transform transition-transform duration-1000`}
            >
              <img
                src={slide.image}
                alt={slide.headline}
                className="w-full h-full object-cover object-center"
              />
              {/* Subtle contrast gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/35 pointer-events-none" />
            </div>
          );
        })}

        {/* Top & Middle Floating Badges */}
        <div className="relative z-10 p-4 md:p-9 flex items-start justify-between">
          
          {/* 3D Special Event Floating Badge */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 md:p-5 rounded-2xl shadow-2xl border border-white/60 max-w-[180px] md:max-w-[240px] transform hover:scale-105 transition-transform duration-300">
            <div className="text-center space-y-1">
              <span className={`block text-[10px] md:text-xs font-black ${currentSlide.tagColor} tracking-wider uppercase drop-shadow-xs`}>
                {currentSlide.tag}
              </span>
              <div className={`text-xl md:text-3xl font-black tracking-tight ${currentSlide.brandColor} leading-none uppercase drop-shadow-xs`}>
                {currentSlide.brandTitle1}
              </div>
              <div className={`text-2xl md:text-4xl font-black tracking-tighter ${currentSlide.brandColor2} leading-none uppercase drop-shadow-xs`}>
                {currentSlide.brandTitle2}
              </div>
              <div className="pt-1.5 flex items-center justify-center">
                <span className={`inline-flex items-center gap-1.5 ${currentSlide.statusBadgeBg} text-white text-[10px] md:text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md`}>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>{currentSlide.statusBadge}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Floating Discount Typography */}
          <div className="text-right max-w-xs md:max-w-md space-y-1">
            <div className="text-4xl md:text-8xl font-black text-white tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.85)] leading-none font-sans">
              {currentSlide.discountNumber}<span className="text-2xl md:text-5xl align-super font-black">{currentSlide.discountUnit}</span>
            </div>
            <div className={`text-xs md:text-lg font-black ${currentSlide.discountAccentColor} uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
              {currentSlide.discountSubtitle}
            </div>
            <p className="text-sm md:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-tight">
              {currentSlide.headline}<br />
              <span className="text-sky-100">{currentSlide.subHeadline}</span>
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] md:text-xs font-bold shadow-lg hover:bg-white/30 transition-colors">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Tap to Explore with AI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>

        {/* Carousel Navigation Arrow Controls */}
        <button
          onClick={handlePrevSlide}
          aria-label="Previous slide"
          className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <button
          onClick={handleNextSlide}
          aria-label="Next slide"
          className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Bottom Carousel Indicators & Play/Pause Controller */}
        <div className="relative z-10 w-full flex flex-col">
          
          {/* Slide Indicator Dots & Pause Status */}
          <div className="flex items-center justify-between px-5 md:px-10 pb-2">
            
            {/* Dots */}
            <div className="flex items-center gap-2">
              {BANNER_SLIDES.map((slide, index) => {
                const isActive = index === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlideIndex(index);
                    }}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'w-8 bg-white shadow-lg shadow-white/50' 
                        : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                );
              })}
            </div>

            {/* Slide Counter & Pause/Play Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                0{currentSlideIndex + 1} / 0{BANNER_SLIDES.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-colors"
                title={isPaused ? "Resume Auto-Play" : "Pause Auto-Play"}
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
              </button>
            </div>

          </div>

          {/* Bottom Bank Sponsor Strip */}
          <div className="w-full bg-white border-t border-[#e2e8f0] px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 md:gap-5 flex-wrap">
              {currentSlide.bankOffers.map((offer, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">|</span>}
                  <span className={`font-black text-xs md:text-sm ${offer.color}`}>
                    {offer.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">T&C Apply*</span>
          </div>

        </div>

      </div>

      {/* ── 3. Bottom "WOW DEALS" Showcase Strip ── */}
      <div 
        onClick={() => {
          setIsAgentOpen(true);
          sendMessage("Show WOW DEALS with highest discounts and 4.5+ star customer ratings");
        }}
        className="w-full bg-[#eff6ff] rounded-2xl border border-[#bfdbfe] py-3.5 px-6 shadow-sm cursor-pointer hover:border-[#60a5fa] hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg md:text-2xl font-black text-[#0047fb] tracking-tight uppercase drop-shadow-xs font-sans">
            WOW DEALS
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-[#0c2340]">
          <span>Big Brands, Even Bigger Savings</span>
          <div className="w-5 h-5 rounded-full bg-[#00b386] text-white flex items-center justify-center text-[10px] ml-1">
            ❯
          </div>
        </div>
      </div>

    </div>
  );
};
