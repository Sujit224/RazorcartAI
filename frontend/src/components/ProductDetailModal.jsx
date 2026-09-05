import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';
import { api } from '../services/api';
import {
  Star, ShoppingBag, Bot, Zap, X, MapPin, CheckCircle2,
  Truck, ShieldCheck, Heart, MessageSquare, Plus, ArrowRight
} from 'lucide-react';
import { ProductReviewsModal } from './ProductReviewsModal';
import { MarkdownMessage } from './MarkdownMessage';

export function ProductDetailModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();
  const [selectedSize, setSelectedSize] = useState('UK 8');
  const [addedNotice, setAddedNotice] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [fbtProducts, setFbtProducts] = useState([]);

  const isFashion = product?.department === 'Fashion' || ['Footwear', 'Topwear', 'Bottomwear', 'Dresses', 'Ethnic Wear'].includes(product?.category);
  const sizes = isFashion ? (product?.category === 'Footwear'
    ? ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
    : ['S', 'M', 'L', 'XL', 'XXL']) : [];

  useEffect(() => {
    if (isOpen && product?.id) {
      fetchProductDetails();
    }
  }, [isOpen, product?.id]);

  const fetchProductDetails = async () => {
    try {
      const res = await api.getProductReviews(product.id);
      setReviews(res.data || []);

      // Fetch FBT products if ids exist
      if (product.fbt_product_ids) {
        try {
          const ids = typeof product.fbt_product_ids === 'string'
            ? JSON.parse(product.fbt_product_ids)
            : product.fbt_product_ids;
          if (ids.length > 0) {
            const allRes = await api.getProducts({});
            const matched = allRes.data.filter(p => ids.includes(p.id));
            setFbtProducts(matched);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching detail data:', err);
    }
  };

  if (!isOpen || !product) return null;

  const int = (val) => Math.round(Number(val || 0));

  const handleAdd = () => {
    addToCart(product.id, 1, sizes.length > 0 ? selectedSize : 'Standard');
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleAskAgent = () => {
    onClose();
    setIsAgentOpen(true);
    sendMessage(`Give me a detailed comparison, review breakdown, and sizing advice for ${product.brand} ${product.title}.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row my-8 max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Image Showcase */}
        <div className="w-full md:w-1/2 bg-gray-100 relative min-h-[320px] md:min-h-[500px]">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Rating Badge */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-xs font-extrabold text-[#0c2340]">
            <span className="text-sm font-black">{product.rating || 4.5}</span>
            <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
            <span className="text-gray-300 font-light">|</span>
            <span className="text-gray-600 font-semibold">{product.review_count || 0} Ratings</span>
          </div>

          {/* Express Delivery Badge */}
          {product.is_local_seller && (
            <div className="absolute top-4 left-4 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Fast Dispatch from {product.city}</span>
            </div>
          )}
        </div>

        {/* Right Product Details & Actions */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[90vh]">
          
          {/* Brand & Title */}
          <div>
            <h2 className="text-xl font-black text-[#0c2340] tracking-tight">{product.brand}</h2>
            <h1 className="text-base text-[#5c6f84] font-medium mt-0.5">{product.title}</h1>
          </div>

          {/* Price Block */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-3">
            <span className="text-2xl font-black text-[#0c2340]">Rs. {int(product.price)}</span>
            {product.original_price > product.price && (
              <>
                <span className="text-sm text-gray-400 line-through">Rs. {int(product.original_price)}</span>
                <span className="text-sm font-black text-[#ff905a]">({product.discount_pct}% OFF)</span>
              </>
            )}
          </div>
          <p className="text-[11px] font-bold text-emerald-700 mt-1">inclusive of all taxes</p>

          {/* Added to Bag Toast Notice */}
          {addedNotice && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Added to Bag (Size: {selectedSize})</span>
            </div>
          )}

          {/* Size Selector */}
          {sizes.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Select Size</span>
                <span className="text-xs text-[#0066cc] font-bold cursor-pointer hover:underline">Size Chart</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                      selectedSize === sz
                        ? 'border-[#0066cc] text-[#0066cc] bg-[#f0f7ff]/50 shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seller & Hub Badge */}
          <div className="mt-4 p-2.5 bg-[#f0f7ff] rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🏪</span>
              <div>
                <span className="text-gray-500 text-[10px] block">Sold by:</span>
                <strong className="text-[#0c2340] font-bold text-xs">{product.merchant_name || 'RazorCart Official Store'}</strong>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#00b386] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified • 📍 {product.city || 'Bengaluru'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">Product Specifications</h3>
              <div className="bg-[#f8fafc] p-3 rounded-xl border border-slate-200 max-h-64 overflow-y-auto">
                <MarkdownMessage content={product.description} />
              </div>
            </div>
          )}

          {/* Delivery & Seller Stats */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Truck className="w-4 h-4 text-[#0066cc]" />
              <span>Standard Express Shipping: 2-3 Days</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Original Products & 7-Day Easy Returns</span>
            </div>
          </div>

          {/* Frequently Bought Together (FBT) Pairings */}
          {fbtProducts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 block mb-2">
                Frequently Bought Together
              </span>
              <div className="space-y-2">
                {fbtProducts.map((fbt) => (
                  <div key={fbt.id} className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={fbt.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{fbt.title}</p>
                        <p className="text-[11px] font-extrabold text-[#0066cc]">Rs. {int(fbt.price)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(fbt.id, 1, 'Standard')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] rounded-lg shrink-0 shadow-sm transition-colors"
                    >
                      + Add Pair
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews Quick Link */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block">Customer Feedback</span>
              <span className="text-xs text-gray-500">{reviews.length} Verified Customer Reviews</span>
            </div>
            <button
              onClick={() => setIsReviewsModalOpen(true)}
              className="text-xs font-extrabold text-[#0066cc] border border-[#0066cc]/30 bg-[#f0f7ff] hover:bg-pink-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Read & Write Reviews</span>
            </button>
          </div>

          {/* Bottom Sticky Action Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="flex-1 py-3.5 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Bag</span>
            </button>

            <button
              onClick={handleAskAgent}
              className="px-4 py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all"
              title="Ask AI Copilot about sizing, compatibility & performance"
            >
              <Bot className="w-4 h-4 text-[#0066cc]" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </div>

        </div>

      </div>

      {/* Embedded Product Reviews Modal */}
      <ProductReviewsModal
        product={product}
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        onReviewSubmitted={fetchProductDetails}
      />
    </div>
  );
}
