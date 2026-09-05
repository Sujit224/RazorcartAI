import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AgentProvider } from './context/AgentContext';

// Customer Portal components
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { PersonalizedFeed } from './components/PersonalizedFeed';
import { ProductGrid } from './components/ProductGrid';
import { AgentCopilotModal } from './components/AgentCopilotModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { DemoChaosPanel } from './components/DemoChaosPanel';
import { CustomerSidebar } from './components/CustomerSidebar';

// Portals & Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import { AgenticChatbotLauncher } from './components/AgenticChatbotLauncher';
import { ZoraIntroGuide } from './components/ZoraIntroGuide';

// ─── Customer Storefront ────────────────────────────────────────────────────
function CustomerStorefront() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#282c3f] flex flex-col font-sans">
      <Navbar
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6">
        {!searchQuery && selectedCategory === 'ALL' && <HeroBanner />}
        {!searchQuery && <PersonalizedFeed />}
        <ProductGrid selectedCategory={selectedCategory} searchQuery={searchQuery} />
      </div>

      <footer className="bg-gray-50 border-t border-gray-200 mt-16 py-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            <span className="font-extrabold text-[#282c3f]">RazorCartAI</span> • Agentic AI E-Commerce Platform
          </div>
          <div className="flex items-center gap-4">
            <span>LangGraph Multi-Agent Engine</span>
            <span>•</span>
            <span>Agentic Commerce Core</span>
            <span>•</span>
            <span>Razorpay Test Gateway</span>
          </div>
        </div>
      </footer>

      {/* Agentic Overlays & Floating Launcher */}
      <CustomerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <ZoraIntroGuide />
      <AgenticChatbotLauncher />
      <AgentCopilotModal />
      <CartDrawer />
      <CheckoutModal />
    </div>
  );
}

// ─── Root App with Router ───────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AgentProvider>
            <Routes>
              {/* Storefront as primary landing page */}
              <Route path="/" element={<CustomerStorefront />} />
              <Route path="/store" element={<CustomerStorefront />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Shared login / signup page — role tabs inside */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/merchant/login" element={<LoginPage initialPortal="merchant" />} />
              <Route path="/admin/login" element={<LoginPage initialPortal="admin" />} />

              {/* Merchant portal */}
              <Route path="/merchant/dashboard" element={<MerchantDashboard />} />

              {/* Razorpay Admin portal */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AgentProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
