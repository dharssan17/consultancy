import api from './api';

export const yarnPurchaseService = {
  getPurchases: async () => {
    const response = await api.get('/yarn-purchases');
    return response.data;
  },
  getPurchase: async (id) => {
    const response = await api.get(`/yarn-purchases/${id}`);
    return response.data;
  },
  createPurchase: async (data) => {
    const response = await api.post('/yarn-purchases', data);
    return response.data;
  },
  updatePurchase: async (id, data) => {
    const response = await api.put(`/yarn-purchases/${id}`, data);
    return response.data;
  },
  deletePurchase: async (id) => {
    const response = await api.delete(`/yarn-purchases/${id}`);
    return response.data;
  },
};
