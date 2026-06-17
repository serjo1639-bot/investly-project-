/**
 * client.js — The single HTTP gateway for the whole app.
 *
 * Responsibilities:
 *   • One axios instance pointed at CONFIG.apiBaseUrl.
 *   • Request interceptor injects the bearer access token.
 *   • Response interceptor unwraps the backend's ApiResponse envelope
 *     ({ success, message, data, errors }) so callers receive `data` directly,
 *     and turns `success:false` / network / HTTP failures into a normalized
 *     ApiError.
 *   • 401 handling: a single-flight refresh-token call. Concurrent requests
 *     that 401 are queued and replayed once a fresh token arrives; if refresh
 *     fails, the session is cleared (tokenManager.triggerUnauthorized()).
 *
 * No screen or hook should ever import axios directly — use the api modules.
 */
import axios from 'axios';
import { CONFIG } from '../constants/config';
import { endpoints } from './endpoints';
import { tokenManager } from '../services/tokenManager';
import { ApiError, normalizeError } from '../utils/errors';
import { logger } from '../utils/logger';

export const http = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: CONFIG.requestTimeoutMs,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Endpoints that must never carry a (possibly stale) token or trigger refresh.
const AUTH_FREE = [
  endpoints.auth.loginEmail,
  endpoints.auth.loginPhone,
  endpoints.auth.register,
  endpoints.auth.sendOtp,
  endpoints.auth.verifyOtp,
  endpoints.auth.forgotPassword,
  endpoints.auth.verifyResetCode,
  endpoints.auth.resetPassword,
  endpoints.auth.refreshToken,
];
const isAuthFree = (url = '') => AUTH_FREE.some((p) => url.includes(p));

// ── Request: attach bearer token ────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token && !isAuthFree(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Single-flight refresh machinery ─────────────────────────────────────────
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) throw new ApiError('No refresh token', { status: 401, code: 'NO_REFRESH' });

  // Use a bare axios call so we don't re-enter this interceptor (no recursion).
  const res = await axios.post(
    `${CONFIG.apiBaseUrl}${endpoints.auth.refreshToken}`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' }, timeout: CONFIG.requestTimeoutMs }
  );
  const body = res.data;
  // Backend AuthResponse uses `token` (not `accessToken`); accept either.
  const newAccess = body?.data?.token ?? body?.data?.accessToken;
  if (!body?.success || !newAccess) {
    throw new ApiError('Session refresh failed', { status: 401, code: 'REFRESH_FAILED' });
  }
  const newRefresh = body.data.refreshToken;
  await tokenManager.setTokens({ accessToken: newAccess, refreshToken: newRefresh ?? refreshToken });
  return newAccess;
}

// ── Response: unwrap ApiResponse + normalize errors + refresh on 401 ─────────
http.interceptors.response.use(
  (response) => {
    const body = response.data;
    // Unwrap the standard envelope; tolerate raw/empty bodies (e.g. 204).
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        throw new ApiError(body.message || 'Request failed', {
          status: response.status,
          code: `HTTP_${response.status}`,
          errors: Array.isArray(body.errors) ? body.errors : [],
        });
      }
      return body.data ?? null;
    }
    return body ?? null;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Attempt a transparent refresh exactly once per request.
    if (status === 401 && original && !original._retried && !isAuthFree(original.url)) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original); // replay with the fresh token
      } catch (refreshErr) {
        logger.warn('token refresh failed → logging out');
        tokenManager.triggerUnauthorized();
        return Promise.reject(normalizeError(refreshErr));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

// ── Convenience verbs (already unwrapped + normalized) ──────────────────────
export const api = {
  get: (url, config) => http.get(url, config),
  post: (url, data, config) => http.post(url, data, config),
  put: (url, data, config) => http.put(url, data, config),
  patch: (url, data, config) => http.patch(url, data, config),
  delete: (url, config) => http.delete(url, config),
};
