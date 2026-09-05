import api from '@/lib/apiClient';

/**
 * Financial reports. All three are read-only and fully computed by the backend
 * from POSTED journal entries (P&L, balance sheet) or budget records.
 *
 * The report validators reject unknown query keys, so only the documented
 * filters below may be sent.
 */
export const reportService = {
  /** startDate, endDate (both optional ISO dates). */
  profitAndLoss: (params) => api.get('/reports/profit-loss', params),
  /** asOfDate (optional ISO date). */
  balanceSheet: (params) => api.get('/reports/balance-sheet', params),
  /** startDate, endDate, type, analyticAccountId, responsibleContactId, status. */
  budget: (params) => api.get('/reports/budget', params),
};

export default reportService;
