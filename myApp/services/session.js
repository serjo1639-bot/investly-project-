/**
 * session.js — Persistent session management via AsyncStorage
 *
 * Responsibilities
 * ────────────────
 * Store and retrieve the auth token and user object so the
 * user stays logged in after the app is closed and reopened.
 *
 * Storage keys
 * ────────────
 *   auth_token     — JWT access token sent with every API request
 *   user_data      — JSON-serialised user object (avoids an /auth/profile
 *                    round-trip on cold start)
 *
 * Relationship with backendConfig
 * ────────────────────────────────
 * After reading the token from AsyncStorage, sessionManager calls
 * setAuthToken() to inject it into the in-memory module-level variable in
 * backendConfig.js so apiRequest() can attach it to every request header.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './backendConfig';

const TOKEN_KEY = 'auth_token';
const USER_KEY  = 'user_data';

export const sessionManager = {
  /**
   * Persist the entire session after a successful login.
   * @param {string|null} token - JWT access token
   * @param {object}      user  - Normalised user object from mapAuthSession
   */
  async saveSession(token, user) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token || '');
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user || {}));
      // Sync the in-memory token so apiRequest() works immediately
      setAuthToken(token);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  },

  /**
   * Load the persisted session on app start.
   * Also re-injects the token into backendConfig so requests work without login.
   * @returns {{ token, user }}
   */
  async loadSession() {
    try {
      const token    = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);

      let user = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson);
        } catch (e) {
          console.error('Error parsing user:', e);
        }
      }

      // Re-inject so apiRequest() has the token even before useAuth mounts
      if (token) setAuthToken(token);

      return { token, user };
    } catch (error) {
      console.error('Error loading session:', error);
      return { token: null, user: null };
    }
  },

  /**
   * Remove all session data and clear the in-memory token.
   * Called on logout and on 401 (session expired).
   */
  async clearSession() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setAuthToken(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },
};
