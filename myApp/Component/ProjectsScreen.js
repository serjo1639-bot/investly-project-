/**
 * ProjectsScreen.js — Full project list with filtering
 *
 * Fetches all projects via projectsAPI.getAll({ category, search }).
 * Filtering happens server-side (or inside the mock layer) — the screen
 * only passes the current filter values and re-fetches on change.
 *
 * Tapping a project calls navigation.navigateToDetail(project), which sets
 * global.currentProject and navigates to ProjectDetailScreen.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
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

const ProjectCard = ({ project, onPress }) => {
  const { i18n } = useTranslation();
  const isAr   = i18n.language === 'ar';
  const title  = isAr ? project.titleAr : project.titleEn;
  const city   = isAr ? project.cityAr  : project.cityEn;
  const catLbl = isAr ? project.categoryAr : project.categoryEn;
  const owner  = project.ownerCompanyName || project.ownerName || project.founderName;
  const pct    = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0;
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <Image source={resolveProjectImage(project.image)} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {canSaveProject && (
        <TouchableOpacity style={styles.addCartBtn} onPress={handleToggleSave} activeOpacity={0.85}>
          <Ionicons name={isTracked ? 'heart' : 'heart-outline'} size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(8,12,46,0.65)', 'rgba(5,8,35,0.98)']}
        locations={[0.2, 0.55, 1]}
        style={styles.cardGrad}
      >
        {/* Category badge */}
        {catLbl ? (
          <View style={[styles.cardCatBadge, { alignSelf: isAr ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.cardCatTxt}>{catLbl}</Text>
          </View>
        ) : null}

        {owner ? (
          <Text style={[styles.cardOwner, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={1}>{owner}</Text>
        ) : null}

        <Text style={[styles.cardTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>{title}</Text>

        <View style={[styles.pillRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={styles.pill}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{city}</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{project.investorsCount || 0}</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="eye-outline" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.pillTxt}>{project.viewsCount || 0}</Text>
          </View>
        </View>

        {/* Colored gradient progress bar */}
        <View style={styles.barBg}>
          <LinearGradient
            colors={['#00B4A0', '#4361EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${pct}%` }]}
          />
        </View>

        <View style={[styles.pctRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Text style={styles.pctTxt}>{pct}% {isAr ? 'مُموَّل' : 'funded'}</Text>
          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={14} color="rgba(255,255,255,0.55)" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function ProjectsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await projectsAPI.getAll();
        setProjects(res.data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader title={t('projects')} onMenuPress={() => navigation.openDrawer()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={() => navigation.navigateToDetail && navigation.navigateToDetail(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="layers-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>{t('noProjects')}</Text>
              <Text style={styles.emptyDesc}>{t('noProjectsDesc')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: SPACING.base, gap: SPACING.base, paddingBottom: SPACING.xl },

  card: {
    borderRadius: 26,
    overflow: 'hidden',
    height: responsiveHeight(240, { min: 210, max: 265 }),
    ...SHADOWS.md,
  },
  addCartBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
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
  cardGrad: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xxl, paddingBottom: SPACING.sm,
    gap: 5,
  },

  // Category badge
  cardCatBadge: {
    backgroundColor: 'rgba(67,97,238,0.72)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    marginBottom: 2,
  },
  cardCatTxt: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.white },

  cardOwner: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.65)', fontWeight: FONTS.medium },
  cardTitle: { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.white, lineHeight: FONTS.base * 1.38 },

  pillRow: { flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  pillTxt: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.95)', fontWeight: FONTS.medium },

  // Colored gradient progress bar
  barBg:   { height: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: RADIUS.full },

  pctRow: { alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  pctTxt: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.72)', fontWeight: FONTS.semibold },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxl },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginTop: SPACING.base },
  emptyDesc:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
