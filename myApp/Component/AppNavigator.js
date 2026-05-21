/**
 * AppNavigator.js — Custom navigation system for Investly
 *
 * Why a custom navigator?
 * ───────────────────────
 * The project intentionally avoids React Navigation to keep the dependency
 * tree small and maintain full control over transitions and the drawer.
 *
 * How it works
 * ────────────
 * Navigation state is two variables:
 *   currentScreen  — the name of the screen currently rendered
 *   stack          — array of screen names, acts as a history stack for goBack()
 *
 * navigate(screen)   → pushes currentScreen onto stack, sets the new screen
 * goBack()           → pops from stack, returns to previous screen
 * replaceScreen()    → clears stack and jumps (used after login/logout)
 *
 * Every screen receives a `navigation` prop object with these methods.
 * Screens that need project data (ProjectDetail, Contribution) receive it via
 * `global.currentProject` — a deliberate trade-off to avoid prop-drilling
 * through the navigator for a single piece of data.
 *
 * Animations
 * ──────────
 * Three Animated values drive screen transitions:
 *   slideAnim  — translateX: slides old screen off, new screen in
 *   fadeAnim   — opacity:    cross-fade
 *   scaleAnim  — scale:      subtle zoom-in for depth
 *
 * Drawer
 * ──────
 * The drawer slides in from the left (LTR) or right (RTL/Arabic).
 * drawerProgress (0 = closed, 1 = open) drives both the drawer translateX
 * and the overlay opacity via Animated.interpolate.
 *
 * Two PanResponders handle gesture interaction:
 *   edgePanResponder  — detects swipe from the screen edge to OPEN the drawer
 *   drawerPanResponder — detects swipe on the open drawer to CLOSE it
 *
 * Tab bar
 * ───────
 * Tabs differ by user role (guest/investor vs owner).
 * The tab bar is hidden on full-screen flows (Login, AddProject, etc.).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Pressable, Easing, PanResponder, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useCart }     from '../hooks/useCart';
import { useAuth }     from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

// ── Screen components ─────────────────────────────────────────────────────────
import HomeScreen           from './HomeScreen';
import ProjectsScreen       from './ProjectsScreen';
import ProjectDetailScreen  from './ProjectDetailScreen';
import CartScreen           from './CartScreen';
import AccountScreen        from './AccountScreen';
import LoginScreen          from './LoginScreen';
import RegisterScreen       from './RegisterScreen';
import AddProjectScreen     from './AddProjectScreen';
import ContributionScreen   from './ContributionScreen';
import DrawerContent        from './DrawerContent';
import AboutScreen          from './AboutScreen';
import AboutEntityScreen    from './AboutEntityScreen';
import NotificationsScreen  from './NotificationsScreen';
import TermsScreen          from './TermsScreen';
import PrivacyScreen        from './PrivacyScreen';
import ContactScreen        from './ContactScreen';
import FAQScreen            from './FAQScreen';
import OwnerDashboard       from './OwnerDashboard';
import EditAccountScreen    from './EditAccountScreen';
import RechargeWalletScreen  from './RechargeWalletScreen';
import ForgotPasswordScreen  from './ForgotPasswordScreen';
import CheckEmailScreen      from './CheckEmailScreen';
import ResetPasswordScreen   from './ResetPasswordScreen';
import PaymentsScreen        from './PaymentsScreen';
import SecurePaymentScreen   from './SecurePaymentScreen';

// ─── Constants ────────────────────────────────────────────────────────────────

// Drawer is at most 84 % of screen width, capped at 320 pt (comfortable for one-thumb reach)
const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.84, 320);

// Registry of all screens accessible via navigate(key)
const screens = {
  Home:           HomeScreen,
  Projects:       ProjectsScreen,
  Cart:           CartScreen,
  Account:        AccountScreen,
  AddProject:     AddProjectScreen,
  Contribution:   ContributionScreen,
  About:          AboutScreen,
  AboutEntity:    AboutEntityScreen,
  Notifications:  NotificationsScreen,
  Terms:          TermsScreen,
  Privacy:        PrivacyScreen,
  Contact:        ContactScreen,
  FAQ:            FAQScreen,
  OwnerDashboard: OwnerDashboard,
  EditAccount:    EditAccountScreen,
  RechargeWallet:  RechargeWalletScreen,
  ForgotPassword:  ForgotPasswordScreen,
  CheckEmail:      CheckEmailScreen,
  ResetPassword:   ResetPasswordScreen,
  Payments:        PaymentsScreen,
  SecurePayment:   SecurePaymentScreen,
};

/**
 * Tab definitions per role.
 * fallbackLabel is used when the i18n translation key doesn't resolve
 * (e.g. missing key in a translation file).
 */
