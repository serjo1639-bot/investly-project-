/**
 * CheckoutScreen — invest in a project. Pick an amount and a payment method
 * (wallet or credit card), see a live summary, and confirm. On success the
 * portfolio + wallet caches refresh automatically (useCheckout).
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Input, Button, Card, Divider, ListRow, toast } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useCheckout } from '../../hooks/useInvestments';
import { useWallet } from '../../hooks/useWallet';
import { PaymentMethod } from '../../constants/enums';
import { formatCurrency } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function CheckoutScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const project = route.params?.project ?? {};
  const wallet = useWallet();
  const checkout = useCheckout();

  const min = project.minInvestment || 1;
  const [amount, setAmount] = useState(String(min));
  const [method, setMethod] = useState(PaymentMethod.WALLET);

  const numericAmount = Number(amount) || 0;
  const balance = wallet.data?.balance ?? 0;
  const insufficient = method === PaymentMethod.WALLET && numericAmount > balance;

  const onConfirm = () => {
    if (numericAmount < min) return toast.error(`Minimum investment is ${formatCurrency(min)}`);
    if (insufficient) return toast.error('Insufficient wallet balance. Top up first.');
    checkout.mutate(
      { projectId: project.id, amount: numericAmount, method },
      {
        onSuccess: () => {
          toast.success('Investment confirmed!');
          navigation.navigate(ROUTES.MY_INVESTMENTS);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={t('project.invest')} showBack />
      <View style={styles.body}>
        <Card style={styles.projectCard}>
          <Text variant="caption" color="textSecondary">{t('project.details')}</Text>
          <Text variant="subtitle" numberOfLines={1} style={{ marginTop: 2 }}>{project.title}</Text>
        </Card>

        <Input
          label={t('wallet.amount')}
          icon="cash-outline"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder={String(min)}
        />
        <Text variant="caption" color="textMuted" style={styles.minHint}>
          {t('project.minInvestment')}: {formatCurrency(min)}
        </Text>

        <Text variant="caption" color="textSecondary" style={styles.label}>Payment method</Text>
        <Card padded={false} style={styles.methods}>
          <Method
            icon="wallet-outline"
            title={t('tabs.wallet')}
            subtitle={`${t('wallet.balance')}: ${formatCurrency(balance)}`}
            selected={method === PaymentMethod.WALLET}
            onPress={() => setMethod(PaymentMethod.WALLET)}
            theme={theme}
          />
          <Divider />
          <Method
            icon="card-outline"
            title="Credit card"
            subtitle="Visa / Mastercard"
            selected={method === PaymentMethod.CREDIT_CARD}
            onPress={() => setMethod(PaymentMethod.CREDIT_CARD)}
            theme={theme}
          />
        </Card>

        <Card style={styles.summary}>
          <Row label="Amount" value={formatCurrency(numericAmount)} />
          <Divider spacing={10} />
          <Row label="Total" value={formatCurrency(numericAmount)} strong />
        </Card>

        {insufficient ? (
          <Text variant="caption" color="danger" style={styles.warn}>
            Insufficient balance. Top up your wallet to continue.
          </Text>
        ) : null}

        <Button
          title={t('common.confirm')}
          size="lg"
          loading={checkout.isPending}
          onPress={onConfirm}
          style={styles.confirm}
        />
      </View>
    </ScreenContainer>
  );
}

function Method({ icon, title, subtitle, selected, onPress, theme }) {
  return (
    <ListRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      right={
        <View
          style={[
            styles.radio,
            { borderColor: selected ? theme.colors.primary : theme.colors.borderStrong },
          ]}
        >
          {selected ? <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} /> : null}
        </View>
      }
      style={styles.methodRow}
    />
  );
}

function Row({ label, value, strong }) {
  return (
    <View style={styles.sumRow}>
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'text' : 'textSecondary'}>{label}</Text>
      <Text variant={strong ? 'h3' : 'bodyStrong'}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  projectCard: { marginBottom: 20 },
  minHint: { marginTop: -8, marginBottom: 18, marginLeft: 2 },
  label: { marginBottom: 8, marginLeft: 2 },
  methods: { paddingHorizontal: 14, marginBottom: 20 },
  methodRow: { paddingVertical: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  summary: { marginBottom: 14 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  warn: { marginBottom: 12 },
  confirm: { marginTop: 4 },
});
