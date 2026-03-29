import api from './api';

export const yarnSupplierService = {
  getSuppliers: async () => {
    const response = await api.get('/yarn-suppliers');
    return response.data;
  },
  getSuppliersDropdown: async () => {
    const response = await api.get('/yarn-suppliers/dropdown');
    return response.data;
  },
  getSupplier: async (id) => {
    const response = await api.get(`/yarn-suppliers/${id}`);
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/yarn-suppliers', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/yarn-suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/yarn-suppliers/${id}`);
    return response.data;
  },
};
