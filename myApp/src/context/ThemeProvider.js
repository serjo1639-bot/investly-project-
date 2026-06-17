/**
 * ThemeProvider.js — Resolves the active theme from the user's preference
 * (uiStore) combined with the OS color scheme, and exposes it via context.
 *
 * Consume it through the `useTheme()` hook (src/hooks/useTheme.js).
 */
import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { buildTheme } from '../theme/tokens';
import { useUiStore } from '../store/uiStore';

export const ThemeContext = createContext(buildTheme('light'));

export function ThemeProvider({ children }) {
  const themeMode = useUiStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const theme = useMemo(() => {
    const resolved = themeMode === 'system' ? systemScheme || 'light' : themeMode;
    return buildTheme(resolved === 'dark' ? 'dark' : 'light');
  }, [themeMode, systemScheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
