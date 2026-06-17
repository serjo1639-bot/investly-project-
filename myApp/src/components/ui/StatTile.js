/** StatTile — a compact metric card (icon + value + label). */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

function StatTileBase({ icon, value, label, tone = 'primary', style }) {
  const theme = useTheme();
  const c = theme.colors;
  const accent =
    tone === 'primary' ? c.primary : c[tone]?.solid ?? c[tone]?.fg ?? c.primary;
  const soft = tone === 'primary' ? c.primarySoft : c[tone]?.bg ?? c.primarySoft;

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: c.surface, borderRadius: theme.radii.lg, borderColor: c.border },
        theme.shadows.sm,
        style,
      ]}
    >
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: soft }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <Text variant="h2" numberOfLines={1} style={styles.value}>
        {value}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  value: { marginBottom: 2 },
});

export const StatTile = memo(StatTileBase);
