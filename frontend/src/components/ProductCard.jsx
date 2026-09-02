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
      className="group relative bg-white rounded-none border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer overflow-hidden pb-3"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] w-full bg-[#f5f5f6] overflow-hidden">
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Authentic Rating & Review Badge */}
        <div
          className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-sm flex items-center gap-1.5 shadow-sm text-xs font-bold text-[#282c3f]"
        >
          <span className="font-extrabold">{product.rating}</span>
          <Star className="w-3 h-3 fill-[#14958f] text-[#14958f]" />
          <span className="text-gray-300 font-light">|</span>
          <span className="text-gray-600 font-semibold">{product.review_count}</span>
        </div>

        {/* Local Seller Fast Delivery Tag */}
        {product.is_local_seller && (
          <div className="absolute top-2 left-2 bg-[#14958f] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
            <Zap className="w-2.5 h-2.5 fill-current" />
            <span>Fast from {product.city}</span>
          </div>
        )}

        {/* Hover Actions Bar */}
        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex gap-1.5 border-t border-gray-100">
          <button
            onClick={handleQuickAdd}
            className="flex-1 py-1.5 bg-[#ff3f6c] hover:bg-[#e62e5b] text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1 shadow-sm transition-colors uppercase tracking-wider"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
          <button
            onClick={handleAskAgent}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-sm flex items-center justify-center transition-colors"
            title="Ask AI Copilot about customer reviews & fit"
          >
            <Bot className="w-3.5 h-3.5 text-[#ff3f6c]" />
          </button>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="pt-3 px-2.5">
        <h3 className="font-extrabold text-sm text-[#282c3f] tracking-tight leading-tight">
          {product.brand}
        </h3>

        <p className="text-xs text-[#535766] truncate mt-0.5 font-normal">
          {product.title}
        </p>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-bold text-sm text-[#282c3f]">
            Rs. {int(product.price)}
          </span>

          {product.original_price > product.price && (
            <>
              <span className="text-xs text-gray-400 line-through">
                Rs. {int(product.original_price)}
              </span>
              <span className="text-xs font-bold text-[#ff905a] tracking-tight">
                ({product.discount_pct}% OFF)
              </span>
            </>
          )}
        </div>

        {product.review_count >= 100 && (
          <p className="text-[10px] text-[#14958f] font-semibold mt-1 flex items-center gap-1">
            <span>High Rating & Review volume</span>
          </p>
        )}
      </div>
    </div>
  );
};
