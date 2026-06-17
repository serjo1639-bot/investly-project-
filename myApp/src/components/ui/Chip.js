/**
 * Chip — selectable pill, used for category filters. Animates color on select.
 */
import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

function ChipBase({ label, selected = false, icon, onPress, style }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      style={[
        styles.base,
        {
          borderRadius: theme.radii.full,
          backgroundColor: selected ? c.primary : c.surfaceAlt,
          borderColor: selected ? c.primary : c.border,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={15}
          color={selected ? c.onPrimary : c.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text
        variant="caption"
        style={{ color: selected ? c.onPrimary : c.textSecondary, fontWeight: '600' }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: { marginRight: 6 },
});

export const Chip = memo(ChipBase);
