import { request } from './http';

export function adminLogin(credentials) {
  return request('/api/admin/login', { method: 'POST', body: credentials });
}

export function listInventory(token, signal) {
  return request('/api/admin/products', { token, signal });
}

export function listOrders(page, token, signal, filters = {}) {
  const params = new URLSearchParams({ page, size: 10 });
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  return request(`/api/admin/orders?${params}`, { token, signal });
}

export const getOrderStats = (token, signal) => request('/api/admin/orders/stats', { token, signal });
export const getAdminOrder = (id, token, signal) => request(`/api/admin/orders/${encodeURIComponent(id)}`, { token, signal });
export const updateOrderStatus = (id, body, token) => request(`/api/admin/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', token, body });

export function uploadImage(file, token) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/admin/images', { method: 'POST', body: form, token });
}
