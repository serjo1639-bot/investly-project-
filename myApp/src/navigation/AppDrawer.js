/**
 * AppDrawer — a modern slide-in side drawer rendered as a global overlay.
 *
 * It is mounted once (inside <NavigationContainer> in RootNavigator) and driven
 * by `uiStore.drawerOpen`, so any screen can open it via `openDrawer()` without
 * touching the navigation structure. It uses the shared navigation ref to jump
 * to existing routes — no new navigator, no new dependencies.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text, Avatar, HeroBackground, PressableScale } from '../components';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useUiStore } from '../store/uiStore';
import { IMAGES } from '../constants/images';
import { ROUTES } from './routes';
import { navigate } from './navigationRef';

const SCREEN_W = Dimensions.get('window').width;
const PANEL_W = Math.min(320, SCREEN_W * 0.84);

export function AppDrawer() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, isOwner } = useAuth();

  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const anim = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(drawerOpen);

  useEffect(() => {
    if (drawerOpen) {
      setRendered(true);
      Animated.timing(anim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => finished && setRendered(false)
      );
    }
  }, [drawerOpen, anim]);

  if (!rendered) return null;

  const go = (route, params) => {
    closeDrawer();
    navigate(route, params);
  };

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-PANEL_W - 24, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const SECTIONS = [
    {
      label: t('menu.general'),
      items: [
        { icon: 'person-outline', title: t('account.profile'), onPress: () => go('MainTabs', { screen: ROUTES.ACCOUNT_TAB }) },
        { icon: 'notifications-outline', title: t('tabs.notifications'), onPress: () => go('MainTabs', { screen: ROUTES.NOTIFICATIONS_TAB }) },
        { icon: 'settings-outline', title: t('account.settings'), onPress: () => go(ROUTES.SETTINGS) },
      ],
    },
    {
      label: t('account.about'),
      items: [
        { icon: 'business-outline', title: t('account.aboutOrg'), onPress: () => go(ROUTES.ABOUT, { focus: 'org' }) },
        { icon: 'cube-outline', title: t('account.aboutSystem'), onPress: () => go(ROUTES.ABOUT, { focus: 'system' }) },
      ],
    },
    {
      label: t('menu.support'),
      items: [
        { icon: 'help-buoy-outline', title: t('account.help'), onPress: () => go(ROUTES.FAQ) },
        { icon: 'chatbubbles-outline', title: t('account.contact'), onPress: () => go(ROUTES.CONTACT) },
      ],
    },
    {
      label: t('menu.legal'),
      items: [
        { icon: 'shield-checkmark-outline', title: t('account.privacy'), onPress: () => go(ROUTES.PRIVACY) },
        { icon: 'document-text-outline', title: t('account.terms'), onPress: () => go(ROUTES.TERMS) },
      ],
    },
  ];

  const c = theme.colors;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay, opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Close menu" />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          theme.shadows.lg,
          { width: PANEL_W, backgroundColor: c.surface, transform: [{ translateX }] },
        ]}
      >
        {/* Branded header */}
        <HeroBackground image={IMAGES.authBg} height={188 + insets.top} contentStyle={{ paddingTop: insets.top }}>
          <View style={styles.header}>
            <Avatar uri={user?.avatarUrl} name={user?.name} size={56} />
            <Text variant="h3" style={styles.name} numberOfLines={1} color="textInverse">
              {user?.name || 'Investly'}
            </Text>
            <Text variant="caption" numberOfLines={1} style={styles.email}>
              {user?.email || user?.phone || ''}
            </Text>
            <View style={styles.roleChip}>
              <Ionicons name={isOwner ? 'briefcase' : 'trending-up'} size={12} color="#FFFFFF" />
              <Text variant="tiny" style={styles.roleText}>
                {isOwner ? t('auth.owner') : t('auth.investor')}
              </Text>
            </View>
          </View>
        </HeroBackground>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menu}>
          {SECTIONS.map((section) => (
            <View key={section.label} style={styles.section}>
              <Text variant="tiny" color="textMuted" style={styles.sectionLabel}>
                {section.label.toUpperCase()}
              </Text>
              {section.items.map((item) => (
                <PressableScale key={item.title} scaleTo={0.98} onPress={item.onPress}>
                  <View style={styles.item}>
                    <View style={[styles.itemIcon, { backgroundColor: c.primarySoft }]}>
                      <Ionicons name={item.icon} size={19} color={c.primary} />
                    </View>
                    <Text variant="bodyStrong" style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={17} color={c.textMuted} />
                  </View>
                </PressableScale>
              ))}
            </View>
          ))}

          <Text variant="tiny" color="textMuted" align="center" style={styles.version}>
            Investly · v1.0.0
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  header: { paddingHorizontal: 20, paddingBottom: 18 },
  name: { marginTop: 12 },
  email: { color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  roleText: { color: '#FFFFFF', marginLeft: 5, letterSpacing: 0.3 },
  menu: { paddingVertical: 12, paddingHorizontal: 12 },
  section: { marginBottom: 6 },
  sectionLabel: { marginLeft: 12, marginTop: 12, marginBottom: 4, letterSpacing: 0.6 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 14 },
  itemIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemTitle: { flex: 1 },
  version: { marginTop: 18, marginBottom: 8 },
});
