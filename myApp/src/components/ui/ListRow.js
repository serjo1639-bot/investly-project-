/**
 * ListRow — a tappable settings/menu row: leading icon, title, optional
 * subtitle/value, and a trailing chevron or custom right element.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { PressableScale } from './PressableScale';
import { useTheme } from '../../hooks/useTheme';

function ListRowBase({ icon, title, subtitle, value, right, onPress, danger = false, style }) {
  const theme = useTheme();
  const c = theme.colors;
  const tint = danger ? c.danger.fg : c.text;

  const content = (
    <View style={[styles.row, style]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: danger ? c.danger.bg : c.surfaceAlt }]}>
          <Ionicons name={icon} size={19} color={danger ? c.danger.fg : c.icon} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text variant="bodyStrong" style={{ color: tint }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" color="textSecondary" style={styles.value}>
          {value}
        </Text>
      ) : null}
      {right !== undefined
        ? right
        : onPress && <Ionicons name="chevron-forward" size={18} color={c.textMuted} />}
    </View>
  );

  if (!onPress) return content;
  return (
    <PressableScale onPress={onPress} scaleTo={0.98}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  body: { flex: 1 },
  value: { marginRight: 8 },
});

export const ListRow = memo(ListRowBase);
