/**
 * PaymentsScreen — full payment history with status badges.
 */
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Card, Badge, Skeleton, EmptyState, ErrorState, Divider } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { usePaymentHistory } from '../../hooks/usePayments';
import { formatCurrency, formatDate } from '../../utils/format';

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch } = usePaymentHistory();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <ScreenContainer padded={false}>
      <AppHeader title={t('account.title')} showBack />
      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Ionicons name={item.method === 'wallet' ? 'wallet-outline' : 'card-outline'} size={18} color={theme.colors.icon} />
              </View>
              <View style={styles.body}>
                <Text variant="bodyStrong" numberOfLines={1}>{item.reference || item.method || 'Payment'}</Text>
                <Text variant="caption" color="textMuted">{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.right}>
                <Text variant="bodyStrong">{formatCurrency(item.amount)}</Text>
                {item.status ? <Badge status={item.status} style={{ marginTop: 4 }} /> : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ paddingHorizontal: 16 }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} height={60} radius={12} style={{ marginBottom: 10 }} />)}</View>
            ) : (
              <EmptyState icon="card-outline" title="No payments yet" message="Your payment history will appear here." />
            )
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  body: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
