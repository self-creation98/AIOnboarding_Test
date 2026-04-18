/**
 * API Client — fetch wrapper with auth token management.
 * Connects to FastAPI backend at localhost:8000.
 */

const API_BASE = 'http://localhost:8000';

export function getToken() {
  return localStorage.getItem('access_token');
}

export function getUser() {
  const raw = localStorage.getItem('user_info');
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(token, user) {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_info', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_info');
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * Authenticated API call.
 * Automatically adds Authorization header.
 */
export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return res.json();
}

/**
 * Login — uses OAuth2 form-encoded format for Swagger compat.
 */
export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  return res.json();
}

/**
 * Public API call (no auth needed) — for webhooks.
 */
export async function publicApi(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return res.json();
}
