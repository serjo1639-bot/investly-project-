/**
 * AccountScreen.js — User profile and account menu
 *
 * Two states:
 *   Logged out → shows Login + Register buttons only
 *   Logged in  → shows name, member ID, wallet balance, stats, and role-specific menu
 *
 * Role-specific menu items:
 *   investor → Recharge Wallet, Edit Account
 *   owner    → Project Profile, Add Project, Edit Account
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, SCREEN } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

// Local colour shortcuts so JSX below reads "ACCOUNT_ACCENT.primary" instead of
// the longer "COLORS.primary". Also lets us change the screen's colour palette
// in one place without touching every style rule.
const ACCOUNT_ACCENT = {
  primary: COLORS.primary,
  primaryDark: COLORS.primaryDark,
  primarySoft: COLORS.primaryLight,
  background: COLORS.background,
  cardBorder: COLORS.border,
  warning: '#d4a017',
  warningSoft: '#fff7db',
};

/**
 * Formats a number as Libyan Dinar.
 * isAr = true  → "د.ل 100.00"  (Arabic layout: symbol on the right side)
 * isAr = false → "LYD 100.00"  (English layout)
 * Currency is always LYD — no other currency is used in this app.
 */
const formatCurrency = (value, isAr) => {
  const amount = Number(value || 0).toFixed(2);
  return isAr ? `د.ل ${amount}` : `LYD ${amount}`;
};

