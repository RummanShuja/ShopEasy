import { request } from './http';

export function adminLogin(credentials) {
  return request('/api/admin/login', { method: 'POST', body: credentials });
}

export function listInventory(token, signal) {
  return request('/api/admin/products', { token, signal });
}

export function listOrders(page, token, signal) {
  return request(`/api/admin/orders?page=${page}&size=10`, { token, signal });
}

export function uploadImage(file, token) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/admin/images', { method: 'POST', body: form, token });
}
