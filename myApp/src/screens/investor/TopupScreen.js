/**
 * TopupScreen — add funds to the wallet. Two modes:
 *   • amount top-up (quick-pick chips + custom amount)
 *   • redeem a prepaid code (route param `redeem`)
 */
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import { Text, Input, Button, Chip, Card, toast } from '../../components';
import { useTopup, useRedeemCode } from '../../hooks/useWallet';
import { PaymentMethod } from '../../constants/enums';
import { formatCurrency } from '../../utils/format';

const QUICK = [50, 100, 250, 500];

export default function TopupScreen({ navigation, route }) {
  const { t } = useTranslation();
  const redeemMode = Boolean(route.params?.redeem);
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');

  const topup = useTopup();
  const redeem = useRedeemCode();

  const onTopup = () => {
    const value = Number(amount);
    if (!value || value <= 0) return toast.error('Enter a valid amount');
    topup.mutate(
      { amount: value, method: PaymentMethod.CREDIT_CARD },
      {
        onSuccess: () => { toast.success(`${formatCurrency(value)} added to your wallet`); navigation.goBack(); },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const onRedeem = () => {
    if (!code.trim()) return toast.error('Enter a code');
    redeem.mutate(code.trim(), {
      onSuccess: () => { toast.success('Code redeemed!'); navigation.goBack(); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <ScreenContainer scroll keyboardAvoiding padded={false}>
      <AppHeader title={redeemMode ? t('wallet.redeem') : t('wallet.topup')} showBack />
      <View style={styles.body}>
        {redeemMode ? (
          <>
            <Text variant="body" color="textSecondary" style={styles.sub}>
              Enter your prepaid code to add its value to your wallet.
            </Text>
            <Input label={t('wallet.redeem')} icon="gift-outline" autoCapitalize="characters" value={code} onChangeText={setCode} placeholder="XXXX-XXXX-XXXX" />
            <Button title={t('common.confirm')} size="lg" loading={redeem.isPending} onPress={onRedeem} />
          </>
        ) : (
          <>
            <Card style={styles.amountCard}>
              <Text variant="caption" color="textSecondary">{t('wallet.amount')}</Text>
              <Text variant="display" style={styles.amountPreview}>{formatCurrency(Number(amount) || 0)}</Text>
            </Card>

            <View style={styles.quick}>
              {QUICK.map((q) => (
                <Chip key={q} label={formatCurrency(q)} selected={Number(amount) === q} onPress={() => setAmount(String(q))} />
              ))}
            </View>

            <Input label={t('wallet.amount')} icon="cash-outline" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" />
            <Button title={t('wallet.topup')} icon="card-outline" size="lg" loading={topup.isPending} onPress={onTopup} />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 16, paddingTop: 8 },
  sub: { marginBottom: 22 },
  amountCard: { alignItems: 'center', marginBottom: 18 },
  amountPreview: { marginTop: 6 },
  quick: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
});
