/**
 * backendConfig.js — Central API configuration and HTTP request layer
 *
 * Responsibilities
 * ────────────────
 * 1. Reads the server URL and mock-mode flag from environment / app.json
 * 2. Declares every backend endpoint path in one place
 * 3. Manages the in-memory auth token (set after login, cleared on logout/401)
 * 4. Exports `apiRequest`  — JSON requests (all normal API calls)
 * 5. Exports `apiUpload`   — multipart/form-data (image / file uploads)
 *
 * Connecting to ASP.NET C# backend
 * ──────────────────────────────────
 * 1. In your ASP.NET Program.cs / Startup.cs add:
 *
 *    // Camel-case JSON (matches what the app expects)
 *    builder.Services.AddControllers().AddJsonOptions(o =>
 *        o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase);
 *
 *    // CORS — allow Expo dev server and production app
 *    builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
 *        p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
 *    app.UseCors();
 *
 * 2. Set the base URL in .env or app.json "extra":
 *    - iOS simulator  : http://localhost:5000/api
 *    - Android emu    : http://10.0.2.2:5000/api
 *    - Physical device: http://<LAN-IP>:5000/api
 *    - Production     : https://api.investly.ly/api
 *
 * 3. Set useMockApi = false in app.json or EXPO_PUBLIC_USE_MOCK_API=false
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notifyUnauthorized } from './authEvents';

// ── Read config from expo-constants (app.json "extra") or .env ───────────────
const expoConfig = Constants?.manifest?.extra || Constants?.expoConfig?.extra || {};

const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || expoConfig.apiBaseUrl || '';

const defaultUseMockApi =
  expoConfig.useMockApi !== undefined
    ? expoConfig.useMockApi
    : process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[API] baseURL    =', defaultApiBaseUrl || '(mock mode)');
  console.log('[API] useMockApi =', defaultUseMockApi);
  console.log('[API] platform   =', Platform.OS);
}

// ─── API_CONFIG ───────────────────────────────────────────────────────────────
export const API_CONFIG = {
  useMockApi: defaultUseMockApi,
  baseURL:    defaultApiBaseUrl,
  timeoutMs:  30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },

  endpoints: {
    // ── Auth ────────────────────────────────────────────────────────────────
    // POST /auth/send-otp        { phone }
    // POST /auth/verify-otp      { phone, otp, role }
    // POST /auth/login           { phone, password, role }
    // POST /auth/login-simple    { phone }
    // POST /auth/register        { name, phone, email, role, age, gender, location, passportUrl, password, ... }
    // GET  /auth/profile
    // PUT  /auth/profile         { name, email, bio, companyName, age, gender, location, ... }
    // POST /auth/refresh-token   { refreshToken }
    // POST /auth/logout
    // POST /auth/login-email       { email, password, role }
    // POST /auth/forgot-password   { email }
    // POST /auth/verify-reset-code { email, code }
    // POST /auth/reset-password    { email, code, newPassword }
    // POST /auth/change-password   { currentPassword, newPassword }
    auth: {
      sendOtp:          '/auth/send-otp',
      verifyOtp:        '/auth/verify-otp',
      login:            '/auth/login',
      loginEmail:       '/auth/login-email',
      loginSimple:      '/auth/login-simple',
      register:         '/auth/register',
      profile:          '/auth/profile',
      updateProfile:    '/auth/profile',
      refreshToken:     '/auth/refresh-token',
      logout:           '/auth/logout',
      forgotPassword:   '/auth/forgot-password',
      verifyResetCode:  '/auth/verify-reset-code',
      resetPassword:    '/auth/reset-password',
      changePassword:   '/auth/change-password',
    },

    // ── Projects ────────────────────────────────────────────────────────────
    // GET  /projects/featured
    // GET  /projects             ?category=tech&search=keyword&page=1&pageSize=20
    // GET  /projects/categories
    // POST /projects             { titleAr, titleEn, category, cityAr, ... }
    // GET  /projects/:id
    // PUT  /projects/:id
    // DELETE /projects/:id
    // GET  /projects/:id/stats
    // POST /projects/:id/views   (increment view counter)
    projects: {
      featured:   '/projects/featured',
      list:       '/projects',
      categories: '/projects/categories',
      submit:     '/projects',
      details:    (id) => `/projects/${id}`,
      update:     (id) => `/projects/${id}`,
      delete:     (id) => `/projects/${id}`,
      stats:      (id) => `/projects/${id}/stats`,
      recordView: (id) => `/projects/${id}/views`,
    },

    // ── Owner ───────────────────────────────────────────────────────────────
    // GET /owners/:ownerId/projects
    // GET /owners/:ownerId/stats
    // GET /owners/:ownerId/dashboard
    owners: {
      projects:  (ownerId) => `/owners/${ownerId}/projects`,
      stats:     (ownerId) => `/owners/${ownerId}/stats`,
      dashboard: (ownerId) => `/owners/${ownerId}/dashboard`,
    },

    // ── Investments ─────────────────────────────────────────────────────────
    // POST /investments/checkout       { currency, contributions: [{ projectId, amount, currency, paymentMethod }] }
    // GET  /investments/me
    // GET  /investments/history
    // GET  /investments/wallet
    // POST /investments/wallet/topup   { amount, method }
    // POST /investments/wallet/withdraw { amount }
    // GET  /investments/funding-options
    // POST /investments/topup/redeem   { code }
    investments: {
      confirm:        '/investments/checkout',
      mine:           '/investments/me',
      history:        '/investments/history',
      wallet:         '/investments/wallet',
      walletTopup:    '/investments/wallet/topup',
      walletWithdraw: '/investments/wallet/withdraw',
      fundingOptions: '/investments/funding-options',
      redeemTopup:    '/investments/topup/redeem',
    },

    // ── Payments ────────────────────────────────────────────────────────────
    // POST /payments/initiate          { amount, method, ... }
    // POST /payments/verify            { transactionId }
    // GET  /payments/methods
    // GET  /payments/:paymentId/status
    // POST /payments/:paymentId/refund
    // GET  /payments/history
    // GET  /payments/:paymentId
    payments: {
      initiate: '/payments/initiate',
      verify:   '/payments/verify',
      methods:  '/payments/methods',
      status:   (paymentId) => `/payments/${paymentId}/status`,
      refund:   (paymentId) => `/payments/${paymentId}/refund`,
      history:  '/payments/history',
      details:  (paymentId) => `/payments/${paymentId}`,
      wallet:   '/payments/wallet',
    },

    // ── Users ────────────────────────────────────────────────────────────────
    // GET    /users/:userId
    // PUT    /users/:userId   { name, email, age, gender, location, companyName, bio, ... }
    // DELETE /users/:userId
    // POST   /users/:userId/kyc          multipart/form-data — passport image (field: "passport")
    // GET    /users/:userId/documents
    // GET    /users/:userId/investments
    // POST   /admin/users/:userId/kyc/approve  → sets kycStatus = 'approved', isVerified = true
    // POST   /admin/users/:userId/kyc/reject   { reason? } → sets kycStatus = 'rejected'
    users: {
      details:     (userId) => `/users/${userId}`,
      update:      (userId) => `/users/${userId}`,
      delete:      (userId) => `/users/${userId}`,
      kyc:         (userId) => `/users/${userId}/kyc`,
      kycApprove:  (userId) => `/admin/users/${userId}/kyc/approve`,
      kycReject:   (userId) => `/admin/users/${userId}/kyc/reject`,
      documents:   (userId) => `/users/${userId}/documents`,
      investments: (userId) => `/users/${userId}/investments`,
    },

    // ── Notifications ────────────────────────────────────────────────────────
    // GET  /notifications                    → list all for current user
    // GET  /notifications/unread-count       → { count: number }
    // POST /notifications/:id/read           → mark one as read
    // POST /notifications/read-all           → mark all as read
    // GET  /notifications/settings           → user notification preferences
    notifications: {
      list:        '/notifications',
      unreadCount: '/notifications/unread-count',
      markRead:    (id) => `/notifications/${id}/read`,
      markAllRead: '/notifications/read-all',
      settings:    '/notifications/settings',
    },

    // ── Media ────────────────────────────────────────────────────────────────
    // POST /media/upload    multipart/form-data  field: "file"
    // DELETE /media/:mediaId
    media: {
      upload: '/media/upload',
      delete: (mediaId) => `/media/${mediaId}`,
    },

    // ── Admin (used by the web admin-dashboard, listed here for reference) ──
    // All /admin/* routes require an admin JWT token.
    // GET  /admin/users                          → paginated user list
    // GET  /admin/projects                       → paginated project list
    // GET  /admin/stats                          → platform dashboard stats
    // GET  /admin/payments                       → payment transaction list
    // GET  /admin/activity-logs                  → admin action audit log
    // POST /admin/projects/:id/approve           → approve a pending project
    // POST /admin/projects/:id/reject  { reason }→ reject a pending project
    // POST /admin/users/:id/ban                  → permanently ban a user
    // POST /admin/users/:id/suspend   { reason } → temporarily suspend a user
    // POST /admin/users/:id/unsuspend            → lift a suspension
    // POST /admin/notifications/send             → broadcast or targeted push
    //        body: { titleEn, titleAr, messageEn, messageAr, type, targetUserId? }
    //        targetUserId omitted  → sent to ALL users
    //        targetUserId present  → sent to that one user only
    admin: {
      users:              '/admin/users',
      projects:           '/admin/projects',
      stats:              '/admin/stats',
      payments:           '/admin/payments',
      activityLogs:       '/admin/activity-logs',
      approveProject:     (id) => `/admin/projects/${id}/approve`,
      rejectProject:      (id) => `/admin/projects/${id}/reject`,
      banUser:            (id) => `/admin/users/${id}/ban`,
      suspendUser:        (id) => `/admin/users/${id}/suspend`,
      unsuspendUser:      (id) => `/admin/users/${id}/unsuspend`,
      sendNotification:   '/admin/notifications/send',
    },
  },
};

// ─── Auth token (in-memory, not persisted here) ───────────────────────────────
let authToken = null;
export const setAuthToken = (token) => { authToken = token || null; };
export const getAuthToken = ()      => authToken;

// ─── URL helpers ──────────────────────────────────────────────────────────────
const joinUrl = (baseURL, path) => {
  const base    = (baseURL || '').replace(/\/+$/, '');
  const segment = String(path  || '').replace(/^\/+/, '');
  return `${base}/${segment}`;
};

const buildUrl = (path, query) => {
  const url = new URL(joinUrl(API_CONFIG.baseURL, path));
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

// ─── extractErrorMessage ─────────────────────────────────────────────────────
/**
 * Pulls a human-readable message from any error body shape:
 *   • Standard app format : { message, error }
 *   • ASP.NET ProblemDetails: { title, errors: { Field: ["msg"] } }
 *   • Plain string body
 */
