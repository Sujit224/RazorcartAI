import React, { useState, useEffect } from 'react';
import { Filter, Star, Check, ArrowUpDown } from 'lucide-react';
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
      const isDeptCat = ["ELECTRONICS", "APPLIANCES", "HOME & KITCHEN", "BEAUTY & PERSONAL CARE", "BOOKS", "Books", "HOME & FURNITURE", "Home & Furniture", "Home & Furnishings"].includes(selectedCategory);

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
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sticky top-24 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
            <div className="flex items-center gap-2 font-black text-xs text-[#0c2340] uppercase tracking-wider">
              <Filter className="w-4 h-4 text-[#0066cc]" />
              <span>Catalog Filters</span>
            </div>
            {(selectedBrand || selectedGender !== "All" || minRating > 0 || localOnly) && (
              <button
                onClick={() => {
                  setSelectedGender("All");
                  setSelectedBrand("");
                  setMinRating(0);
                  setLocalOnly(false);
                }}
                className="text-xs font-bold text-[#0066cc] hover:underline uppercase cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="mb-5 pb-4 border-b border-[#e2e8f0]">
            <h4 className="text-xs font-black text-[#0c2340] uppercase tracking-wider mb-2.5">Gender / Fit</h4>
            <div className="space-y-2">
              {genders.map((g) => (
                <label key={g} className="flex items-center gap-2 text-xs text-[#5c6f84] cursor-pointer hover:text-[#0c2340] font-medium">
                  <input
                    type="radio"
                    name="gender"
                    checked={selectedGender === g}
                    onChange={() => setSelectedGender(g)}
                    className="accent-[#0066cc]"
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div className="mb-5 pb-4 border-b border-[#e2e8f0]">
            <h4 className="text-xs font-black text-[#0c2340] uppercase tracking-wider mb-2.5">Verified Reviews</h4>
            <div className="space-y-1.5">
              {[4.5, 4.0, 3.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(minRating === r ? 0 : r)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    minRating === r ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "hover:bg-[#f8fafc] text-[#5c6f84]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-[#00b386] text-[#00b386]" />
                    <span>{r}★ & above</span>
                  </div>
                  {minRating === r && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-5 pb-4 border-b border-[#e2e8f0]">
            <h4 className="text-xs font-black text-[#0c2340] uppercase tracking-wider mb-2.5">Top Brands</h4>
            <div className="space-y-1">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(selectedBrand === b ? "" : b)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedBrand === b ? "bg-[#f0f7ff] text-[#0066cc] font-black border border-[#0066cc]/30" : "hover:bg-[#f8fafc] text-[#5c6f84] font-medium"
                  }`}
                >
                  <span>{b}</span>
                  {selectedBrand === b && <Check className="w-3.5 h-3.5 text-[#0066cc]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Local Fast Dispatch Toggle */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-[#5c6f84] cursor-pointer">
              <input
                type="checkbox"
                checked={localOnly}
                onChange={(e) => setLocalOnly(e.target.checked)}
                className="mt-0.5 accent-[#00b386]"
              />
              <div>
                <span className="font-extrabold text-[#0c2340]">Express Dispatch</span>
                <p className="text-[10px] text-[#5c6f84]">Sellers in {currentUser?.city}</p>
              </div>
            </label>
          </div>

        </div>
      </aside>

      {/* Products Content Area */}
      <main className="flex-1">
        
        {/* Top bar: Result count & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#e2e8f0]">
          <div>
            <span className="text-sm font-black text-[#0c2340]">
              {products.length} Products Available
            </span>
            {searchQuery && (
              <span className="text-xs text-[#5c6f84] ml-2 font-medium">
                matching "<strong className="text-[#0c2340]">{searchQuery}</strong>"
              </span>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#5c6f84]" />
            <span className="text-xs font-semibold text-[#5c6f84]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-[#0c2340] bg-[#f8fafc] border border-[#e2e8f0] px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#0066cc] cursor-pointer"
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
              <div key={n} className="aspect-[3/4] bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#e2e8f0]">
            <p className="text-base font-bold text-[#0c2340]">No matching products found</p>
            <p className="text-xs text-[#5c6f84] mt-1 font-medium">Try resetting your filters or search for another term.</p>
          </div>
        )}

      </main>

    </div>
  );
};
