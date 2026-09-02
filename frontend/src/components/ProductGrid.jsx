import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, Star, Check, ArrowUpDown } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProductGrid = ({ selectedCategory, searchQuery }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [selectedGender, setSelectedGender] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [localOnly, setLocalOnly] = useState(false);
  const [sortBy, setSortBy] = useState("smart_rank");

  const brands = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "Puma", "Philips", "Levi's", "Fabindia", "Drools"];
  const genders = ["All", "Men", "Women", "Unisex"];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const isGenderCat = ["MEN", "WOMEN"].includes(selectedCategory);
      const isDeptCat = ["ELECTRONICS", "APPLIANCES", "HOME & KITCHEN", "BEAUTY & PERSONAL CARE"].includes(selectedCategory);

      const params = {
        category: (!isGenderCat && !isDeptCat && selectedCategory !== "ALL") ? selectedCategory : undefined,
        department: isDeptCat ? selectedCategory : undefined,
        gender: isGenderCat ? (selectedCategory === "MEN" ? "Men" : "Women") : (selectedGender === "All" ? undefined : selectedGender),
        brand: selectedBrand || undefined,
        min_rating: minRating > 0 ? minRating : undefined,
        city: localOnly ? currentUser?.city : undefined,
        sort_by: sortBy,
        user_city: currentUser?.city || "Bengaluru",
        query: searchQuery || undefined
      };
      const res = await api.getProducts(params);
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedGender, selectedBrand, minRating, localOnly, sortBy, searchQuery, currentUser?.city]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      
      {/* Filters Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
            <div className="flex items-center gap-1.5 font-extrabold text-sm text-[#282c3f] uppercase tracking-wider">
              <Filter className="w-4 h-4 text-[#ff3f6c]" />
              <span>Filters</span>
            </div>
            {(selectedBrand || selectedGender !== "All" || minRating > 0 || localOnly) && (
              <button
                onClick={() => {
                  setSelectedGender("All");
                  setSelectedBrand("");
                  setMinRating(0);
                  setLocalOnly(false);
                }}
                className="text-xs font-bold text-[#ff3f6c] hover:underline uppercase"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h4 className="text-xs font-extrabold text-[#282c3f] uppercase tracking-wider mb-2.5">Gender</h4>
            <div className="space-y-1.5">
              {genders.map((g) => (
                <label key={g} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-[#ff3f6c]">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === g}
                    onChange={() => setSelectedGender(g)}
                    className="accent-[#ff3f6c]"
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Rating Filter (Emphasis on Reviews & Ratings) */}
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h4 className="text-xs font-extrabold text-[#282c3f] uppercase tracking-wider mb-2.5">Customer Rating</h4>
            <div className="space-y-1.5">
              {[4.5, 4.0, 3.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    minRating === r ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-300" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{r}★ & above</span>
                  </div>
                  {minRating === r && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h4 className="text-xs font-extrabold text-[#282c3f] uppercase tracking-wider mb-2.5">Brand</h4>
            <div className="space-y-1.5">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    selectedBrand === b ? "bg-pink-50 text-[#ff3f6c] font-bold border border-pink-200" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>{b}</span>
                  {selectedBrand === b && <Check className="w-3.5 h-3.5 text-[#ff3f6c]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Local Seller Fast Delivery Toggle */}
          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={localOnly}
                onChange={(e) => setLocalOnly(e.target.checked)}
                className="mt-0.5 accent-[#ff3f6c]"
              />
              <div>
                <span className="font-bold text-[#282c3f]">Express Dispatch Only</span>
                <p className="text-[10px] text-gray-500">From sellers in {currentUser?.city}</p>
              </div>
            </label>
          </div>

        </div>
      </aside>

      {/* Products Content Area */}
      <main className="flex-1">
        
        {/* Top bar: Result count & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-200">
          <div>
            <span className="text-sm font-extrabold text-[#282c3f]">
              {products.length} Items Found
            </span>
            {searchQuery && (
              <span className="text-xs text-gray-500 ml-2">
                for "<strong className="text-[#282c3f]">{searchQuery}</strong>"
              </span>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-[#282c3f] bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="smart_rank">Smart Rank (AI Review & City Boost)</option>
              <option value="rating_high">Highest Customer Rating & Reviews</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-base font-bold text-gray-700">No matching products found</p>
            <p className="text-xs text-gray-500 mt-1">Try resetting your filters or search for another term.</p>
          </div>
        )}

      </main>

    </div>
  );
};
