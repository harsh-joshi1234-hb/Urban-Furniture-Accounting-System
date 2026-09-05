import api from '@/lib/apiClient';

export const contactService = {
  list: (params) => api.get('/contacts', params),
  get: (id) => api.get(`/contacts/${id}`),
  create: (payload) => api.post('/contacts', payload),
  update: (id, payload) => api.patch(`/contacts/${id}`, payload),
  remove: (id) => api.del(`/contacts/${id}`),
};

export default contactService;
