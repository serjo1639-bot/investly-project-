/**
 * authStore.js — Global auth/session state (the current user + auth status).
 *
 * Token bytes live in tokenManager (secure store); this store holds the user
 * object and the derived `isAuthenticated` flag the navigator gates on.
 */
import { create } from 'zustand';
import { tokenManager } from '../services/tokenManager';
import { storage } from '../services/storage';
import { CONFIG } from '../constants/config';
import { logger } from '../utils/logger';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  // 'idle' | 'hydrating' | 'ready'
  status: 'idle',

  /**
   * Boot-time hydration: restore tokens + cached user so the app can decide
   * whether to show the app or the auth flow without a flash of the wrong UI.
   */
  hydrate: async () => {
    set({ status: 'hydrating' });
    try {
      const { accessToken } = await tokenManager.load();
      const cachedUser = await storage.getJSON(CONFIG.storageKeys.user);
      set({
        user: cachedUser,
        isAuthenticated: Boolean(accessToken && cachedUser),
        status: 'ready',
      });
    } catch (e) {
      logger.warn('auth hydrate failed', e);
      set({ status: 'ready' });
    }
  },

  /** Persist a freshly authenticated session. */
  setSession: async ({ user, accessToken, refreshToken }) => {
    await tokenManager.setTokens({ accessToken, refreshToken });
    await storage.setJSON(CONFIG.storageKeys.user, user);
    set({ user, isAuthenticated: true, status: 'ready' });
  },

  /** Merge updated profile fields into the cached user. */
  setUser: async (user) => {
    await storage.setJSON(CONFIG.storageKeys.user, user);
    set({ user });
  },

  /** Clear everything (explicit logout or forced 401). */
  clearSession: async () => {
    await tokenManager.clear();
    await storage.removeItem(CONFIG.storageKeys.user);
    set({ user: null, isAuthenticated: false, status: 'ready' });
  },

  // Convenience selectors
  isOwner: () => get().user?.role === 'owner',
}));

// When a token refresh ultimately fails, force a clean logout.
tokenManager.setUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});
