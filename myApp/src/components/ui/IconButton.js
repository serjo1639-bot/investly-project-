/** IconButton — circular icon-only pressable used in headers and rows. */
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

function IconButtonBase({ icon, onPress, size = 22, badge, variant = 'soft', color, style }) {
  const theme = useTheme();
  const c = theme.colors;
  const bg = variant === 'soft' ? c.surfaceAlt : 'transparent';
  return (
    <PressableScale onPress={onPress} scaleTo={0.9} style={[styles.base, { backgroundColor: bg }, style]}>
      <Ionicons name={icon} size={size} color={color || c.icon} />
      {badge != null && Number(badge) > 0 ? (
        <View style={[styles.badge, { backgroundColor: c.danger.solid }]}>
          <Text style={styles.badgeText}>{Number(badge) > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});

export const IconButton = memo(IconButtonBase);
