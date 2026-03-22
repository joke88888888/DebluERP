import api from '../utils/api';

const crud = (path) => ({
  getAll: (params) => api.get(path, { params }),
  getById: (id) => api.get(`${path}/${id}`),
  create: (data) => api.post(path, data),
  update: (id, data) => api.put(`${path}/${id}`, data),
  remove: (id) => api.delete(`${path}/${id}`),
});

export const gendersApi = crud('/genders');
export const colorsApi = crud('/colors');
export const sizesApi = crud('/sizes');
export const versionsApi = crud('/versions');
export const categoriesApi = crud('/product-categories');
export const productionMethodsApi = crud('/production-methods');
export const brandsApi = {
  ...crud('/brands'),
  create: (data) => api.post('/brands', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/brands/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const modelsApi = {
  ...crud('/models'),
  create: (data) => api.post('/models', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/models/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const provincesApi = { getAll: (params) => api.get('/provinces', { params }) };
export const regionsApi = crud('/regions');
export const employeesApi = {
  ...crud('/employees'),
  create: (data) => api.post('/employees', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/employees/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPositions: () => api.get('/employees/positions'),
  getEmploymentTypes: () => api.get('/employees/employment-types'),
  uploadDocument: (id, data) => api.post(`/employees/${id}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (id, docId) => api.delete(`/employees/${id}/documents/${docId}`),
  uploadProfileImage: (id, data) => api.post(`/employees/${id}/profile-image`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};
export const customersApi = crud('/customers');
export const discountCodesApi = crud('/discount-codes');
export const commissionRulesApi = crud('/commission-rules');
export const productsApi = {
  ...crud('/products'),
  create: (data) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  createBulk: (data) => api.post('/products/bulk', data),
  uploadImages: (id, data) => api.post(`/products/${id}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id, imgId) => api.delete(`/products/${id}/images/${imgId}`),
  checkSku: (sku) => api.get(`/products/check-sku/${sku}`),
  getAllSkus: () => api.get('/products', { params: { limit: 9999 } }),
};
