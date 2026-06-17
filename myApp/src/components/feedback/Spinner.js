/** Spinner — centered loading indicator, optionally filling the screen. */
import React, { memo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { useTheme } from '../../hooks/useTheme';

function SpinnerBase({ label, fill = true, style }) {
  const theme = useTheme();
  return (
    <View style={[fill ? styles.fill : styles.inline, style]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {label ? (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  inline: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  label: { marginTop: 12 },
});

export const Spinner = memo(SpinnerBase);
