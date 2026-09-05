import React, { useEffect, useState } from 'react';
import { Sparkles, X, ChevronRight, Zap, Star, ShoppingBag } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export function CampaignBanner() {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDealsModalOpen, setIsDealsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'customer') return;

    const fetchOffers = async () => {
      try {
        const res = await api.getActiveCampaignOffers(currentUser.id);
        if (res.data?.offers?.length > 0) {
          setOffers(res.data.offers);
        }
      } catch (err) {
        console.error("Failed to fetch campaign offers", err);
      }
    };
    fetchOffers();
  }, [currentUser]);

  if (!isVisible || offers.length === 0) return null;

  const currentOffer = offers[currentIndex];

  return (
    <>
      <div className="bg-gradient-to-r from-[#f0f7ff] via-white to-[#f0f7ff] rounded-2xl p-4 md:p-5 pr-11 md:pr-14 shadow-sm hover:shadow-md transition-all mb-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 border border-[#bfdbfe]">
        {/* Dynamic Background Glow Accents */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        {/* Dismiss Close Button */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all flex items-center justify-center cursor-pointer border border-gray-200/80 shadow-xs"
          title="Dismiss Flash Deals"
        >
          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* Left Content Section */}
        <div className="relative z-10 flex items-center gap-3.5 md:gap-4 min-w-0 flex-1 w-full md:w-auto cursor-pointer" onClick={() => setIsDealsModalOpen(true)}>
          {/* Glowing Zap Container */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-[#0066cc] to-[#0047fb] text-white flex items-center justify-center shrink-0 shadow-md border border-blue-400/30">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-amber-300 fill-amber-300 drop-shadow-xs" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/25 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#0066cc]" />
                <span>Personalized AI Flash Deals</span>
              </span>
            </div>
            <h3 className="text-sm md:text-base font-black leading-tight text-[#0c2340] tracking-tight truncate md:whitespace-normal">
              "{currentOffer.pitch}"
            </h3>
            <p className="text-xs text-[#5c6f84] font-medium mt-0.5 truncate md:whitespace-normal">
              Razorcart AI has tailored these exclusive prices just for you.
            </p>
          </div>
        </div>

        {/* Right Action Section */}
        <div className="relative z-10 flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-end shrink-0">
          {/* Overlapping Product Avatars */}
          <div className="flex -space-x-2.5 items-center shrink-0">
            {currentOffer.products?.slice(0, 3).map((p, i) => (
              <img 
                key={p.id} 
                src={p.image_url} 
                alt={p.title}
                style={{ zIndex: 10 - i }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${p.id}`);
                }}
                title={`View ${p.brand} ${p.title}`}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white object-cover bg-white shadow-md ring-1 ring-blue-200 cursor-pointer hover:scale-110 transition-transform"
              />
            ))}
            {currentOffer.products?.length > 3 && (
              <div 
                style={{ zIndex: 1 }}
                onClick={() => setIsDealsModalOpen(true)}
                title="View All Deals"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white bg-[#0c2340] flex items-center justify-center text-[10px] font-black text-white shadow-md ring-1 ring-blue-200 cursor-pointer hover:scale-110 transition-transform"
              >
                +{currentOffer.products.length - 3}
              </div>
            )}
          </div>
          
          {/* View Deals CTA Button */}
          <button 
            onClick={() => setIsDealsModalOpen(true)}
            className="px-4 py-2 md:py-2.5 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1 cursor-pointer shrink-0 uppercase tracking-wider"
          >
            <span>View Deals</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        {offers.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {offers.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentIndex ? 'bg-[#0066cc] w-4' : 'bg-blue-200 hover:bg-blue-300 w-1.5'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Deals Collection Modal */}
      {isDealsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0c2340] via-[#0047fb] to-[#0066cc] text-white p-5 md:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-sm">
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-blue-100 px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1 backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Personalized AI Deals</span>
                    </span>
                    <span className="text-xs text-amber-300 font-extrabold bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                      {currentOffer.products?.length || 0} Exclusive Deals
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-black text-white mt-1">
                    "{currentOffer.pitch}"
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsDealsModalOpen(false)}
                className="relative z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Products Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {currentOffer.products?.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-[#0047fb]/40 hover:shadow-lg transition-all p-3.5 flex flex-col justify-between group"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=800&q=80";
                        }}
                      />
                      {product.discount_pct > 0 && (
                        <span className="absolute top-2 left-2 bg-[#0047fb] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                          {product.discount_pct}% OFF
                        </span>
                      )}
                      {product.rating && (
                        <span className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-[#0c2340] text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs border border-gray-200">
                          {product.rating} <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <span className="text-[11px] font-extrabold text-[#0047fb] uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <h4 className="text-xs font-bold text-[#0c2340] line-clamp-2 leading-snug">
                        {product.title}
                      </h4>
                    </div>

                    <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-[#0c2340]">
                          Rs. {Math.round(product.price || 0).toLocaleString()}
                        </div>
                        {product.original_price > product.price && (
                          <div className="text-[10px] text-gray-400 line-through">
                            Rs. {Math.round(product.original_price || 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            addToCart(product.id, 1);
                          }}
                          className="px-3 py-2 bg-[#0047fb] hover:bg-[#0038c7] text-white rounded-xl shadow-xs transition-all flex items-center gap-1 text-xs font-extrabold cursor-pointer"
                          title="Add to Bag"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsDealsModalOpen(false);
                            navigate(`/product/${product.id}`);
                          }}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all text-xs font-extrabold cursor-pointer"
                          title="View Details"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
              <p className="text-xs text-gray-500 font-medium">
                ⚡ Exclusive AI flash deal pricing applied automatically.
              </p>
              <button
                onClick={() => setIsDealsModalOpen(false)}
                className="px-5 py-2 bg-[#0c2340] text-white font-extrabold text-xs rounded-xl hover:bg-[#1a365d] transition-all cursor-pointer"
              >
                Close Deals
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

