import { request } from './http';

export function placeOrder(order, key, token) {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: order,
    token,
  });
}
