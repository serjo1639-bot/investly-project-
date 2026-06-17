/**
 * EmptyState — friendly "nothing here" placeholder with an icon, message and
 * optional action button.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';

function EmptyStateBase({
  icon = 'file-tray-outline',
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
  style,
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={34} color={theme.colors.primary} />
      </View>
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} size="md" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 28 },
  iconWrap: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { marginBottom: 6 },
  message: { maxWidth: 300 },
  action: { marginTop: 20, paddingHorizontal: 28 },
});

export const EmptyState = memo(EmptyStateBase);
