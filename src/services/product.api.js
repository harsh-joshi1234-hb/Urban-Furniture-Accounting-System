import api from '@/lib/apiClient';

export const productService = {
  list: (params) => api.get('/products', params),
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.patch(`/products/${id}`, payload),
  remove: (id) => api.del(`/products/${id}`),
};

export const productCategoryService = {
  list: () => api.get('/product-categories'),
  get: (id) => api.get(`/product-categories/${id}`),
  create: (payload) => api.post('/product-categories', payload),
  update: (id, payload) => api.patch(`/product-categories/${id}`, payload),
  remove: (id) => api.del(`/product-categories/${id}`),
};

export default productService;
