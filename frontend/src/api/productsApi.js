import { request } from './http';

const PRODUCTS = '/api/products';
const pathFor = (id) => `${PRODUCTS}/${encodeURIComponent(id)}`;

export function listProducts(query, signal) {
  return request(query ? `${PRODUCTS}?${query}` : PRODUCTS, { signal });
}

export function listCategories(signal) {
  return request(`${PRODUCTS}/categories`, { signal });
}

export function getProduct(id, signal) {
  return request(pathFor(id), { signal });
}

export function createProduct(product, token) {
  return request(PRODUCTS, { method: 'POST', body: product, token });
}

export function updateProduct(id, product, token) {
  return request(pathFor(id), { method: 'PUT', body: product, token });
}

export function deleteProduct(id, token) {
  return request(pathFor(id), { method: 'DELETE', token });
}
