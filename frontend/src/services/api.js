import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// ─── Token helpers ──────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem('rc_token');

export const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const apiClient = axios.create({ baseURL: API_BASE });

// Auto-attach token on every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  login: (email, password, role) =>
    apiClient.post('/api/auth/login', { email, password, role }),

  register: (data) => apiClient.post('/api/auth/register', data),

  getMe: () => apiClient.get('/api/auth/me'),

  switchPersona: (userId) =>
    apiClient.post(`/api/auth/switch-persona/${userId}`),

  // ─── Customer: Products & Personalization ─────────────────────────────────

  getProducts: (params = {}) =>
    apiClient.get('/api/products', { params }),

  getPersonalizedFeed: (userId = 1) =>
    apiClient.get(`/api/products/personalized-feed?user_id=${userId}`),

  getProductDetails: (id, userId) =>
    apiClient.get(`/api/products/${id}`, { params: { user_id: userId } }),

  // ─── Customer: Ratings & Reviews ──────────────────────────────────────────

  getProductReviews: (productId) =>
    apiClient.get(`/api/products/${productId}/reviews`),

  createProductReview: (productId, data) =>
    apiClient.post(`/api/products/${productId}/reviews`, data),

  // ─── Customer: Orders ─────────────────────────────────────────────────────

  getMyOrders: (userId = 1) =>
    apiClient.get(`/api/orders/my-orders?user_id=${userId}`),

  // ─── Customer: Cart ───────────────────────────────────────────────────────

  getCart: (userId = 1) => apiClient.get(`/api/cart?user_id=${userId}`),
  addToCart: (data, userId = 1) =>
    apiClient.post(`/api/cart/add?user_id=${userId}`, data),
  removeFromCart: (itemId, userId = 1) =>
    apiClient.delete(`/api/cart/remove/${itemId}?user_id=${userId}`),
  clearCart: (userId = 1) =>
    apiClient.delete(`/api/cart/clear?user_id=${userId}`),

  // ─── Customer: AI Copilot ─────────────────────────────────────────────────

  agentChat: (data) => apiClient.post('/api/agent/chat', data),

  // ─── Customer: Payments ───────────────────────────────────────────────────

  createPaymentOrder: (data) => apiClient.post('/api/payment/create-order', data),
  confirmPaymentSuccess: (data) =>
    apiClient.post('/api/payment/confirm-success', data),

  // ─── Merchant Portal ──────────────────────────────────────────────────────

  getMerchantDashboard: () => apiClient.get('/api/merchant/dashboard'),
  getMerchantTransactions: (page = 1, perPage = 20) =>
    apiClient.get(`/api/merchant/transactions?page=${page}&per_page=${perPage}`),
  getMerchantDailyChart: (days = 30) =>
    apiClient.get(`/api/merchant/daily-chart?days=${days}`),
  getMerchantProducts: (params = {}) =>
    apiClient.get('/api/merchant/products', { params }),
  addMerchantProduct: (data) =>
    apiClient.post('/api/merchant/products', data),
  deleteMerchantProduct: (id) =>
    apiClient.delete(`/api/merchant/products/${id}`),
  getMerchantCustomers: () =>
    apiClient.get('/api/merchant/customers'),
  getMerchantCustomerDetails: (userId) =>
    apiClient.get(`/api/merchant/customers/${userId}`),

  // ─── Admin Portal ─────────────────────────────────────────────────────────

  getAdminDashboard: (days = 30) =>
    apiClient.get(`/api/admin/dashboard?days=${days}`),
  getAllMerchants: () => apiClient.get('/api/admin/merchants'),
  onboardMerchant: (data) => apiClient.post('/api/admin/merchants', data),
  getMerchantStats: (merchantId) =>
    apiClient.get(`/api/admin/merchants/${merchantId}/stats`),
  getMerchantTransactionsAdmin: (merchantId, page = 1) =>
    apiClient.get(`/api/admin/merchants/${merchantId}/transactions?page=${page}`),
};
