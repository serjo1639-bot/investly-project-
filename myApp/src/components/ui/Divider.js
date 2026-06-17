/** Divider — a 1px themed separator line. */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function DividerBase({ style, spacing = 0 }) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.divider, marginVertical: spacing },
        style,
      ]}
    />
  );
}

export const Divider = memo(DividerBase);
