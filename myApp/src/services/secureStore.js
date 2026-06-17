/**
 * secureStore.js — Encrypted storage for auth tokens (expo-secure-store).
 *
 * expo-secure-store keeps values in the device keychain/keystore. It is not
 * available on web, so we transparently fall back to AsyncStorage there.
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { storage } from './storage';
import { logger } from '../utils/logger';

const isWeb = Platform.OS === 'web';
// SecureStore keys must be alphanumeric + ".-_"; map our dotted keys safely.
const safeKey = (key) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export const secureStore = {
  async get(key) {
    try {
      if (isWeb) return await storage.getItem(key);
      return await SecureStore.getItemAsync(safeKey(key));
    } catch (e) {
      logger.warn('secureStore.get failed', key, e);
      return null;
    }
  },

  async set(key, value) {
    try {
      if (value == null) return this.remove(key);
      if (isWeb) return await storage.setItem(key, value);
      await SecureStore.setItemAsync(safeKey(key), value);
    } catch (e) {
      logger.warn('secureStore.set failed', key, e);
    }
  },

  async remove(key) {
    try {
      if (isWeb) return await storage.removeItem(key);
      await SecureStore.deleteItemAsync(safeKey(key));
    } catch (e) {
      logger.warn('secureStore.remove failed', key, e);
    }
  },
};
