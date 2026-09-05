import api from '@/lib/apiClient';

export const purchaseOrderService = {
  list: (params) => api.get('/purchase-orders', params),
  get: (id) => api.get(`/purchase-orders/${id}`),
  create: (payload) => api.post('/purchase-orders', payload),
  update: (id, payload) => api.patch(`/purchase-orders/${id}`, payload),
  confirm: (id) => api.post(`/purchase-orders/${id}/confirm`),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`),
};

export const vendorBillService = {
  list: (params) => api.get('/vendor-bills', params),
  get: (id) => api.get(`/vendor-bills/${id}`),
  create: (payload) => api.post('/vendor-bills', payload),
  update: (id, payload) => api.patch(`/vendor-bills/${id}`, payload),
  confirm: (id) => api.post(`/vendor-bills/${id}/confirm`),
  cancel: (id) => api.post(`/vendor-bills/${id}/cancel`),
  createFromPurchaseOrder: (purchaseOrderId) =>
    api.post(`/vendor-bills/from-po/${purchaseOrderId}`),
};

export default purchaseOrderService;