const TABS_BY_ROLE = {
  guest: [
    { key: 'Home',    labelKey: 'home',    fallbackLabel: { ar: 'الرئيسية', en: 'Home' },     icons: { active: 'home',    inactive: 'home-outline' } },
    { key: 'Projects', labelKey: 'projects', fallbackLabel: { ar: 'المشاريع', en: 'Projects' }, icons: { active: 'trending-up', inactive: 'trending-up-outline' } },
    { key: 'Cart',    labelKey: 'cart',    fallbackLabel: { ar: 'السلة',    en: 'Cart' },      icons: { active: 'bag',     inactive: 'bag-outline' } },
    { key: 'Account', labelKey: 'account', fallbackLabel: { ar: 'الحساب',   en: 'Account' },   icons: { active: 'person',  inactive: 'person-outline' } },
  ],
  investor: [
    { key: 'Home',    labelKey: 'home',    fallbackLabel: { ar: 'الرئيسية', en: 'Home' },     icons: { active: 'home',    inactive: 'home-outline' } },
    { key: 'Projects', labelKey: 'projects', fallbackLabel: { ar: 'المشاريع', en: 'Projects' }, icons: { active: 'trending-up', inactive: 'trending-up-outline' } },
    { key: 'Cart',    labelKey: 'cart',    fallbackLabel: { ar: 'السلة',    en: 'Cart' },      icons: { active: 'bag',     inactive: 'bag-outline' } },
    { key: 'Account', labelKey: 'account', fallbackLabel: { ar: 'الحساب',   en: 'Account' },   icons: { active: 'person',  inactive: 'person-outline' } },
  ],
  owner: [
    { key: 'Home',           labelKey: 'home',         fallbackLabel: { ar: 'الرئيسية', en: 'Home' },        icons: { active: 'home',      inactive: 'home-outline' } },
    { key: 'Projects',       labelKey: 'projects',     fallbackLabel: { ar: 'استكشاف',  en: 'Explore' },     icons: { active: 'compass',   inactive: 'compass-outline' } },
    { key: 'OwnerDashboard', labelKey: 'ownerProjects', fallbackLabel: { ar: 'مشاريعي', en: 'My Projects' }, icons: { active: 'briefcase', inactive: 'briefcase-outline' } },
    { key: 'Account',        labelKey: 'ownerSettings', fallbackLabel: { ar: 'إعداداتي', en: 'Settings' },   icons: { active: 'settings',  inactive: 'settings-outline' } },
  ],
};

// ─── TabBar ────────────────────────────────────────────────────────────────────
/**
 * Bottom navigation bar.
 *
 * Active tab shows a halo glow + active icon + bold label.
 * The Cart tab shows a red badge when totalCount > 0.
 * A brief scale-down animation plays on press for tactile feedback.
 */
