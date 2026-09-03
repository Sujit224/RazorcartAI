import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAgent } from '../context/AgentContext';

export const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, addToCart, clearCart } = useCart();
  const { currentUser } = useAuth();
  const { setIsCheckoutModalOpen, setActiveCheckoutData } = useAgent();

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setActiveCheckoutData({
      amount: cart.total,
      razorpay_order_id: null,
      items_summary: cart.items.map(it => `${it.quantity}x ${it.product.brand} ${it.product.title}`)
    });
    setIsCheckoutModalOpen(true);
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-in">
        
        {/* Cart Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0066cc]" />
            <h3 className="font-extrabold text-base text-[#0c2340]">
              SHOPPING BAG ({cart.item_count} Items)
            </h3>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery Address Pill */}
        <div className="bg-[#f0f7ff]/70 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Deliver to <strong className="text-[#0c2340]">{currentUser?.name}</strong>, {currentUser?.city}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            Express Active
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">Hey, it feels so light!</p>
              <p className="text-xs text-gray-400 mt-1">There is nothing in your bag. Let's add some items.</p>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex gap-3 relative hover:shadow-sm transition-shadow"
              >
                <img
                  src={item.product.image_url}
                  alt={item.product.title}
                  className="w-16 h-20 object-cover rounded bg-gray-100 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-xs text-[#0c2340] truncate">{item.product.brand}</h4>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600 truncate">{item.product.title}</p>
                  
                  <div className="text-[10px] text-gray-500 mt-1">
                    Size: <strong>{item.size}</strong> • Qty: <strong>{item.quantity}</strong>
                    {item.priority === 0 && (
                      <span className="ml-2 text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                        Negotiable Accessory
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-xs text-[#0c2340]">
                      Rs. {Math.round(item.product.price * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ★ {item.product.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* FBT Recommendations Tile */}
          {cart.fbt_recommendations && cart.fbt_recommendations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0c2340] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>Frequently Bought Together</span>
              </div>
              <div className="space-y-2">
                {cart.fbt_recommendations.map((fbt) => (
                  <div
                    key={fbt.id}
                    className="p-2.5 bg-[#f0f7ff]/60 rounded-lg border border-blue-100 flex items-center justify-between gap-3"
                  >
                    <img src={fbt.image_url} alt={fbt.title} className="w-10 h-10 object-cover rounded bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{fbt.brand} {fbt.title}</p>
                      <p className="text-[11px] font-semibold text-gray-600">
                        Rs. {Math.round(fbt.price).toLocaleString()} • <span className="text-emerald-700">★ {fbt.rating}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(fbt.id, 1, "Standard")}
                      className="px-2.5 py-1 bg-[#0066cc] hover:bg-[#0052a3] text-white text-[11px] font-bold rounded shadow-sm"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Price Breakdown & Footer */}
        {cart.items.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
            <div className="space-y-1.5 text-xs text-gray-600 mb-3">
              <div className="flex justify-between">
                <span>Bag Total:</span>
                <span className="font-semibold text-gray-800">Rs. {Math.round(cart.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Convenience / Delivery Fee:</span>
                <span className="font-semibold text-emerald-700">{cart.shipping_fee === 0 ? "FREE" : `Rs. ${cart.shipping_fee}`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100 text-sm font-extrabold text-[#0c2340]">
                <span>Total Amount:</span>
                <span className="text-[#0066cc]">Rs. {Math.round(cart.total).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3 bg-[#0066cc] hover:bg-[#0052a3] text-white font-extrabold text-sm rounded shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
