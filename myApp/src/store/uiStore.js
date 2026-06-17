/**
 * uiStore.js — Global client UI state (theme mode + language).
 * Persisted to AsyncStorage so the choice survives app restarts.
 */
import { create } from 'zustand';
import { storage } from '../services/storage';
import { CONFIG } from '../constants/config';

export const useUiStore = create((set, get) => ({
  // 'light' | 'dark' | 'system'
  themeMode: 'system',
  language: CONFIG.defaultLanguage,
  hydrated: false,

  // Side navigation drawer (session-only, never persisted).
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),

  /** Load persisted UI prefs at boot. */
  hydrate: async () => {
    const [themeMode, language] = await Promise.all([
      storage.getItem(CONFIG.storageKeys.themeMode),
      storage.getItem(CONFIG.storageKeys.language),
    ]);
    set({
      themeMode: themeMode || 'system',
      language: language || CONFIG.defaultLanguage,
      hydrated: true,
    });
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    storage.setItem(CONFIG.storageKeys.themeMode, mode);
  },

  toggleTheme: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark';
    get().setThemeMode(next);
  },

  setLanguage: (lang) => {
    set({ language: lang });
    storage.setItem(CONFIG.storageKeys.language, lang);
  },
}));
