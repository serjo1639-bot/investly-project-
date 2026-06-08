/**
 * authEvents.js — Global pub/sub bridge for 401 "unauthorized" events
 *
 * Problem this solves
 * ───────────────────
 * backendConfig.js needs to signal the app when the server returns 401
 * (session expired / invalid token), but it cannot import React context
 * directly — that would create a circular dependency:
 *
 *   useAuth → backendConfig → useAuth  ✗
 *
 * Solution: a single module-level handler variable
 * ─────────────────────────────────────────────────
 * 1. AuthProvider (useAuth.js) calls setUnauthorizedHandler() on mount,
 *    registering a callback that clears session state and bumps sessionExpiredAt.
 * 2. apiRequest (backendConfig.js) calls notifyUnauthorized() on every 401.
 * 3. The registered handler runs: token cleared, user reset, AppNavigator
 *    redirects to Login via the sessionExpiredAt watch.
 *
 * This is safe because there is exactly one AuthProvider in the tree.
 */

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
};

export const notifyUnauthorized = async (payload = {}) => {
  if (!unauthorizedHandler) return false;
  try {
    await unauthorizedHandler(payload);
    return true;
  } catch (error) {
    console.error('Unauthorized handler error:', error);
    return false;
  }
};
