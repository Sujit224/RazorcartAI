import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, Heart, ShoppingBag, Bot, MapPin, Sparkles, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';

export const RazorcartLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Myntra Ribbon Style Letter R: Overlapping Pink & Orange Petals */}
    {/* Left Stem Petal - Signature Myntra Pink */}
    <path
      d="M7 6C9.5 6 11.5 8 11.5 10.5V31.5C11.5 34 9.5 36 7 36C4.5 36 2.5 34 2.5 31.5V10.5C2.5 8 4.5 6 7 6Z"
      fill="#FF3F6C"
    />
    {/* Top-to-Mid Loop Ribbon - Warm Tangerine Orange */}
    <path
      d="M8 6.5C15 5.5 26 6.5 29 13.5C31.5 19 27.5 22.5 19 22.5H9C6.5 22.5 5.5 18 8 17.5H18C23 17.5 25.5 16 24.5 12.5C23.5 9.5 19 9 11 10C8.5 10.5 7 6.5 8 6.5Z"
      fill="#FF7034"
    />
    {/* Outer Right Loop Curve - Signature Myntra Pink */}
    <path
      d="M17 6.5C24.5 6.5 32 8.5 32 15C32 21.5 25 23.5 17 23.5C14.5 23.5 14.5 19 17 19C22.5 19 27.5 17.8 27.5 15C27.5 12.2 22.5 11 17 11C14.5 11 14.5 6.5 17 6.5Z"
      fill="#FF3F6C"
    />
    {/* Inner Diagonal Leg Petal - Warm Tangerine Orange */}
    <path
      d="M14 18.5C16.5 16.5 19.5 17.5 21.5 20.5L28.5 31C30 33 28.5 35.5 26 35.5C24 35.5 22.5 34.5 21 32.5L15 23.5L14 18.5Z"
      fill="#FF7034"
    />
    {/* Outer Diagonal Leg Petal - Signature Myntra Pink */}
    <path
      d="M18.5 19.5C21.5 18 24.5 20 26.5 23L34 32C35.5 34 34 36.5 31.5 36.5C29.5 36.5 28 35 26.5 33L20 23.5L18.5 19.5Z"
      fill="#FF3F6C"
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
    { label: "MEN", cat: "MEN" },
    { label: "WOMEN", cat: "WOMEN" },
    { label: "ELECTRONICS", cat: "ELECTRONICS" },
    { label: "APPLIANCES", cat: "APPLIANCES" },
    { label: "HOME", cat: "HOME & KITCHEN" },
    { label: "BEAUTY", cat: "BEAUTY & PERSONAL CARE" },
    { label: "STUDIO", cat: "ALL", isNew: true },
  ];

  const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai"];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleAiSearch = () => {
    if (searchQuery.trim()) {
      setIsAgentOpen(true);
      sendMessage(searchQuery);
    } else {
      setIsAgentOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Text in Signature Color & Navigation Links */}
        <div className="flex items-center gap-7 lg:gap-9">
          <div 
            onClick={() => { setSelectedCategory("ALL"); onSearch(""); navigate('/'); }}
            className="flex items-baseline cursor-pointer group select-none py-1"
            title="Razorcart AI"
          >
            <span className="font-black italic text-2xl md:text-[26px] text-[#FF3F6C] tracking-[-0.03em] font-sans group-hover:opacity-90 transition-opacity">
              Razorcart
            </span>
            <span className="font-black italic text-base text-[#282C3F] ml-1 tracking-tight">
              AI
            </span>
          </div>

          {/* Navigation Category Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const isSelected = selectedCategory === item.cat && item.label === selectedCategory;
              return (
                <button
                  key={item.label}
                  onClick={() => setSelectedCategory(item.cat)}
                  className={`text-[14px] font-bold tracking-[.3px] uppercase transition-all relative py-6 flex items-center ${
                    isSelected
                      ? "text-[#ff3f6c] border-b-4 border-[#ff3f6c]" 
                      : "text-[#282c3f] hover:text-[#ff3f6c] hover:border-b-4 hover:border-[#ff3f6c]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="text-[9px] text-[#ff3f6c] font-black uppercase tracking-normal -top-1 relative ml-1">
                      NEW
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Clean Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for products, brands and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f6] border border-transparent rounded text-xs md:text-sm text-[#282c3f] placeholder-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Right Actions: Login Button (if guest), Profile, Wishlist, Bag */}
        <div className="flex items-center gap-4 md:gap-6">
          
          {/* Direct Login Button for Guest Visitors */}
          {!currentUser && (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#ff3f6c] text-[#ff3f6c] hover:bg-[#ff3f6c] hover:text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Profile Item */}
          <div
            className="relative"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
              onClick={() => navigate(currentUser ? '/profile' : '/login')}
              className="flex flex-col items-center justify-center text-[#282c3f] hover:text-[#ff3f6c] transition-colors py-1"
              title="My Account"
            >
              <UserIcon className="w-5 h-5 text-[#282c3f]" />
              <span className="text-[12px] font-bold mt-0.5">Profile</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full w-72 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 z-50 animate-fade-in text-left">
                {currentUser ? (
                  <div className="border-b border-gray-100 pb-3 mb-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-900 truncate">Welcome, {currentUser.name}</p>
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {currentUser.role || "customer"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{currentUser.email}</p>
                    <p className="text-[11px] text-[#ff3f6c] font-semibold mt-1">📍 Located in {currentUser.city}</p>
                    
                    <div className="grid grid-cols-2 gap-1.5 mt-3">
                      <button
                        onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                        className="py-2 bg-[#ff3f6c] text-white text-[11px] font-bold rounded text-center hover:bg-[#e62e5b] transition-colors"
                      >
                        Orders & Profile
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                          navigate('/');
                        }}
                        className="py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-b border-gray-100 pb-3 mb-2.5">
                    <p className="text-xs font-bold text-gray-800">Welcome</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">To access account and manage orders</p>
                    <button
                      onClick={() => { setShowProfileMenu(false); navigate('/login'); }}
                      className="w-full mt-3 py-2 px-3 border border-[#ff3f6c] text-[#ff3f6c] hover:bg-[#ff3f6c] hover:text-white text-xs font-extrabold uppercase tracking-wider rounded text-center transition-all duration-200 shadow-sm"
                    >
                      LOGIN / SIGNUP
                    </button>
                  </div>
                )}

                {/* Role Portals */}
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Business Portals</p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/merchant/dashboard'); }}
                    className="p-2 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-left transition-colors"
                  >
                    <div className="text-[11px] font-extrabold">🏪 Merchant</div>
                    <div className="text-[9px] text-purple-600 font-medium">Store & AI Ledger</div>
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/admin/dashboard'); }}
                    className="p-2 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-left transition-colors"
                  >
                    <div className="text-[11px] font-extrabold">🛡️ Razorpay Admin</div>
                    <div className="text-[9px] text-emerald-600 font-medium">Audit & Revenue</div>
                  </button>
                </div>
                
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Switch Demo Persona</p>
                <button
                  onClick={() => { switchPersona(1); setShowProfileMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs mb-1 transition-colors ${
                    currentUser?.id === 1 ? "bg-pink-50 border border-pink-200 text-[#ff3f6c] font-bold" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-bold">🏃 Priya Sharma (Bengaluru)</div>
                  <div className="text-[10px] text-gray-500 font-normal">History: Running shoes & gear</div>
                </button>
                <button
                  onClick={() => { switchPersona(2); setShowProfileMenu(false); }}
                  className={`w-full text-left p-2 rounded text-xs transition-colors ${
                    currentUser?.id === 2 ? "bg-pink-50 border border-pink-200 text-[#ff3f6c] font-bold" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-bold">👟 Rahul Verma (Mumbai)</div>
                  <div className="text-[10px] text-gray-500 font-normal">History: White sneakers & care</div>
                </button>
              </div>
            )}
          </div>

          {/* Wishlist Item */}
          <button
            onClick={() => {
              setIsAgentOpen(true);
              sendMessage("Show top rated wishlist items and customer reviews");
            }}
            className="flex flex-col items-center justify-center text-[#282c3f] hover:text-[#ff3f6c] transition-colors"
          >
            <Heart className="w-5 h-5 text-[#282c3f]" />
            <span className="text-[12px] font-bold mt-0.5">Wishlist</span>
          </button>

          {/* Shopping Bag Item */}
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center text-[#282c3f] hover:text-[#ff3f6c] relative transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-[#282c3f]" />
            <span className="text-[12px] font-bold mt-0.5">Bag</span>
            {cart.item_count > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#ff3f6c] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cart.item_count}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
