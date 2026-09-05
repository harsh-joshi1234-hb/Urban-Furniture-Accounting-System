import api from '@/lib/apiClient';

/** Chart of accounts - needed by invoice / bill line pickers. */
export const accountService = {
  list: (params) => api.get('/accounts', params),
  get: (id) => api.get(`/accounts/${id}`),
  balance: (id, params) => api.get(`/accounts/${id}/balance`, params),
  ledger: (id, params) => api.get(`/accounts/${id}/ledger`, params),
};

export const journalService = {
  list: () => api.get('/journals'),
  get: (id) => api.get(`/journals/${id}`),
};

export const journalEntryService = {
  list: (params) => api.get('/journal-entries', params),
  get: (id) => api.get(`/journal-entries/${id}`),
};

export default accountService;
