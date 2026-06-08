/**
 * DrawerContent.js — Side drawer menu
 *
 * Displayed inside the drawer panel that slides in from AppNavigator.
 * Contains: brand header, primary nav links, secondary links (About, FAQ, etc.),
 * language switcher (AR ↔ EN), and logout button (when logged in).
 *
 * Navigation: calls navigation.navigate(screen) which closes the drawer first,
 * then transitions to the target screen so animations don't overlap.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { changeLanguage } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';
import BrandLogo from './BrandLogo';

const DrawerSectionTitle = ({ title, isAr }) => (
  <Text style={[styles.sectionTitle, { textAlign: isAr ? 'right' : 'left' }]}>{title}</Text>
);

const DrawerItem = ({ item, isAr, onPress, danger = false }) => (
  <TouchableOpacity
    style={[styles.itemCard, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <View style={[styles.itemIconWrap, danger && styles.itemIconWrapDanger]}>
      <Ionicons
        name={item.icon}
        size={20}
        color={danger ? COLORS.danger : COLORS.primary}
      />
    </View>
    <Text style={[styles.itemLabel, danger && styles.itemLabelDanger]} numberOfLines={1}>
      {item.label}
    </Text>
    <Ionicons
      name={isAr ? 'chevron-back' : 'chevron-forward'}
      size={20}
      color={danger ? COLORS.danger : COLORS.textMuted}
    />
  </TouchableOpacity>
);

const DrawerContent = (props) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn, activeRole, logout } = useAuth();
  const popup = useTopPopup();

  const profileName = user?.companyName || user?.name || (isAr ? 'زائر' : 'Guest');
  const memberId = user?.id || (isAr ? 'معرف ضيف' : 'GuestID');
  const roleLabel = activeRole === 'owner'
    ? (isAr ? 'مدير مشروع' : 'Project Manager')
    : activeRole === 'investor'
      ? (isAr ? 'مستثمر' : 'Investor')
      : (isAr ? 'ضيف' : 'Guest');

  const roleDescription = activeRole === 'owner'
    ? (isAr ? 'إدارة المشاريع ومتابعة الطلبات والعوائد' : 'Manage projects, requests, and returns')
    : activeRole === 'investor'
      ? (isAr ? 'تصفح المشاريع ومتابعة مساهماتك' : 'Browse projects and track contributions')
      : (isAr ? 'سجل الدخول للوصول إلى مزايا الحساب' : 'Sign in to unlock account features');

  const mainItems = activeRole === 'owner'
    ? [
        { icon: 'briefcase-outline', label: isAr ? 'مشاريعي' : 'My Projects', screen: 'OwnerDashboard' },
        { icon: 'add-circle-outline', label: isAr ? 'طلب إدراج مشروع' : 'Submit Project', screen: 'AddProject' },
        { icon: 'compass-outline', label: isAr ? 'استكشاف المشاريع' : 'Explore Projects', screen: 'Projects' },
        { icon: 'settings-outline', label: isAr ? 'إعدادات الحساب' : 'Account Settings', screen: 'Account' },
      ]
    : [
        { icon: 'leaf-outline', label: isAr ? 'مشاريع الاستثمار' : 'Investment Projects', screen: 'Projects' },
        { icon: 'bag-outline', label: isAr ? 'السلة' : 'Cart', screen: 'Cart' },
        { icon: 'person-outline', label: isAr ? 'الحساب' : 'Account', screen: 'Account' },
        ...(!isLoggedIn ? [{ icon: 'log-in-outline', label: isAr ? 'تسجيل الدخول' : 'Login', screen: 'Login' }] : []),
      ];

  const infoItems = [
    { icon: 'information-circle-outline', label: isAr ? 'عن المنصة' : 'About Platform', screen: 'About' },
    { icon: 'help-circle-outline', label: isAr ? 'الأسئلة الشائعة' : 'FAQ', screen: 'FAQ' },
    { icon: 'call-outline', label: t('contactUs'), screen: 'Contact' },
  ];

  const legalItems = [
    { icon: 'business-outline', label: isAr ? 'عن الجهة' : 'About Entity', screen: 'AboutEntity' },
    { icon: 'document-text-outline', label: isAr ? 'الشروط والأحكام' : 'Terms & Conditions', screen: 'Terms' },
    { icon: 'shield-checkmark-outline', label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy', screen: 'Privacy' },
  ];

  const handleNav = (screen) => {
    if (screen && props.navigation?.navigate) {
      props.navigation.navigate(screen);
    }
  };

  // Switches the app between Arabic and English.
  // The label shown in the drawer always shows the OTHER language so the user
  // knows what they'll switch TO, not what they're currently on.
  const toggleLang = async () => {
    const next = isAr ? 'en' : 'ar';
    await changeLanguage(next);
  };

  const handleLogout = () => {
    popup.confirm({
      title: isAr ? 'تسجيل الخروج' : 'Logout',
      message: isAr ? 'هل تريد تسجيل الخروج من حسابك؟' : 'Do you want to log out of your account?',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
      confirmText: isAr ? 'خروج' : 'Logout',
      onConfirm: () => {
        logout();
        setTimeout(() => handleNav('Home'), 100);
      },
      type: 'warning',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + SPACING.base,
          paddingBottom: Math.max(insets.bottom, SPACING.lg),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.brandWrap}>
          <BrandLogo compact />
          <Text style={styles.brandSub}>{isAr ? 'قائمة الحساب والتنقل' : 'Account and navigation'}</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => props.navigation?.closeDrawer && props.navigation.closeDrawer()}
        >
          <Ionicons name="close" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.profileGlowOne} />
          <View style={styles.profileGlowTwo} />

          <View style={[styles.profileRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.avatarWrap}>
              <Ionicons name={activeRole === 'owner' ? 'business-outline' : 'person-outline'} size={30} color={COLORS.white} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={1}>
                {profileName}
              </Text>
              <Text style={[styles.profileDescription, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>
                {roleDescription}
              </Text>
              <View style={[styles.idRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <Text style={styles.profileMeta}>
                  {isAr ? `المعرّف: ${memberId}` : `ID: ${memberId}`}
                </Text>
                <Ionicons name="copy-outline" size={16} color={COLORS.textMuted} />
              </View>
            </View>
          </View>

          <View style={[styles.profileFooter, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{roleLabel}</Text>
            </View>
            <TouchableOpacity style={styles.profileAction} onPress={() => handleNav('Account')}>
              <Text style={styles.profileActionText}>{isAr ? 'عرض الحساب' : 'View account'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <DrawerSectionTitle title={isAr ? 'الوصول السريع' : 'Quick Access'} isAr={isAr} />
        <View style={styles.groupCard}>
          {mainItems.map((item) => (
            <DrawerItem
              key={item.label}
              item={item}
              isAr={isAr}
              onPress={() => handleNav(item.screen)}
            />
          ))}
        </View>

        <DrawerSectionTitle title={isAr ? 'معلومات ومساعدة' : 'Info & Help'} isAr={isAr} />
        <View style={styles.groupCard}>
          {infoItems.map((item) => (
            <DrawerItem
              key={item.label}
              item={item}
              isAr={isAr}
              onPress={() => handleNav(item.screen)}
            />
          ))}
        </View>

        <DrawerSectionTitle title={isAr ? 'المحتوى القانوني' : 'Legal'} isAr={isAr} />
        <View style={styles.groupCard}>
          {legalItems.map((item) => (
            <DrawerItem
              key={item.label}
              item={item}
              isAr={isAr}
              onPress={() => handleNav(item.screen)}
            />
          ))}
        </View>

        <DrawerSectionTitle title={isAr ? 'إعدادات' : 'Preferences'} isAr={isAr} />
        <View style={styles.groupCard}>
          <DrawerItem
            item={{ icon: 'language-outline', label: isAr ? 'English' : 'العربية' }}
            isAr={isAr}
            onPress={toggleLang}
          />
          {isLoggedIn ? (
            <DrawerItem
              item={{ icon: 'log-out-outline', label: t('logout') }}
              isAr={isAr}
              onPress={handleLogout}
              danger
            />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerMade}>{isAr ? 'تم التصميم بواسطة' : 'Designed by'}</Text>
          <View style={styles.footerNames}>
            <Text style={styles.footerName}>Seraj Sheleg</Text>
            <Text style={styles.footerName}>Ahmed Fleet</Text>
            <Text style={styles.footerName}>Mohammed Sowan</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.base,
  },
  brandWrap: {
    flex: 1,
  },
  brandSub: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  closeButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  profileGlowOne: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -32,
    right: -24,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.85,
  },
  profileGlowTwo: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    bottom: -18,
    left: -18,
    backgroundColor: '#eef4ff',
  },
  profileRow: {
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  idRow: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  profileMeta: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  profileFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  roleChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: SPACING.base,
  },
  roleChipText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  profileAction: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
  },
  profileActionText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
  },
  sectionTitle: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.sm,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  itemCard: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: SPACING.xs,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconWrapDanger: {
    backgroundColor: COLORS.dangerLight,
  },
  itemLabel: {
    flex: 1,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    fontWeight: FONTS.medium,
  },
  itemLabelDanger: {
    color: COLORS.danger,
    fontWeight: FONTS.bold,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  footerMade: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
  },
  footerNames: {
    alignItems: 'center',
  },
  footerName: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
});

export default DrawerContent;
