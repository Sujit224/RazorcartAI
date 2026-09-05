import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const AgentContext = createContext(null);

export const AgentProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { cart, refreshCart } = useCart();
  // AgentProvider sits inside <BrowserRouter> (see App.jsx), so the agent can
  // act on a navigate instruction itself rather than passing one down to the
  // chat panel and hoping the panel is mounted.
  const navigate = useNavigate();

  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: "Hi! I'm **ZORA, your RazorCart Agentic Copilot**. Ask me to find high-rated running shoes, show your bag, reorder a past purchase, or checkout — and say things like *\"open the first one\"* or *\"increase the quantity\"* and I will know what you mean.",
      intent: 'general',
      products: [],
      fbt_products: [],
      cart_snapshot: null,
      orders_snapshot: [],
      suggested_actions: [
        "Show me my cart",
        "What are my past orders",
        "Find pink road running shoes under ₹4,000"
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [activeRecoveryData, setActiveRecoveryData] = useState(null);
  const [activeCheckoutData, setActiveCheckoutData] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [agentMode, setAgentMode] = useState('standard');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Use a ref for sendMessage so the speech event handlers always call the latest version
  const sendMessageRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Web Speech API is not supported in this browser.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-IN';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setSpeechTranscript(final || interim);
      
      if (final) {
        setSpeechTranscript('');
        if (sendMessageRef.current) sendMessageRef.current(final);
      }
    };

    recognitionRef.current.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setVoiceError(event.error);
      }
    };

    recognitionRef.current.onend = () => {
      if (agentMode === 'voice' && !isSpeakingRef.current) {
         try { recognitionRef.current.start(); } catch(e){}
      } else {
         setIsListening(false);
      }
    };
  }, [agentMode]);

  useEffect(() => {
    if (agentMode === 'voice') {
      try { recognitionRef.current?.start(); } catch(e){}
    } else {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
  }, [agentMode]);

  useEffect(() => {
    if (agentMode === 'voice' && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'agent' && lastMsg.text) {
        let textToSpeak = lastMsg.text.replace(/\*\*/g, '').replace(/\*/g, '');
        if (lastMsg.pending_confirmation && lastMsg.pending_confirmation.prompt) {
           textToSpeak = lastMsg.pending_confirmation.prompt;
        }
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.onstart = () => {
          setIsSpeaking(true);
          recognitionRef.current?.stop();
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          if (agentMode === 'voice') {
            try { recognitionRef.current?.start(); } catch(e){}
          }
        };
        synthRef.current?.cancel();
        synthRef.current?.speak(utterance);
      }
    }
  }, [messages, agentMode]);

  const toggleVoiceMode = () => {
    setAgentMode(prev => prev === 'standard' ? 'voice' : 'standard');
  };

  const sendMessage = async (messageText, simulationFlag = null) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const cartIds = (cart?.items || []).map(it => it.product_id);
      const lastAgentMsg = [...messages].reverse().find(m => m.sender === 'agent' && m.products?.length > 0);
      const prevProducts = lastAgentMsg ? lastAgentMsg.products : [];

      const historyFormatted = messages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.agentChat({
        message: messageText,
        user_id: currentUser?.id || 1,
        user_city: currentUser?.city || "Bengaluru",
        session_id: `sess_${currentUser?.id || 1}`,
        current_cart_ids: cartIds,
        simulation_flag: simulationFlag,
        chat_history: historyFormatted,
        previous_products: prevProducts,
        voice_mode: agentMode === 'voice'
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
        suggested_actions: data.suggested_actions || [],
        // ── Conversational operations ──────────────────────────────────────
        // `focus_list` is the numbered list this turn established, so the panel
        // can show the same ordinals the user is about to refer to.
        focus_list: data.focus_list || [],
        // `reference_reason` is why the agent picked that item. It is rendered,
        // not just logged, so a wrong resolution is visible before it compounds
        // into a wrong purchase.
        reference_reason: data.reference_reason || null,
        cart_snapshot: data.cart_snapshot || null,
        orders_snapshot: data.orders_snapshot || null,
        action_result: data.action_result || null,
        pending_confirmation: data.pending_confirmation || null
      };

      setMessages(prev => [...prev, agentMsg]);

      // A turn that touched the bag has to refresh the shared cart state, or the
      // navbar badge and drawer keep showing a bag the agent has already
      // changed. `action_result` is present on refusals too, where `executed` is
      // false and the refetch is a no-op that costs one request.
      if (data.action_result || data.cart_snapshot) {
        await refreshCart();
      }

      // `client_action` is the agent asking the UI to move. Navigating with the
      // copilot open would put the destination behind a full-screen overlay, so
      // close the panel — the conversation is kept in state and comes back with
      // it.
      if (data.client_action?.type === 'navigate' && data.client_action.path) {
        setIsAgentOpen(false);
        navigate(data.client_action.path);
      }
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

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  /**
   * Answer a gated action.
   *
   * Deliberately sends a plain "yes"/"no" back through the same chat endpoint
   * rather than calling a dedicated confirm API. The server only reads a
   * confirmation while that session is holding a pending action, so consent
   * cannot be manufactured by a client that posts "yes" out of the blue — and
   * the approval lands in the audit ledger as a turn like any other.
   */
  const respondToGate = (approve) => sendMessage(approve ? "yes" : "no");

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
      respondToGate,
      activeRecoveryData,
      setActiveRecoveryData,
      activeCheckoutData,
      setActiveCheckoutData,
      isAuditModalOpen,
      setIsAuditModalOpen,
      isCheckoutModalOpen,
      setIsCheckoutModalOpen,
      triggerDirectCheckout,
      agentMode,
      setAgentMode,
      toggleVoiceMode,
      isListening,
      isSpeaking,
      speechTranscript,
      voiceError
    }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => useContext(AgentContext);
