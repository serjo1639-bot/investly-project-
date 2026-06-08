/**
 * ContributionScreen.js — Investment amount selector
 *
 * Shown before the cart: the user picks how much to invest in one project.
 *
 * Amount presets:
 *   [minAmount, minAmount × 5, minAmount × 20]
 *   These multipliers are heuristics. ×5 covers "casual" investors,
 *   ×20 covers "committed" investors. Duplicates are removed via Set.
 *
 * Hard-coded values explained:
 *   ×5  — middle preset: 5× the minimum feels like meaningful participation
 *   ×20 — upper preset: 20× is a typical "serious investor" entry point
 *   390 pt — screen width threshold below which chips stack vertically (compact phones)
 *   1.08  — fontScale threshold; above this, chips stack to avoid text overflow
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, SCREEN, responsiveHeight } from '../constants/theme';
import { createContributionDraft, resolveProjectImage } from '../services/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} LYD`;

// ─── Amount Chip ──────────────────────────────────────────────────────────────
const AmountChip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.amountChip, active && styles.amountChipActive]}>
    {active && (
      <View style={styles.chipCheck}>
        <Ionicons name="checkmark" size={11} color={COLORS.white} />
      </View>
    )}
    <Text style={[styles.amountChipText, active && styles.amountChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── ContributionScreen ───────────────────────────────────────────────────────
const ContributionScreen = ({ route, navigation }) => {
  const project = route?.params?.project || {};
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { width } = useWindowDimensions();
  const stackPresets = width < 390 || SCREEN.fontScale > 1.08;
  const { addToCart, isInCart } = useCart();
  const { user, activeRole } = useAuth();
  const popup = useTopPopup();
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Owners cannot invest — redirect message
  const isOwner = activeRole === 'owner';

  const walletBalance = Number(user?.walletBalance || 0);

  const title     = isAr ? project.titleAr || project.title : project.titleEn || project.title;
  const remaining = Math.max(Number(project.goal || 0) - Number(project.raised || 0), 0);
  const minAmount = Number(project.minInvestment || 5);
  const inCart    = isInCart(project.id);

  const presets = useMemo(() => {
    const base = [minAmount, Math.max(minAmount, minAmount * 5), Math.max(minAmount, minAmount * 20)];
    return [...new Set(base)];
  }, [minAmount]);

  const [selectedAmount, setSelectedAmount] = useState(presets[1] || minAmount);
  const [customAmount,   setCustomAmount]   = useState(String(presets[1] || minAmount));

  const handleSelectPreset = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
  };

  const handleAmountChange = (value) => {
    const cleaned = value.replace(/[^\d]/g, '');
    setCustomAmount(cleaned);
    if (cleaned) setSelectedAmount(Number(cleaned));
  };

  const resolveAmount = () => Math.max(minAmount, Number(customAmount || selectedAmount || minAmount));

  const hasSufficientBalance = walletBalance >= resolveAmount();

  const submitToCart = (goToCart = false) => {
    const amount = resolveAmount();
    if (amount < minAmount) {
      popup.warning(
        isAr
          ? `الحد الأدنى للمساهمة هو ${formatCurrency(minAmount)}`
          : `Minimum contribution is ${formatCurrency(minAmount)}`,
      );
      return;
    }
    const draft = createContributionDraft(project, amount);
    addToCart(project, draft.amount, { currency: draft.currency, minAmount: draft.minAmount });

    if (goToCart) {
      navigation.navigate && navigation.navigate('Cart');
      return;
    }
    popup.success(
      isAr ? 'تمت إضافة قيمة المساهمة إلى السلة' : 'Contribution amount added to cart',
      { title: isAr ? 'تمت الإضافة' : 'Added' },
    );
  };

  const focusAmountInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.measureInWindow?.((_, y) => {
        const targetOffset = Math.max(0, y - responsiveHeight(150, { min: 120, max: 170 }));
        scrollRef.current?.scrollTo?.({ y: targetOffset, animated: true });
      });
    });
  };

  // ── Owner guard ───────────────────────────────────────────────────────────
  if (isOwner) {
    return (
      <View style={styles.container}>
        <View style={[styles.heroCard, { height: responsiveHeight(200, { min: 170, max: 220 }) }]}>
          <Image source={resolveProjectImage(project.image)} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(7,11,44,0.8)']} style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.ownerGuardCard}>
          <View style={styles.ownerGuardIcon}>
            <Ionicons name="shield-checkmark-outline" size={40} color={COLORS.teal} />
          </View>
          <Text style={styles.ownerGuardTitle}>
            {isAr ? 'غير متاح لأصحاب المشاريع' : 'Not Available for Owners'}
          </Text>
          <Text style={styles.ownerGuardDesc}>
            {isAr
              ? 'أنت مسجّل كصاحب مشروع. يقتصر الاستثمار على المستثمرين المسجّلين فقط.'
              : 'You are logged in as a project owner. Investment is only available to registered investors.'}
          </Text>
          <TouchableOpacity style={styles.ownerGuardBtn} onPress={() => navigation.goBack && navigation.goBack()}>
            <Text style={styles.ownerGuardBtnTxt}>{isAr ? 'العودة' : 'Go Back'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        {/* ── Project hero ─────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Image source={resolveProjectImage(project.image)} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(7,11,44,0.75)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>
          {/* Project title overlay */}
          <View style={[styles.heroTitleArea, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.heroProjectTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.heroRemaining}>
              {isAr ? `المتبقي: ${formatCurrency(remaining)}` : `Remaining: ${formatCurrency(remaining)}`}
            </Text>
          </View>
        </View>

        {/* ── Investment sheet ──────────────────────────────────────── */}
        <View style={[styles.sheetCard, SHADOWS.lg]}>

          {/* Wallet balance */}
          <View style={[styles.walletRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[styles.walletIcon, { backgroundColor: hasSufficientBalance ? COLORS.tealLight : COLORS.dangerLight }]}>
              <Ionicons
                name="wallet-outline"
                size={16}
                color={hasSufficientBalance ? COLORS.teal : COLORS.danger}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
              <Text style={[styles.walletLbl, { textAlign: isAr ? 'right' : 'left' }]}>
                {isAr ? 'رصيد المحفظة' : 'Wallet Balance'}
              </Text>
              <Text style={[
                styles.walletAmt,
                { textAlign: isAr ? 'right' : 'left' },
                { color: hasSufficientBalance ? COLORS.teal : COLORS.danger },
              ]}>
                {formatCurrency(walletBalance)}
              </Text>
            </View>
            {!hasSufficientBalance && (
              <TouchableOpacity
                style={styles.topUpBtn}
                onPress={() => navigation.navigate && navigation.navigate('RechargeWallet')}
              >
                <Text style={styles.topUpTxt}>{isAr ? 'شحن' : 'Top Up'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Already in cart notice */}
          {inCart && (
            <View style={[styles.inCartNotice, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Ionicons name="bag-check-outline" size={16} color={COLORS.teal} />
              <Text style={styles.inCartTxt}>
                {isAr ? 'هذا المشروع موجود في سلتك بالفعل. ستُحدَّث القيمة.' : 'Already in cart — amount will be updated.'}
              </Text>
            </View>
          )}

          {/* Amount label */}
          <Text style={[styles.sectionLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'اختر قيمة المساهمة' : 'Choose Your Amount'}
          </Text>

          {/* Preset chips */}
          <View
            style={[
              styles.amountRow,
              stackPresets ? styles.amountRowStack : { flexDirection: isAr ? 'row-reverse' : 'row' },
            ]}
          >
            {presets.map((amount) => (
              <AmountChip
                key={amount}
                label={formatCurrency(amount)}
                active={selectedAmount === amount}
                onPress={() => handleSelectPreset(amount)}
              />
            ))}
          </View>

          {/* Custom amount input */}
          <Text style={[styles.inputLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'أو أدخل مبلغاً مخصصاً' : 'Or enter a custom amount'}
          </Text>
          {/*
            Currency tag placement flips with language:
              LTR: [LYD |] [amount input]
              RTL: [amount input] [| LYD]
            Border swaps sides so the divider always faces the input.
          */}
          <View style={[styles.inputWrap, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={[
              styles.currencyTagWrap,
              isAr
                ? { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: COLORS.border }
                : {},
            ]}>
              <Text style={styles.currencyTag}>LYD</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={[styles.input, { textAlign: 'left' }]}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={handleAmountChange}
              onFocus={focusAmountInput}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Min notice + insufficient balance warning */}
          <View style={[styles.noticeRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.noticeText}>
              {isAr
                ? `الحد الأدنى للمساهمة: ${formatCurrency(minAmount)}`
                : `Minimum contribution: ${formatCurrency(minAmount)}`}
            </Text>
          </View>

          {!hasSufficientBalance && Number(customAmount) > 0 && (
            <View style={[styles.warningRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
              <Text style={styles.warningText}>
                {isAr
                  ? `الرصيد غير كافٍ. تحتاج ${formatCurrency(Math.max(0, resolveAmount() - walletBalance))} إضافية.`
                  : `Insufficient balance. You need ${formatCurrency(Math.max(0, resolveAmount() - walletBalance))} more.`}
              </Text>
            </View>
          )}

          {/* Summary row */}
          {Number(customAmount) >= minAmount && (
            <View style={[styles.summaryBox, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Text style={styles.summaryLbl}>{isAr ? 'إجمالي الاستثمار' : 'Total Investment'}</Text>
              <Text style={styles.summaryVal}>{formatCurrency(resolveAmount())}</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Action buttons */}
          <View style={styles.actionsCol}>
            {/* Invest Now (pay directly) */}
            <TouchableOpacity
              style={[styles.primaryBtn, !hasSufficientBalance && styles.btnDisabled]}
              onPress={() => submitToCart(true)}
              activeOpacity={0.88}
              disabled={!hasSufficientBalance}
            >
              <LinearGradient
                colors={hasSufficientBalance ? ['#1A237E', '#4361EE'] : ['#999', '#bbb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGrad}
              >
                <Ionicons name="trending-up-outline" size={18} color={COLORS.white} />
                <Text style={styles.primaryBtnText}>
                  {isAr ? 'ساهم الآن والذهاب للسلة' : 'Invest Now — Go to Cart'}
                </Text>
                <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Add to cart only */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => submitToCart(false)}
              activeOpacity={0.88}
            >
              <Ionicons name={inCart ? 'bag-check-outline' : 'bag-add-outline'} size={18} color={COLORS.primary} />
              <Text style={styles.secondaryBtnText}>
                {inCart
                  ? (isAr ? 'تحديث قيمة السلة' : 'Update Cart Amount')
                  : (isAr ? 'أضف إلى السلة فقط' : 'Add to Cart Only')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { paddingBottom: SPACING.xxxl },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroCard: {
    height: responsiveHeight(260, { min: 210, max: 280 }),
    backgroundColor: COLORS.backgroundDark,
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  backBtn: {
    position: 'absolute',
    top: SPACING.xl + SPACING.md,
    // back button is on the trailing edge of reading direction
    left: SPACING.base,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(15,23,42,0.40)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  heroTitleArea: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.base,
    right: SPACING.base,
    gap: 4,
  },
  heroProjectTitle: {
    fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.white,
    lineHeight: FONTS.xl * 1.25,
  },
  heroRemaining: {
    fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', fontWeight: FONTS.medium,
  },

  // ── Sheet card ────────────────────────────────────────────────────────────
  sheetCard: {
    backgroundColor: COLORS.white,
    marginTop: -24,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: SPACING.xl,
    gap: SPACING.base,
    minHeight: responsiveHeight(480, { min: 440, max: 520 }),
  },

  // ── Wallet ────────────────────────────────────────────────────────────────
  walletRow:  { alignItems: 'center' },
  walletIcon: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  walletLbl: { fontSize: FONTS.xs, color: COLORS.textMuted },
  walletAmt: { fontSize: FONTS.base, fontWeight: FONTS.bold },
  topUpBtn: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  topUpTxt: { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.white },

  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: -SPACING.xs },

  inCartNotice: {
    alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.tealLight,
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
  },
  inCartTxt: { fontSize: FONTS.xs, color: COLORS.tealDark, flex: 1 },

  sectionLabel: {
    fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.textPrimary,
  },

  // ── Amount chips ──────────────────────────────────────────────────────────
  amountRow:      { gap: SPACING.sm, marginBottom: SPACING.xs },
  amountRowStack: { gap: SPACING.sm },
  amountChip: {
    flex: 1,
    minHeight: responsiveHeight(56, { min: 50, max: 62 }),
    borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
    position: 'relative',
    overflow: 'hidden',
  },
  amountChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  chipCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  amountChipText: {
    fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.textPrimary,
  },
  amountChipTextActive: { color: COLORS.primaryDark },

  // ── Custom amount input ───────────────────────────────────────────────────
  inputLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  currencyTagWrap: {
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  currencyTag: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primary },
  input: {
    flex: 1,
    fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.textPrimary,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.base,
  },

  // ── Notices ───────────────────────────────────────────────────────────────
  noticeRow: { alignItems: 'center', gap: SPACING.xs },
  noticeText: { fontSize: FONTS.xs, color: COLORS.textMuted, flex: 1 },
  warningRow: { alignItems: 'center', gap: SPACING.xs, marginTop: -SPACING.xs },
  warningText: { fontSize: FONTS.xs, color: COLORS.danger, flex: 1 },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryBox: {
    justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
  },
  summaryLbl: { fontSize: FONTS.sm, color: COLORS.primaryDark, fontWeight: FONTS.semibold },
  summaryVal: { fontSize: FONTS.base, color: COLORS.primaryDark, fontWeight: FONTS.bold },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionsCol: { gap: SPACING.sm },
  primaryBtn: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.button },
  primaryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.base,
  },
  primaryBtnText: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold, flex: 1, textAlign: 'center' },
  btnDisabled: { opacity: 0.45 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: FONTS.bold },

  // ── Owner guard ───────────────────────────────────────────────────────────
  ownerGuardCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: SPACING.xl, gap: SPACING.base,
  },
  ownerGuardIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.tealLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  ownerGuardTitle: {
    fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, textAlign: 'center',
  },
  ownerGuardDesc: {
    fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22,
  },
  ownerGuardBtn: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
  },
  ownerGuardBtnTxt: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white },
});

export default ContributionScreen;
