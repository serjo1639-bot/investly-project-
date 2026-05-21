/**
 * PaymentsScreen.js — Payments hub screen
 *
 * Features:
 *   - Gradient header (same style as RechargeWalletScreen)
 *   - Wallet balance card inside the header
 *   - Investly payment provider card
 *   - 4 quick-action buttons (Add Funds, History, Recharge Card, Investments)
 *   - Transaction history list with colored icons and status pills
 *   - Empty state when no transactions
 *   - Amount modal (bottom sheet) for Investly payment
 */
import React, { useEffect, useState, useRef } from 'react';
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
  Animated,
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
 * toLocaleString('en-US') adds thousand separators: 12500 → "12,500".
 * Arabic layout puts the symbol after the number; English puts it before.
 */
const formatCurrency = (value, isAr) => {
  const amount = Number(value || 0).toLocaleString('en-US');
  return isAr ? `${amount} د.ل` : `LYD ${amount}`;
};

const STATUS_CONFIG = {
  completed: { labelAr: 'مكتمل',  labelEn: 'Completed', color: COLORS.teal,    bg: '#e6f7f5' },
  pending:   { labelAr: 'قيد الانتظار', labelEn: 'Pending', color: '#d97706', bg: '#fef3c7' },
  failed:    { labelAr: 'فاشل',   labelEn: 'Failed',    color: COLORS.danger, bg: '#fee2e2' },
  refunded:  { labelAr: 'مسترجع', labelEn: 'Refunded',  color: '#7c3aed',   bg: '#ede9fe' },
};

const StatusPill = ({ status, isAr }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusPillText, { color: cfg.color }]}>
        {isAr ? cfg.labelAr : cfg.labelEn}
      </Text>
    </View>
  );
};

const TransactionRow = ({ tx, isAr }) => {
  const isCredit = tx.type === 'credit';
  return (
    <View style={[styles.txRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <View style={[styles.txIconWrap, { backgroundColor: isCredit ? '#e6f7f5' : '#fee2e2' }]}>
        <Ionicons
          name={isCredit ? 'arrow-down' : 'arrow-up'}
          size={18}
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
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, isAr)}
        </Text>
        <StatusPill status={tx.status} isAr={isAr} />
      </View>
    </View>
  );
};

const QuickActionButton = ({ icon, labelAr, labelEn, onPress, color, isAr }) => (
  <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.quickIconWrap, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.quickLabel} numberOfLines={2}>
      {isAr ? labelAr : labelEn}
    </Text>
  </TouchableOpacity>
);

const PaymentsScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const popup = useTopPopup();
  const { user } = useAuth();

  const [wallet, setWallet] = useState({ balance: 0, totalDeposits: 0, totalWithdrawals: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Amount modal state — controls the bottom-sheet that asks for the payment amount
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState('');
  // slideAnim starts at 400 (off-screen below), springs to 0 when modal opens.
  // useRef keeps the same Animated.Value across re-renders without recreating it.
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes] = await Promise.all([
          paymentsAPI.getWallet(),
          paymentsAPI.getTransactions(),
        ]);
        const walletData = walletRes?.data || walletRes || {};
        const txData = txRes?.data || txRes || [];
        setWallet({
          balance: Number(walletData.balance || 0),
          totalDeposits: Number(walletData.totalDeposits || 0),
          totalWithdrawals: Number(walletData.totalWithdrawals || 0),
        });
        setTransactions(Array.isArray(txData) ? txData : []);
      } catch (error) {
        popup.error(error?.message || (isAr ? 'تعذر تحميل بيانات المدفوعات' : 'Unable to load payment data'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAr, popup]);

  const openAmountModal = () => {
    setAmountInput('');
    setAmountError('');
    setShowAmountModal(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };

  const closeAmountModal = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(() => {
      setShowAmountModal(false);
    });
  };

  const handleContinue = () => {
    const amt = parseFloat(amountInput);
    if (!amountInput || isNaN(amt)) {
      setAmountError(isAr ? 'يرجى إدخال المبلغ' : 'Please enter an amount');
      return;
    }
    if (amt < 10) {
      setAmountError(isAr ? 'الحد الأدنى للدفع 10 دينار ليبي' : 'Minimum payment is LYD 10');
      return;
    }
    // Share the amount with SecurePaymentScreen via a global variable.
    // The custom navigator doesn't support route params, so global is the bridge.
    // 240 ms delay lets the modal slide-out animation complete before the new screen appears.
    global.paymentAmount = amt;
    closeAmountModal();
    setTimeout(() => navigation.navigate && navigation.navigate('SecurePayment'), 240);
  };

  const quickActions = [
    {
      icon: 'add-circle-outline',
      labelAr: 'إضافة رصيد',
      labelEn: 'Add Funds',
      color: COLORS.teal,
      onPress: openAmountModal,
    },
    {
      icon: 'time-outline',
      labelAr: 'السجل',
      labelEn: 'History',
      color: COLORS.primary,
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      labelAr: 'شحن البطاقة',
      labelEn: 'Recharge Card',
      color: '#7c3aed',
      onPress: () => navigation.navigate && navigation.navigate('RechargeWallet'),
    },
    {
      icon: 'trending-up-outline',
      labelAr: 'الاستثمارات',
      labelEn: 'Investments',
      color: '#d97706',
      onPress: () => navigation.navigate && navigation.navigate('Projects'),
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B4B" translucent={false} />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 8, SPACING.xl) }]}
      >
        <View style={styles.headerGlowPrimary} />
        <View style={styles.headerGlowSecondary} />

        {/* Top row: back button + title */}
        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isAr ? 'المدفوعات' : 'Payments'}</Text>
            <Text style={styles.headerSubtitle}>{isAr ? 'إدارة مدفوعاتك ومعاملاتك' : 'Manage your payments & transactions'}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Wallet Balance Card inside header */}
        <View style={styles.balanceCardInHeader}>
          <View style={[styles.balanceCardRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabelInHeader}>{isAr ? 'رصيد المحفظة' : 'Wallet Balance'}</Text>
              <Text style={styles.balanceValueInHeader}>{formatCurrency(wallet.balance, isAr)}</Text>
            </View>
            <View style={styles.balanceStatsCol}>
              <Text style={styles.balanceStatItem}>
                {isAr ? `الإيداعات: ${formatCurrency(wallet.totalDeposits, isAr)}` : `Deposits: ${formatCurrency(wallet.totalDeposits, isAr)}`}
              </Text>
              <Text style={styles.balanceStatItem}>
                {isAr ? `السحوبات: ${formatCurrency(wallet.totalWithdrawals, isAr)}` : `Withdrawals: ${formatCurrency(wallet.totalWithdrawals, isAr)}`}
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

          {/* ── Payment Services ── */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'خدمات الدفع' : 'Payment Services'}
            </Text>

            <TouchableOpacity activeOpacity={0.88} onPress={openAmountModal}>
              <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.providerCard}
              >
                <View style={[styles.providerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                  <View style={styles.providerLogoWrap}>
                    <Text style={styles.providerLogoText}>I</Text>
                  </View>
                  <View style={[styles.providerInfo, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
                    <Text style={styles.providerName}>Investly</Text>
                    <Text style={styles.providerDesc}>
                      {isAr ? 'ادفع استثماراتك بأمان عبر منصة Investly' : 'Secure investment payments via Investly'}
                    </Text>
                  </View>
                  <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={20} color="rgba(255,255,255,0.6)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ── Quick Actions ── */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
            </Text>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <QuickActionButton key={action.labelEn} {...action} isAr={isAr} />
              ))}
            </View>
          </View>

          {/* ── Transaction History ── */}
          <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'سجل المعاملات' : 'Transaction History'}
            </Text>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>{isAr ? 'لا توجد معاملات' : 'No Transactions'}</Text>
                <Text style={styles.emptyDesc}>
                  {isAr ? 'ستظهر معاملاتك هنا بعد أول عملية دفع' : 'Your transactions will appear here after your first payment'}
                </Text>
              </View>
            ) : (
              transactions.map((tx, idx) => (
                <View key={tx.id || idx}>
                  <TransactionRow tx={tx} isAr={isAr} />
                  {idx < transactions.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Amount Modal (bottom sheet) ── */}
      <Modal transparent visible={showAmountModal} animationType="slide" onRequestClose={closeAmountModal}>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeAmountModal} />
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>{isAr ? 'أدخل مبلغ الدفع' : 'Enter Payment Amount'}</Text>
            <Text style={styles.modalSubtitle}>
              {isAr ? 'مزود الدفع: Investly • الحد الأدنى 10 د.ل' : 'Provider: Investly • Minimum LYD 10'}
            </Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currencyLabel}>{isAr ? 'د.ل' : 'LYD'}</Text>
              <View style={styles.currencyDivider} />
              <TextInput
                value={amountInput}
                onChangeText={(v) => { setAmountInput(v.replace(/[^0-9.]/g, '')); setAmountError(''); }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#BDC5DC"
                autoFocus
                selectionColor={COLORS.primary}
                style={[styles.amountInput, { textAlign: isAr ? 'right' : 'left' }]}
              />
            </View>

            {amountError ? (
              <Text style={[styles.amountError, { textAlign: isAr ? 'right' : 'left' }]}>{amountError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.continueBtn, !amountInput && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!amountInput}
            >
              <Text style={styles.continueBtnText}>{isAr ? 'متابعة' : 'Continue'}</Text>
              <Ionicons name={isAr ? 'arrow-back' : 'arrow-forward'} size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
    overflow: 'hidden',
  },
  headerGlowPrimary: {
    position: 'absolute',
    top: -62,
    right: -22,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerGlowSecondary: {
    position: 'absolute',
    left: -46,
    bottom: -76,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FONTS.sm,
    marginTop: 2,
    textAlign: 'center',
  },
  balanceCardInHeader: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  balanceCardRow: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  balanceLabelInHeader: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FONTS.sm,
    marginBottom: 4,
  },
  balanceValueInHeader: {
    color: '#4dd9c0',
    fontSize: 28,
    fontWeight: FONTS.bold,
  },
  balanceStatsCol: {
    gap: 6,
  },
  balanceStatItem: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONTS.xs,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.md,
  },
  providerCard: {
    borderRadius: 18,
    padding: SPACING.md,
  },
  providerRow: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  providerLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  providerLogoText: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    marginBottom: 2,
  },
  providerDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FONTS.xs,
    lineHeight: 18,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  quickBtn: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.semibold,
    textAlign: 'center',
  },
  txRow: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.semibold,
    marginBottom: 3,
  },
  txDate: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  txRight: {
    gap: 4,
  },
  txAmount: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
  },
  statusPill: {
    borderRadius: RADIUS.full,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-end',
  },
  statusPillText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  // ── Amount Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: SPACING.base,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.sm,
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
  currencyLabel: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.primary,
    paddingRight: SPACING.sm,
  },
  currencyDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.borderLight,
    marginRight: SPACING.sm,
  },
  amountError: {
    fontSize: FONTS.sm,
    color: COLORS.danger,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  continueBtn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    ...SHADOWS.button,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
  },
});

export default PaymentsScreen;
