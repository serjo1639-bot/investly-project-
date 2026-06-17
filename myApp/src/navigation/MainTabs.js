/**
 * MainTabs — the bottom tab bar. The tab set is role-aware: investors get a
 * Home/Projects/Wallet flow; owners (Project Managers) get a Dashboard/
 * Projects flow. Both share Wallet, Notifications and Account.
 *
 * Each tab icon sits in an animated "pill" that highlights the active route —
 * a subtle micro-interaction layered on top of React Navigation's bottom tabs
 * (the navigation structure itself is unchanged).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useUnreadCount } from '../hooks/useNotifications';
import { ROUTES } from './routes';

import HomeScreen from '../screens/investor/HomeScreen';
import ProjectsScreen from '../screens/investor/ProjectsScreen';
import WalletScreen from '../screens/investor/WalletScreen';
import NotificationsScreen from '../screens/investor/NotificationsScreen';
import AccountScreen from '../screens/shared/AccountScreen';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import MyProjectsScreen from '../screens/owner/MyProjectsScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  [ROUTES.HOME_TAB]: 'home',
  [ROUTES.DASHBOARD_TAB]: 'grid',
  [ROUTES.PROJECTS_TAB]: 'compass',
  [ROUTES.WALLET_TAB]: 'wallet',
  [ROUTES.NOTIFICATIONS_TAB]: 'notifications',
  [ROUTES.ACCOUNT_TAB]: 'person',
};

function TabBarIcon({ routeName, color, focused }) {
  const theme = useTheme();
  const base = ICONS[routeName] ?? 'ellipse';
  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 140,
    }).start();
  }, [focused, scale]);

  const animatedScale = scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View
      style={[
        styles.iconPill,
        focused && { backgroundColor: theme.colors.primarySoft },
        { transform: [{ scale: animatedScale }] },
      ]}
    >
      <Ionicons name={focused ? base : `${base}-outline`} size={22} color={color} />
    </Animated.View>
  );
}

export function MainTabs() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isOwner } = useAuth();
  const unread = useUnreadCount();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        // Floating bar: detached from the screen edges with a margin all around.
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 64,
          borderRadius: 26,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: theme.colors.tabBar,
          ...theme.shadows.lg,
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => (
          <TabBarIcon routeName={route.name} color={color} focused={focused} />
        ),
      })}
    >
      {isOwner ? (
        <>
          <Tab.Screen name={ROUTES.DASHBOARD_TAB} component={OwnerDashboardScreen} options={{ title: t('owner.dashboard') }} />
          <Tab.Screen name={ROUTES.PROJECTS_TAB} component={MyProjectsScreen} options={{ title: t('owner.myProjects') }} />
        </>
      ) : (
        <>
          <Tab.Screen name={ROUTES.HOME_TAB} component={HomeScreen} options={{ title: t('tabs.home') }} />
          <Tab.Screen name={ROUTES.PROJECTS_TAB} component={ProjectsScreen} options={{ title: t('tabs.projects') }} />
        </>
      )}
      <Tab.Screen name={ROUTES.WALLET_TAB} component={WalletScreen} options={{ title: t('tabs.wallet') }} />
      <Tab.Screen
        name={ROUTES.NOTIFICATIONS_TAB}
        component={NotificationsScreen}
        options={{ title: t('tabs.notifications'), tabBarBadge: unread.data ? (unread.data > 99 ? '99+' : unread.data) : undefined }}
      />
      <Tab.Screen name={ROUTES.ACCOUNT_TAB} component={AccountScreen} options={{ title: t('tabs.account') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    minWidth: 48,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});
