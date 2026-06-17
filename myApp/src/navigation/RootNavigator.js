/**
 * RootNavigator — the top-level gate.
 *
 * On boot it hydrates the auth + UI stores (restoring the session and theme/
 * language). While hydrating it shows a branded splash. Once ready, it renders
 * the AuthStack or the AppStack based on `isAuthenticated`. Because this reads
 * the store reactively, a forced logout (failed token refresh) automatically
 * sends the user back to the auth flow.
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useAppSettings } from '../hooks/useAppSettings';
import { changeLanguage } from '../i18n';
import { Logo } from '../components/ui/Logo';
import { AuthStack } from './AuthStack';
import { AppStack } from './AppStack';
import { AppDrawer } from './AppDrawer';
import { navigationRef } from './navigationRef';
import MaintenanceScreen from '../screens/system/MaintenanceScreen';

export function RootNavigator() {
  const theme = useTheme();
  const status = useAuthStore((s) => s.status);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);
  const language = useUiStore((s) => s.language);
  const appSettings = useAppSettings();

  useEffect(() => {
    hydrateUi();
    hydrateAuth();
  }, [hydrateUi, hydrateAuth]);

  useEffect(() => {
    if (language) changeLanguage(language);
  }, [language]);

  const navTheme = useMemo(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger.solid,
      },
    };
  }, [theme]);

  if (status !== 'ready') {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.background }]}>
        <Logo size={72} showWordmark={false} />
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 28 }} />
      </View>
    );
  }

  // Admin-controlled kill switch: block the whole app when maintenance is on.
  if (appSettings.data?.maintenanceMode) {
    return (
      <MaintenanceScreen
        settings={appSettings.data}
        onRetry={() => appSettings.refetch()}
        retrying={appSettings.isFetching}
      />
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
      {isAuthenticated ? <AppDrawer /> : null}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
