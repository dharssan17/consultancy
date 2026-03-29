import api from './api';

export const productionService = {
  // Get all productions
  getProductions: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.designNo) queryParams.append('designNo', params.designNo);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    const url = `/productions${queryString ? `?${queryString}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  // Get single production
  getProduction: async (id) => {
    const response = await api.get(`/productions/${id}`);
    return response.data;
  },

  // Create production
  createProduction: async (productionData) => {
    const response = await api.post('/productions', productionData);
    return response.data;
  },

  // Update production
  updateProduction: async (id, productionData) => {
    const response = await api.put(`/productions/${id}`, productionData);
    return response.data;
  },

  // Delete production
  deleteProduction: async (id) => {
    const response = await api.delete(`/productions/${id}`);
    return response.data;
  },
};

