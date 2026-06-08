/**
 * ProjectDetailScreen.js — Full project view
 *
 * Receives the project object via `route.params.project`
 * (set in global.currentProject by AppNavigator before navigating here).
 *
 * On mount: calls recordProjectView() as a fire-and-forget side effect
 * so the view counter increments without blocking the UI.
 *
 * Role-aware buttons:
 *   investor → "Invest Now" + "Add to Cart"
 *   owner    → view-only (no invest buttons shown)
 *   guest    → "Invest Now" redirects to Login
 *
 * Hard-coded value:
 *   '22' in `accent + '22'` on StatPill — appends hex alpha 34 % opacity
 *   to the accent color to create a light icon background tint.
 */
import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, SCREEN, responsiveHeight } from '../constants/theme';
import { recordProjectView, resolveProjectImage } from '../services/api';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

const fmt = (v) => `${Number(v || 0).toLocaleString()} LYD`;

// ─── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ icon, label, value, accent }) => (
  <View style={styles.statPill}>
    <View style={[styles.statIcon, { backgroundColor: accent + '22' }]}>
      <Ionicons name={icon} size={SCREEN.isCompactWidth ? 15 : 18} color={accent} />
    </View>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
  </View>
);

// ─── Info Card ────────────────────────────────────────────────────────────────
const InfoCard = ({ children, style }) => (
  <View style={[styles.infoCard, style]}>{children}</View>
);

