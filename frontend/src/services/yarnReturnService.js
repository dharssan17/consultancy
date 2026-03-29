import api from './api';

export const yarnReturnService = {
  getReturns: async () => {
    const response = await api.get('/yarn-returns');
    return response.data;
  },
  getReturn: async (id) => {
    const response = await api.get(`/yarn-returns/${id}`);
    return response.data;
  },
  createReturn: async (data) => {
    const response = await api.post('/yarn-returns', data);
    return response.data;
  },
  updateReturn: async (id, data) => {
    const response = await api.put(`/yarn-returns/${id}`, data);
    return response.data;
  },
  deleteReturn: async (id) => {
    const response = await api.delete(`/yarn-returns/${id}`);
    return response.data;
  },
};