const extractErrorMessage = (data, status) => {
  if (!data) return `HTTP ${status}`;

  // Direct message fields
  if (data.message) return data.message;
  if (data.error)   return data.error;

  // ASP.NET ProblemDetails — flatten validation errors first
  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length) return messages.join(' | ');
  }

  // ASP.NET ProblemDetails — title field
  if (data.title) return data.title;

  // Raw string body
  if (data.raw && typeof data.raw === 'string' && data.raw.trim()) return data.raw.trim();

  return `HTTP ${status}`;
};

// ─── apiRequest ───────────────────────────────────────────────────────────────
/**
 * Central fetch wrapper for JSON requests.
 *
 * @param {{ path, method?, body?, headers?, query?, token? }} options
 */
export const apiRequest = async ({ path, method = 'GET', body, headers, query, token }) => {
  if (!API_CONFIG.baseURL) {
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in .env or useMockApi=true in app.json.',
    );
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const requestUrl = buildUrl(path, query);

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('[API]', method, requestUrl, body ? JSON.stringify(body).slice(0, 200) : '');
    }

    const response = await fetch(requestUrl, {
      method,
      headers: {
        ...API_CONFIG.defaultHeaders,
        ...(token || authToken ? { Authorization: `Bearer ${token || authToken}` } : {}),
        ...(headers || {}),
      },
      body:   body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // Read as text first — handles empty bodies (204) and non-JSON errors gracefully
    const rawText = await response.text();
    let data = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText ? { raw: rawText } : null;
    }

    if (!response.ok) {
      const message = extractErrorMessage(data, response.status);

      if (response.status === 401) {
        await notifyUnauthorized({ status: 401, message });
      }

      const err  = new Error(message);
      err.status = response.status;
      err.data   = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out. Check server URL: ${API_CONFIG.baseURL}`);
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('[API ERROR]', error.message);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ─── apiUpload ────────────────────────────────────────────────────────────────
/**
 * Multipart upload for images and files.
 * ASP.NET endpoint: POST /media/upload
 * Field name: "file"   (configure in your [FromForm] controller)
 *
 * @param {string}  path      - Endpoint path, e.g. API_CONFIG.endpoints.media.upload
 * @param {object}  fileAsset - { uri, name, type } from expo-image-picker result
 * @param {object}  [extra]   - Additional FormData fields (e.g. { projectId: '123' })
 * @returns {Promise<{ url: string, mediaId: string }>}
 */
export const apiUpload = async (path, fileAsset, extra = {}) => {
  if (!API_CONFIG.baseURL) {
    throw new Error('API base URL not configured.');
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 60000); // 60 s for uploads

  try {
    const formData = new FormData();
    formData.append('file', {
      uri:  fileAsset.uri,
      name: fileAsset.name || 'upload.jpg',
      type: fileAsset.type || 'image/jpeg',
    });
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, String(value));
    });

    const requestUrl = joinUrl(API_CONFIG.baseURL, path);

    const response = await fetch(requestUrl, {
      method:  'POST',
      headers: {
        Accept: 'application/json',
        // Do NOT set Content-Type manually — fetch sets it with the boundary
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body:   formData,
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data = null;
    try { data = rawText ? JSON.parse(rawText) : null; } catch { data = { raw: rawText }; }

    if (!response.ok) {
      const err  = new Error(extractErrorMessage(data, response.status));
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Upload timed out.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
