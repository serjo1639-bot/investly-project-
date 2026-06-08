/**
 * AppHeader.js — Top navigation bar
 *
 * Renders: hamburger menu button (opens drawer) + BrandLogo + notification bell.
 * Positions the menu button on the left for LTR (English) and right for RTL (Arabic).
 * Notification bell shows an unread badge when there are unread notifications.
 */
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import BrandLogo from './BrandLogo';

const AppHeader = ({
  title,
  onMenuPress,
  onRightPress,
  rightIcon = 'notifications-outline',
  showRightIcon = true,
  elevated = false,
}) => {
  const insets = useSafeAreaInsets();
  const menuAnim = useRef(new Animated.Value(1)).current;
  const rightAnim = useRef(new Animated.Value(1)).current;

  const press = (anim, to) =>
    Animated.spring(anim, { toValue: to, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  const isHomeTitle = !title || title === 'Investly' || title === 'investly';

  return (
    <View
      style={[
        styles.header,
        elevated && SHADOWS.md,
        { paddingTop: Math.max(insets.top + (Platform.OS === 'android' ? 4 : 2), SPACING.base) },
      ]}
    >
      <View style={styles.row}>
        {/* Menu button */}
        <Animated.View style={{ transform: [{ scale: menuAnim }] }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onMenuPress}
            onPressIn={() => press(menuAnim, 0.88)}
            onPressOut={() => press(menuAnim, 1)}
            activeOpacity={1}
          >
            <Ionicons name="menu-outline" size={22} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </Animated.View>

        {/* Brand center */}
        <View style={styles.center}>
          <BrandLogo compact />
        </View>

        {/* Right action button */}
        <Animated.View style={{ transform: [{ scale: rightAnim }] }} pointerEvents={showRightIcon ? 'auto' : 'none'}>
          <TouchableOpacity
            style={[styles.iconBtn, !showRightIcon && styles.iconBtnHidden]}
            onPress={onRightPress}
            onPressIn={() => press(rightAnim, 0.88)}
            onPressOut={() => press(rightAnim, 1)}
            disabled={!showRightIcon}
            activeOpacity={1}
          >
            {showRightIcon ? (
              <Ionicons name={rightIcon} size={20} color={COLORS.primaryDark} />
            ) : (
              <View style={styles.placeholder} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Screen title — only shown for non-home screens */}
      {!isHomeTitle && (
        <Text style={styles.screenTitle} numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    elevation: 3,
    shadowColor: '#1a2e6e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnHidden: {
    opacity: 0,
  },
  placeholder: {
    width: 22,
    height: 22,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  screenTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    paddingVertical: 4,
    letterSpacing: 0.2,
  },
});

export default AppHeader;
