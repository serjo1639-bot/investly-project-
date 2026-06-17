/**
 * MaintenanceScreen — full-screen block shown when the admin enables
 * maintenance mode from the dashboard's App Control page. Bilingual: it picks
 * the message matching the current app language, with a retry button.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, Button } from '../../components';
import { useTheme } from '../../hooks/useTheme';

export default function MaintenanceScreen({ settings, onRetry, retrying }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const isAr = (i18n.language || 'ar').startsWith('ar');

  const message = isAr
    ? settings?.maintenanceMessageAr
    : settings?.maintenanceMessageEn;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + '1A' }]}>
        <Ionicons name="construct-outline" size={56} color={theme.colors.primary} />
      </View>
      <Text variant="h2" align="center" style={styles.title}>
        {isAr ? 'التطبيق قيد الصيانة' : 'Under Maintenance'}
      </Text>
      <Text variant="body" color="textSecondary" align="center" style={styles.message}>
        {message || (isAr
          ? 'نعتذر، التطبيق قيد الصيانة حالياً. يرجى المحاولة لاحقاً.'
          : "We'll be back soon. Please try again later.")}
      </Text>
      <Button
        title={isAr ? 'إعادة المحاولة' : 'Retry'}
        onPress={onRetry}
        loading={retrying}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { marginBottom: 12 },
  message: { lineHeight: 22, marginBottom: 28 },
  button: { alignSelf: 'stretch' },
});
