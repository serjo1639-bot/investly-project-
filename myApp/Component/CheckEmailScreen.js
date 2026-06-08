/**
 * CheckEmailScreen.js — Step 2 of the password-reset flow
 *
 * Displays the email address the code was sent to.
 * User enters the 6-digit code received in their inbox.
 * On verify → POST /auth/verify-reset-code { email, code }
 * On success → navigate to ResetPasswordScreen (code stored in global.resetCode).
 *
 * Resend: after 60 s the "Resend" button activates and re-calls
 * POST /auth/forgot-password to issue a fresh code.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const CODE_LENGTH   = 6;
const RESEND_DELAY  = 60; // seconds

export default function CheckEmailScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const isAr        = i18n.language === 'ar';
  const insets      = useSafeAreaInsets();
  const popup       = useTopPopup();

  const email = global.resetEmail || '';

  // Individual digit refs for auto-focus progression
  const inputRefs = useRef([]);

  const [digits,    setDigits]    = useState(Array(CODE_LENGTH).fill(''));
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);

  const code = digits.join('');

  // ── 60-second countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Handle digit input ────────────────────────────────────────────────────
  const handleDigitChange = useCallback((value, index) => {
    // Accept only one digit; auto-advance to next box
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleDigitKeyPress = useCallback((key, index) => {
    // Backspace on an empty box moves focus to the previous box
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

  // ── Verify code ───────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      popup.warning(
        isAr ? 'يرجى إدخال الرمز المكون من 6 أرقام كاملاً' : 'Please enter the complete 6-digit code',
      );
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyResetCode({ email, code });
      global.resetCode = code;
      navigation.navigate && navigation.navigate('ResetPassword');
    } catch (error) {
      popup.error(
        error?.message || (isAr ? 'الرمز غير صحيح أو منتهي الصلاحية' : 'Incorrect or expired code'),
        { title: isAr ? 'خطأ' : 'Error' },
      );
      // Clear boxes and refocus the first one
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.forgotPassword(email);
      setCountdown(RESEND_DELAY);
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      popup.success(
        isAr ? 'تم إرسال رمز جديد إلى بريدك الإلكتروني' : 'A new code was sent to your email',
      );
    } catch (error) {
      popup.error(
        error?.message || (isAr ? 'فشل إعادة الإرسال' : 'Resend failed'),
      );
    } finally {
      setResending(false);
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

        {/* Nav */}
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

        {/* Icon + email */}
        <View style={styles.heroContent}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="mail-open-outline" size={34} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>{t('checkEmailTitle')}</Text>
          <Text style={styles.heroSub}>
            {t('checkEmailDesc')}{'\n'}
            <Text style={styles.heroEmail}>{email}</Text>
          </Text>
          <Text style={styles.heroHint}>{t('checkEmailHint')}</Text>
        </View>
      </LinearGradient>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.sheet}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.codeLabel, { textAlign: isAr ? 'right' : 'left' }]}>
          {t('resetCodeLabel')}
        </Text>

        {/* 6 individual digit boxes */}
        <View style={styles.digitsRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[styles.digitBox, digit && styles.digitBoxFilled]}
              value={digit}
              onChangeText={(v) => handleDigitChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleDigitKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={2}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.btn, (code.length < CODE_LENGTH || loading) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={code.length < CODE_LENGTH || loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={code.length === CODE_LENGTH && !loading
              ? ['#1a3a8c', '#4361EE']
              : ['#a0aabf', '#b0bcd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Ionicons
              name={loading ? 'hourglass-outline' : 'checkmark-circle-outline'}
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.btnText}>
              {loading
                ? (isAr ? 'جاري التحقق...' : 'Verifying...')
                : t('verifyCode')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Resend section */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              {t('resendCodeIn')} {countdown} {t('seconds')}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resending}
              activeOpacity={0.75}
            >
              <Text style={[styles.resendText, resending && styles.resendTextMuted]}>
                {resending
                  ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                  : t('resendCode')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
  },
  heroSub: {
    fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
  },
  heroEmail: {
    fontWeight: FONTS.bold, color: COLORS.white,
  },
  heroHint: {
    fontSize: FONTS.xs, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },

  // ── Form ────────────────────────────────────────────────────────────────
  sheet: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  codeLabel: {
    alignSelf: 'stretch',
    fontSize: FONTS.sm, fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.base,
  },

  // ── 6-digit boxes ────────────────────────────────────────────────────────
  digitsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  digitBox: {
    width: 48, height: 58,
    borderRadius: RADIUS.base,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    fontSize: FONTS.xl, fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    ...SHADOWS.sm,
  },
  digitBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
  },

  // ── Button ──────────────────────────────────────────────────────────────
  btn: {
    alignSelf: 'stretch',
    borderRadius: RADIUS.base, overflow: 'hidden',
    marginBottom: SPACING.lg,
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

  // ── Resend ───────────────────────────────────────────────────────────────
  resendRow: { alignItems: 'center', marginTop: SPACING.xs },
  countdownText: {
    fontSize: FONTS.sm, color: COLORS.textMuted,
  },
  resendText: {
    fontSize: FONTS.sm, color: COLORS.primary,
    fontWeight: FONTS.semibold, textDecorationLine: 'underline',
  },
  resendTextMuted: { color: COLORS.textMuted, textDecorationLine: 'none' },
});
