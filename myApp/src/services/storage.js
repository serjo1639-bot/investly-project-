/**
 * storage.js — Thin, safe wrapper over AsyncStorage for non-sensitive data
 * (theme, language, cached user profile). Never store tokens here — use
 * secureStore.js for those.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

export const storage = {
  async getItem(key) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      logger.warn('storage.getItem failed', key, e);
      return null;
    }
  },

  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      logger.warn('storage.setItem failed', key, e);
    }
  },

  async getJSON(key) {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  async setJSON(key, value) {
    await this.setItem(key, JSON.stringify(value));
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      logger.warn('storage.removeItem failed', key, e);
    }
  },

  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      logger.warn('storage.multiRemove failed', e);
    }
  },
};
