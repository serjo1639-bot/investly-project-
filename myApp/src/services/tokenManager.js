/**
 * tokenManager.js — Single owner of the JWT access/refresh tokens.
 *
 * Keeps tokens in memory for fast synchronous reads by the axios interceptor,
 * and mirrors them to the encrypted secure store for persistence. Decoupled
 * from authStore and the API client to avoid circular imports: the client
 * reads tokens here; authStore writes them here.
 */
import { secureStore } from './secureStore';
import { CONFIG } from '../constants/config';

const { accessToken: ACCESS_KEY, refreshToken: REFRESH_KEY } = CONFIG.storageKeys;

let accessToken = null;
let refreshToken = null;
let onUnauthorized = null; // set by authStore: clears session + routes to Login

export const tokenManager = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,

  /** Load persisted tokens into memory at boot. */
  async load() {
    accessToken = await secureStore.get(ACCESS_KEY);
    refreshToken = await secureStore.get(REFRESH_KEY);
    return { accessToken, refreshToken };
  },

  async setTokens({ accessToken: at, refreshToken: rt }) {
    accessToken = at ?? null;
    refreshToken = rt ?? null;
    await Promise.all([
      secureStore.set(ACCESS_KEY, accessToken),
      secureStore.set(REFRESH_KEY, refreshToken),
    ]);
  },

  async clear() {
    accessToken = null;
    refreshToken = null;
    await Promise.all([secureStore.remove(ACCESS_KEY), secureStore.remove(REFRESH_KEY)]);
  },

  /** authStore registers a handler invoked when refresh ultimately fails. */
  setUnauthorizedHandler(fn) {
    onUnauthorized = fn;
  },

  triggerUnauthorized() {
    if (typeof onUnauthorized === 'function') onUnauthorized();
  },
};
