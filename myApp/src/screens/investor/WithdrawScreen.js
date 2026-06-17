/**
 * WithdrawScreen — request a withdrawal from the wallet (capped at balance).
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Input, Button, Card, toast } from '../../components';
import { useWallet, useWithdraw } from '../../hooks/useWallet';
import { formatCurrency } from '../../utils/format';

export default function WithdrawScreen({ navigation }) {
  const { t } = useTranslation();
  const wallet = useWallet();
  const withdraw = useWithdraw();
  const [amount, setAmount] = useState('');
  const balance = wallet.data?.balance ?? 0;

  const onWithdraw = () => {
    const value = Number(amount);
    if (!value || value <= 0) return toast.error('Enter a valid amount');
    if (value > balance) return toast.error('Amount exceeds your balance');
    withdraw.mutate(
      { amount: value },
      {
        onSuccess: () => { toast.success('Withdrawal requested'); navigation.goBack(); },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={t('wallet.withdraw')} showBack />
      <View style={styles.body}>
        <Card style={styles.card}>
          <Text variant="caption" color="textSecondary">{t('wallet.balance')}</Text>
          <Text variant="h1" style={{ marginTop: 4 }}>{formatCurrency(balance)}</Text>
        </Card>

        <Input label={t('wallet.amount')} icon="cash-outline" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" />
        <Text variant="caption" style={styles.max} color="textMuted" onPress={() => setAmount(String(balance))}>
          Withdraw all ({formatCurrency(balance)})
        </Text>

        <Button title={t('wallet.withdraw')} icon="arrow-up-circle-outline" size="lg" loading={withdraw.isPending} onPress={onWithdraw} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  card: { marginBottom: 20 },
  max: { marginTop: -8, marginBottom: 18, marginLeft: 2, fontWeight: '700' },
});