export default function ProjectDetailScreen({ route, navigation }) {
  const project = route?.params?.project || {};
  const { t, i18n } = useTranslation();
  const isAr   = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { isInCart, getItemByProjectId } = useCart();
  const { activeRole } = useAuth();

  const isOwner   = activeRole === 'owner';
  const canInvest = !isOwner;

  const title         = isAr ? project.titleAr || project.title : project.titleEn || project.title;
  const city          = isAr ? project.cityAr  || project.city  : project.cityEn  || project.city;
  const description   = isAr ? project.descriptionAr || project.description : project.descriptionEn || project.description;
  const categoryLabel = isAr ? project.categoryAr || project.categoryEn || '' : project.categoryEn || project.categoryAr || '';

  const goal      = Number(project.goal   || 0);
  const raised    = Number(project.raised || 0);
  const remaining = Math.max(0, goal - raised);
  const percent   = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const inCart    = isInCart(project.id);
  const cartItem  = getItemByProjectId(project.id);
  const imgSrc    = resolveProjectImage(project.image);

  useEffect(() => { recordProjectView(project.id); }, [project.id]);

  const navigateToContribution = () => {
    global.currentProject = project;
    if (navigation.navigateToContribution) {
      navigation.navigateToContribution(project);
    } else {
      navigation.navigate && navigation.navigate('Contribution');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Hero — identical structure to ContributionScreen's heroCard ── */}
      <View style={styles.heroCard}>
        <Image source={imgSrc} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent', 'rgba(7,11,44,0.82)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Nav row: back ← … → cart/owner */}
        <View style={[
          styles.heroNav,
          { paddingTop: insets.top + SPACING.sm, flexDirection: isAr ? 'row-reverse' : 'row' },
        ]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>

          {canInvest && (
            <TouchableOpacity
              style={[styles.navBtn, inCart && styles.navBtnCart]}
              onPress={() => navigation.navigate && navigation.navigate('Cart')}
            >
              <Ionicons name={inCart ? 'bag-check' : 'bag-outline'} size={20} color={COLORS.white} />
              {inCart && <View style={styles.cartDot} />}
            </TouchableOpacity>
          )}

          {isOwner && (
            <View style={styles.ownerBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.teal} />
              <Text style={styles.ownerBadgeTxt}>{isAr ? 'صاحب مشروع' : 'Owner'}</Text>
            </View>
          )}
        </View>

        {/* Title / category / pills — at the bottom of the image */}
        <View style={[styles.heroBottom, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
          {categoryLabel ? (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeTxt}>{categoryLabel}</Text>
            </View>
          ) : null}
          <Text style={[styles.heroTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={[styles.heroPillRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.heroPill}>
              <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.88)" />
              <Text style={styles.heroPillTxt}>{city}</Text>
            </View>
            {project.reference ? (
              <View style={styles.heroPill}>
                <Ionicons name="pricetag-outline" size={11} color="rgba(255,255,255,0.88)" />
                <Text style={styles.heroPillTxt}>{project.reference}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── White sheet — slides over the hero (same as ContributionScreen) ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheet}>

          {/* ── Progress ─────────────────────────────────────────────── */}
          <InfoCard style={styles.progressCard}>
            <View style={[styles.progressTopRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={{ alignItems: isAr ? 'flex-end' : 'flex-start' }}>
                <Text style={styles.raisedVal}>{fmt(raised)}</Text>
                <Text style={styles.raisedLbl}>{t('raised')}</Text>
              </View>
              <View style={styles.percentCircle}>
                <Text style={styles.percentCircleTxt}>{percent}%</Text>
                <Text style={styles.percentCircleSub}>{isAr ? 'مُموَّل' : 'funded'}</Text>
              </View>
              <View style={{ alignItems: isAr ? 'flex-start' : 'flex-end' }}>
                <Text style={[styles.raisedVal, { color: COLORS.warning }]}>{fmt(remaining)}</Text>
                <Text style={styles.raisedLbl}>{t('remaining')}</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <LinearGradient
                colors={['#00B4A0', '#4361EE']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${percent}%` }]}
              />
            </View>
            <View style={[styles.progressLabels, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Text style={styles.progressLabelTxt}>0</Text>
              <Text style={styles.progressLabelTxt}>{fmt(goal)}</Text>
            </View>
          </InfoCard>

          {/* ── Stats ───────────────────────────────────────────────── */}
          <View style={[styles.statsRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <StatPill icon="wallet-outline"      label={isAr ? 'الهدف'       : 'Goal'}      value={fmt(goal)}                          accent={COLORS.primary} />
            <StatPill icon="trending-up-outline" label={isAr ? 'أدنى مساهمة' : 'Min'}       value={fmt(project.minInvestment || 5)}    accent={COLORS.teal}    />
            <StatPill icon="people-outline"      label={isAr ? 'مستثمرون'    : 'Investors'}  value={String(project.investorsCount || 0)} accent={COLORS.amber}   />
            <StatPill icon="eye-outline"         label={isAr ? 'زيارات'      : 'Views'}      value={String(project.viewsCount || 0)}    accent={COLORS.info}    />
          </View>

          {/* ── Owner view-only notice ───────────────────────────────── */}
          {isOwner && (
            <InfoCard style={styles.ownerNoticeCard}>
              <View style={[styles.ownerNoticeRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <View style={styles.ownerNoticeIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.teal} />
                </View>
                <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
                  <Text style={[styles.ownerNoticeTitle, { textAlign: isAr ? 'right' : 'left' }]}>
                    {isAr ? 'وضع المشاهدة فقط' : 'View-Only Mode'}
                  </Text>
                  <Text style={[styles.ownerNoticeDesc, { textAlign: isAr ? 'right' : 'left' }]}>
                    {isAr
                      ? 'أنت مسجّل كصاحب مشروع. الاستثمار متاح للمستثمرين فقط.'
                      : 'Logged in as owner. Investment is available to investors only.'}
                  </Text>
                </View>
              </View>
            </InfoCard>
          )}

          {/* ── Cart status banner ──────────────────────────────────── */}
          {canInvest && cartItem ? (
            <InfoCard style={styles.cartStatusCard}>
              <View style={[styles.cartStatusRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <View style={styles.cartStatusIcon}>
                  <Ionicons name="bag-check-outline" size={18} color={COLORS.teal} />
                </View>
                <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
                  <Text style={[{ textAlign: isAr ? 'right' : 'left' }, styles.cartStatusLbl]}>
                    {isAr ? 'مُضاف للسلة' : 'In Cart'}
                  </Text>
                  <Text style={[{ textAlign: isAr ? 'right' : 'left' }, styles.cartStatusAmt]}>
                    {fmt(cartItem.amount)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cartStatusBtn}
                  onPress={() => navigation.navigate && navigation.navigate('Cart')}
                >
                  <Text style={styles.cartStatusBtnTxt}>{isAr ? 'السلة' : 'Cart'}</Text>
                </TouchableOpacity>
              </View>
            </InfoCard>
          ) : null}

          {/* ── Project owner card ───────────────────────────────────── */}
          <InfoCard>
            <View style={[styles.ownerHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerAvatarTxt}>
                  {(project.ownerCompanyName || project.ownerName || project.founderName || '?')[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
                <Text style={styles.cardSectionLabel}>
                  {isAr ? 'صاحب المشروع' : 'Project Owner'}
                </Text>
                <Text style={[styles.ownerName, { textAlign: isAr ? 'right' : 'left' }]}>
                  {project.ownerCompanyName || project.ownerName || project.founderName || (isAr ? 'غير محدد' : 'Not specified')}
                </Text>
              </View>
            </View>
            {project.founderEmail ? (
              <View style={[styles.ownerMetaRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Ionicons name="mail-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.ownerMeta}>{project.founderEmail}</Text>
              </View>
            ) : null}
            {project.founderPhone ? (
              <View style={[styles.ownerMetaRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
                <Text style={styles.ownerMeta}>{project.founderPhone}</Text>
              </View>
            ) : null}
          </InfoCard>

          {/* ── Description ─────────────────────────────────────────── */}
          <InfoCard>
            <Text style={[styles.cardSectionLabel, { textAlign: isAr ? 'right' : 'left' }]}>
              {t('details')}
            </Text>
            <Text style={[styles.description, { textAlign: isAr ? 'right' : 'left' }]}>
              {description || (isAr ? 'لا يوجد وصف متاح.' : 'No description available.')}
            </Text>
          </InfoCard>

          {/* ── CTA buttons — investors only, inside scroll (like ContributionScreen) */}
          {canInvest && (
            <View style={styles.actionsCol}>
              {/* Primary: Invest Now */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={navigateToContribution}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#1A237E', '#4361EE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGrad}
                >
                  <Ionicons name="trending-up-outline" size={18} color={COLORS.white} />
                  <Text style={styles.primaryBtnText}>{isAr ? 'استثمر الآن' : 'Invest Now'}</Text>
                  <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary: Add to Cart / View Cart */}
              <TouchableOpacity
                style={[styles.secondaryBtn, inCart && styles.secondaryBtnCart]}
                onPress={() => {
                  if (inCart) {
                    navigation.navigate && navigation.navigate('Cart');
                  } else {
                    navigateToContribution();
                  }
                }}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={inCart ? 'bag-check-outline' : 'bag-add-outline'}
                  size={18}
                  color={inCart ? COLORS.teal : COLORS.primary}
                />
                <Text style={[styles.secondaryBtnText, inCart && { color: COLORS.teal }]}>
                  {inCart
                    ? (isAr ? 'عرض السلة' : 'View Cart')
                    : (isAr ? 'أضف للسلة' : 'Add to Cart')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>{/* end sheet */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero — exact same as ContributionScreen's heroCard ────────────────────
  heroCard: {
    height: responsiveHeight(260, { min: 215, max: 295 }),
    backgroundColor: COLORS.backgroundDark,
    overflow: 'hidden',
    // deliberately NO border radius — flat rectangle like ContributionScreen
  },
  heroImage: { width: '100%', height: '100%' },

  // Nav bar (back + cart/owner badge)
  heroNav: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.base,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  navBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.38)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  navBtnCart: {
    backgroundColor: 'rgba(0,180,160,0.30)',
    borderColor: COLORS.teal,
  },
  cartDot: {
    position: 'absolute', top: 7, right: 7,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.teal,
    borderWidth: 1.5, borderColor: COLORS.white,
  },
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,180,160,0.22)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(0,180,160,0.4)',
  },
  ownerBadgeTxt: { fontSize: FONTS.xs, fontWeight: FONTS.semibold, color: COLORS.teal },

  // Title / category / pills at the bottom of the image
  heroBottom: {
    position: 'absolute', bottom: SPACING.xl,
    left: SPACING.base, right: SPACING.base,
    gap: 5,
  },
  catBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  catBadgeTxt:  { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.white },
  heroTitle:    { fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.white, lineHeight: FONTS.xl * 1.25 },
  heroPillRow:  { flexWrap: 'wrap', gap: 5 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  heroPillTxt: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.92)', fontWeight: FONTS.medium },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },

  // ── Sheet — slides over the hero, same pattern as ContributionScreen ───────
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.base,
    gap: SPACING.base,
    // elevation ensures the sheet renders on top of the flat heroCard on Android
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  // ── Info card ─────────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20, padding: SPACING.base,
    borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardSectionLabel: {
    fontSize: FONTS.sm, fontWeight: FONTS.bold,
    color: COLORS.textMuted, marginBottom: SPACING.sm,
  },

  // ── Progress ──────────────────────────────────────────────────────────────
  progressCard:   { gap: SPACING.sm },
  progressTopRow: { justifyContent: 'space-between', alignItems: 'center' },
  raisedVal:      { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.teal },
  raisedLbl:      { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
  percentCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary + '44',
  },
  percentCircleTxt: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primaryDark },
  percentCircleSub: { fontSize: 9, color: COLORS.primary, fontWeight: FONTS.semibold, marginTop: -2 },
  progressBg:     { height: 8, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: RADIUS.full },
  progressLabels: { justifyContent: 'space-between' },
  progressLabelTxt: { fontSize: FONTS.xs, color: COLORS.textMuted },

  // ── Stats — 4 larger pills in a 2×2 grid for better readability ─────────
  statsRow: {
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  statPill: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center' },

  // ── Owner view-only notice ────────────────────────────────────────────────
  ownerNoticeCard: { borderColor: COLORS.teal + '55', backgroundColor: COLORS.tealLight },
  ownerNoticeRow:  { alignItems: 'flex-start' },
  ownerNoticeIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,180,160,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ownerNoticeTitle: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.tealDark, marginBottom: 3 },
  ownerNoticeDesc:  { fontSize: FONTS.xs, color: COLORS.tealDark, lineHeight: 17 },

  // ── Cart status ───────────────────────────────────────────────────────────
  cartStatusCard: { borderColor: COLORS.teal + '44', backgroundColor: COLORS.tealLight },
  cartStatusRow:  { alignItems: 'center' },
  cartStatusIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,180,160,0.15)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cartStatusLbl:  { fontSize: FONTS.xs, color: COLORS.tealDark },
  cartStatusAmt:  { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.tealDark },
  cartStatusBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.teal, borderRadius: RADIUS.full,
  },
  cartStatusBtnTxt: { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.white },

  // ── Owner card ────────────────────────────────────────────────────────────
  ownerHeader:    { alignItems: 'center', marginBottom: SPACING.sm },
  ownerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ownerAvatarTxt: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.primary },
  ownerName:      { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  ownerMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ownerMeta:      { fontSize: FONTS.xs, color: COLORS.textMuted },

  // ── Description ───────────────────────────────────────────────────────────
  description: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 22 },

  // ── CTA buttons — same pattern as ContributionScreen's actionsCol ─────────
  actionsCol: { gap: SPACING.sm, marginTop: SPACING.xs },

  // Primary "Invest Now" — tall gradient button with strong shadow
  primaryBtn: { borderRadius: 22, overflow: 'hidden', ...SHADOWS.glow },
  primaryBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  primaryBtnText: {
    color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold,
    flex: 1, textAlign: 'center', letterSpacing: 0.3,
  },

  // Secondary "Add to Cart / View Cart" — full-width outline, rounded corners
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  secondaryBtnCart: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.tealLight,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: FONTS.sm, fontWeight: FONTS.bold },
});
