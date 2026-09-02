import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const AgentContext = createContext(null);

export const AgentProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { cart } = useCart();

  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: "👋 Hi! I'm **RazorCart Agentic Copilot**. Ask me to find high-rated running shoes, explore customer reviews, pair complementary gear, or checkout directly!",
      intent: 'general',
      products: [],
      fbt_products: [],
      suggested_actions: [
        "Find pink road running shoes under ₹4,000",
        "Show highest-rated marathon sneakers",
        "Pair running socks with my cart"
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeRecoveryData, setActiveRecoveryData] = useState(null);
  const [activeCheckoutData, setActiveCheckoutData] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const sendMessage = async (messageText, simulationFlag = null) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const cartIds = cart.items.map(it => it.product_id);
      const res = await api.agentChat({
        message: messageText,
        user_id: currentUser?.id || 1,
        user_city: currentUser?.city || "Bengaluru",
        session_id: `sess_${currentUser?.id || 1}`,
        current_cart_ids: cartIds,
        simulation_flag: simulationFlag
      });

      const data = res.data;

      // Handle checkout or recovery data
      if (data.checkout_data) {
        setActiveCheckoutData(data.checkout_data);
      }
      if (data.recovery_data) {
        setActiveRecoveryData(data.recovery_data);
      }

      const agentMsg = {
        sender: 'agent',
        text: data.reply,
        intent: data.intent,
        products: data.products || [],
        fbt_products: data.fbt_products || [],
        checkout_data: data.checkout_data,
        recovery_data: data.recovery_data,
        audit_id: data.audit_id,
        suggested_actions: data.suggested_actions || []
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      console.error("Agent chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: "I encountered a minor network issue. Showing top rated products from catalog.",
          intent: 'error',
          products: [],
          fbt_products: [],
          suggested_actions: ["Retry search"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const triggerDirectCheckout = (checkoutData) => {
    setActiveCheckoutData(checkoutData);
    setIsCheckoutModalOpen(true);
  };

  return (
    <AgentContext.Provider value={{
      isAgentOpen,
      setIsAgentOpen,
      messages,
      loading,
      sendMessage,
      activeRecoveryData,
      setActiveRecoveryData,
      activeCheckoutData,
      setActiveCheckoutData,
      isAuditModalOpen,
      setIsAuditModalOpen,
      isCheckoutModalOpen,
      setIsCheckoutModalOpen,
      triggerDirectCheckout
    }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => useContext(AgentContext);
