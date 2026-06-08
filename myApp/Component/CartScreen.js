/**
 * CartScreen.js - My Investments
 *
 * The route name stays "Cart" to keep the custom navigator small, but the UI
 * now represents investor projects rather than an e-commerce cart:
 *   - Saved Projects: projects the investor wants to revisit later.
 *   - Invested Projects: projects the investor already invested in this session.
 */
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, responsiveHeight } from '../constants/theme';
import { useCart } from '../hooks/useCart';
import { resolveProjectImage } from '../services/api';
import AppHeader from './AppHeader';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString()} LYD`;

const ProjectCard = ({ item, isAr, invested = false, onRemove, onInvest }) => {
  const project = item.project || {};
  const title = isAr ? project.titleAr || project.title : project.titleEn || project.title;
  const percent = Math.min(
    100,
    Math.round((Number(project.raised || 0) / Number(project.goal || 1)) * 100),
  );

  return (
    <View style={[styles.projectCard, SHADOWS.md]}>
      <View style={styles.projectHero}>
        <Image source={resolveProjectImage(project.image)} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(7,11,44,0.90)']}
          locations={[0.25, 1]}
          style={styles.projectHeroGrad}
        >
          <Text style={[styles.projectTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.projectBody}>
        <View style={[styles.metaRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Ionicons
            name={invested ? 'checkmark-circle-outline' : 'heart-outline'}
            size={18}
            color={invested ? COLORS.teal : COLORS.primary}
          />
          <Text style={[styles.metaText, { textAlign: isAr ? 'right' : 'left' }]}>
            {invested
              ? (isAr ? `استثمرت: ${formatCurrency(item.amount)}` : `Invested: ${formatCurrency(item.amount)}`)
              : (isAr ? 'محفوظ للاستثمار لاحقا' : 'Saved to invest later')}
          </Text>
        </View>

        <View style={[styles.actionRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          {!invested ? (
            <>
              <TouchableOpacity style={styles.investBtn} onPress={() => onInvest(project)} activeOpacity={0.85}>
                <Ionicons name="trending-up-outline" size={16} color={COLORS.white} />
                <Text style={styles.investBtnText}>{isAr ? 'استثمر الآن' : 'Invest Now'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(project.id)} activeOpacity={0.85}>
                <Ionicons name="heart-dislike-outline" size={16} color={COLORS.danger} />
                <Text style={styles.removeBtnText}>{isAr ? 'إلغاء الحفظ' : 'Unsave'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.trackBtn} activeOpacity={0.85}>
              <Ionicons name="analytics-outline" size={16} color={COLORS.teal} />
              <Text style={styles.trackBtnText}>{isAr ? 'متابعة المشروع' : 'Track Project'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const Section = ({ title, emptyText, items, isAr, invested, onRemove, onInvest }) => (
  <View style={styles.section}>
    <View style={[styles.sectionHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{items.length}</Text>
    </View>
    {items.length === 0 ? (
      <View style={styles.emptySection}>
        <Ionicons name={invested ? 'bar-chart-outline' : 'heart-outline'} size={24} color={COLORS.textMuted} />
        <Text style={styles.emptySectionText}>{emptyText}</Text>
      </View>
    ) : (
      items.map((item) => (
        <ProjectCard
          key={`${item.status}-${item.project.id}`}
          item={item}
          isAr={isAr}
          invested={invested}
          onRemove={onRemove}
          onInvest={onInvest}
        />
      ))
    )}
  </View>
);

const CartScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { savedItems, investedItems, removeSavedProject } = useCart();
  const hasAnyItems = savedItems.length > 0 || investedItems.length > 0;

  const goToContribution = (project) => {
    global.currentProject = project;
    if (navigation.navigateToContribution) {
      navigation.navigateToContribution(project);
    } else {
      navigation.navigate && navigation.navigate('Contribution');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t('cartTitle')} onMenuPress={() => navigation.openDrawer()} showRightIcon={false} />

      {!hasAnyItems ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={52} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('emptyCart')}</Text>
          <Text style={styles.emptyDesc}>{t('emptyCartDesc')}</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate && navigation.navigate('Projects')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>{t('browseProjects')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Section
            title={isAr ? 'المشاريع المحفوظة' : 'Saved Projects'}
            emptyText={isAr ? 'لا توجد مشاريع محفوظة بعد.' : 'No saved projects yet.'}
            items={savedItems}
            isAr={isAr}
            onRemove={removeSavedProject}
            onInvest={goToContribution}
          />
          <Section
            title={isAr ? 'المشاريع المستثمر بها' : 'Invested Projects'}
            emptyText={isAr ? 'لا توجد مشاريع مستثمر بها بعد.' : 'No invested projects yet.'}
            items={investedItems}
            isAr={isAr}
            invested
            onRemove={removeSavedProject}
            onInvest={goToContribution}
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  sectionCount: {
    minWidth: 28,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
    fontWeight: FONTS.bold,
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: SPACING.base,
    overflow: 'hidden',
  },
  projectHero: {
    height: responsiveHeight(145, { min: 125, max: 165 }),
    overflow: 'hidden',
  },
  projectHeroGrad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    gap: 6,
  },
  projectTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    lineHeight: FONTS.base * 1.35,
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: RADIUS.full,
  },
  projectBody: { padding: SPACING.base, gap: SPACING.sm },
  metaRow: { alignItems: 'center', gap: SPACING.xs },
  metaText: { flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary },
  actionRow: { gap: SPACING.sm, flexWrap: 'wrap' },
  investBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm,
  },
  investBtnText: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  removeBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.dangerLight,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm,
  },
  removeBtnText: { color: COLORS.danger, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.tealLight,
    borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  trackBtnText: { color: COLORS.tealDark, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptySectionText: {
    marginTop: SPACING.xs,
    color: COLORS.textMuted,
    fontSize: FONTS.sm,
    textAlign: 'center',
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  emptyDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.base,
  },
  browseBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold },
});

export default CartScreen;
