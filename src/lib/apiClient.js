'use client';

/**
 * Centralised API client for the Urban Furniture accounting backend.
 * Every service file goes through here so that auth headers, error
 * normalisation and 401 handling live in exactly one place.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'ufas_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - session stays in memory only */
  }
}

export function clearToken() {
  setToken(null);
}

/**
 * Normalised error thrown by every request.
 * `status` mirrors the HTTP status so pages can branch on 401/403/404/409/422.
 */
export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function messageForStatus(status, fallback) {
  switch (status) {
    case 400:
    case 422:
      return fallback || 'The submitted data is invalid.';
    case 401:
      return fallback || 'Your session has expired. Please sign in again.';
    case 403:
      return fallback || 'Access denied. You do not have permission for this action.';
    case 404:
      return fallback || 'The requested record was not found.';
    case 409:
      return fallback || 'This action conflicts with the current record state.';
    case 500:
    default:
      return fallback || 'Something went wrong. Please try again.';
  }
}

let onUnauthorized = null;

/** Registered by AuthProvider so a 401 anywhere logs the user out. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function request(path, { method = 'GET', body, params, signal } = {}) {
  const token = getToken();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      'Cannot reach the server. Check that the backend is running.',
      0,
      null,
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }
    throw new ApiError(
      messageForStatus(response.status, payload?.message),
      response.status,
      payload,
    );
  }

  // Backend always answers { success, message, data }
  return payload;
}

export const api = {
  get: (path, params, options) => request(path, { ...options, method: 'GET', params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

export default api;
