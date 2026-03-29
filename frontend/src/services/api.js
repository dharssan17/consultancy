import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('[FRONTEND API] API Base URL:', API_URL);
console.log('[FRONTEND API] Environment:', process.env.NODE_ENV);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Remove Authorization header if no token
      delete config.headers.Authorization;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FRONTEND API] ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[FRONTEND API] Request error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FRONTEND API] ✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  (error) => {
    console.error('[FRONTEND API] Response error:', error.message);
    if (error.response) {
      console.error('[FRONTEND API] Status:', error.response.status);
      console.error('[FRONTEND API] Data:', error.response.data);
    } else if (error.request) {
      console.error('[FRONTEND API] No response received. Check if backend is running on', API_URL);
    }
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