const TabBar = ({ currentScreen, navigate, totalCount, t, isAr, tabs, bottomInset }) => {
  const [pressedKey, setPressedKey] = useState(null);

  // Return translated label or fallback to hardcoded AR/EN string
  const getTabLabel = (tab) => {
    const translated = t(tab.labelKey);
    return translated === tab.labelKey
      ? tab.fallbackLabel[isAr ? 'ar' : 'en']
      : translated;
  };

  // Brief press animation — key resets after 140 ms so it can replay
  const handlePress = (key) => {
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 140);
    navigate(key);
  };

  return (
    <View style={styles.tabBarWrap} pointerEvents="box-none">
      <View
        style={[
          styles.tabBar,
          {
            flexDirection: isAr ? 'row-reverse' : 'row',
            // Add platform-specific bottom padding for home indicator / nav bar
            paddingBottom: Math.max(bottomInset, Platform.OS === 'ios' ? 10 : 8),
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive  = currentScreen === tab.key;
          const isPressed = pressedKey === tab.key;
          const label     = getTabLabel(tab);

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabTouch}
              activeOpacity={0.82}
              onPress={() => handlePress(tab.key)}
            >
              <Animated.View style={[styles.tabItem, isPressed && styles.tabItemPressed]}>
                {/* Radial halo behind the active icon */}
                {isActive && <View style={styles.activeHalo} />}

                <Animated.View
                  style={[
                    styles.iconContainer,
                    isActive && styles.iconContainerActive,
                    { transform: [{ scale: isActive ? 1.1 : 1 }, { translateY: isActive ? -2 : 0 }] },
                  ]}
                >
                  <Ionicons
                    name={isActive ? tab.icons.active : tab.icons.inactive}
                    size={24}
                    color={isActive ? COLORS.primary : COLORS.textMuted}
                  />
                  {/* Dot indicator below active icon */}
                  <Animated.View
                    style={[
                      styles.activeIndicator,
                      { opacity: isActive ? 1 : 0, transform: [{ scale: isActive ? 1 : 0 }] },
                    ]}
                  />
                </Animated.View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                    { color: isActive ? COLORS.primary : COLORS.textMuted },
                  ]}
                >
                  {label}
                </Text>

                {/* Cart badge — only shown when there are items in cart */}
                {tab.key === 'Cart' && totalCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCount}</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── AppNavigator ─────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { t, i18n }                                       = useTranslation();
  const isAr                                              = i18n.language === 'ar';
  const insets                                            = useSafeAreaInsets();
  const popup                                             = useTopPopup();
  const { totalCount }                                    = useCart();
  const { user, activeRole, isLoggedIn, isLoading, sessionExpiredAt } = useAuth();

  // ── Navigation state ──────────────────────────────────────────────────────
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [stack, setStack]                 = useState([]);  // history for goBack()

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [showDrawer,          setShowDrawer]          = useState(false);
  const [drawerGestureEnabled, setDrawerGestureEnabled] = useState(false);

  // ── Transition animation values ───────────────────────────────────────────
  const slideAnim    = useRef(new Animated.Value(0)).current;    // translateX
  const fadeAnim     = useRef(new Animated.Value(1)).current;    // opacity
  const scaleAnim    = useRef(new Animated.Value(0.95)).current; // scale
  const drawerProgress = useRef(new Animated.Value(0)).current;  // 0=closed, 1=open

  const currentRole  = activeRole || user?.role || 'guest';
  const visibleTabs  = useMemo(() => TABS_BY_ROLE[currentRole] || TABS_BY_ROLE.guest, [currentRole]);

  // ── Screen entrance animation ─────────────────────────────────────────────
  // Runs every time currentScreen changes — springs all three values back to neutral
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,  { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(fadeAnim,   { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim,  { toValue: 1, friction: 7,  tension: 50, useNativeDriver: true }),
    ]).start();
  }, [currentScreen, slideAnim, fadeAnim, scaleAnim]);

  // ── Role guard: redirect non-owners away from OwnerDashboard ─────────────
  /**
   * الـ Role-based Route Guard:
   * ──────────────────────────
   * تأكد أن المستخدم لا يستطيع الوصول لـ شاشات محمية بـ role
   * 
   * المثال:
   * - شاشة "OwnerDashboard" للـ owners فقط
   * - إذا جرب guest أو investor الوصول إليها:
   *   → يتم إعادة توجيهه للـ Home
   * 
   * كيف تحدث المحاولة؟
   * - ربما عبر وضع رابط مباشر (deep link)
   * - أو bug في شاشة navigation
   * - أو محاولة تحرير الـ frontend code (لا يؤثر - البيانات مأمونة)
   * 
   * الفحص يحدث في كل render بحيث إذا تغيرت الـ role → توجيه فوري
   */
  useEffect(() => {
    if (currentRole !== 'owner' && currentScreen === 'OwnerDashboard') {
      setCurrentScreen('Home');
    }
  }, [currentRole, currentScreen]);

  // ── Auth guard: redirect unauthenticated users to Login ──────────────────
  /**
   * الـ Auth Guard:
   * ──────────────
   * تأكد أن المستخدم المجهول (guest) لا يرى شاشات محمية
   * 
   * المحمية:
   * - Projects, Cart, Account, Home (إذا كان logged-out)
   * - أي شاشة تحتاج بيانات مستخدم
   * 
   * الآمنة:
   * - Login, Register (يجب أن يرها guest)
   * - About, FAQ, Privacy, Terms (public)
   * 
   * الشروط:
   * 1. isLoading === false: أكملنا تحميل الجلسة من AsyncStorage
   * 2. !isLoggedIn: المستخدم غير مسجل دخول
   * 3. activeRole !== 'guest': يحاول دخول كـ guest (بدون login)
   * 4. !['Login', 'Register'].includes(currentScreen): ليس بالفعل على صفحة auth
   * 
   * إذا كل الشروط صحيحة → redirect للـ Login
   * 
   * لماذا ننتظر isLoading === false؟
   * - نتجنب race conditions
   * - نعطي الجلسة وقتاً كافياً للـ load من AsyncStorage
   * - نمنع ومضات "go to Login" ثم "back to Home"
   */
  useEffect(() => {
    if (!isLoading && !isLoggedIn && activeRole !== 'guest' && !['Login', 'Register'].includes(currentScreen)) {
      setCurrentScreen('Login');
    }
  }, [isLoggedIn, isLoading, currentScreen, activeRole]);

  // ── Session expiry handler ────────────────────────────────────────────────
  // sessionExpiredAt is bumped by useAuth when a 401 is received
  useEffect(() => {
    if (!sessionExpiredAt) return;
    popup.warning(
      isAr
        ? 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
        : 'Your session has expired. Please log in again.',
      { title: isAr ? 'انتهاء الجلسة' : 'Session Expired', duration: 2600 },
    );
    setStack([]);
    setCurrentScreen('Login');
  }, [isAr, popup, sessionExpiredAt]);

  // ── Drawer open / close ───────────────────────────────────────────────────

  const openDrawer = () => {
    setShowDrawer(true);
    setDrawerGestureEnabled(true);
    Animated.spring(drawerProgress, {
      toValue:     1,
      speed:       18,
      bounciness:  0,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Close the drawer with a timing animation (easeIn feels more natural for closing).
   * Accepts an optional callback that runs after the animation completes —
   * used by DrawerContent to navigate to a screen after the drawer is gone.
   */
  const closeDrawer = (callback) => {
    Animated.timing(drawerProgress, {
      toValue:         0,
      duration:        180,
      easing:          Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowDrawer(false);
      setDrawerGestureEnabled(false);
      if (callback) callback();
    });
  };

  // ── Navigation actions ────────────────────────────────────────────────────

  /**
   * Navigate to a screen with a slide transition.
   * Direction: LTR → slide current screen left, RTL → slide right.
   *
   * تسلسل الـ Navigate:
   * ──────────────────
   * 
   * الخطوة 1: إخفاء الشاشة الحالية (Slide out)
   * - animate slideAnim إلى قيمة بعيدة (50 أو -50 حسب اللغة)
   * - هذا يحرك الشاشة الحالية خارج الشاشة
   * 
   * الخطوة 2: تحديث الحالة
   * - دفع currentScreen للـ stack (history)
   * - ضبط currentScreen للشاشة الجديدة
   * - إعادة تعيين animation values (off-screen)
   * 
   * الخطوة 3: دخول الشاشة الجديدة (Slide in)
   * - يتم تشغيل useEffect entrance animation
   * - يعود slideAnim من 50/-50 إلى 0
   * - يعود fadeAnim من 0 إلى 1
   * - يعود scaleAnim من 0.9 إلى 1
   * 
   * اتجاهات:
   * - LTR: شاشة جديدة تدخل من اليمين (slideAnim → 0 من 50)
   * - RTL: شاشة جديدة تدخل من اليسار (slideAnim → 0 من -50)
   * 
   * الحجة: اتجاه القراءة → اتجاه الحركة
   * 
   * The transition:
   *   1. Animate the current screen sliding OUT
   *   2. Push currentScreen to stack, set new screen
   *   3. Reset animation values to "off-screen" position
   *   4. The entrance useEffect above will spring them back to 0
   */
  const navigate = (screen) => {
    if (screens[screen] || ['ProjectDetail', 'Login', 'Register'].includes(screen)) {
      if (screen === currentScreen) return;  // no-op if already on this screen

      Animated.timing(slideAnim, {
        toValue:         isAr ? -50 : 50,  // slide direction matches reading direction
        duration:        150,
        useNativeDriver: true,
      }).start(() => {
        setStack((prev) => [...prev, currentScreen]);
        setCurrentScreen(screen);
        slideAnim.setValue(isAr ? 50 : -50);  // position new screen off-screen on opposite side
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
        // Entrance animation springs back from these values ↑
      });
    }
  };

  /** Replace without keeping history — used after login so Back can't go back to Login.
   * 
   * الـ Replace Screen:
   * ─────────────────
   * عندما نريد التنقل بدون حفظ الشاشة الحالية في الـ stack
   * 
   * الحالات:
   * 1. بعد تسجيل الدخول الناجح:
   *    - لا نريد أن يتمكن المستخدم من الضغط Back ورؤية Login مرة أخرى
   *    - replaceScreen('Home') → يمسح الـ stack و يذهب للـ Home
   * 
   * 2. بعد انتهاء الجلسة (Session Expired):
   *    - نريد العودة للـ Login وإزالة التاريخ بالكامل
   * 
   * 3. بعد تسجيل الخروج:
   *    - نمسح كل شاشة سابقة من الـ stack
   * 
   * الفرق مع navigate():
   * - navigate: يحفظ الشاشة الحالية (يمكن العودة بـ Back)
   * - replaceScreen: يمسح الـ stack بالكامل (لا يمكن العودة)
   */
  const replaceScreen = (screen) => {
    setStack([]);
    setCurrentScreen(screen);
    slideAnim.setValue(0);
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
  };

  /**
   * Go back to the previous screen (pop from stack).
   * Uses a reverse slide direction so it feels like going backward.
   * 
   * الـ Go Back:
   * ──────────
   * العودة إلى الشاشة السابقة في الـ stack (history)
   * 
   * المنطق:
   * 1. إذا كان الـ stack فارغ → لا تفعل شيء (لا شاشة سابقة)
   * 2. animate slideAnim بـ اتجاه معاكس:
   *    - forward navigate: right-to-left (50 → 0)
   *    - back navigate: left-to-right (-50 → 0)
   * 3. pop من الـ stack (أخذ الشاشة السابقة)
   * 4. ضبط currentScreen للشاشة المنبثقة
   * 5. إعادة تعيين animation values
   * 
   * الاتجاهات:
   * - LTR: Back يشعر بـ "من اليسار إلى اليمين"
   * - RTL: Back يشعر بـ "من اليمين إلى اليسار"
   * 
   * هذا يخلق إحساس طبيعي بـ "العودة"
   */
  const goBack = () => {
    if (stack.length > 0) {
      Animated.timing(slideAnim, {
        toValue:         isAr ? 50 : -50,  // reverse of navigate direction
        duration:        150,
        useNativeDriver: true,
      }).start(() => {
        const newStack = [...stack];
        const prev     = newStack.pop();
        setStack(newStack);
        setCurrentScreen(prev);
        slideAnim.setValue(isAr ? -50 : 50);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
      });
    }
  };

  // ── Navigation prop object passed to every screen ─────────────────────────
  const screenProps = {
    navigation: {
      openDrawer,
      navigate,
      // Store project in global before navigating so the detail screen can read it.
      // This avoids prop-drilling project data through the navigator abstraction.
      navigateToDetail:        (p) => { global.currentProject = p; navigate('ProjectDetail'); },
      navigateToContribution:  (p) => { global.currentProject = p; navigate('Contribution'); },
      navigateToLogin:         () => navigate('Login'),
      navigateToRegister:      () => navigate('Register'),
      navigateToAddProject:    () => navigate('AddProject'),
      navigateToNotifications: () => navigate('Notifications'),
      goBack,
    },
  };

  // ── Tab bar visibility ────────────────────────────────────────────────────
  // Hide the tab bar on full-screen flows where the tab bar would be distracting
  const hideTabBar   = ['Login', 'Register', 'AddProject', 'Contribution', 'EditAccount', 'RechargeWallet', 'Notifications', 'ForgotPassword', 'CheckEmail', 'ResetPassword', 'Payments', 'SecurePayment'].includes(currentScreen);
  const tabBarHeight = hideTabBar ? 0 : 82 + Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 8);

  // ── Drawer animation interpolations ──────────────────────────────────────
  // drawerProgress 0→1 maps to: drawer sliding in, overlay fading in
  /**
   * Animated.interpolate: تحويل قيمة متحركة إلى قيمة مختلفة
   * ────────────────────────────────────────────────────────
   * مثال: drawerProgress تتراوح من 0 إلى 1
   * لكن نريد drawer يتحرك بـ translateX من -320 إلى 0
   * 
   * Interpolation يفعل هذا بـ linear mapping:
   *   drawerProgress = 0   → translateX = -DRAWER_WIDTH
   *   drawerProgress = 0.5 → translateX = -DRAWER_WIDTH / 2
   *   drawerProgress = 1   → translateX = 0 (مفتوح تماماً)
   * 
   * ميزات interpolate:
   * - يعمل بسلاسة (smooth) دون تأخير
   * - يدعم LTR/RTL (تلقائياً معكوس للعربية)
   * - يستخدم useNativeDriver فيعمل بكفاءة على الـ native thread
   * 
   * المثال الثاني (overlayOpacity):
   *   drawerProgress = 0   → opacity = 0 (شفاف تماماً، لا overlay مرئي)
   *   drawerProgress = 1   → opacity = 0.32 (نصف معتم)
   * 
   * هذا يخلق تأثير ظلال تدريجي عند فتح الدرج
   */
  const drawerTranslateX = drawerProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [isAr ? DRAWER_WIDTH : -DRAWER_WIDTH, 0],
  });
  const overlayOpacity = drawerProgress.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 0.32],
  });

  // ── Drawer swipe-to-close gesture ─────────────────────────────────────────
  /**
   * Attached to the open drawer panel.
   * Allows the user to drag the drawer back closed.
   *
   * كيفية عمل PanResponder (معالج الحركة):
   * ──────────────────────────────────────
   * PanResponder يستمع إلى حركات الإصبع (swipe/drag) ويتيح:
   * - onMoveShouldSetPanResponder: تقرر هل نتعامل مع هذه الحركة؟
   * - onPanResponderMove: يتم استدعاؤه بشكل مستمر أثناء السحب
   * - onPanResponderRelease: عند رفع الإصبع
   * 
   * gestureState يحتوي على:
   *   dx: المسافة الأفقية المسحوبة (موجب = يمين)
   *   dy: المسافة العمودية
   *   vx: سرعة الحركة الأفقية (velocity)
   * 
   * الحد الأدنى (threshold):
   *   - > 40 pt سحب (drag distance)
   *   - أو > 28% من عرض الدرج
   *   - أو > 0.35 سرعة فلك (flick velocity)
   * 
   * إذا لم يصل الحد الأدنى، الدرج يعود إلى وضع مفتوح (spring back)
   *
   * Threshold: if the user drags > 40 pt or > 28 % of drawer width → close.
   * Otherwise spring back open.
   */
  const drawerPanResponder = useRef(
    PanResponder.create({
      // Only claim horizontal drags with minimal vertical movement
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 12,

      onPanResponderMove: (_, gestureState) => {
        // Convert drag distance to a 0–1 progress value, clamped to [0, 1]
        const progressDelta = isAr ? -gestureState.dx / DRAWER_WIDTH : gestureState.dx / DRAWER_WIDTH;
        const nextValue     = Math.max(0, Math.min(1, 1 + progressDelta));
        drawerProgress.setValue(nextValue);
      },

      onPanResponderRelease: (_, gestureState) => {
        const shouldClose     = isAr ? gestureState.dx > 40 : gestureState.dx < -40;
        const draggedFarEnough = isAr
          ? gestureState.dx > DRAWER_WIDTH * 0.28
          : gestureState.dx < -DRAWER_WIDTH * 0.28;

        if (shouldClose || draggedFarEnough) {
          closeDrawer();
          return;
        }

        // Snap back open if the drag wasn't far enough
        Animated.spring(drawerProgress, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
      },

      // Restore if the gesture is interrupted by the OS (e.g. notification)
      onPanResponderTerminate: () => {
        Animated.spring(drawerProgress, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 0 }).start();
      },
    })
  ).current;

  // ── Edge swipe-to-open gesture ────────────────────────────────────────────
  /**
   * Invisible 24 pt zone at the screen edge that initiates drawer open.
   * Only activates when the drawer is currently closed.
   *
   * الـ Edge Swipe Gesture (فتح الدرج من حافة الشاشة):
   * ──────────────────────────────────────────────────
   * التجربة الشائعة في تطبيقات مثل Gmail و Facebook:
   * - منطقة غير مرئية بعرض 24 نقطة على حافة الشاشة
   * - عند تمرير الإصبع من الحافة للداخل: يفتح الدرج
   * - يعمل فقط عندما يكون الدرج مغلقاً
   * 
   * الاتجاهات:
   * - LTR (إنجليزي): المنطقة على اليسار، تمرر لليمين
   * - RTL (عربي): المنطقة على اليمين، تمرر لليسار
   * 
   * الخطوات:
   * 1. onMoveShouldSetPanResponder: هل يجب التعامل مع هذه الحركة؟
   *    - تتحقق من: الدرج مغلق؟ الحركة أفقية (not vertical)؟ اتجاه صحيح؟
   * 
   * 2. onPanResponderGrant: "قبول" الحركة (المستخدم بدأ التمرير)
   *    - نجعل الدرج مرئي على الفور (لكن يبقى مخفي off-screen)
   *    - نبدأ drawerProgress من 0
   * 
   * 3. onPanResponderMove: أثناء التمرير المستمر
   *    - نحسب كم نسبة من الدرج ظهرت
   *    - drawerProgress = 0.5 يعني نصف الدرج مرئي
   * 
   * 4. onPanResponderRelease: عند رفع الإصبع
   *    - إذا سحب > 22% من عرض الدرج OR سرعة > 0.35:
   *      → Animate to fully open (drawerProgress = 1)
   *    - وإلا:
   *      → Collapse back (drawerProgress = 0)
   * 
   * الحد الأدنى (threshold):
   *   - المسافة: 22% من عرض الدرج (DRAWER_WIDTH * 0.22)
   *   - أو السرعة: vx > 0.35 (فلك سريع يعني "نية" واضحة)
   * 
   * For LTR: the zone is on the left edge, open gesture is swipe RIGHT.
   * For RTL: the zone is on the right edge, open gesture is swipe LEFT.
   */
  const edgePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Ignore if drawer is open, if swipe is too vertical, or swipe too short
        if (showDrawer || Math.abs(gestureState.dy) > 14 || Math.abs(gestureState.dx) < 10) return false;
        return isAr ? gestureState.dx < 0 : gestureState.dx > 0;  // correct direction for layout
      },

      onPanResponderGrant: () => {
        // Make the drawer visible immediately (at progress 0, so still off-screen)
        setShowDrawer(true);
        setDrawerGestureEnabled(true);
        drawerProgress.setValue(0);
      },

      onPanResponderMove: (_, gestureState) => {
        const distance = Math.max(0, Math.min(DRAWER_WIDTH, Math.abs(gestureState.dx)));
        drawerProgress.setValue(distance / DRAWER_WIDTH);
      },

      onPanResponderRelease: (_, gestureState) => {
        // Open if dragged > 22 % of drawer width OR flicked fast enough
        const shouldOpen = Math.abs(gestureState.dx) > DRAWER_WIDTH * 0.22 || Math.abs(gestureState.vx) > 0.35;

        if (shouldOpen) {
          Animated.spring(drawerProgress, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 0 }).start();
          return;
        }

        // Not far enough — collapse back
        Animated.timing(drawerProgress, { toValue: 0, duration: 140, useNativeDriver: true })
          .start(() => { setShowDrawer(false); setDrawerGestureEnabled(false); });
      },

      onPanResponderTerminate: () => {
        Animated.timing(drawerProgress, { toValue: 0, duration: 140, useNativeDriver: true })
          .start(() => { setShowDrawer(false); setDrawerGestureEnabled(false); });
      },
    })
  ).current;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Invisible edge zone — must be behind everything else but still receive touches */}
      <View
        pointerEvents={showDrawer ? 'none' : 'box-only'}
        style={[styles.edgeSwipeZone, isAr ? styles.edgeSwipeZoneRight : styles.edgeSwipeZoneLeft]}
        {...edgePanResponder.panHandlers}
      />

      {/* ── Active screen with transition animation ── */}
      <Animated.View
        style={[
          styles.screenContainer,
          {
            paddingBottom: tabBarHeight,
            opacity:       fadeAnim,
            transform:     [{ translateX: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {(() => {
          // Screens that need special props are handled explicitly here;
          // all others fall through to the generic screens registry.
          if (currentScreen === 'ProjectDetail') {
            return (
              <ProjectDetailScreen
                route={{ params: { project: global.currentProject } }}
                navigation={{
                  goBack,
                  navigate,
                  navigateToContribution: (p) => { global.currentProject = p; navigate('Contribution'); },
                }}
              />
            );
          }
          if (currentScreen === 'Contribution') {
            return <ContributionScreen route={{ params: { project: global.currentProject } }} navigation={{ goBack, navigate }} />;
          }
          if (currentScreen === 'Login') {
            return <LoginScreen navigation={{ goBack, navigate, replace: replaceScreen }} />;
          }
          if (currentScreen === 'Register') {
            return <RegisterScreen navigation={{ goBack, navigate, replace: replaceScreen }} />;
          }
          if (currentScreen === 'OwnerDashboard') {
            return <OwnerDashboard navigation={{ goBack, navigate }} />;
          }
          if (currentScreen === 'AddProject') {
            return <AddProjectScreen navigation={{ goBack, navigate }} />;
          }
          if (currentScreen === 'RechargeWallet') {
            return <RechargeWalletScreen navigation={{ goBack, navigate }} />;
          }
          if (currentScreen === 'Payments') {
            return <PaymentsScreen navigation={{ goBack, navigate }} />;
          }
          if (currentScreen === 'SecurePayment') {
            return <SecurePaymentScreen navigation={{ goBack, navigate }} />;
          }
          const ActiveScreen = screens[currentScreen] || screens.Home;
          return <ActiveScreen {...screenProps} />;
        })()}
      </Animated.View>

      {/* ── Full-screen loading overlay (covers everything while session loads) ── */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>{isAr ? 'جاري التحميل...' : 'Loading...'}</Text>
        </View>
      )}

      {/* ── Bottom tab bar ── */}
      {!hideTabBar && !isLoading && (
        <TabBar
          currentScreen={currentScreen}
          navigate={navigate}
          totalCount={totalCount}
          t={t}
          isAr={isAr}
          tabs={visibleTabs}
          bottomInset={insets.bottom}
        />
      )}

      {/* ── Side drawer ── */}
      {showDrawer && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Semi-transparent overlay — tap closes drawer */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()}>
            <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]} />
          </Pressable>

          {/* Drawer panel — gesture-enabled when open */}
          <Animated.View
            {...(drawerGestureEnabled ? drawerPanResponder.panHandlers : {})}
            style={[
              styles.drawerSheet,
              isAr ? { right: 0 } : { left: 0 },
              { transform: [{ translateX: drawerTranslateX }] },
            ]}
          >
            <DrawerContent
              navigation={{
                closeDrawer: () => closeDrawer(),
                // Close first, then navigate so the transition feels smooth
                navigate:    (screen) => closeDrawer(() => navigate(screen)),
              }}
            />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },

  // Invisible touch zone at screen edge for swipe-to-open gesture
  edgeSwipeZone: {
    position: 'absolute',
    top:      0,
    bottom:   0,
    width:    24,
    zIndex:   20,
  },
  edgeSwipeZoneLeft:  { left:  0 },
  edgeSwipeZoneRight: { right: 0 },

  // Tab bar floats above the screen content
  tabBarWrap: {
    position: 'absolute',
    left:  0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    backgroundColor:      COLORS.surface,
    borderTopLeftRadius:  32,
    borderTopRightRadius: 32,
    paddingHorizontal:    SPACING.sm,
    paddingTop:           SPACING.sm,
    // Stronger top border line for visual separation
    borderTopWidth:       1,
    borderTopColor:       COLORS.borderLight,
    elevation:            28,
    shadowColor:          '#0D1B4B',
    shadowOffset:         { width: 0, height: -6 },
    shadowOpacity:        0.10,
    shadowRadius:         24,
  },
  tabTouch: {
    flex: 1,
  },
  tabItem: {
    position:        'relative',
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       68,
    paddingVertical: SPACING.sm,
    marginHorizontal: 2,
    borderRadius:    20,
    overflow:        'hidden',
  },
  tabItemPressed: {
    transform: [{ scale: 0.94 }],
  },
  // Soft pill highlight behind active icon (more prominent than before)
  activeHalo: {
    position:        'absolute',
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: COLORS.primaryLight,
    top:             4,
  },
  tabLabel: {
    fontSize:   FONTS.xs,
    fontWeight: FONTS.semibold,
    marginTop:  5,
  },
  tabLabelActive: {
    fontWeight: FONTS.bold,
  },
  iconContainer: {
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  iconContainerActive: {},
  // Small pill underline indicator on active tab
  activeIndicator: {
    position:        'absolute',
    bottom:          -5,
    width:           18,
    height:          3,
    borderRadius:    2,
    backgroundColor: COLORS.primary,
  },
  // Cart item count badge
  badge: {
    position:          'absolute',
    top:               4,
    right:             14,
    backgroundColor:   COLORS.danger,
    borderRadius:      RADIUS.full,
    minWidth:          18,
    height:            18,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 5,
    borderWidth:       2,
    borderColor:       COLORS.white,
  },
  badgeText: {
    color:      COLORS.white,
    fontSize:   9,
    fontWeight: FONTS.bold,
  },

  // Drawer overlay (darkens screen behind drawer)
  drawerOverlay: {
    flex:            1,
    backgroundColor: COLORS.black,
  },
  // Drawer panel slides in from left/right
  drawerSheet: {
    position:      'absolute',
    top:           0,
    bottom:        0,
    width:         DRAWER_WIDTH,
    backgroundColor: COLORS.surface,
    shadowColor:   COLORS.black,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius:  24,
    elevation:     18,
  },

  // Full-screen loading overlay — covers everything at z-index 100
  loadingContainer: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: COLORS.background,
    zIndex:          100,
  },
  loadingSpinner: {
    marginBottom: SPACING.base,
  },
  loadingText: {
    fontSize: FONTS.base,
    color:    COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});
