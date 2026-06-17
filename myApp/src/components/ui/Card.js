/**
 * Card — elevated surface container. Optionally pressable (springs on tap).
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { useTheme } from '../../hooks/useTheme';

function CardBase({ children, onPress, elevation = 'sm', padded = true, style }) {
  const theme = useTheme();
  const cardStyle = [
    styles.base,
    {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderColor: theme.colors.border,
      padding: padded ? theme.spacing.lg : 0,
    },
    theme.shadows[elevation],
    style,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={cardStyle}>
        {children}
      </PressableScale>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderWidth: StyleSheet.hairlineWidth },
});

export const Card = memo(CardBase);
