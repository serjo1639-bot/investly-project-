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
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, GRADIENTS, responsiveHeight } from '../constants/theme';
import { projectsAPI, resolveProjectImage } from '../services/api';
import AppHeader from './AppHeader';

// ProjectCard uses the same image-top + white-info-bottom design as HomeScreen
// for a consistent look across the full project listing.
const ProjectCard = ({ project, onPress }) => {
  const { i18n } = useTranslation();
  const isAr   = i18n.language === 'ar';
  const title  = isAr ? project.titleAr : project.titleEn;
  const city   = isAr ? project.cityAr  : project.cityEn;
  const catLbl = isAr ? project.categoryAr : project.categoryEn;
  const owner  = project.ownerCompanyName || project.ownerName || project.founderName;
  const pct    = project.goal > 0 ? Math.min(100, Math.round((project.raised / project.goal) * 100)) : 0;
  const minInv = Number(project.minInvestment || 5).toLocaleString();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Image hero */}
      <View style={styles.cardImgWrap}>
        <Image source={resolveProjectImage(project.image)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(8,12,46,0.45)']} style={StyleSheet.absoluteFill} />

        {catLbl ? (
          <View style={[styles.cardCatBadge, isAr ? { right: SPACING.md } : { left: SPACING.md }]}>
            <Text style={styles.cardCatTxt}>{catLbl}</Text>
          </View>
        ) : null}

        <View style={[styles.cardPctBadge, isAr ? { left: SPACING.md } : { right: SPACING.md }]}>
          <Text style={styles.cardPctBadgeTxt}>{pct}%</Text>
          <Text style={styles.cardPctBadgeSub}>{isAr ? 'مُموَّل' : 'funded'}</Text>
        </View>
      </View>

      {/* White info panel */}
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
          {title}
        </Text>
        {owner ? (
          <Text style={[styles.cardOwner, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={1}>
            {owner}
          </Text>
        ) : null}

        <View style={[styles.cardStatsRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <View style={styles.cardStat}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.cardStatTxt}>{city}</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStat}>
            <Ionicons name="people-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.cardStatTxt}>{project.investorsCount || 0}</Text>
          </View>
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStat}>
            <Ionicons name="wallet-outline" size={12} color={COLORS.primary} />
            <Text style={[styles.cardStatTxt, { color: COLORS.primary, fontWeight: FONTS.semibold }]}>
              {minInv} LYD
            </Text>
          </View>
        </View>

        <View style={styles.barBg}>
          <LinearGradient
            colors={GRADIENTS.accent}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${pct}%` }]}
          />
        </View>
      </View>
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
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardImgWrap: {
    height: responsiveHeight(155, { min: 130, max: 175 }),
    overflow: 'hidden',
  },
  cardCatBadge: {
    position: 'absolute', top: SPACING.md,
    backgroundColor: 'rgba(67,97,238,0.82)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
  },
  cardCatTxt: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.white },

  cardPctBadge: {
    position: 'absolute', top: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  cardPctBadgeTxt: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white, lineHeight: 16 },
  cardPctBadgeSub: { fontSize: 9, color: 'rgba(255,255,255,0.75)', lineHeight: 12 },

  cardInfo: { padding: SPACING.base, gap: SPACING.xs },
  cardTitle: {
    fontSize: FONTS.base, fontWeight: FONTS.bold,
    color: COLORS.textPrimary, lineHeight: FONTS.base * 1.38,
  },
  cardOwner: { fontSize: FONTS.xs, color: COLORS.textMuted, fontWeight: FONTS.medium },
  cardStatsRow: { alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatTxt: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  cardStatDivider: { width: 1, height: 12, backgroundColor: COLORS.borderLight },

  barBg:   { height: 4, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.full, overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: RADIUS.full },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxl },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginTop: SPACING.base },
  emptyDesc:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
