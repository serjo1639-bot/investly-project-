/** SectionHeader — a row title with an optional "See all" action. */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { PressableScale } from './PressableScale';

function SectionHeaderBase({ title, actionLabel, onAction, style }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Text variant="h3">{title}</Text>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} scaleTo={0.95}>
          <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});

export const SectionHeader = memo(SectionHeaderBase);
