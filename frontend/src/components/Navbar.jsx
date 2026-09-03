import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, User as UserIcon, Heart, ShoppingBag, Bot, MapPin, Sparkles,
  LogOut, LogIn, ArrowRight, Headphones, ChevronDown, Check, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';

export const RazorpayLogo = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Razorpay Brand Monogram Slash Mark */}
    <path
      d="M32 20L10 95H34L48 50H78L88 20H32Z"
      fill="#0B72E7"
    />
    <path
      d="M52 50L30 100H56L68 62H96L108 30H76L68 50H52Z"
      fill="#0052CC"
    />
  </svg>
);

export const RazorcartLogo = RazorpayLogo;

export const Navbar = ({ onSearch, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, onOpenSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, switchPersona, updateUserCity, logout } = useAuth();
  const { cart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);

  const cities = [
    { name: "Bengaluru", state: "Karnataka" },
    { name: "Mumbai", state: "Maharashtra" },
    { name: "Delhi", state: "NCR" },
    { name: "Hyderabad", state: "Telangana" },
    { name: "Chennai", state: "Tamil Nadu" },
  ];

  // Original E-Commerce Bar Headings & Titles with Razorpay-style interactive dropdowns
  const navCategories = [
    {
      label: "MEN",
      cat: "MEN",
      dropdown: {
        title: "MEN'S COLLECTION",
        subcategories: [
          { name: "Running & Sports Shoes", query: "Show top rated men's running shoes" },
          { name: "Casual Sneakers & Loafers", query: "Show men's white sneakers" },
          { name: "T-Shirts & Polos", query: "Show men's cotton t-shirts" },
          { name: "Jackets & Activewear", query: "Show men's jackets and activewear" },
        ]
      }
    },
    {
      label: "WOMEN",
      cat: "WOMEN",
      dropdown: {
        title: "WOMEN'S COLLECTION",
        subcategories: [
          { name: "Dresses & Western Wear", query: "Show women's western dresses" },
          { name: "Ethnic Wear & Kurtas", query: "Show women's ethnic kurtas" },
          { name: "Footwear & Heels", query: "Show women's footwear and sandals" },
          { name: "Handbags & Accessories", query: "Show women's designer handbags" },
        ]
      }
    },
    {
      label: "ELECTRONICS",
      cat: "ELECTRONICS",
      dropdown: {
        title: "ELECTRONICS & AUDIO",
        subcategories: [
          { name: "Wireless Earbuds & Headphones", query: "Show noise cancelling wireless headphones" },
          { name: "Smartwatches & Fitness Bands", query: "Show smartwatches with health tracking" },
          { name: "Smart Speakers & Tech", query: "Show smart speakers and home audio" },
        ]
      }
    },
    {
      label: "APPLIANCES",
      cat: "APPLIANCES",
      dropdown: {
        title: "HOME APPLIANCES",
        subcategories: [
          { name: "Kitchen Appliances", query: "Show smart kitchen appliances and air fryers" },
          { name: "Personal Grooming", query: "Show trimmers and hair stylers" },
        ]
      }
    },
    {
      label: "HOME",
      cat: "HOME & KITCHEN",
      dropdown: {
        title: "HOME & LIVING",
        subcategories: [
          { name: "Home Decor & Lighting", query: "Show modern home decor and lamps" },
          { name: "Cookware & Dining", query: "Show nonstick cookware and dinnerware" },
        ]
      }
    },
    {
      label: "BEAUTY",
      cat: "BEAUTY & PERSONAL CARE",
      dropdown: {
        title: "BEAUTY & PERSONAL CARE",
        subcategories: [
          { name: "Skincare Essentials", query: "Show top rated skincare and serums" },
          { name: "Fragrances & Perfumes", query: "Show luxury perfumes and mists" },
        ]
      }
    },
    {
      label: "STUDIO",
      cat: "ALL",
      isNew: true,
      dropdown: {
        title: "AGENTIC COMMERCE STUDIO",
        subcategories: [
          { name: "AI Semantic Search", query: "Explore semantic recommendation feed" },
          { name: "Frequently Bought Together", query: "Show frequently bought together bundle pairings" },
          { name: "Zero-Dropoff Payment Recovery", query: "Explain 504 gateway recovery workflow" },
        ]
      }
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setActiveDropdown(null);
  };

  const handleSubcategoryClick = (sub) => {
    if (sub.query) {
      setIsAgentOpen(true);
      sendMessage(sub.query);
    }
    setActiveDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-18 flex items-center justify-between gap-4">
        
        {/* ── Left: Razorcart AI Brand Logo & Category Headings ── */}
        <div className="flex items-center gap-6 lg:gap-8">
          
          {/* Razorcart AI Brand Logo with Razorpay Slash Monogram */}
          <div 
            onClick={() => { setSelectedCategory("ALL"); onSearch(""); navigate('/'); }}
            className="flex items-center gap-2 cursor-pointer group select-none py-1 shrink-0"
            title="Razorcart AI"
          >
            <RazorpayLogo className="w-7 h-7" />
            <div className="flex items-baseline font-sans">
              <span className="font-extrabold text-[22px] tracking-tight text-[#0b72e7] italic group-hover:text-[#0052cc] transition-colors">
                Razorcart
              </span>
              <span className="font-extrabold text-base text-[#0c2340] ml-1 tracking-tight">
                AI
              </span>
            </div>
          </div>

          {/* Navigation Category Tabs (Original Headings) with Razorpay Blue Underline & Dropdowns */}
          <nav className="hidden lg:flex items-center gap-6 relative">
            {navCategories.map((item) => {
              const isSelected = selectedCategory === item.cat || (item.label === "STUDIO" && selectedCategory === "ALL");
              const isOpen = activeDropdown === item.label;

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    onClick={() => handleCategorySelect(item.cat)}
                    className={`text-[13px] font-bold tracking-tight uppercase transition-all relative py-6 flex items-center gap-1 cursor-pointer select-none ${
                      isSelected
                        ? "text-[#0b72e7]" 
                        : "text-[#0c2340] hover:text-[#0b72e7]"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.isNew && (
                      <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 ml-0.5">
                        NEW
                      </span>
                    )}

                    {/* Active State Rounded Blue Underline Bar (Razorpay style) */}
                    {isSelected && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0b72e7] rounded-full" />
                    )}
                  </button>

                  {/* Razorpay-style Hover Dropdown */}
                  {isOpen && item.dropdown && (
                    <div className="absolute left-0 top-full -mt-1 w-64 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl p-3.5 z-50 animate-fade-in text-left">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                        {item.dropdown.title}
                      </p>
                      <div className="space-y-1 mt-1">
                        {item.dropdown.subcategories.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => handleSubcategoryClick(sub)}
                            className="p-2 rounded-xl hover:bg-[#f0f7ff] cursor-pointer transition-colors group flex items-center justify-between"
                          >
                            <span className="text-xs font-bold text-[#0c2340] group-hover:text-[#0b72e7] transition-colors">
                              {sub.name}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#0b72e7] transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </div>

        {/* ── Right Actions: Search Bar, Support, Country Flag, Login & Sign Up CTA ── */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Quick Search Input */}
          <div className="hidden sm:block relative w-44 md:w-56">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs text-[#0c2340] placeholder-slate-400 focus:bg-white focus:border-[#0b72e7] focus:outline-none transition-all font-medium"
              />
            </form>
          </div>

          {/* Support / Helpdesk Icon */}
          <button
            onClick={() => {
              setIsAgentOpen(true);
              sendMessage("I need customer support and assistant help");
            }}
            className="p-2 text-[#0c2340] hover:text-[#0b72e7] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Customer Support & FAQ"
            aria-label="Support"
          >
            <Headphones className="w-5 h-5" />
          </button>

          {/* Country / City Selector Flag (🇮🇳 ⌵) */}
          <div className="relative">
            <button
              onClick={() => setShowCityMenu(!showCityMenu)}
              className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 rounded-lg text-xs font-bold text-[#0c2340] transition-colors cursor-pointer"
              title="Select Operating City"
            >
              <span className="text-base leading-none">🇮🇳</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showCityMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl p-2 z-50 animate-fade-in text-left">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Select Operating Hub
                </p>
                {cities.map((ct) => (
                  <button
                    key={ct.name}
                    onClick={() => {
                      updateUserCity(ct.name);
                      setShowCityMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      currentUser?.city === ct.name
                        ? "bg-[#f0f7ff] text-[#0b72e7] font-bold"
                        : "hover:bg-slate-50 text-[#0c2340]"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{ct.name}</div>
                      <div className="text-[10px] text-slate-500">{ct.state}</div>
                    </div>
                    {currentUser?.city === ct.name && (
                      <Check className="w-3.5 h-3.5 text-[#0b72e7]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shopping Bag Icon with Active Counter */}
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center justify-center p-2 text-[#0c2340] hover:text-[#0b72e7] hover:bg-slate-100 rounded-lg relative transition-colors cursor-pointer"
            title="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.item_count > 0 && (
              <span className="absolute top-1 right-1 bg-[#0b72e7] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cart.item_count}
              </span>
            )}
          </button>

          {/* ── Profile or Razorpay-style Login & Sign Up CTA Buttons ── */}
          {currentUser ? (
            <div
              className="relative"
              onMouseEnter={() => setShowProfileMenu(true)}
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e8f0] hover:border-[#0b72e7] bg-white text-xs font-bold text-[#0c2340] transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#0b72e7] text-white flex items-center justify-center text-[10px] font-black">
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline">{currentUser.name?.split(' ')[0]}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-left">
                  <div className="border-b border-[#e2e8f0] pb-2.5 mb-2.5">
                    <p className="text-xs font-bold text-[#0c2340]">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                    <p className="text-[11px] text-[#00b386] font-bold mt-0.5">📍 Hub: {currentUser.city}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/merchant/dashboard'); }}
                      className="p-2 rounded-xl bg-[#f0f7ff] text-[#0b72e7] hover:bg-blue-100 text-left transition-colors cursor-pointer text-xs font-bold"
                    >
                      🏪 Merchant
                    </button>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/admin/dashboard'); }}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-left transition-colors cursor-pointer text-xs font-bold"
                    >
                      🛡️ Admin
                    </button>
                  </div>

                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); navigate('/'); }}
                    className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Clean White Login Button with Blue Border */}
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-lg border border-[#0b72e7] text-[#0b72e7] hover:bg-blue-50 font-bold text-xs md:text-[13px] transition-all cursor-pointer"
              >
                Login
              </button>

              {/* Solid Royal Blue Sign Up CTA Button with Arrow */}
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 rounded-lg bg-[#0b72e7] hover:bg-[#0052cc] text-white font-bold text-xs md:text-[13px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
