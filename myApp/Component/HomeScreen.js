/**
 * HomeScreen.js — App landing screen
 *
 * Layout (top to bottom):
 *   AppHeader → announcement banner (auto-rotates every 4 s) → featured projects list
 *
 * The announcement banner does NOT use a FlatList or ScrollView — it uses
 * Animated fade + slide to swap between slides without scroll glitches.
 *
 * The third slide is dynamic: logged-in users see a personalised welcome card,
 * guests see a "Sign Up" call-to-action.
 *
 * Hard-coded values explained:
 *   4000 ms  — banner auto-advance interval (4 seconds feels natural for reading AR/EN text)
 *   30 pt    — banner slide animation offset (small enough to feel subtle, big enough to feel smooth)
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Animated,
  StyleSheet, Image, ActivityIndicator, useWindowDimensions, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, responsiveHeight } from '../constants/theme';
import { projectsAPI, resolveProjectImage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useTopPopup } from '../hooks/useTopPopup';
import AppHeader from './AppHeader';

// ─── Static base slides (action drives navigation on tap) ────────────────────
const BASE_SLIDES = [
  {
    id: 'ann1',
    action: 'about',
    gradientColors: ['#0D5A2C', '#1B6B3A', '#0A3B1C'],
    gradientStart: { x: 0.1, y: 0 },
    gradientEnd:   { x: 1,   y: 1 },
    decorativeText: 'بِسْمِ',
    titleAr: 'منصة Investly لاستثماراتك',
    titleEn: 'Investly — Your Investment Platform',
    subtitleAr: 'استثمر في مشاريع واعدة تصنع الفرق',
    subtitleEn: 'Invest in promising projects that make a difference',
    ctaAr: 'اعرف المزيد',
    ctaEn: 'Learn More',
    ctaColor: '#0D5A2C',
  },
  {
    id: 'ann2',
    action: 'projects',
    gradientColors: ['#1A237E', '#283593', '#0D47A1'],
    gradientStart: { x: 0, y: 0 },
    gradientEnd:   { x: 1, y: 1 },
    decorativeText: '◈',
    titleAr: 'فرص استثمارية متنوعة',
    titleEn: 'Diverse Investment Opportunities',
    subtitleAr: 'تقنية · تعليم · صحة · زراعة وأكثر',
    subtitleEn: 'Tech · Education · Health · Agriculture & more',
    ctaAr: 'تصفح المشاريع',
    ctaEn: 'Browse Projects',
    ctaColor: '#1A237E',
  },
];

// ─── Announcement Banner Card (no scroll — displayed one at a time) ───────────
const AnnouncementCard = ({ item, cardWidth, isAr, onPress }) => {
  const handleShare = async () => {
    try {
      await Share.share({ message: isAr ? item.titleAr : item.titleEn });
    } catch {}
  };

  return (
    <View style={[styles.bannerCard, { width: cardWidth }]}>
      <LinearGradient
        colors={item.gradientColors}
        start={item.gradientStart}
        end={item.gradientEnd}
        style={StyleSheet.absoluteFill}
      />

      {/* Large decorative text watermark */}
      <Text
        style={[
          styles.bannerDecorText,
          isAr ? { left: SPACING.base } : { right: SPACING.base },
        ]}
        numberOfLines={3}
      >
        {item.decorativeText}
      </Text>

      {/* Tappable card body */}
      <TouchableOpacity
        style={[styles.bannerInner, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <View style={{ flex: 1 }} />

        <Text style={[styles.bannerTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
          {isAr ? item.titleAr : item.titleEn}
        </Text>

        <Text style={[styles.bannerSubtitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
          {isAr ? item.subtitleAr : item.subtitleEn}
        </Text>

        <TouchableOpacity style={styles.bannerCta} onPress={onPress} activeOpacity={0.85}>
          <Text style={[styles.bannerCtaTxt, { color: item.ctaColor || '#0D5A2C' }]}>
            {isAr ? (item.ctaAr || 'اعرف المزيد') : (item.ctaEn || 'Learn More')}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Share button */}
      <TouchableOpacity
        style={[styles.bannerShareBtn, isAr ? { left: SPACING.base } : { right: SPACING.base }]}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Ionicons name="share-social-outline" size={15} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

// ─── Project list card ────────────────────────────────────────────────────────
const ProjectCard = ({ project, onPress }) => {
  const { i18n } = useTranslation();
  const isAr   = i18n.language === 'ar';
  const title  = isAr ? project.titleAr  : project.titleEn;
  const city   = isAr ? project.cityAr   : project.cityEn;
  const catLbl = isAr ? project.categoryAr : project.categoryEn;
  const owner  = project.ownerCompanyName || project.ownerName || project.founderName;
  const pct    = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0;
  const imgSrc = resolveProjectImage(project.image);
  const { activeRole } = useAuth();
  const { toggleSavedProject, isSaved, isInvested } = useCart();
  const popup = useTopPopup();
  const canSaveProject = activeRole === 'investor' || activeRole === 'owner';
  const isProjectSaved = isSaved(project.id);
  const isProjectInvested = isInvested(project.id);
  const isTracked = isProjectSaved || isProjectInvested;

  const handleToggleSave = (event) => {
    event?.stopPropagation?.();
    if (isProjectInvested) {
      popup.success(isAr ? 'المشروع موجود بالفعل في استثماراتي' : 'Project is already in My Investments');
      return;
    }
    const amount = Number(project.minInvestment || 5);
    toggleSavedProject(project, amount, { minAmount: amount, currency: project.currencyCode || 'LYD' });
    popup.success(
      isProjectSaved
        ? (isAr ? 'تم إلغاء حفظ المشروع' : 'Project unsaved')
        : (isAr ? 'تم حفظ المشروع في استثماراتي' : 'Project saved to My Investments')
    );
  };

  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.88}>
      <Image source={imgSrc} style={styles.listCardBg} resizeMode="cover" />
      {canSaveProject && (
        <TouchableOpacity style={styles.addCartBtn} onPress={handleToggleSave} activeOpacity={0.85}>
          <Ionicons name={isTracked ? 'heart' : 'heart-outline'} size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(8,12,46,0.65)', 'rgba(5,8,35,0.98)']}
        locations={[0.15, 0.52, 1]}
        style={styles.listGrad}
      >
        {catLbl ? (
          <View style={[styles.listCatBadge, { alignSelf: isAr ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.listCatBadgeTxt}>{catLbl}</Text>
          </View>
        ) : null}

        {owner ? (
          <Text style={[styles.listOwner, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={1}>
            {owner}
          </Text>
        ) : null}

        <Text style={[styles.listTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
          {title}
        </Text>

        <View style={[styles.pillRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={styles.pill}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{city}</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="eye-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{project.viewsCount || 0}</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{project.investorsCount || 0}</Text>
          </View>
        </View>

        <View style={styles.listBarBg}>
          <LinearGradient
            colors={['#00B4A0', '#4361EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.listBarFill, { width: `${pct}%` }]}
          />
        </View>

        <View style={[styles.listPctRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Text style={styles.listPct}>{pct}% {isAr ? 'مُموَّل' : 'funded'}</Text>
          <Ionicons
            name={isAr ? 'chevron-back' : 'chevron-forward'}
            size={14}
            color="rgba(255,255,255,0.6)"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { width } = useWindowDimensions();
  const { user, isLoggedIn } = useAuth();

  const bannerCardWidth = width - SPACING.base * 2;

  // Build slides list — 3rd slide adapts to login state
  const slides = useMemo(() => {
    const third = isLoggedIn && user
      ? {
          id: 'ann3_welcome',
          action: 'account',
          gradientColors: ['#006064', '#00838F', '#004D40'],
          gradientStart: { x: 0.2, y: 0 },
          gradientEnd:   { x: 1,   y: 1 },
          decorativeText: 'نمو',
          titleAr: `أهلاً، ${user.name}!`,
          titleEn: `Welcome, ${user.name}!`,
          subtitleAr: 'نحن سعداء بوجودك في منصة Investly',
          subtitleEn: "We're glad to have you on Investly",
          ctaAr: 'حسابي',
          ctaEn: 'My Account',
          ctaColor: '#004D40',
        }
      : {
          id: 'ann3',
          action: 'login',
          gradientColors: ['#006064', '#00838F', '#004D40'],
          gradientStart: { x: 0.2, y: 0 },
          gradientEnd:   { x: 1,   y: 1 },
          decorativeText: 'نمو',
          titleAr: 'سجّل اليوم وابدأ رحلتك',
          titleEn: 'Sign Up & Start Your Journey',
          subtitleAr: 'انضم لمئات المستثمرين الذين يثقون بنا',
          subtitleEn: 'Join hundreds of investors who trust us',
          ctaAr: 'انضم الآن',
          ctaEn: 'Join Now',
          ctaColor: '#004D40',
        };
    return [...BASE_SLIDES, third];
  }, [isLoggedIn, user]);

  // Route each slide to its destination
  const handleSlidePress = useCallback((action) => {
    if (action === 'about')    navigation.navigate('About');
    else if (action === 'projects') navigation.navigate('Projects');
    else if (action === 'login')    navigation.navigateToLogin?.();
    else if (action === 'account')  navigation.navigate('Account');
  }, [navigation]);

  // Slide animation — no FlatList, no scroll, no glitch
  const bannerFade    = useRef(new Animated.Value(1)).current;
  const bannerSlide   = useRef(new Animated.Value(0)).current;
  const currentIdxRef = useRef(0);
  const [activeBanner, setActiveBanner] = useState(0);

  // Projects
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  // Animate to a new slide: fade+slide out → swap → fade+slide in
  const goToSlide = useCallback((nextIndex) => {
    currentIdxRef.current = nextIndex;
    Animated.parallel([
      Animated.timing(bannerFade,  { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(bannerSlide, { toValue: isAr ? 30 : -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setActiveBanner(nextIndex);
      bannerSlide.setValue(isAr ? -30 : 30);
      Animated.parallel([
        Animated.timing(bannerFade,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(bannerSlide, { toValue: 0, friction: 9, tension: 60, useNativeDriver: true }),
      ]).start();
    });
  }, [bannerFade, bannerSlide, isAr]);

  // Auto-advance every 4 s
  useEffect(() => {
    const timer = setInterval(() => {
      const next = (currentIdxRef.current + 1) % slides.length;
      goToSlide(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [goToSlide, slides.length]);

  // Fetch featured projects
  useEffect(() => {
    (async () => {
      try { setItems(await projectsAPI.getFeatured()); } catch {}
      setLoading(false);
    })();
  }, []);

  // Compact stats
  const totalProjects  = items.length;
  const totalRaised    = items.reduce((s, p) => s + (p.raised || 0), 0);
  const totalInvestors = items.reduce((s, p) => s + (p.investorsCount || 0), 0);
  const fmtRaised = totalRaised >= 1000
    ? `${(totalRaised / 1000).toFixed(0)}K`
    : String(totalRaised);

  const currentSlide = slides[activeBanner] || slides[0];

  const ListHeader = useCallback(() => (
    <View>
      {/* ── Banner (single card, animated) ──────────────────────── */}
      <View style={styles.bannerWrap}>
        <Animated.View style={{ opacity: bannerFade, transform: [{ translateX: bannerSlide }] }}>
          <AnnouncementCard
            item={currentSlide}
            cardWidth={bannerCardWidth}
            isAr={isAr}
            onPress={() => handleSlidePress(currentSlide.action)}
          />
        </Animated.View>
      </View>

      {/* ── Dots + compact stats on the same row ─────────────────── */}
      <View style={[styles.dotsStatsRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <View style={styles.dotsGroup}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={() => goToSlide(i)}
            >
              <View style={[styles.dot, i === activeBanner && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.statsInline, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Ionicons name="briefcase-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.statInlineTxt}>{totalProjects}</Text>
          <View style={styles.statDot} />
          <Ionicons name="trending-up-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.statInlineTxt}>{fmtRaised}</Text>
          <View style={styles.statDot} />
          <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.statInlineTxt}>{totalInvestors}</Text>
        </View>
      </View>

      {/* ── Section header ───────────────────────────────────────── */}
      <View style={[styles.sectionRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <Text style={styles.sectionTitle}>
          {isAr ? 'المشاريع المميزة' : 'Featured Projects'}
        </Text>
        <TouchableOpacity activeOpacity={0.75}>
          <Text style={styles.sectionLink}>{isAr ? 'عرض الكل' : 'View All'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [
    currentSlide, activeBanner, slides, isAr, bannerCardWidth, bannerFade, bannerSlide,
    totalProjects, fmtRaised, totalInvestors, goToSlide, handleSlidePress,
  ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingLabel}>
          {isAr ? 'جاري تحميل المشاريع...' : 'Loading projects...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => navigation.openDrawer()}
        onRightPress={() => navigation.navigate('Notifications')}
        elevated
      />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id + '_list'}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigateToDetail && navigation.navigateToDetail(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingLabel: { marginTop: SPACING.base, fontSize: FONTS.sm, color: COLORS.textMuted },
  listContent:  { paddingBottom: SPACING.xl },

  // ── Banner wrapper ────────────────────────────────────────────────────────
  bannerWrap: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
  },

  // ── Announcement banner card ──────────────────────────────────────────────
  bannerCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: responsiveHeight(215, { min: 195, max: 235 }),
    ...SHADOWS.lg,
  },
  bannerInner: {
    flex: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
  },
  bannerDecorText: {
    position: 'absolute',
    top: -12,
    fontSize: 120,
    color: 'rgba(255,255,255,0.09)',
    fontWeight: '900',
    lineHeight: 160,
    letterSpacing: -4,
  },
  bannerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    lineHeight: FONTS.xl * 1.22,
    marginBottom: SPACING.xs,
  },
  bannerSubtitle: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: SPACING.md,
    lineHeight: FONTS.sm * 1.5,
  },
  bannerCta: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
    ...SHADOWS.button,
  },
  bannerCtaTxt: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
  },
  bannerShareBtn: {
    position: 'absolute',
    top: SPACING.base,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  // ── Dots + stats row ──────────────────────────────────────────────────────
  dotsStatsRow: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot:       { width: 6,  height: 6,  borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 20, height: 6,  borderRadius: 3, backgroundColor: COLORS.primary },

  statsInline: {
    alignItems: 'center',
    gap: 5,
  },
  statInlineTxt: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.border,
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionRow: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  sectionLink:  { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.primary },

  // ── Project list cards ────────────────────────────────────────────────────
  listCard: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.base,
    borderRadius: 26,
    overflow: 'hidden',
    height: responsiveHeight(230, { min: 200, max: 255 }),
    backgroundColor: COLORS.backgroundDark,
    ...SHADOWS.md,
  },
  addCartBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.lg,
    zIndex: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,180,160,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  listCardBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },
  listGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xxl, paddingBottom: SPACING.sm,
    gap: 5,
  },
  listCatBadge: {
    backgroundColor: 'rgba(67,97,238,0.7)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    marginBottom: 2,
  },
  listCatBadgeTxt: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.white },
  listOwner:       { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.65)', fontWeight: FONTS.medium },
  listTitle:       { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.white, lineHeight: FONTS.base * 1.38 },

  listBarBg:   { height: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.full, overflow: 'hidden' },
  listBarFill: { height: '100%', borderRadius: RADIUS.full },

  listPctRow: { alignItems: 'center', justifyContent: 'space-between' },
  listPct:    { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.75)', fontWeight: FONTS.semibold },

  // ── Shared pills ──────────────────────────────────────────────────────────
  pillRow: { flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pillTxt: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.95)', fontWeight: FONTS.medium },
});
