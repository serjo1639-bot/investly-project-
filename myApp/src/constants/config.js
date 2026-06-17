/**
 * config.js — Single source of runtime configuration.
 *
 * Resolution order for the API base URL:
 *   1. EXPO_PUBLIC_API_BASE_URL  (env, highest priority)
 *   2. app.json -> expo.extra.apiBaseUrl
 *   3. Platform default (Android emulator uses 10.0.2.2 to reach host localhost)
 *
 * The ASP.NET backend listens on http://localhost:5231 (see launchSettings.json).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};

const platformDefaultUrl = () => {
  // Android emulator cannot see the host's "localhost"; 10.0.2.2 maps to it.
  if (Platform.OS === 'android') return 'http://10.0.2.2:5231/api';
  return 'http://localhost:5231/api';
};

export const CONFIG = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || platformDefaultUrl(),
  requestTimeoutMs: 30000,
  // Default app language (Arabic, RTL). Persisted choice overrides this at runtime.
  defaultLanguage: 'ar',
  // Storage keys (kept in one place so nothing drifts).
  storageKeys: {
    accessToken: 'investly.auth.accessToken',
    refreshToken: 'investly.auth.refreshToken',
    user: 'investly.auth.user',
    themeMode: 'investly.ui.themeMode',
    language: 'investly.ui.language',
  },
};

export const IS_DEV = typeof __DEV__ !== 'undefined' && __DEV__;
