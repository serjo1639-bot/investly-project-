/**
 * App.js — application root.
 *
 * Provider order (outer → inner):
 *   GestureHandlerRootView  → required by navigation gestures
 *   SafeAreaProvider        → safe-area insets for every screen
 *   QueryProvider           → React Query client (server state)
 *   ThemeProvider           → design-system theme (must wrap anything theming)
 *   ToastProvider           → global toasts (uses the theme)
 *   RootNavigator           → auth gate + navigation
 *
 * `./src/i18n` is imported for its initialization side effect.
 */
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './src/i18n';
import { QueryProvider } from './src/context/QueryProvider';
import { ThemeProvider } from './src/context/ThemeProvider';
import { ToastProvider } from './src/components/feedback/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
