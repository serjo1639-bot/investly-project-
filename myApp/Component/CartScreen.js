/**
 * CartScreen.js — Investment cart and checkout
 *
 * Lists all projects the user has queued for investment.
 * Each item shows the project image, title, and an AmountEditor
 * (± stepper that clamps to the project's minInvestment).
 *
 * Checkout flow:
 *   1. Check if wallet balance ≥ total investment
 *   2. If not → show "Top Up Wallet" button (navigates to RechargeWallet)
 *   3. If yes → buildInvestmentPayload(items) → investmentAPI.confirmInvestment()
 *   4. On success → clearCart() → show success popup
 *
 * The AmountEditor steps by minAmount (not by 1) so the user stays above
 * the project's minimum with every tap.
 */
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, GRADIENTS, SCREEN, responsiveHeight } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { buildInvestmentPayload, investmentAPI, resolveProjectImage } from '../services/api';
import AppHeader from './AppHeader';
import { useTopPopup } from '../hooks/useTopPopup';

const Button = ({ title, onPress, size = 'md', style, loading, icon, danger }) => (
  <TouchableOpacity onPress={onPress} style={[styles.btn, style]} disabled={loading} activeOpacity={0.88}>
    <LinearGradient
      colors={danger ? GRADIENTS.danger : GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.btnGrad, size === 'lg' && styles.btnGradLg]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={COLORS.white} style={{ marginRight: 6 }} />}
          <Text style={styles.btnText}>{title}</Text>
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} LYD`;

const AmountEditor = ({ value, minAmount, onChange, isAr }) => (
  <View style={[styles.amountEditor, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
    <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Math.max(minAmount, Number(value || minAmount) - minAmount))}>
      <Ionicons name="remove" size={18} color={COLORS.primary} />
    </TouchableOpacity>
    <Text style={styles.amountValue}>{formatCurrency(value)}</Text>
    <TouchableOpacity style={styles.stepBtn} onPress={() => onChange(Number(value || minAmount) + minAmount)}>
      <Ionicons name="add" size={18} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
);

const CartScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  const { items, removeFromCart, updateAmount, clearCart, totalAmount, totalCount } = useCart();
  const [loading, setLoading] = useState(false);
  const popup = useTopPopup();

  const walletBalance = Number(user?.walletBalance || 0);
  const canPayWithWallet = totalAmount <= walletBalance;
  const shortfall = Math.max(0, totalAmount - walletBalance);

  const handleConfirm = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = buildInvestmentPayload(items);
      await investmentAPI.confirmInvestment(payload);
      clearCart();
      popup.success(
        isAr ? 'تم تجهيز بيانات الدفع والمساهمة بنجاح.' : 'Payment and contribution data were prepared successfully.',
        {
          title: isAr ? 'تم إرسال طلب المساهمة' : 'Contribution Submitted',
          duration: 3200,
        }
      );
      setTimeout(() => navigation.navigate && navigation.navigate('Home'), 450);
    } catch {
      popup.error(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again.', {
        title: t('error'),
      });
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <AppHeader title={t('cartTitle')} onMenuPress={() => navigation.openDrawer()} showRightIcon={false} />
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={52} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('emptyCart')}</Text>
          <Text style={styles.emptyDesc}>{t('emptyCartDesc')}</Text>
          <Button
            title={t('browseProjects')}
            onPress={() => navigation.navigate && navigation.navigate('Projects')}
            size="lg"
            icon="leaf-outline"
            style={{ marginTop: SPACING.md, alignSelf: 'stretch' }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={t('cartTitle')} onMenuPress={() => navigation.openDrawer()} showRightIcon={false} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.project.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const title   = isAr ? item.project.titleAr : item.project.titleEn;
          const percent = Math.min(100, Math.round((Number(item.project.raised || 0) / Number(item.project.goal || 1)) * 100));
          return (
            <View style={[styles.cartCard, SHADOWS.md]}>
              {/* ── Project image hero ── */}
              <View style={styles.cartHero}>
                <Image source={resolveProjectImage(item.project.image)} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(7,11,44,0.90)']}
                  locations={[0.3, 1]}
                  style={styles.cartHeroGrad}
                >
                  <Text style={[styles.cartHeroTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
                    {title}
                  </Text>
                  <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, overflow: 'hidden' }}>
                    <View style={{ width: `${percent}%`, height: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: RADIUS.full }} />
                  </View>
                </LinearGradient>
                {/* Delete button — top trailing corner (right in LTR, left in RTL) */}
                <TouchableOpacity
                  style={[styles.cartDeleteBtn, isAr ? { left: SPACING.sm, right: undefined } : {}]}
                  onPress={() => popup.confirm({
                    title: isAr ? 'حذف من السلة' : 'Remove from cart',
                    message: isAr ? 'هل تريد حذف هذا المشروع من السلة؟' : 'Remove this project from cart?',
                    cancelText: t('cancel'),
                    confirmText: t('delete'),
                    onConfirm: () => removeFromCart(item.project.id),
                    type: 'warning',
                  })}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              {/* ── Amount editor ── */}
              <View style={styles.cartBody}>
                <Text style={[styles.cartMinLabel, { textAlign: isAr ? 'right' : 'left' }]}>
                  {isAr ? `الحد الأدنى: ${formatCurrency(item.minAmount)}` : `Minimum: ${formatCurrency(item.minAmount)}`}
                </Text>
                <AmountEditor
                  value={item.amount}
                  minAmount={Number(item.minAmount || 5)}
                  onChange={(value) => updateAmount(item.project.id, value)}
                  isAr={isAr}
                />
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.summaryRowLeft, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <Ionicons name="briefcase-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.summaryLabel}>{t('projectsCount')}</Text>
            </View>
            <Text style={styles.summaryValue}>{totalCount}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={[styles.summaryRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.summaryRowLeft, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <Ionicons name="trending-up-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.summaryLabel, { color: COLORS.primary }]}>{t('totalInvestment')}</Text>
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: FONTS.md }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={[styles.summaryRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.summaryRowLeft, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
              <Ionicons name="wallet-outline" size={14} color={canPayWithWallet ? COLORS.teal : COLORS.danger} />
              <Text style={styles.summaryLabel}>{isAr ? 'رصيد المحفظة' : 'Wallet Balance'}</Text>
            </View>
            <Text style={[styles.summaryValue, { color: canPayWithWallet ? COLORS.teal : COLORS.danger }]}>
              {formatCurrency(walletBalance)}
            </Text>
          </View>
        </View>

        {/* Insufficient balance warning */}
        {!canPayWithWallet && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
            <Text style={styles.warningText}>
              {isAr
                ? `يلزم شحن ${formatCurrency(shortfall)} إضافية`
                : `Need ${formatCurrency(shortfall)} more`}
            </Text>
          </View>
        )}

        {/* Action button */}
        {!canPayWithWallet ? (
          <Button
            title={isAr ? 'شحن المحفظة' : 'Top Up Wallet'}
            onPress={() => navigation.navigate && navigation.navigate('RechargeWallet')}
            size="lg"
            icon="add-circle-outline"
          />
        ) : (
          <Button
            title={isAr ? 'تأكيد الدفع' : 'Confirm Payment'}
            onPress={handleConfirm}
            loading={loading}
            size="lg"
            icon="lock-closed-outline"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.base },
  cartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    marginBottom: SPACING.base,
    overflow: 'hidden',
  },
  cartHero: {
    height: responsiveHeight(160, { min: 130, max: 180 }),
    overflow: 'hidden',
  },
  cartHeroGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl, paddingBottom: SPACING.base,
    gap: 6,
  },
  cartHeroTitle: {
    fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.white,
    lineHeight: FONTS.base * 1.35,
  },
  cartDeleteBtn: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.72)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  cartBody: {
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  cartMinLabel: { fontSize: FONTS.xs, color: COLORS.textMuted },
  // Amount editor — larger, more premium
  amountEditor: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.sm,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  stepBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  amountValue: {
    fontSize: FONTS.md, fontWeight: FONTS.bold,
    color: COLORS.textPrimary, minWidth: 120,
    textAlign: 'center', flexShrink: 1,
  },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  emptyDesc:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs, textAlign: 'center' },

  // Footer with summary + action button
  footer: {
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  summaryCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.xs,
  },
  summaryRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryRowLeft: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
  },
  summaryDivider: {
    height: 1, backgroundColor: COLORS.borderLight, marginVertical: SPACING.xs,
  },
  summaryLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.textPrimary },

  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base,
    borderWidth: 1, borderColor: `${COLORS.danger}30`,
  },
  warningText: { flex: 1, color: COLORS.danger, fontSize: FONTS.sm, fontWeight: FONTS.medium },

  // Gradient button — pill shape (RADIUS.full) for a modern fintech look
  btn: { borderRadius: RADIUS.full, overflow: 'hidden', ...SHADOWS.button },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: 6,
    borderRadius: RADIUS.full,
  },
  btnGradLg: { paddingVertical: SPACING.lg },
  btnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold },
});

export default CartScreen;
