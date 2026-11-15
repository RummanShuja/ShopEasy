const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function request(path, { token, body, headers, ...options } = {}) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');
  if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers: requestHeaders, body });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'ShopEasy could not reach the server. Check your connection and try again.');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.message || 'Something went wrong. Please try again.', data?.fieldErrors);
  }
  if (data === null) throw new ApiError(response.status, 'The server returned an unexpected response.');
  return data;
}
