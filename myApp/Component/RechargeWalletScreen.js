/**
 * RechargeWalletScreen.js — Wallet top-up via Investly
 *
 * Replaces the old prepaid-card-code system.
 * Flow: Investly provider card → amount modal → SecurePaymentScreen
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { paymentsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

/**
 * Formats a number as Libyan Dinar (LYD only — no other currency).
 * toLocaleString('en-US') adds comma separators: 12500 → "12,500".
 * Arabic layout puts the symbol after the number; English puts it before.
 */
const formatLYD = (value, isAr) => {
  const n = Number(value || 0).toLocaleString('en-US');
  return isAr ? `${n} د.ل` : `LYD ${n}`;
};

const STATUS_CFG = {
  completed: { ar: 'مكتمل',        en: 'Completed', color: COLORS.teal,    bg: '#e6f7f5' },
  pending:   { ar: 'قيد الانتظار', en: 'Pending',   color: '#d97706',     bg: '#fef3c7' },
  failed:    { ar: 'فاشل',         en: 'Failed',    color: COLORS.danger, bg: '#fee2e2' },
  refunded:  { ar: 'مسترجع',       en: 'Refunded',  color: '#7c3aed',     bg: '#ede9fe' },
};

const RechargeWalletScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const popup = useTopPopup();
  const { user } = useAuth();

  const [wallet, setWallet] = useState({
    balance: Number(user?.walletBalance || 0),
    totalDeposits: 0,
    totalWithdrawals: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Amount modal
  const [showModal, setShowModal] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [wRes, tRes] = await Promise.all([
          paymentsAPI.getWallet(),
          paymentsAPI.getTransactions(),
        ]);
        const wd = wRes?.data || wRes || {};
        const td = tRes?.data || tRes || [];
        setWallet({
          balance: Number(wd.balance || 0),
          totalDeposits: Number(wd.totalDeposits || 0),
          totalWithdrawals: Number(wd.totalWithdrawals || 0),
        });
        setTransactions(Array.isArray(td) ? td : []);
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openModal = () => {
    setAmountInput('');
    setAmountError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleContinue = () => {
    const amt = parseFloat(amountInput);
    if (!amountInput || isNaN(amt)) {
      setAmountError(isAr ? 'يرجى إدخال المبلغ' : 'Please enter an amount');
      return;
    }
    if (amt < 10) {
      setAmountError(isAr ? 'الحد الأدنى 10 دينار ليبي' : 'Minimum is LYD 10');
      return;
    }
    // Pass the amount to SecurePaymentScreen via a global variable.
    // We use global because the custom navigator doesn't support route params.
    // The 240 ms delay lets the modal close animation finish before the new screen slides in.
    global.paymentAmount = amt;
    closeModal();
    setTimeout(() => navigation.navigate && navigation.navigate('SecurePayment'), 240);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B4B" translucent={false} />

      {/* ── Gradient header ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 8, SPACING.xl) }]}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />

        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isAr ? 'شحن الرصيد' : 'Recharge Wallet'}</Text>
            <Text style={styles.headerSub}>{isAr ? 'أضف رصيداً إلى محفظتك' : 'Top up your wallet balance'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance card inside header */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{isAr ? 'الرصيد الحالي' : 'Current Balance'}</Text>
          <Text style={styles.balanceAmount}>{formatLYD(wallet.balance, isAr)}</Text>
          <View style={[styles.balanceRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-down-circle-outline" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.balanceStatText}>
                {isAr ? `إيداعات: ${formatLYD(wallet.totalDeposits, isAr)}` : `Deposits: ${formatLYD(wallet.totalDeposits, isAr)}`}
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Ionicons name="arrow-up-circle-outline" size={13} color="rgba(255,255,255,0.65)" />
              <Text style={styles.balanceStatText}>
                {isAr ? `سحوبات: ${formatLYD(wallet.totalWithdrawals, isAr)}` : `Withdrawals: ${formatLYD(wallet.totalWithdrawals, isAr)}`}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Payment method ─────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'طريقة الشحن' : 'Top-up Method'}
          </Text>

          <TouchableOpacity activeOpacity={0.88} onPress={openModal}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.providerCard}
            >
              <View style={[styles.providerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <View style={styles.logoWrap}>
                  <Text style={styles.logoText}>I</Text>
                </View>
                <View style={[styles.providerInfo, { alignItems: isAr ? 'flex-end' : 'flex-start', flex: 1 }]}>
                  <Text style={styles.providerName}>Investly</Text>
                  <Text style={styles.providerDesc}>
                    {isAr ? 'شحن آمن عبر البطاقة المصرفية' : 'Secure top-up via bank card'}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={18} color={COLORS.white} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.teal} />
            <Text style={styles.infoText}>
              {isAr
                ? 'مدفوعاتك محمية بتشفير SSL. اضغط على بطاقة Investly أعلاه لبدء عملية الشحن.'
                : 'Your payments are SSL-protected. Tap the Investly card above to start the top-up process.'}
            </Text>
          </View>

          {/* ── Transaction history ─────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'سجل المعاملات' : 'Transaction History'}
          </Text>

          <View style={styles.txCard}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>{isAr ? 'لا توجد معاملات بعد' : 'No Transactions Yet'}</Text>
                <Text style={styles.emptyDesc}>
                  {isAr ? 'ستظهر معاملاتك هنا بعد أول عملية شحن' : 'Your transactions will appear here after your first top-up'}
                </Text>
              </View>
            ) : (
              transactions.map((tx, idx) => {
                const isCredit = tx.type === 'credit';
                const cfg = STATUS_CFG[tx.status] || STATUS_CFG.pending;
                return (
                  <View key={tx.id || idx}>
                    <View style={[styles.txRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.txIcon, { backgroundColor: isCredit ? '#e6f7f5' : '#fee2e2' }]}>
                        <Ionicons
                          name={isCredit ? 'arrow-down' : 'arrow-up'}
                          size={16}
                          color={isCredit ? COLORS.teal : COLORS.danger}
                        />
                      </View>
                      <View style={[styles.txInfo, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                        <Text style={styles.txTitle} numberOfLines={1}>
                          {isAr ? tx.titleAr : tx.titleEn}
                        </Text>
                        <Text style={styles.txDate}>{tx.date}</Text>
                      </View>
                      <View style={[styles.txRight, { alignItems: isAr ? 'flex-start' : 'flex-end' }]}>
                        <Text style={[styles.txAmount, { color: isCredit ? COLORS.teal : COLORS.danger }]}>
                          {isCredit ? '+' : '-'}{formatLYD(tx.amount, isAr)}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusText, { color: cfg.color }]}>
                            {isAr ? cfg.ar : cfg.en}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {idx < transactions.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Amount Modal ─────────────────────────────────────────────── */}
      <Modal transparent visible={showModal} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>{isAr ? 'أدخل مبلغ الشحن' : 'Enter Top-up Amount'}</Text>
            <Text style={styles.modalSub}>
              {isAr ? 'مزود الدفع: Investly  •  الحد الأدنى 10 د.ل' : 'Provider: Investly  •  Minimum LYD 10'}
            </Text>

            <View style={styles.amountWrap}>
              <Text style={styles.currencyBadge}>{isAr ? 'د.ل' : 'LYD'}</Text>
              <View style={styles.currencyDivider} />
              <TextInput
                value={amountInput}
                onChangeText={(v) => {
                  setAmountInput(v.replace(/[^0-9.]/g, ''));
                  setAmountError('');
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BDC5DC"
                selectionColor={COLORS.primary}
                autoFocus
                style={[styles.amountInput, { textAlign: isAr ? 'right' : 'left' }]}
              />
            </View>

            {amountError ? (
              <Text style={styles.amountError}>{amountError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.continueBtn, !amountInput && styles.continueBtnOff]}
              onPress={handleContinue}
              disabled={!amountInput}
            >
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.white} />
              <Text style={styles.continueBtnText}>{isAr ? 'متابعة الدفع' : 'Continue to Payment'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: { paddingBottom: SPACING.base, paddingHorizontal: SPACING.base, overflow: 'hidden' },
  glowA: { position: 'absolute', top: -62, right: -22, width: 108, height: 108, borderRadius: 54, backgroundColor: 'rgba(255,255,255,0.14)' },
  glowB: { position: 'absolute', left: -46, bottom: -76, width: 116, height: 116, borderRadius: 58, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerRow: { alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.base },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.sm },
  headerTitle: { color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold },
  headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: FONTS.sm, marginTop: 2 },

  // Balance card
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: SPACING.xs,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sm, marginBottom: 4 },
  balanceAmount: { color: COLORS.white, fontSize: 34, fontWeight: FONTS.bold, letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', gap: SPACING.base, marginTop: SPACING.sm, flexWrap: 'wrap' },
  balanceStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceStatText: { color: 'rgba(255,255,255,0.65)', fontSize: FONTS.xs },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.base, gap: SPACING.base, paddingBottom: 60 },

  sectionTitle: { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: -4 },

  // Investly provider card
  providerCard: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.md },
  providerRow: { alignItems: 'center', padding: SPACING.base, gap: SPACING.base },
  logoWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: COLORS.white, fontSize: FONTS.lg, fontWeight: FONTS.bold },
  providerInfo: {},
  providerName: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold, marginBottom: 2 },
  providerDesc: { color: 'rgba(255,255,255,0.65)', fontSize: FONTS.sm },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  // Info card
  infoCard: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    backgroundColor: COLORS.tealLight, borderRadius: 14, padding: SPACING.base,
    borderWidth: 1, borderColor: `${COLORS.teal}30`,
  },
  infoText: { flex: 1, fontSize: FONTS.sm, color: COLORS.tealDark, lineHeight: 20 },

  // Transactions
  txCard: { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOWS.sm },
  txRow: { alignItems: 'center', padding: SPACING.base, gap: SPACING.sm },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txTitle: { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.textPrimary },
  txDate: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: FONTS.sm, fontWeight: FONTS.bold },
  statusPill: { borderRadius: RADIUS.full, paddingVertical: 2, paddingHorizontal: SPACING.sm, marginTop: 3 },
  statusText: { fontSize: FONTS.xs, fontWeight: FONTS.semibold },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: SPACING.base },
  emptyState: { alignItems: 'center', padding: SPACING.xxl },
  emptyTitle: { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 20 },

  // Modal
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: SPACING.lg, paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, alignSelf: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.xs },
  modalSub: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl },

  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: COLORS.primary,
    borderRadius: 18, paddingHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  currencyBadge: {
    fontSize: FONTS.lg, fontWeight: '700',
    color: COLORS.primary, paddingRight: SPACING.sm,
  },
  currencyDivider: {
    width: 1, height: 32,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '700',
    color: '#111111',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.sm,
  },
  amountError: { fontSize: FONTS.sm, color: COLORS.danger, textAlign: 'center', marginBottom: SPACING.sm },

  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: SPACING.sm,
    ...SHADOWS.button,
  },
  continueBtnOff: { opacity: 0.4 },
  continueBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold },
});

export default RechargeWalletScreen;
