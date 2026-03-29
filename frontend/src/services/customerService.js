import api from './api';

export const customerService = {
  // Get all customers
  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  // Get customers for dropdown
  getCustomersDropdown: async () => {
    const response = await api.get('/customers/dropdown');
    return response.data;
  },

  // Get single customer
  getCustomer: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
};

