/**
 * ErrorState — standardized error view with a retry button. Accepts an
 * ApiError (or any Error) and renders its normalized message.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';

function ErrorStateBase({ error, onRetry, title = 'Something went wrong', style }) {
  const theme = useTheme();
  const message = error?.message || 'Please try again.';
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.danger.bg }]}>
        <Ionicons name="cloud-offline-outline" size={32} color={theme.colors.danger.fg} />
      </View>
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" color="textSecondary" align="center" style={styles.message}>
        {message}
      </Text>
      {onRetry ? (
        <Button title="Retry" icon="refresh" onPress={onRetry} fullWidth={false} variant="outline" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { marginBottom: 6 },
  message: { maxWidth: 300 },
  action: { marginTop: 20, paddingHorizontal: 28 },
});

export const ErrorState = memo(ErrorStateBase);
