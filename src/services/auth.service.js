import api from '@/lib/apiClient';

export const authService = {
  login: (loginId, password) => api.post('/auth/login', { loginId, password }),
  signup: (payload) => api.post('/auth/signup', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export default authService;