const GuestButton = ({ title, onPress, variant = 'solid' }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.guestButton, variant === 'outline' && styles.guestButtonOutline]}
  >
    <Text style={[styles.guestButtonText, variant === 'outline' && styles.guestButtonTextOutline]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const ActionRow = ({ icon, label, value, iconColor, isAr, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.actionRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
  >
    <View style={[styles.actionIconWrap, iconColor?.backgroundColor && { backgroundColor: iconColor.backgroundColor }]}>
      <Ionicons name={icon} size={22} color={iconColor?.color || ACCOUNT_ACCENT.primary} />
    </View>
    <View style={styles.actionTextWrap}>
      <Text style={[styles.actionLabel, value && styles.actionLabelWithValue]}>{label}</Text>
      {value ? <Text style={styles.actionValue}>{value}</Text> : null}
    </View>
    <Ionicons
      name={isAr ? 'chevron-back' : 'chevron-forward'}
      size={20}
      color={ACCOUNT_ACCENT.primary}
    />
  </TouchableOpacity>
);

const AccountTopBar = ({ title, onMenuPress, onEditPress, insets }) => (
  <View style={[styles.accountTopBar, { paddingTop: Math.max(insets.top, SPACING.sm) }]}>
    <TouchableOpacity style={styles.topIconBtn} onPress={onMenuPress}>
      <Ionicons name="menu" size={22} color={ACCOUNT_ACCENT.primaryDark} />
    </TouchableOpacity>
    <Text style={styles.accountTopTitle} numberOfLines={1}>{title}</Text>
    {onEditPress ? (
      <TouchableOpacity style={styles.topIconBtn} onPress={onEditPress}>
        <Ionicons name="create-outline" size={20} color={ACCOUNT_ACCENT.primaryDark} />
      </TouchableOpacity>
    ) : (
      <View style={styles.topIconPlaceholder} />
    )}
  </View>
);

const AccountScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user, isLoggedIn, logout, activeRole } = useAuth();
  const popup = useTopPopup();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // When the user is logged in, fade the content in and slide it up into place.
  // Animated.parallel runs both animations at the same time instead of one after the other.
  // useNativeDriver: true means the animation runs on the device's native thread (smoother).
  useEffect(() => {
    if (isLoggedIn) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 20, useNativeDriver: true }),
      ]).start();
    }
  }, [fadeAnim, isLoggedIn, translateY]);

  const roleLabel = activeRole === 'owner'
    ? (isAr ? 'مدير مشروع' : 'Project Manager')
    : activeRole === 'investor'
      ? (isAr ? 'مستثمر' : 'Investor')
      : (isAr ? 'ضيف' : 'Guest');

  const memberId = user?.memberId || '127663157';
  const walletBalance = formatCurrency(user?.walletBalance, isAr);
  const contributionTotal = formatCurrency(user?.contributionTotal, isAr);
  const contributionsCount = user?.contributionsCount ?? 0;
  const projectsCount = user?.projectsCount ?? 0;

  const commonItems = [
    {
      icon: 'card-outline',
      label: isAr ? 'المدفوعات' : 'Payments',
      value: isAr ? 'إدارة بطاقاتك ومعاملاتك' : 'Manage cards & transactions',
      iconColor: { color: COLORS.tealDark, backgroundColor: COLORS.tealLight },
      onPress: () => navigation.navigate && navigation.navigate('Payments'),
    },
    {
      icon: 'wallet-outline',
      label: isAr ? 'شحن الرصيد' : 'Recharge Wallet',
      value: walletBalance,
      iconColor: { color: ACCOUNT_ACCENT.primaryDark, backgroundColor: ACCOUNT_ACCENT.primarySoft },
      onPress: () => navigation.navigate && navigation.navigate('RechargeWallet'),
    },
    {
      icon: 'create-outline',
      label: isAr ? 'تعديل بيانات الحساب' : 'Edit Account Details',
      onPress: () => navigation.navigate && navigation.navigate('EditAccount'),
    },
  ];

  const menuItems = activeRole === 'owner'
    ? [
        {
          icon: 'business-outline',
          label: isAr ? 'ملف المشروع' : 'Project Profile',
          value: user?.companyName || (isAr ? 'أضف اسم الجهة' : 'Add company name'),
          iconColor: { color: ACCOUNT_ACCENT.primary, backgroundColor: ACCOUNT_ACCENT.primarySoft },
          onPress: () => navigation.navigate && navigation.navigate('OwnerDashboard'),
        },
        {
          icon: 'add-circle-outline',
          label: isAr ? 'إضافة مشروع جديد' : 'Add New Project',
          onPress: () => navigation.navigate && navigation.navigate('AddProject'),
        },
        ...commonItems,
      ]
    : [
        ...commonItems,
        {
          icon: 'mail-unread-outline',
          label: isAr ? 'تأكيد البريد الإلكتروني' : 'Verify Email',
          value: isAr ? 'مطلوب' : 'Required',
          iconColor: { color: ACCOUNT_ACCENT.warning, backgroundColor: ACCOUNT_ACCENT.warningSoft },
          onPress: () => navigation.navigate && navigation.navigate('EditAccount'),
        },
        {
          icon: 'briefcase-outline',
          label: isAr ? 'طلبات المساهمة' : 'Contribution Requests',
          onPress: () => {},
        },
      ];

  const handleLogout = () => {
    popup.confirm({
      title: isAr ? 'تسجيل الخروج' : 'Logout',
      message: isAr ? 'هل تريد تسجيل الخروج من حسابك؟' : 'Do you want to log out of your account?',
      cancelText: t('cancel'),
      confirmText: t('logout'),
      onConfirm: () => {
        logout();
        setTimeout(() => navigation.navigate('Home'), 100);
      },
      type: 'warning',
    });
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
        <AccountTopBar
          title={t('account')}
          onMenuPress={() => navigation.openDrawer()}
          insets={insets}
        />

        <View style={styles.guestWrap}>
          <View style={styles.guestBadge}>
            <Ionicons name="person-circle-outline" size={44} color={ACCOUNT_ACCENT.primaryDark} />
          </View>
          <Text style={styles.guestTitle}>{t('notLoggedIn')}</Text>
          <Text style={styles.guestDesc}>{t('notLoggedInDesc')}</Text>
          <GuestButton title={t('loginTitle')} onPress={() => navigation.navigate('Login')} />
          <GuestButton title={t('register')} onPress={() => navigation.navigate('Register')} variant="outline" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <AccountTopBar
        title={activeRole === 'owner' ? (isAr ? 'إعدادات الحساب' : 'Account Settings') : t('account')}
        onMenuPress={() => navigation.openDrawer()}
        onEditPress={() => navigation.navigate && navigation.navigate('EditAccount')}
        insets={insets}
      />

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY }] }}
      >
        <View style={styles.accountCard}>
          <View style={styles.identityBlock}>
            <Text style={styles.profileName}>{user?.name || (isAr ? 'مستخدم' : 'User')}</Text>
            <View style={[styles.metaRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Text style={styles.profileMeta}>
                {isAr ? `المعرّف: ${memberId}` : `ID: ${memberId}`}
              </Text>
              <Ionicons name="copy-outline" size={17} color={COLORS.textMuted} />
            </View>
            <View style={styles.accountTypeChip}>
              <Text style={styles.accountTypeChipText}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>{isAr ? 'رصيد المحفظة' : 'Wallet Balance'}</Text>
            <Text style={styles.totalValue}>{walletBalance}</Text>
            <Text style={styles.totalStatus}>
              {activeRole === 'owner'
                ? (isAr ? `إجمالي العوائد ${contributionTotal}` : `Total returns ${contributionTotal}`)
                : (isAr ? `إجمالي المساهمات ${contributionTotal}` : `Total contributions ${contributionTotal}`)}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, {
          flexDirection: SCREEN.isCompactWidth ? 'column' : (isAr ? 'row-reverse' : 'row'),
        }]}>
          <StatCard label={activeRole === 'owner' ? (isAr ? 'طلبات المتابعة' : 'Tracked Requests') : (isAr ? 'مساهماتي' : 'My Contributions')} value={String(contributionsCount)} />
          <StatCard label={isAr ? 'عدد المشاريع' : 'Projects Count'} value={String(projectsCount)} />
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={`${item.label}-${index}`}>
              <ActionRow
                icon={item.icon}
                label={item.label}
                value={item.value}
                iconColor={item.iconColor}
                isAr={isAr}
                onPress={item.onPress}
              />
              {index < menuItems.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutInner}>
            <Ionicons name="log-out-outline" size={22} color={ACCOUNT_ACCENT.primaryDark} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </View>
          <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={20} color={ACCOUNT_ACCENT.primaryDark} />
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ACCOUNT_ACCENT.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  accountTopBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCOUNT_ACCENT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIconPlaceholder: {
    width: 40,
    height: 40,
  },
  accountTopTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  guestBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ACCOUNT_ACCENT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  guestTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  guestDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  guestButton: {
    width: '82%',
    backgroundColor: ACCOUNT_ACCENT.primary,
    borderRadius: 18,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  guestButtonOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: ACCOUNT_ACCENT.primary,
  },
  guestButtonText: {
    fontSize: FONTS.base,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  guestButtonTextOutline: {
    color: ACCOUNT_ACCENT.primary,
  },
  accountCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  identityBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  profileName: {
    fontSize: SCREEN.isCompactWidth ? FONTS.xl : FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  metaRow: {
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  profileMeta: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
  },
  accountTypeChip: {
    minWidth: 160,
    backgroundColor: ACCOUNT_ACCENT.primarySoft,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  accountTypeChipText: {
    color: ACCOUNT_ACCENT.primaryDark,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    textAlign: 'center',
  },
  totalCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 24,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  totalLabel: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONTS.medium,
  },
  totalValue: {
    fontSize: SCREEN.isCompactWidth ? FONTS.xxl : FONTS.xxxl,
    color: COLORS.teal,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  totalStatus: {
    fontSize: FONTS.base,
    color: ACCOUNT_ACCENT.primary,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  statsRow: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 22,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    minHeight: 122,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  statLabel: {
    fontSize: FONTS.md,
    color: COLORS.primaryDark,
    fontWeight: FONTS.bold,
    textAlign: 'center',
    lineHeight: 24,
  },
  statValue: {
    fontSize: SCREEN.isCompactWidth ? FONTS.xl : FONTS.xxl,
    color: COLORS.teal,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  actionRow: {
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ACCOUNT_ACCENT.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    fontWeight: FONTS.bold,
  },
  actionLabelWithValue: {
    marginBottom: 3,
  },
  actionValue: {
    fontSize: FONTS.sm,
    color: ACCOUNT_ACCENT.warning,
    fontWeight: FONTS.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.base,
  },
  logoutRow: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
    fontWeight: FONTS.bold,
  },
});

export default AccountScreen;
