import api from '@/lib/apiClient';

export const userService = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
  activate: (id) => api.patch(`/users/${id}/activate`),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  roles: () => api.get('/roles'),
};

export default userService;
