import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Read a FastAPI error body without assuming its shape: `detail` is sometimes a
// string and sometimes a list of validation objects.
const errorText = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
};

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
  // The last thing the cart refused or clamped, e.g. "capped at the 10-unit
  // per-item maximum". The bounds are the point of the design, so a bound that
  // silently swallows a click reads to the user as a broken button.
  const [notice, setNotice] = useState(null);

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
      const res = await api.addToCart(
        { product_id: productId, quantity, size },
        currentUser?.id || 1
      );
      // The server clamps to the per-line cap and to available stock, so `added`
      // is what was actually granted. Surface a shortfall instead of letting the
      // UI imply the whole quantity landed.
      setNotice(res.data?.added < quantity ? res.data.message : null);
      await fetchCart();
      setIsCartOpen(true);
    } catch (err) {
      // 409 is the per-line cap or a stock ceiling, not a crash. Say which.
      console.error("Failed to add to bag:", err);
      setNotice(errorText(err, "Could not add that to your bag."));
    }
  };

  /**
   * Set an existing line's quantity.
   *
   * Returns the server's view of the line so a caller can react to a clamp: the
   * backend caps at MAX_QTY_PER_LINE and at available stock, so `quantity` in
   * the response is what was actually applied, not what was asked for. A
   * quantity of 0 or less deletes the line, which the server reports as
   * `removed: true`.
   */
  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.updateCartItem(itemId, { quantity }, currentUser?.id || 1);
      setNotice(res.data?.note || null);
      await fetchCart();
      return res.data;
    } catch (err) {
      console.error("Failed to update quantity:", err);
      setNotice(errorText(err, "Could not change that quantity."));
      return null;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await api.removeFromCart(itemId, currentUser?.id || 1);
      setNotice(null);
      await fetchCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      setNotice(errorText(err, "Could not remove that item."));
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart(currentUser?.id || 1);
      setNotice(null);
      await fetchCart();
    } catch (err) {
      console.error("Failed to clear cart:", err);
      setNotice(errorText(err, "Could not clear your bag."));
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: fetchCart,
      notice,
      dismissNotice: () => setNotice(null),
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
