import api from '@/lib/apiClient';

/** Customer portal. The backend enforces ownership on every one of these. */
export const portalService = {
  invoices: () => api.get('/portal/invoices'),
  invoice: (id) => api.get(`/portal/invoices/${id}`),
  initiatePayment: (invoiceId, amount) =>
    api.post('/portal/payments', { invoiceId, amount: Number(amount) }),
};

export default portalService;
