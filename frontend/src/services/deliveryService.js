import api from './api';

// Helper to ensure Authorization header is included
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const deliveryService = {
  // Get all deliveries
  getDeliveries: async () => {
    const response = await api.get('/deliveries', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get delivered meters for a design number
  getDeliveredMtrs: async (designNo) => {
    const response = await api.get(`/deliveries/design/${designNo}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single delivery
  getDelivery: async (id) => {
    const response = await api.get(`/deliveries/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create delivery
  createDelivery: async (deliveryData) => {
    const response = await api.post('/deliveries', deliveryData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update delivery
  updateDelivery: async (id, deliveryData) => {
    const response = await api.put(`/deliveries/${id}`, deliveryData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete delivery
  deleteDelivery: async (id) => {
    const response = await api.delete(`/deliveries/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
