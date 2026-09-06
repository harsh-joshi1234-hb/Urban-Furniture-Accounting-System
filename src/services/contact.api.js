import api from '@/lib/apiClient';

export const contactService = {
  list: (params) => api.get('/contacts', params),
  get: (id) => api.get(`/contacts/${id}`),
  create: (payload) => api.post('/contacts', payload),
  update: (id, payload) => api.patch(`/contacts/${id}`, payload),
  remove: (id) => api.del(`/contacts/${id}`),

  /**
   * Portal access - which login accounts may see this customer's invoices.
   * A portal user with no link here sees nothing, so this is what makes a
   * customer's documents visible to them and to nobody else.
   */
  portalCandidates: () => api.get('/contacts/portal-candidates'),
  portalUsers: (id) => api.get(`/contacts/${id}/portal-users`),
  grantPortalAccess: (id, userId) => api.post(`/contacts/${id}/portal-users`, { userId }),
  revokePortalAccess: (id, userId) => api.del(`/contacts/${id}/portal-users/${userId}`),
};

export default contactService;
