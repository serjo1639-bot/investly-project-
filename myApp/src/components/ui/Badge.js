/**
 * Badge — small status pill. Pass an explicit `tone`
 * ('success'|'warning'|'danger'|'info'|'neutral') or a backend status string
 * via `status` and it maps to the right tone automatically.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { STATUS_TONE } from '../../constants/enums';
import { humanize } from '../../utils/format';

function BadgeBase({ label, status, tone, style }) {
  const theme = useTheme();
  const resolvedTone = tone || (status && STATUS_TONE[status]) || 'neutral';
  const { bg, fg } = toneColors(resolvedTone, theme);

  return (
    <View style={[styles.base, { backgroundColor: bg, borderRadius: theme.radii.full }, style]}>
      <Text variant="tiny" style={{ color: fg }}>
        {label ?? humanize(status)}
      </Text>
    </View>
  );
}

function toneColors(tone, theme) {
  const c = theme.colors;
  switch (tone) {
    case 'success':
      return { bg: c.success.bg, fg: c.success.fg };
    case 'warning':
      return { bg: c.warning.bg, fg: c.warning.fg };
    case 'danger':
      return { bg: c.danger.bg, fg: c.danger.fg };
    case 'info':
      return { bg: c.info.bg, fg: c.info.fg };
    case 'neutral':
    default:
      return { bg: c.surfaceAlt, fg: c.textSecondary };
  }
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
});

export const Badge = memo(BadgeBase);
