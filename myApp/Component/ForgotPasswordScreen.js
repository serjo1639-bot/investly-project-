/**
 * ForgotPasswordScreen.js — Step 1 of the password-reset flow
 *
 * User enters their email address.
 * On submit → POST /auth/forgot-password { email }
 * Backend sends a 6-digit code to that email.
 * On success → navigate to CheckEmailScreen (email stored in global.resetEmail).
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, SCREEN } from '../constants/theme';
import { authAPI } from '../services/api';
import { useTopPopup } from '../hooks/useTopPopup';
import BrandLogo from './BrandLogo';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const isAr        = i18n.language === 'ar';
  const insets      = useSafeAreaInsets();
  const popup       = useTopPopup();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const isValid = EMAIL_REGEX.test(email.trim());

  const handleSend = async () => {
    if (!isValid) {
      popup.warning(
        isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address',
      );
      return;
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      // Store for the next two screens so they don't need navigation params
      global.resetEmail = email.trim().toLowerCase();
      navigation.navigate && navigation.navigate('CheckEmail');
    } catch (error) {
      popup.error(
        error?.message || (isAr ? 'تعذر إرسال رمز التحقق' : 'Failed to send reset code'),
        { title: isAr ? 'خطأ' : 'Error' },
      );
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

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#3a56e8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.base) }]}
      >
        <View style={styles.heroGlow1} />
        <View style={styles.heroGlow2} />

        {/* Nav row: back ← … → language toggle */}
        <View style={[styles.heroNav, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.goBack && navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isAr ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Ionicons name="language-outline" size={16} color={COLORS.white} />
            <Text style={styles.langBtnText}>{isAr ? 'EN' : 'ع'}</Text>
          </TouchableOpacity>
        </View>

        {/* Icon + title */}
        <View style={styles.heroContent}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="lock-open-outline" size={34} color={COLORS.white} />
          </View>
          <BrandLogo compact light style={{ marginTop: SPACING.sm }} />
          <Text style={styles.heroTitle}>{t('forgotPasswordTitle')}</Text>
          <Text style={styles.heroSub}>{t('forgotPasswordDesc')}</Text>
        </View>
      </LinearGradient>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.sheet}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Email field */}
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {t('emailAddress')}
          </Text>
          <View style={[
            styles.inputShell,
            { flexDirection: isAr ? 'row-reverse' : 'row' },
            focused && styles.inputShellFocused,
          ]}>
            <View style={styles.inputIconWrap}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={focused ? COLORS.primary : COLORS.textMuted}
              />
            </View>
            <TextInput
              style={[styles.input, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={t('emailPlaceholderLogin')}
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </View>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
          onPress={handleSend}
          disabled={!isValid || loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={isValid && !loading ? ['#1a3a8c', '#4361EE'] : ['#a0aabf', '#b0bcd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Ionicons
              name={loading ? 'hourglass-outline' : 'paper-plane-outline'}
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.btnText}>
              {loading
                ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                : t('sendResetCode')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity
          style={[styles.backRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
          onPress={() => navigation.goBack && navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons
            name={isAr ? 'chevron-forward' : 'chevron-back'}
            size={16}
            color={COLORS.primary}
          />
          <Text style={styles.backRowText}>
            {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xxxl + insets.bottom }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Hero ────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: SCREEN.isCompactWidth ? SPACING.base : SPACING.xl,
    paddingBottom: SPACING.xxl,
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
  heroNav: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  navBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  langBtnText: {
    fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white, letterSpacing: 0.5,
  },
  heroContent: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitle: {
    fontSize: FONTS.xl, fontWeight: FONTS.bold,
    color: COLORS.white, textAlign: 'center',
    marginTop: SPACING.xs,
  },
  heroSub: {
    fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: SPACING.base,
  },

  // ── Form ────────────────────────────────────────────────────────────────
  sheet: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl },
  section: { marginBottom: SPACING.base },
  fieldLabel: {
    fontSize: FONTS.sm, fontWeight: FONTS.semibold,
    color: COLORS.textSecondary, marginBottom: SPACING.sm,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.base,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    overflow: 'hidden', ...SHADOWS.sm,
  },
  inputShellFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.12,
  },
  inputIconWrap: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },

  // ── Button ──────────────────────────────────────────────────────────────
  btn: {
    borderRadius: RADIUS.base,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    marginBottom: SPACING.base,
    ...SHADOWS.button,
  },
  btnDisabled: { opacity: 0.55, elevation: 0, shadowOpacity: 0 },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md + 4, gap: SPACING.sm,
  },
  btnText: {
    fontSize: FONTS.base, fontWeight: FONTS.bold,
    color: COLORS.white, letterSpacing: 0.3,
  },

  // ── Back link ────────────────────────────────────────────────────────────
  backRow: {
    alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, marginTop: SPACING.xs,
  },
  backRowText: {
    fontSize: FONTS.sm, color: COLORS.primary, fontWeight: FONTS.semibold,
  },
});
