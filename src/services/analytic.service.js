import api from '@/lib/apiClient';

export const analyticAccountService = {
  list: () => api.get('/analytic-accounts'),
  get: (id) => api.get(`/analytic-accounts/${id}`),
  create: (payload) => api.post('/analytic-accounts', payload),
  update: (id, payload) => api.patch(`/analytic-accounts/${id}`, payload),
  remove: (id) => api.del(`/analytic-accounts/${id}`),
};

export default analyticAccountService;
