import api from '@/lib/apiClient';

export const salesOrderService = {
  list: (params) => api.get('/sales-orders', params),
  get: (id) => api.get(`/sales-orders/${id}`),
  create: (payload) => api.post('/sales-orders', payload),
  update: (id, payload) => api.patch(`/sales-orders/${id}`, payload),
  confirm: (id) => api.post(`/sales-orders/${id}/confirm`),
  cancel: (id) => api.post(`/sales-orders/${id}/cancel`),
};

export const invoiceService = {
  list: (params) => api.get('/invoices', params),
  get: (id) => api.get(`/invoices/${id}`),
  create: (payload) => api.post('/invoices', payload),
  update: (id, payload) => api.patch(`/invoices/${id}`, payload),
  confirm: (id) => api.post(`/invoices/${id}/confirm`),
  cancel: (id) => api.post(`/invoices/${id}/cancel`),
  createFromSalesOrder: (salesOrderId) => api.post(`/invoices/from-so/${salesOrderId}`),
};

export default salesOrderService;
