/**
 * Button — primary action component.
 * Variants: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'.
 * Sizes: 'sm' | 'md' | 'lg'. Supports loading, disabled, full-width, icons.
 */
import React, { memo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

const SIZES = {
  sm: { h: 40, px: 14, font: 14, icon: 16 },
  md: { h: 50, px: 18, font: 15, icon: 18 },
  lg: { h: 56, px: 22, font: 16, icon: 20 },
};

function ButtonBase({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon, // Ionicons name
  iconRight = false,
  style,
}) {
  const theme = useTheme();
  const s = SIZES[size] ?? SIZES.md;
  const v = resolveVariant(variant, theme);
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      style={[
        styles.base,
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: theme.radii.lg,
          backgroundColor: v.bg,
          borderWidth: v.borderWidth,
          borderColor: v.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        v.shadow && theme.shadows.sm,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon && !iconRight && (
            <Ionicons name={icon} size={s.icon} color={v.fg} style={styles.iconLeft} />
          )}
          <Text style={{ color: v.fg, fontSize: s.font, fontWeight: '700' }}>{title}</Text>
          {icon && iconRight && (
            <Ionicons name={icon} size={s.icon} color={v.fg} style={styles.iconRight} />
          )}
        </View>
      )}
    </PressableScale>
  );
}

function resolveVariant(variant, theme) {
  const c = theme.colors;
  switch (variant) {
    case 'secondary':
      return { bg: c.surfaceAlt, fg: c.text, border: 'transparent', borderWidth: 0, shadow: false };
    case 'ghost':
      return { bg: 'transparent', fg: c.primary, border: 'transparent', borderWidth: 0, shadow: false };
    case 'outline':
      return { bg: 'transparent', fg: c.primary, border: c.primary, borderWidth: 1.5, shadow: false };
    case 'danger':
      return { bg: c.danger.solid, fg: '#FFFFFF', border: 'transparent', borderWidth: 0, shadow: true };
    case 'primary':
    default:
      return { bg: c.primary, fg: c.onPrimary, border: 'transparent', borderWidth: 0, shadow: true };
  }
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});

export const Button = memo(ButtonBase);
