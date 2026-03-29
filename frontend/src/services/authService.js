import api from './api';

export const authService = {
  login: async (email, password) => {
    try {
      console.log('[AUTH] Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('role', response.data.data.user.role || 'data_entry');
        console.log('[AUTH] Login successful, role:', response.data.data.user.role);
      }
      return response.data;
    } catch (error) {
      console.error('[AUTH] Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      console.log('[AUTH] Attempting registration for:', userData.email);
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('role', response.data.data.user.role || 'data_entry');
        console.log('[AUTH] Registration successful, role:', response.data.data.user.role);
      }
      return response.data;
    } catch (error) {
      console.error('[AUTH] Registration error:', error.response?.data || error.message);
      throw error;
    }
  },

  logout: () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      const parsedUser = user ? JSON.parse(user) : null;
      if (parsedUser && !parsedUser.role) {
        // Fallback: get role from localStorage if not in user object
        parsedUser.role = localStorage.getItem('role') || 'data_entry';
      }
      return parsedUser;
    } catch (error) {
      console.error('[AUTH] Error getting current user:', error);
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || localStorage.getItem('role') || 'data_entry';
  },

  isAdmin: () => {
    return authService.getRole() === 'admin';
  },

  getMe: async () => {
    try {
      console.log('[AUTH] Fetching current user info');
      const response = await api.get('/auth/me');
      if (response.data.success && response.data.data.user) {
        // Update stored user info
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        localStorage.setItem('role', response.data.data.user.role || 'data_entry');
        console.log('[AUTH] User info updated, role:', response.data.data.user.role);
      }
      return response.data;
    } catch (error) {
      console.error('[AUTH] Error fetching user info:', error.response?.data || error.message);
      throw error;
    }
  },
};

