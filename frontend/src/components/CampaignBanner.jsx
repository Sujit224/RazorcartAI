import React, { useEffect, useState } from 'react';
import { Sparkles, X, ChevronRight, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function CampaignBanner() {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
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
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-[#FF3F6C] text-white rounded-2xl p-4 shadow-xl mb-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
          <Zap className="w-6 h-6 text-yellow-300" fill="currentColor" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-1 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              ⚡ Personalized AI Flash Deals
            </span>
          </div>
          <h3 className="text-sm md:text-base font-extrabold leading-tight">
            "{currentOffer.pitch}"
          </h3>
          <p className="text-xs text-white/80 font-medium mt-1">
            Razorcart AI has tailored these exclusive prices just for you.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3 w-full md:w-auto">
        <div className="flex -space-x-2">
          {currentOffer.products?.slice(0, 3).map((p, i) => (
            <img 
              key={p.id} 
              src={p.image_url} 
              alt={p.title}
              className={`w-10 h-10 rounded-full border-2 border-purple-600 object-cover bg-white z-[${3-i}]`}
            />
          ))}
          {currentOffer.products?.length > 3 && (
            <div className="w-10 h-10 rounded-full border-2 border-purple-600 bg-black/50 backdrop-blur-md flex items-center justify-center text-[10px] font-bold z-0">
              +{currentOffer.products.length - 3}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => {
            // Ideally navigate to a filtered view or just open the first product
            if (currentOffer.products?.[0]) {
              navigate(`/product/${currentOffer.products[0].id}`);
            }
          }}
          className="flex-1 md:flex-none px-4 py-2 bg-white text-purple-700 hover:bg-gray-50 font-black text-xs rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center gap-1 cursor-pointer"
        >
          View Deals
          <ChevronRight className="w-4 h-4" />
        </button>

        <button 
          onClick={() => setIsVisible(false)}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Indicator dots if multiple offers */}
      {offers.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {offers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-3' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
