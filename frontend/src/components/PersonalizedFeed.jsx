import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from './ProductCard';

export const PersonalizedFeed = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPersonalized = async () => {
      if (!currentUser?.id) return;
      try {
        setLoading(true);
        const res = await api.getPersonalizedFeed(currentUser.id);
        setProducts(res.data);
      } catch (err) {
        console.warn("Failed to load zero-query personalized feed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonalized();
  }, [currentUser?.id, currentUser?.city]);

  if (products.length === 0 && !loading) return null;

  return (
    <section className="mb-10 bg-white p-4 md:p-6 border border-[#eaeaec]">
      
      {/* Header for Personalized Recommendations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-[#eaeaec]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#282c3f] tracking-tight">
            Explore Products of Your Recommendation
          </h2>
          <p className="text-xs text-[#94969f] mt-1 font-normal">
            Handpicked styles tailored for you • Rated 4.5★+ with express dispatch
          </p>
        </div>

        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
          <span>Express Delivery Available</span>
        </div>
      </div>

      {/* Grid of Personalized Product Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="aspect-[3/4] bg-white/70 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={`personalized-${p.id}`} product={p} />
          ))}
        </div>
      )}

    </section>
  );
};
