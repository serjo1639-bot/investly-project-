/**
 * WalletScreen — balance overview, quick actions (top-up / withdraw / redeem)
 * and the transaction history list.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Text, Card, Button, Divider, Skeleton, EmptyState, ErrorState, Badge,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useWallet } from '../../hooks/useWallet';
import { usePaymentHistory } from '../../hooks/usePayments';
import { formatCurrency, formatRelative } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function WalletScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const wallet = useWallet();
  const history = usePaymentHistory();
  const [refreshing, setRefreshing] = useState(false);

  const transactions =
    (Array.isArray(wallet.data?.transactions) && wallet.data.transactions) ||
    (Array.isArray(history.data) ? history.data : history.data?.items) ||
    [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([wallet.refetch(), history.refetch()]);
    setRefreshing(false);
  }, [wallet, history]);

  const Header = (
    <View>
      <Text variant="h1" style={styles.title}>{t('wallet.title')}</Text>

      <Card elevation="md" style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
        <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('wallet.balance')}</Text>
        {wallet.isLoading ? (
          <Skeleton width={180} height={34} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)' }} />
        ) : (
          <Text variant="display" style={styles.balance}>{formatCurrency(wallet.data?.balance ?? 0)}</Text>
        )}
        {wallet.data?.status ? <Badge status={wallet.data.status} style={styles.statusBadge} /> : null}
      </Card>

      <View style={styles.actions}>
        <Action icon="add" label={t('wallet.topup')} onPress={() => navigation.navigate(ROUTES.TOPUP)} theme={theme} primary />
        <Action icon="arrow-up" label={t('wallet.withdraw')} onPress={() => navigation.navigate(ROUTES.WITHDRAW)} theme={theme} />
        <Action icon="gift-outline" label={t('wallet.redeem')} onPress={() => navigation.navigate(ROUTES.TOPUP, { redeem: true })} theme={theme} />
      </View>

      <Text variant="h3" style={styles.txTitle}>{t('wallet.transactions')}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {wallet.isError ? (
        <ErrorState error={wallet.error} onRetry={wallet.refetch} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => String(item.id ?? i)}
          ListHeaderComponent={Header}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item }) => <TransactionRow tx={item} theme={theme} />}
          ListEmptyComponent={
            wallet.isLoading || history.isLoading ? (
              <View>{[1, 2, 3].map((i) => <Skeleton key={i} height={56} radius={12} style={{ marginBottom: 10 }} />)}</View>
            ) : (
              <EmptyState icon="receipt-outline" title="No transactions yet" message="Top up your wallet to get started." />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

function Action({ icon, label, onPress, theme, primary }) {
  return (
    <View style={styles.actionWrap}>
      <Button icon={icon} title="" onPress={onPress} variant={primary ? 'primary' : 'secondary'}
        size="md" fullWidth={false} style={styles.actionBtn} />
      <Text variant="caption" color="textSecondary" style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

function TransactionRow({ tx, theme }) {
  const credit = tx.type === 'credit';
  const c = theme.colors;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: credit ? c.success.bg : c.surfaceAlt }]}>
        <Ionicons name={credit ? 'arrow-down' : 'arrow-up'} size={18} color={credit ? c.success.fg : c.textSecondary} />
      </View>
      <View style={styles.txBody}>
        <Text variant="bodyStrong" numberOfLines={1}>{tx.description || (credit ? 'Top up' : 'Payment')}</Text>
        <Text variant="caption" color="textMuted">{formatRelative(tx.createdAt)}</Text>
      </View>
      <View style={styles.txRight}>
        <Text variant="bodyStrong" style={{ color: credit ? c.success.fg : c.text }}>
          {credit ? '+' : '-'}{formatCurrency(tx.amount)}
        </Text>
        {tx.status ? <Badge status={tx.status} style={{ marginTop: 4 }} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  title: { marginTop: 12, marginBottom: 16 },
  balanceCard: { borderWidth: 0 },
  balance: { color: '#fff', marginTop: 6 },
  statusBadge: { marginTop: 14 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, marginBottom: 8 },
  actionWrap: { alignItems: 'center' },
  actionBtn: { width: 56, height: 56, borderRadius: 18, paddingHorizontal: 0 },
  actionLabel: { marginTop: 8 },
  txTitle: { marginTop: 22, marginBottom: 6 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txBody: { flex: 1 },
  txRight: { alignItems: 'flex-end' },
});
