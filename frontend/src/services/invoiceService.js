import api from './api';

// Helper to ensure Authorization header is included
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const invoiceService = {
  // Get all invoices
  getInvoices: async () => {
    const response = await api.get('/invoices', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Get single invoice
  getInvoice: async (id) => {
    const response = await api.get(`/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Create invoice
  createInvoice: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Update invoice
  updateInvoice: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    const response = await api.delete(`/invoices/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};



