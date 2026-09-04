import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Bot, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();

  const handleAskAgent = (e) => {
    e.stopPropagation();
    setIsAgentOpen(true);
    sendMessage(`Tell me about customer reviews and compatibility for ${product.brand} ${product.title}`);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product.id, 1, "UK 8");
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const int = (val) => Math.round(Number(val || 0));

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-[#e2e8f0] hover:border-[#0066cc]/50 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer overflow-hidden pb-4"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full bg-[#f8fafc] overflow-hidden">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=800&q=80";
          }}
        />

        {/* Authentic Rating & Review Badge */}
        <div
          className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm text-xs font-bold text-[#0c2340] border border-[#e2e8f0]"
        >
          <span className="font-extrabold">{product.rating}</span>
          <Star className="w-3 h-3 fill-[#00b386] text-[#00b386]" />
          <span className="text-gray-300 font-light">|</span>
          <span className="text-[#5c6f84] font-semibold">{product.review_count}</span>
        </div>

        {/* Local Seller Fast Delivery Tag */}
        {product.is_local_seller && (
          <div className="absolute top-2.5 left-2.5 bg-[#00b386] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span>Fast from {product.city}</span>
          </div>
        )}

        {/* Hover Actions Bar */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-2.5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex gap-2 border-t border-[#e2e8f0]">
          <button
            onClick={handleQuickAdd}
            className="flex-1 py-2 bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
          <button
            onClick={handleAskAgent}
            className="px-3 py-2 bg-[#f8fafc] hover:bg-[#f0f7ff] text-[#0c2340] border border-[#e2e8f0] text-xs font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            title="Ask ZORA about customer reviews & fit"
          >
            <Bot className="w-3.5 h-3.5 text-[#0066cc]" />
          </button>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="pt-3.5 px-3.5 space-y-1">
        <h3 className="font-extrabold text-sm text-[#0047fb] tracking-tight leading-tight">
          {product.brand}
        </h3>

        <p className="text-xs text-[#5c6f84] truncate font-medium">
          {product.title}
        </p>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="font-black text-sm text-[#0c2340]">
            Rs. {int(product.price)}
          </span>

          {product.original_price > product.price && (
            <>
              <span className="text-xs text-slate-400 line-through">
                Rs. {int(product.original_price)}
              </span>
              <span className="text-xs font-extrabold text-[#0047fb] tracking-tight">
                ({product.discount_pct}% OFF)
              </span>
            </>
          )}
        </div>

        {product.review_count >= 100 && (
          <p className="text-[10px] text-[#00b386] font-bold pt-1 flex items-center gap-1">
            <span>High Rating & Verified Reviews</span>
          </p>
        )}
      </div>
    </div>
  );
};
