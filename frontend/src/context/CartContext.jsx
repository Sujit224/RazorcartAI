import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    shipping_fee: 0,
    total: 0,
    item_count: 0,
    fbt_recommendations: []
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await api.getCart(currentUser.id);
      setCart(res.data);
    } catch (err) {
      console.warn("Failed to load cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser?.id]);

  const addToCart = async (productId, quantity = 1, size = "UK 8") => {
    try {
      await api.addToCart({ product_id: productId, quantity, size }, currentUser?.id || 1);
      await fetchCart();
      setIsCartOpen(true);
    } catch (err) {
      console.error("Failed to add to bag:", err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await api.removeFromCart(itemId, currentUser?.id || 1);
      await fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart(currentUser?.id || 1);
      await fetchCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      refreshCart: fetchCart,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
