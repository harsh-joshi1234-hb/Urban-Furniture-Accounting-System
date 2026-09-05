import api from '@/lib/apiClient';

/**
 * Chart of accounts.
 * Backend: GET/POST /accounts, PATCH /accounts/:id,
 *          GET /accounts/:id/balance, GET /accounts/:id/ledger
 * There is no DELETE - accounts are deactivated via isActive.
 */
export const accountService = {
  list: (params) => api.get('/accounts', params),
  get: (id) => api.get(`/accounts/${id}`),
  create: (payload) => api.post('/accounts', payload),
  update: (id, payload) => api.patch(`/accounts/${id}`, payload),
  setActive: (id, isActive) => api.patch(`/accounts/${id}`, { isActive }),
  /** Authoritative period balance: debitTotal, creditTotal, balance (POSTED only). */
  balance: (id, params) => api.get(`/accounts/${id}/balance`, params),
  /** Posted journal items for one account, ordered by accounting date. */
  ledger: (id, params) => api.get(`/accounts/${id}/ledger`, params),
};

/** Journals. Backend supports list / detail / create only - no update or delete. */
export const journalService = {
  list: () => api.get('/journals'),
  get: (id) => api.get(`/journals/${id}`),
  create: (payload) => api.post('/journals', payload),
};

/**
 * Journal entries.
 * PATCH only accepts DRAFT entries; post/cancel are backend state transitions.
 */
export const journalEntryService = {
  list: (params) => api.get('/journal-entries', params),
  get: (id) => api.get(`/journal-entries/${id}`),
  create: (payload) => api.post('/journal-entries', payload),
  update: (id, payload) => api.patch(`/journal-entries/${id}`, payload),
  post: (id) => api.post(`/journal-entries/${id}/post`),
  cancel: (id) => api.post(`/journal-entries/${id}/cancel`),
};

export default accountService;
