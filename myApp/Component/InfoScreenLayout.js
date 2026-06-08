/**
 * InfoScreenLayout.js — Reusable layout for all static info screens
 *
 * Used by: AboutScreen, AboutEntityScreen, FAQScreen, ContactScreen,
 *          TermsScreen, PrivacyScreen
 *
 * Each screen passes bilingual content as props:
 *   hero     — { icon, titleAr, titleEn, subtitleAr, subtitleEn }
 *   stats    — optional array of pill stats
 *   sections — array of { icon, titleAr, titleEn, bodyAr, bodyEn }
 *   footer   — optional callout card at the bottom
 *
 * The layout is fully animated: hero slides in from the top on mount.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const ACCENT = {
  primary: COLORS.primary,
  primaryDark: COLORS.primaryDark,
  primarySoft: COLORS.primaryLight,
  secondarySoft: '#f3f6ff',
  border: COLORS.border,
  textMuted: COLORS.textMuted,
};

const InfoScreenLayout = ({
  navigation,
  isAr,
  title,
  eyebrow,
  heroTitle,
  heroDescription,
  heroIcon = 'sparkles-outline',
  stats = [],
  sections = [],
  footer,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.xl) }]}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
        <Ionicons
          name={isAr ? 'chevron-forward' : 'chevron-back'}
          size={22}
          color={ACCENT.primaryDark}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name={heroIcon} size={28} color={ACCENT.primaryDark} />
        </View>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={[styles.heroDescription, { textAlign: isAr ? 'right' : 'left' }]}>
          {heroDescription}
        </Text>
      </View>

      {!!stats.length && (
        <View style={styles.statsRow}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <View style={[styles.sectionHead, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.sectionIcon}>
              <Ionicons name={section.icon || 'ellipse-outline'} size={18} color={ACCENT.primary} />
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Text style={[styles.sectionDescription, { textAlign: isAr ? 'right' : 'left' }]}>
            {section.description}
          </Text>
        </View>
      ))}

      {footer ? (
        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>{footer.title}</Text>
          <Text style={[styles.footerText, { textAlign: isAr ? 'right' : 'left' }]}>
            {footer.description}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: ACCENT.primaryDark,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: ACCENT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  eyebrow: {
    fontSize: FONTS.sm,
    color: ACCENT.primary,
    fontWeight: FONTS.semibold,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontSize: FONTS.xl,
    color: COLORS.textPrimary,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  heroDescription: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    lineHeight: 25,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: ACCENT.secondarySoft,
    borderRadius: 22,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.lg,
    color: ACCENT.primaryDark,
    fontWeight: FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: ACCENT.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHead: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: ACCENT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  sectionDescription: {
    fontSize: FONTS.sm,
    lineHeight: 23,
    color: COLORS.textSecondary,
  },
  footerCard: {
    backgroundColor: ACCENT.primarySoft,
    borderRadius: 24,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  footerTitle: {
    fontSize: FONTS.base,
    color: ACCENT.primaryDark,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  footerText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
});

export default InfoScreenLayout;
