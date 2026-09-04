import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAgent } from '../context/AgentContext';
import { api } from '../services/api';
import { Navbar } from '../components/Navbar';
import { CustomerSidebar } from '../components/CustomerSidebar';
import { AgenticChatbotLauncher } from '../components/AgenticChatbotLauncher';
import { AgentCopilotModal } from '../components/AgentCopilotModal';
import { CartDrawer } from '../components/CartDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { MarkdownMessage } from '../components/MarkdownMessage';
import { ProductReviewsModal } from '../components/ProductReviewsModal';
import {
  Star, ShoppingBag, Bot, Zap, ArrowLeft, CheckCircle2,
  Truck, ShieldCheck, MessageSquare, Plus, ChevronRight, Tag
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const { setIsAgentOpen, sendMessage } = useAgent();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('UK 8');
  const [addedNotice, setAddedNotice] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [fbtProducts, setFbtProducts] = useState([]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await api.getProductDetails(id, currentUser?.id || 1);
      const prodData = res.data;
      setProduct(prodData);

      // Fetch reviews for this product
      const revRes = await api.getProductReviews(id);
      setReviews(revRes.data || []);

      // Fetch FBT products if ids exist
      if (prodData.fbt_product_ids) {
        try {
          const ids = typeof prodData.fbt_product_ids === 'string'
            ? JSON.parse(prodData.fbt_product_ids)
            : prodData.fbt_product_ids;
          if (ids.length > 0) {
            const allRes = await api.getProducts({});
            const matched = allRes.data.filter(p => ids.includes(p.id));
            setFbtProducts(matched);
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar onSearch={() => {}} searchQuery="" setSearchQuery={() => {}} selectedCategory="ALL" setSelectedCategory={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-gray-500">Loading Product Details…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar onSearch={() => {}} searchQuery="" setSearchQuery={() => {}} selectedCategory="ALL" setSelectedCategory={() => {}} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-[#0066cc] text-white font-bold text-xs rounded-lg">
            Back to Storefront
          </button>
        </div>
      </div>
    );
  }

  const isFashion = product.department === 'Fashion' || ['Footwear', 'Topwear', 'Bottomwear', 'Dresses', 'Ethnic Wear'].includes(product.category);
  const sizes = isFashion ? (product.category === 'Footwear'
    ? ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
    : ['S', 'M', 'L', 'XL', 'XXL']) : [];

  const int = (val) => Math.round(Number(val || 0));

  const handleAdd = () => {
    addToCart(product.id, 1, selectedSize);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  const handleAskAgent = () => {
    setIsAgentOpen(true);
    sendMessage(`Give me a detailed comparison, review breakdown, and sizing advice for ${product.brand} ${product.title}.`);
  };

  return (
    <div className="min-h-screen bg-white text-[#0c2340] flex flex-col font-sans">
      <Navbar
        onSearch={(q) => navigate(`/?search=${encodeURIComponent(q)}`)}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="ALL"
        setSelectedCategory={() => {}}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6">
        
        {/* Breadcrumb & Back Link */}
        <div className="flex items-center justify-between mb-6 text-xs text-gray-500 font-semibold">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-[#0066cc] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="capitalize">{product.category}</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="font-bold text-gray-900">{product.brand}</span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </button>
        </div>

        {/* Product Detail Layout: Compact Image Showcase Left + Product Details Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
          
          {/* Left Column: Product Image Showcase (Compact & Centered) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="relative w-full max-w-[420px] mx-auto bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-2">
              <img
                src={product.image_url}
                alt={product.title}
                className="w-full max-h-[420px] object-contain object-center rounded-lg hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&h=800&q=80";
                }}
              />

              {/* Express Delivery Badge */}
              {product.is_local_seller && (
                <div className="absolute top-3 left-3 bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Express Dispatch from {product.city}</span>
                </div>
              )}

              {/* Rating & Review Overlay Badge */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-md border border-[#e2e8f0] shadow-sm flex items-center gap-1.5 text-xs font-bold text-[#0c2340]">
                <span className="text-xs font-bold">{product.rating || 4.5}</span>
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span className="text-gray-300 font-light">|</span>
                <span className="text-gray-500 font-normal">{product.review_count || 0} Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Information & Purchase Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Brand & Title */}
              <h1 className="text-2xl md:text-3xl font-black text-[#0c2340] tracking-tight">{product.brand}</h1>
              <p className="text-base text-[#5c6f84] font-medium mt-1">{product.title}</p>

              {/* Rating Summary Bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs font-black text-emerald-800">
                  <span>{product.rating || 4.5}</span>
                  <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {product.review_count || 0} Customer Ratings & Reviews
                </span>
              </div>

              {/* Pricing Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#0c2340]">Rs. {int(product.price)}</span>
                {product.original_price > product.price && (
                  <>
                    <span className="text-base text-gray-400 line-through">Rs. {int(product.original_price)}</span>
                    <span className="text-base font-black text-[#ff905a]">({product.discount_pct}% OFF)</span>
                  </>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-700 mt-1">inclusive of all taxes</p>

              {/* Added to Bag Toast Notification */}
              {addedNotice && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Added to Bag {sizes.length > 0 ? `(Size: ${selectedSize})` : ''}</span>
                </div>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Select Size</span>
                    <span className="text-xs text-[#0066cc] font-bold cursor-pointer hover:underline">Size Chart</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {sizes.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-14 h-14 rounded-xl text-xs font-bold transition-all border ${
                          selectedSize === sz
                            ? 'border-[#0066cc] text-[#0066cc] bg-[#f0f7ff]/50 shadow-sm font-extrabold scale-105'
                            : 'border-gray-200 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={handleAdd}
                  className="px-8 py-3.5 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={handleAskAgent}
                  className="px-5 py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all"
                  title="Ask AI Copilot about fit, performance & reviews"
                >
                  <Bot className="w-4 h-4 text-[#0066cc]" />
                  <span>Ask AI</span>
                </button>
              </div>

              {/* Seller & Dispatch Info */}
              <div className="mt-4 p-3 bg-[#f0f7ff] rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0066cc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    🏪
                  </div>
                  <div>
                    <span className="text-gray-500 text-[11px] block">Sold & Dispatched by:</span>
                    <strong className="text-[#0c2340] font-extrabold">{product.merchant_name || 'RazorCart Official Store'}</strong>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#00b386] font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00b386]" />
                  <span>Verified Merchant • 📍 {product.city || 'Bengaluru'}</span>
                </div>
              </div>

              {/* Shipping & Delivery Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3 text-xs">
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                  <Truck className="w-4 h-4 text-[#0066cc]" />
                  <span>Get it delivered in <strong>2-3 Business Days</strong></span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Original Product · 7-Day Easy Returns</span>
                </div>
              </div>

              {/* Product Specifications & Description */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3">
                  Product Details & Specifications
                </h3>
                <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-200 max-h-[480px] overflow-y-auto">
                  <MarkdownMessage
                    content={product.description || 'Engineered with premium materials for maximum comfort and durability.'}
                  />
                </div>
              </div>

              {/* Frequently Bought Together (FBT) Rail */}
              {fbtProducts.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-700 block mb-3">
                    Frequently Bought Together
                  </span>
                  <div className="space-y-2.5">
                    {fbtProducts.map((fbt) => (
                      <div key={fbt.id} className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={fbt.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{fbt.title}</p>
                            <p className="text-xs font-extrabold text-[#0066cc]">Rs. {int(fbt.price)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(fbt.id, 1, 'Standard')}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-lg shrink-0 shadow-sm transition-colors"
                        >
                          + Add Pair
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings & Customer Reviews Link */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 block">Verified Customer Reviews</span>
                  <span className="text-xs text-gray-500">{reviews.length} Customer Reviews</span>
                </div>
                <button
                  onClick={() => setIsReviewsModalOpen(true)}
                  className="text-xs font-extrabold text-[#0066cc] border border-[#0066cc]/30 bg-[#f0f7ff] hover:bg-pink-100 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Read & Write Reviews</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            <span className="font-extrabold text-[#0c2340]">RazorCartAI</span> • Agentic AI E-Commerce Platform
          </div>
          <div className="flex items-center gap-4">
            <span>LangGraph Multi-Agent Engine</span>
            <span>•</span>
            <span>Agentic Commerce Core</span>
          </div>
        </div>
      </footer>

      {/* Overlays */}
      <CustomerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <AgenticChatbotLauncher />
      <AgentCopilotModal />
      <CartDrawer />
      <CheckoutModal />
      <ProductReviewsModal
        product={product}
        isOpen={isReviewsModalOpen}
        onClose={() => setIsReviewsModalOpen(false)}
        onReviewSubmitted={fetchProduct}
      />
    </div>
  );
}
