import api from './api';

// Helper to ensure Authorization header is included
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const orderService = {
  // Get all orders
  getOrders: async () => {
    const response = await api.get('/orders', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get orders for dropdown
  getOrdersDropdown: async () => {
    const response = await api.get('/orders/dropdown', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single order
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get order details (populated)
  getOrderDetails: async (id) => {
    const response = await api.get(`/orders/${id}/details`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update order
  updateOrder: async (id, orderData) => {
    const response = await api.put(`/orders/${id}`, orderData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete order
  deleteOrder: async (id) => {
    const response = await api.delete(`/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
