import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, Heart, ShoppingBag, Bot, MapPin, Sparkles, LogOut, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';

export const RazorcartLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Razorpay-style Bolt / Geometric Monogram */}
    <path
      d="M20 3L6 21H18L16 35L30 17H18L20 3Z"
      fill="#0066CC"
    />
  </svg>
);

export const Navbar = ({ onSearch, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, onOpenSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, switchPersona, updateUserCity, logout } = useAuth();
  const { cart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);

  const navItems = [
    { label: "ALL PRODUCTS", cat: "ALL" },
    { label: "MEN", cat: "MEN" },
    { label: "WOMEN", cat: "WOMEN" },
    { label: "ELECTRONICS", cat: "ELECTRONICS" },
    { label: "APPLIANCES", cat: "APPLIANCES" },
    { label: "HOME", cat: "HOME & KITCHEN" },
    { label: "BEAUTY", cat: "BEAUTY & PERSONAL CARE" },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8f0] shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Razorpay-style Navigation Links */}
        <div className="flex items-center gap-7 lg:gap-9">
          <div 
            onClick={() => { setSelectedCategory("ALL"); onSearch(""); navigate('/'); }}
            className="flex items-center gap-2 cursor-pointer group select-none py-1"
            title="Razorcart AI"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0066cc] flex items-center justify-center text-white font-black text-lg shadow-sm">
              R
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-2xl tracking-tight text-[#0066cc] font-sans group-hover:text-[#0052a3] transition-colors">
                Razorcart
              </span>
              <span className="font-bold text-base text-[#0c2340] ml-1 tracking-tight">
                AI
              </span>
            </div>
          </div>

          {/* Navigation Category Tabs with Razorpay Mint Active Underline */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const isSelected = selectedCategory === item.cat;
              return (
                <button
                  key={item.label}
                  onClick={() => setSelectedCategory(item.cat)}
                  className={`text-[13px] font-bold tracking-tight uppercase transition-all relative py-6 flex items-center cursor-pointer ${
                    isSelected
                      ? "text-[#0c2340] border-b-2 border-[#00b386]" 
                      : "text-[#5c6f84] hover:text-[#0c2340] hover:border-b-2 hover:border-[#00b386]/60"
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5c6f84] w-4 h-4" />
            <input
              type="text"
              placeholder="Search products, categories, RAG catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs md:text-sm text-[#0c2340] placeholder-[#5c6f84] focus:bg-white focus:border-[#0066cc] focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Right Actions: Login Button / Get Started Now, Profile, Wishlist, Bag */}
        <div className="flex items-center gap-4 md:gap-5">
          
          {/* Razorpay Style 'Get Started Now' Button */}
          {!currentUser ? (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Profile Menu */}
          <div
            className="relative"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
              onClick={() => navigate(currentUser ? '/profile' : '/login')}
              className="flex flex-col items-center justify-center text-[#5c6f84] hover:text-[#0066cc] transition-colors py-1 cursor-pointer"
              title="My Account"
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-[11px] font-bold mt-0.5">{currentUser ? currentUser.name?.split(' ')[0] : 'Account'}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full w-72 bg-white border border-[#e2e8f0] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-left">
                {currentUser ? (
                  <div className="border-b border-[#e2e8f0] pb-3 mb-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-[#0c2340] truncate">Welcome, {currentUser.name}</p>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#f0f7ff] text-[#0066cc] border border-[#e2e8f0]">
                        {currentUser.role || "customer"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5c6f84] truncate mt-0.5">{currentUser.email}</p>
                    <p className="text-[11px] text-[#00b386] font-bold mt-1">📍 Located in {currentUser.city}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                        className="py-2 bg-[#0066cc] text-white text-[11px] font-bold rounded-xl text-center hover:bg-[#0052a3] transition-colors cursor-pointer"
                      >
                        Orders & Profile
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                          navigate('/');
                        }}
                        className="py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-b border-[#e2e8f0] pb-3 mb-2.5">
                    <p className="text-xs font-bold text-[#0c2340]">Welcome</p>
                    <p className="text-[11px] text-[#5c6f84] mt-0.5">Access account and manage live orders</p>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/login'); }}
                      className="w-full mt-3 py-2 px-3 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-bold rounded-xl text-center transition-all shadow-sm cursor-pointer"
                    >
                      LOGIN / SIGN UP
                    </button>
                  </div>
                )}

                {/* Role Portals */}
                <p className="text-[10px] font-extrabold text-[#5c6f84] uppercase tracking-wider mb-1.5">Business Portals</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/merchant/dashboard'); }}
                    className="p-2 rounded-xl bg-[#f0f7ff] hover:bg-blue-100 border border-blue-200 text-[#0066cc] text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] font-extrabold">🏪 Merchant</div>
                    <div className="text-[9px] text-[#0066cc]/80 font-medium">Catalog & Analytics</div>
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/admin/dashboard'); }}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] font-extrabold">🛡️ Admin Portal</div>
                    <div className="text-[9px] text-emerald-700 font-medium">Telemetry & Ledger</div>
                  </button>
                </div>
                
                <p className="text-[10px] font-extrabold text-[#5c6f84] uppercase tracking-wider mb-1.5">Switch Demo Persona</p>
                <button
                  onClick={() => { switchPersona(1); setShowProfileMenu(false); }}
                  className={`w-full text-left p-2 rounded-xl text-xs mb-1 transition-colors cursor-pointer ${
                    currentUser?.id === 1 ? "bg-[#f0f7ff] border border-[#0066cc] text-[#0066cc] font-bold" : "hover:bg-[#f8fafc] text-[#0c2340]"
                  }`}
                >
                  <div className="font-bold">🏃 Priya Sharma (Bengaluru)</div>
                  <div className="text-[10px] text-[#5c6f84] font-normal">History: Running shoes & gear</div>
                </button>
                <button
                  onClick={() => { switchPersona(2); setShowProfileMenu(false); }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                    currentUser?.id === 2 ? "bg-[#f0f7ff] border border-[#0066cc] text-[#0066cc] font-bold" : "hover:bg-[#f8fafc] text-[#0c2340]"
                  }`}
                >
                  <div className="font-bold">👟 Rahul Verma (Mumbai)</div>
                  <div className="text-[10px] text-[#5c6f84] font-normal">History: White sneakers & care</div>
                </button>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={() => {
              setIsAgentOpen(true);
              sendMessage("Show top rated wishlist items and customer reviews");
            }}
            className="flex flex-col items-center justify-center text-[#5c6f84] hover:text-[#0066cc] transition-colors cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            <span className="text-[11px] font-bold mt-0.5">Wishlist</span>
          </button>

          {/* Shopping Bag */}
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center text-[#5c6f84] hover:text-[#0066cc] relative transition-colors cursor-pointer"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-[#0c2340]" />
            <span className="text-[11px] font-bold mt-0.5">Bag</span>
            {cart.item_count > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#00b386] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {cart.item_count}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
