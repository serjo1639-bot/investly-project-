/**
 * LoginScreen.js — Email + password login
 *
 * Flow: role selection → email input → password input → submit
 *
 * Hard-coded values:
 *   6 — minimum password length
 *   'investor' — default role pre-selected
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, SCREEN } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';
import BrandLogo from './BrandLogo';

const ROLE_OPTIONS = [
  {
    key: 'investor',
    icon: 'trending-up-outline',
    activeIcon: 'trending-up',
    titleAr: 'مستثمر',
    titleEn: 'Investor',
    descAr: 'تصفح المشاريع وابدأ الاستثمار',
    descEn: 'Browse and invest in projects',
  },
  {
    key: 'owner',
    icon: 'briefcase-outline',
    activeIcon: 'briefcase',
    titleAr: 'مدير مشروع',
    titleEn: 'Project Manager',
    descAr: 'أضف مشاريعك وأدر الطلبات',
    descEn: 'Add projects and manage requests',
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginScreen = ({ navigation }) => {
  const { t, i18n }    = useTranslation();
  const isAr           = i18n.language === 'ar';
  const insets         = useSafeAreaInsets();
  const { loginWithEmail } = useAuth();
  const popup          = useTopPopup();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [role,         setRole]         = useState('investor');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused,  setPassFocused]  = useState(false);

  const canSubmit = EMAIL_REGEX.test(email.trim()) && password.length >= 6;

  const handleLogin = async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      popup.warning(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      popup.warning(
        isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
      );
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail({ email: email.trim().toLowerCase(), password, role });
      navigation.replace && navigation.replace('Home');
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('not found') || msg.includes('not registered')) {
        popup.confirm({
          title:       isAr ? 'حساب غير موجود' : 'Account not found',
          message:     isAr
            ? 'هذا البريد غير مسجل. هل تريد إنشاء حساب جديد؟'
            : 'This email is not registered. Would you like to create an account?',
          cancelText:  isAr ? 'إلغاء' : 'Cancel',
          confirmText: isAr ? 'تسجيل' : 'Register',
          onConfirm:   () => navigation.navigate('Register'),
          type: 'info',
        });
      } else {
        popup.error(msg || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'), { title: t('error') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#07194b" translucent={false} />

      {/* ── Hero gradient ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#3a56e8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.base) }]}
      >
        {/* Decorative glow blobs */}
        <View style={styles.heroGlow1} />
        <View style={styles.heroGlow2} />
        <View style={styles.heroGlow3} />

        {/* Back button + language toggle */}
        <View style={[styles.heroNav, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack && navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAr ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {/* Language toggle — tapping switches between Arabic and English */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Ionicons name="language-outline" size={16} color={COLORS.white} />
            <Text style={styles.langBtnText}>{isAr ? 'EN' : 'ع'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <BrandLogo light showTagline />
          <View style={styles.heroTextBlock}>
            <Text style={[styles.heroTitle, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'مرحباً بعودتك' : 'Welcome back'}
            </Text>
            <Text style={[styles.heroSub, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr
                ? 'سجّل دخولك للوصول إلى محفظتك ومشاريعك'
                : 'Sign in to access your portfolio and projects'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Form sheet ────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.sheet}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Role selector ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'الدخول كـ' : 'Continue as'}
          </Text>
          {/* Stack cards vertically on very narrow phones (< 360 pt) */}
          <View style={[styles.roleRow, {
            flexDirection: SCREEN.isCompactWidth ? 'column' : (isAr ? 'row-reverse' : 'row'),
          }]}>
            {ROLE_OPTIONS.map((opt) => {
              const active = role === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  onPress={() => setRole(opt.key)}
                  activeOpacity={0.85}
                >
                  {/* Check badge */}
                  {active && (
                    <View style={styles.roleCheck}>
                      <Ionicons name="checkmark" size={12} color={COLORS.white} />
                    </View>
                  )}
                  <View style={[styles.roleIconCircle, active && styles.roleIconCircleActive]}>
                    <Ionicons
                      name={active ? opt.activeIcon : opt.icon}
                      size={22}
                      color={active ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                    {isAr ? opt.titleAr : opt.titleEn}
                  </Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]} numberOfLines={2}>
                    {isAr ? opt.descAr : opt.descEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Email input ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {t('emailAddress')}
          </Text>
          <View style={[
            styles.inputShell,
            { flexDirection: isAr ? 'row-reverse' : 'row' },
            emailFocused && styles.inputShellFocused,
          ]}>
            <View style={styles.emailIconWrap}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? COLORS.primary : COLORS.textMuted}
              />
            </View>
            <TextInput
              style={[styles.input, styles.inputFlex, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={t('emailPlaceholderLogin')}
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>
        </View>

        {/* ── Password input ── */}
        <View style={styles.section}>
          <View style={[styles.labelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
              {isAr ? 'كلمة المرور' : 'Password'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate && navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[
            styles.inputShell,
            { flexDirection: isAr ? 'row-reverse' : 'row', marginTop: SPACING.sm },
            passFocused && styles.inputShellFocused,
          ]}>
            <TextInput
              style={[styles.input, styles.inputFlex, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter your password'}
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Login button ── */}
        <TouchableOpacity
          style={[styles.loginBtn, (!canSubmit || loading) && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit || loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={canSubmit && !loading ? ['#1a3a8c', '#4361EE'] : ['#a0aabf', '#b0bcd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginBtnGradient}
          >
            {loading ? (
              <Text style={styles.loginBtnText}>
                {isAr ? 'جاري التحقق...' : 'Verifying...'}
              </Text>
            ) : (
              <>
                <Ionicons
                  name={isAr ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color="transparent"
                />
                <Text style={styles.loginBtnText}>
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Text>
                <Ionicons
                  name={isAr ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={COLORS.white}
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{isAr ? 'أو' : 'or'}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Register card ── */}
        <View style={styles.registerCard}>
          <View style={styles.registerCardIcon}>
            <Ionicons name="person-add-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.registerCardBody}>
            <Text style={[styles.registerCardTitle, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr ? 'مستخدم جديد؟' : 'New here?'}
            </Text>
            <Text style={[styles.registerCardDesc, { textAlign: isAr ? 'right' : 'left' }]}>
              {isAr
                ? 'أنشئ حسابك في دقيقة واحدة وابدأ الاستثمار أو أضف مشروعك.'
                : 'Create your account in one minute and start investing or add your project.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate && navigation.navigate('Register')}
            activeOpacity={0.88}
          >
            <Text style={styles.registerBtnText}>
              {isAr ? 'إنشاء حساب' : 'Create Account'}
            </Text>
            <Ionicons
              name={isAr ? 'chevron-back' : 'chevron-forward'}
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxxl + insets.bottom }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Hero ─────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: SCREEN.isCompactWidth ? SPACING.base : SPACING.xl,
    paddingBottom: SCREEN.isCompactWidth ? SPACING.lg : SPACING.xxl,
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  heroGlow1: {
    position: 'absolute', top: -50, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroGlow2: {
    position: 'absolute', bottom: -60, left: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(47,91,231,0.22)',
  },
  heroGlow3: {
    position: 'absolute', top: '40%', right: '10%',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,180,160,0.12)',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langBtnText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroContent: {
    marginTop: SPACING.sm,
  },
  heroTextBlock: {
    marginTop: SPACING.lg,
  },
  heroTitle: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    lineHeight: FONTS.xxl * 1.25,
  },
  heroSub: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.72)',
    marginTop: SPACING.xs,
    lineHeight: 22,
  },

  // ── Form sheet ────────────────────────────────────────────────────────────
  sheet: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  section: {
    marginBottom: SPACING.base,
  },
  labelRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  forgotLink: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    fontWeight: FONTS.semibold,
  },

  // ── Email icon (left of email input) ─────────────────────────────────────
  emailIconWrap: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },

  // ── Role cards ───────────────────────────────────────────────────────────
  roleRow: {
    gap: SPACING.sm,
  },
  roleCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleCheck: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  roleIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  roleTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roleTitleActive: {
    color: COLORS.primaryDark,
  },
  roleDesc: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  roleDescActive: {
    color: COLORS.primary,
  },

  // ── Inputs ───────────────────────────────────────────────────────────────
  inputShell: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.base,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  inputShellFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
  },
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },

  // ── Login button ─────────────────────────────────────────────────────────
  loginBtn: {
    borderRadius: RADIUS.base,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    marginBottom: SPACING.base,
    ...SHADOWS.button,
  },
  loginBtnDisabled: {
    opacity: 0.58,
    elevation: 0,
    shadowOpacity: 0,
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 4,
    gap: SPACING.xs,
  },
  loginBtnText: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // ── Divider ──────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    marginBottom: SPACING.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
  },

  // ── Register card ─────────────────────────────────────────────────────────
  registerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  registerCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  registerCardBody: {
    flex: 1,
    gap: 4,
  },
  registerCardTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  registerCardDesc: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: RADIUS.base,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.primaryLight,
  },
  registerBtnText: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.primary,
  },
});

export default LoginScreen;
