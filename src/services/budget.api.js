import api from '@/lib/apiClient';

/**
 * Budgets. Backend: GET/POST /budgets, PATCH /budgets/:id (DRAFT only),
 * POST /budgets/:id/{confirm,revise,cancel}.
 *
 * List and detail responses already carry the computed figures - achievedAmount,
 * amountToAchieve and achievedPct - so the frontend never derives them.
 */
export const budgetService = {
  list: (params) => api.get('/budgets', params),
  get: (id) => api.get(`/budgets/${id}`),
  create: (payload) => api.post('/budgets', payload),
  /** Only DRAFT budgets accept updates. */
  update: (id, payload) => api.patch(`/budgets/${id}`, payload),
  confirm: (id) => api.post(`/budgets/${id}/confirm`),
  /** Revising moves the original to REVISED and returns the new CONFIRMED budget. */
  revise: (id, payload) => api.post(`/budgets/${id}/revise`, payload),
  cancel: (id) => api.post(`/budgets/${id}/cancel`),
};

export default budgetService;
