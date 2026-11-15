import { request } from './http';

export function placeOrder(order, key) {
  return request('/api/orders', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: order,
  });
}
