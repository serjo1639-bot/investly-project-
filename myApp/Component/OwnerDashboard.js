/**
 * OwnerDashboard.js — Project owner's management panel
 *
 * Access: owners only. Non-owner roles are redirected to Home by AppNavigator's
 * role guard before this component even mounts.
 *
 * Loads the owner's projects via ownerAPI.getProjects(user.id).
 * In mock mode: returns all 8 mock projects attributed to the current owner.
 * In real mode: GET /owners/:ownerId/projects
 *
 * Actions available: navigate to AddProjectScreen, navigate to EditAccountScreen.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { ownerAPI, resolveProjectImage } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';

const formatMoney = (value) => `${Number(value || 0).toLocaleString()} د.ل`;

// ─── Metric card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={28} color={COLORS.primary} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

// ─── OwnerDashboard ───────────────────────────────────────────────────────────
const OwnerDashboard = ({ navigation }) => {
  const { user }   = useAuth();
  const insets     = useSafeAreaInsets();
  const { i18n }   = useTranslation();
  const isAr       = i18n.language === 'ar';
  const userId     = user?.id;

  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) { setProjects([]); setLoading(false); return; }
      setLoading(true);
      try {
        const response = await ownerAPI.getProjects(userId);
        setProjects(response?.data || []);
      } catch (error) {
        console.error('Error fetching owner projects:', error);
        setProjects([]);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userId]);

  const summary = useMemo(() =>
    projects.reduce(
      (acc, item) => {
        acc.projects  += 1;
        acc.investors += Number(item.investorsCount || 0);
        acc.views     += Number(item.viewsCount     || 0);
        acc.raised    += Number(item.raised         || 0);
        if ((item.status || '').toLowerCase() === 'completed') acc.completed += 1;
        return acc;
      },
      { projects: 0, investors: 0, views: 0, raised: 0, completed: 0 },
    ),
    [projects],
  );

  const activeProjects = useMemo(
    () => projects.filter((p) => (p.status || '').toLowerCase() === 'active'),
    [projects],
  );

  const renderProject = ({ item }) => {
    const pct = Math.max(0, Math.min(100, item.progress || 0));
    return (
      <TouchableOpacity
        style={styles.projectCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigateToDetail && navigation.navigateToDetail(item)}
      >
        <View style={styles.projectHero}>
          <Image
            source={resolveProjectImage(item.image)}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(7,11,44,0.96)']}
            locations={[0.35, 1]}
            style={styles.projectHeroGrad}
          >
            <Text style={styles.projectHeroTitle} numberOfLines={2}>
              {item.titleAr || item.title}
            </Text>
            <Text style={styles.projectHeroOwner} numberOfLines={1}>
              {item.ownerCompanyName || item.ownerName || item.founderName || ''}
            </Text>
            <View style={styles.projectHeroPills}>
              <View style={styles.heroPill}>
                <Ionicons name="radio-button-on-outline" size={10} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroPillTxt}>{item.status || 'pending'}</Text>
              </View>
              <View style={[styles.heroPill, { backgroundColor: 'rgba(0,180,160,0.32)' }]}>
                <Text style={styles.heroPillTxt}>{pct}%</Text>
              </View>
            </View>
            <View style={styles.heroPBar}>
              <View style={[styles.heroPFill, { width: `${pct}%` }]} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.projectStatsGrid}>
          <MetricCard icon="eye-outline"            label={isAr ? 'الزيارات'  : 'Views'}     value={String(item.viewsCount     || 0)} />
          <MetricCard icon="people-outline"         label={isAr ? 'المهتمون'  : 'Investors'}  value={String(item.investorsCount || 0)} />
          <MetricCard icon="cash-outline"           label={isAr ? 'المساهمات' : 'Raised'}     value={formatMoney(item.raised    || 0)} />
          <MetricCard icon="checkmark-done-outline" label={isAr ? 'الإنجاز'   : 'Progress'}   value={`${pct}%`} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B4B" translucent={false} />

      {/* ── Gradient header (respects safe area) ── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        {/* Decorative glows */}
        <View style={styles.headerGlow1} />
        <View style={styles.headerGlow2} />

        {/* Title row */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerEyebrow}>Investly</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {user?.companyName || user?.name || (isAr ? 'مشاريعي' : 'My Projects')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddProject')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            onPress={() => setActiveTab('stats')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'stats' ? 'bar-chart' : 'bar-chart-outline'}
              size={15}
              color={activeTab === 'stats' ? COLORS.primaryDark : 'rgba(255,255,255,0.75)'}
            />
            <Text style={[styles.tabTxt, activeTab === 'stats' && styles.tabTxtActive]}>
              {isAr ? 'الإحصائيات' : 'Statistics'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'active' ? 'briefcase' : 'briefcase-outline'}
              size={15}
              color={activeTab === 'active' ? COLORS.primaryDark : 'rgba(255,255,255,0.75)'}
            />
            <Text style={[styles.tabTxt, activeTab === 'active' && styles.tabTxtActive]}>
              {isAr ? 'المشاريع النشطة' : 'Active Projects'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{isAr ? 'جارٍ تحميل مشاريعك...' : 'Loading your projects...'}</Text>
        </View>
      ) : activeTab === 'stats' ? (
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Total raised banner */}
          <View style={styles.raisedBanner}>
            <Text style={styles.raisedLabel}>{isAr ? 'إجمالي المساهمات المُجمَّعة' : 'Total Raised'}</Text>
            <Text style={styles.raisedValue}>{formatMoney(summary.raised)}</Text>
          </View>

          {/* Metrics grid */}
          <View style={styles.metricsGrid}>
            <MetricCard icon="wallet-outline"           label={isAr ? 'المشاريع' : 'Projects'}   value={String(summary.projects)}  />
            <MetricCard icon="people-outline"           label={isAr ? 'المهتمون' : 'Investors'}   value={String(summary.investors)} />
            <MetricCard icon="eye-outline"              label={isAr ? 'الزيارات' : 'Views'}       value={String(summary.views)}     />
            <MetricCard icon="checkmark-circle-outline" label={isAr ? 'المكتملة' : 'Completed'}   value={String(summary.completed)} />
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={activeProjects}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderProject}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {isAr ? `${activeProjects.length} مشروع نشط` : `${activeProjects.length} Active Projects`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>{isAr ? 'لا توجد مشاريع نشطة حالياً' : 'No active projects yet'}</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddProject')}
              >
                <Text style={styles.emptyBtnTxt}>{isAr ? 'أضف مشروعك الأول' : 'Add Your First Project'}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGlow1: {
    position: 'absolute', top: -40, right: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerGlow2: {
    position: 'absolute', left: -50, bottom: -60,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  headerTextWrap: { flex: 1, marginRight: SPACING.sm },
  headerEyebrow: {
    fontSize: FONTS.xs,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: FONTS.semibold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ── Tab switcher ─────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  tabTxt: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: 'rgba(255,255,255,0.8)',
  },
  tabTxtActive: {
    color: COLORS.primaryDark,
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  bodyScroll:  { flex: 1 },
  bodyContent: { padding: SPACING.base, paddingBottom: SPACING.xxxl },

  // ── Raised banner ─────────────────────────────────────────────────────────
  raisedBanner: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  raisedLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  raisedValue: {
    fontSize: FONTS.xxl,
    color: COLORS.teal,
    fontWeight: FONTS.bold,
  },

  // ── Metrics grid ──────────────────────────────────────────────────────────
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  metricLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  metricValue: {
    fontSize: FONTS.xl,
    color: COLORS.teal,
    fontWeight: FONTS.bold,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  // ── Projects list ─────────────────────────────────────────────────────────
  listContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  listHeader: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: SPACING.sm,
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    marginBottom: SPACING.base,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  projectHero: { height: 200, overflow: 'hidden' },
  projectHeroGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.base,
    gap: 6,
  },
  projectHeroTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    lineHeight: FONTS.base * 1.35,
  },
  projectHeroOwner: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.65)' },
  projectHeroPills: { flexDirection: 'row', gap: 6 },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPillTxt:  { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.9)', fontWeight: FONTS.semibold },
  heroPBar:     { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.full, overflow: 'hidden' },
  heroPFill:    { height: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: RADIUS.full },
  projectStatsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, justifyContent: 'space-between',
    padding: SPACING.base,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.base,
  },
  emptyText: {
    fontSize: FONTS.base,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  emptyBtnTxt: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.white,
  },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  loadingText: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: SPACING.sm },
});

export default OwnerDashboard;
