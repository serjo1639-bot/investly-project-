/**
 * ResetPasswordScreen.js — Step 3 of the password-reset flow
 *
 * User sets a new password after verifying their code.
 * On submit → POST /auth/reset-password { email, code, newPassword }
 * Always redirects to Home on success.
 * If the backend returns a full session (token + user) the user is auto-logged in.
 * If not, the session guard will prompt login on the next protected action.
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
import { sessionManager } from '../services/session';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';
import { mapAuthSession } from '../services/api';

export default function ResetPasswordScreen({ navigation }) {
  const { t, i18n }    = useTranslation();
  const isAr           = i18n.language === 'ar';
  const insets         = useSafeAreaInsets();
  const popup          = useTopPopup();
  const { updateUser } = useAuth();

  const email = global.resetEmail || '';
  const code  = global.resetCode  || '';

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [newFocused,      setNewFocused]      = useState(false);
  const [confirmFocused,  setConfirmFocused]  = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isStrong       = newPassword.length >= 6;
  const canSubmit      = isStrong && passwordsMatch && newPassword.length > 0;

  const handleReset = async () => {
    if (!isStrong) {
      popup.warning(
        isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
      );
      return;
    }
    if (!passwordsMatch) {
      popup.warning(
        isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({ email, code, newPassword });

      // If the backend returns a full session, auto-login the user
      if (response?.token && response?.user) {
        const normalizedUser = {
          ...mapAuthSession(response.user),
          id:   response.user.id       || '1',
          name: response.user.name     || 'مستخدم',
        };
        await sessionManager.saveSession(response.token, normalizedUser);
        await updateUser(normalizedUser);

        popup.success(
          isAr ? 'تم تغيير كلمة المرور بنجاح، أهلاً بك!' : 'Password changed! Welcome back.',
          { title: isAr ? 'تم التغيير' : 'Done', duration: 2400 },
        );

        // Clean up global reset state
        global.resetEmail = undefined;
        global.resetCode  = undefined;

        setTimeout(() => navigation.replace && navigation.replace('Home'), 600);
      } else {
        // Backend returned success without a full session token.
        // Still go straight to Home — the user will be prompted to log in
        // the next time the session guard fires if no token is present.
        popup.success(
          isAr ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!',
          { title: isAr ? 'تم التغيير' : 'Done', duration: 2400 },
        );
        global.resetEmail = undefined;
        global.resetCode  = undefined;
        setTimeout(() => navigation.replace && navigation.replace('Home'), 600);
      }
    } catch (error) {
      popup.error(
        error?.message || (isAr ? 'تعذر تغيير كلمة المرور' : 'Failed to reset password'),
        { title: isAr ? 'خطأ' : 'Error' },
      );
    } finally {
      setLoading(false);
    }
  };

  // Strength indicator: none / weak / strong
  const strength = newPassword.length === 0
    ? 'none'
    : newPassword.length < 8
      ? 'fair'
      : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
        ? 'strong'
        : 'good';

  const strengthColor = { none: 'transparent', fair: COLORS.danger, good: COLORS.amber, strong: COLORS.teal };
  const strengthLabel = {
    none:   '',
    fair:   isAr ? 'ضعيفة' : 'Weak',
    good:   isAr ? 'جيدة'  : 'Good',
    strong: isAr ? 'قوية'  : 'Strong',
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

        {/* Icon + title */}
        <View style={styles.heroContent}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="key-outline" size={34} color={COLORS.white} />
          </View>
          <Text style={styles.heroTitle}>{t('newPasswordTitle')}</Text>
          <Text style={styles.heroSub}>{t('newPasswordDesc')}</Text>
        </View>
      </LinearGradient>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.sheet}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* New password */}
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {t('newPassword')}
          </Text>
          <View style={[
            styles.inputShell,
            { flexDirection: isAr ? 'row-reverse' : 'row' },
            newFocused && styles.inputShellFocused,
          ]}>
            <TextInput
              style={[styles.input, styles.inputFlex, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={t('newPasswordPlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              onFocus={() => setNewFocused(true)}
              onBlur={() => setNewFocused(false)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowNew((v) => !v)}
            >
              <Ionicons
                name={showNew ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Strength bar */}
          {strength !== 'none' && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthTrack}>
                <View style={[
                  styles.strengthFill,
                  {
                    width: strength === 'fair' ? '33%' : strength === 'good' ? '66%' : '100%',
                    backgroundColor: strengthColor[strength],
                  },
                ]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor[strength] }]}>
                {strengthLabel[strength]}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm password */}
        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { textAlign: isAr ? 'right' : 'left' }]}>
            {t('confirmNewPassword')}
          </Text>
          <View style={[
            styles.inputShell,
            { flexDirection: isAr ? 'row-reverse' : 'row' },
            confirmFocused && styles.inputShellFocused,
            confirmPassword.length > 0 && !passwordsMatch && styles.inputShellError,
          ]}>
            <TextInput
              style={[styles.input, styles.inputFlex, { textAlign: isAr ? 'right' : 'left' }]}
              placeholder={t('confirmNewPasswordPlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowConfirm((v) => !v)}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={
                  confirmPassword.length > 0
                    ? passwordsMatch ? COLORS.teal : COLORS.danger
                    : COLORS.textMuted
                }
              />
            </TouchableOpacity>
          </View>

          {/* Match indicator */}
          {confirmPassword.length > 0 && (
            <View style={[styles.matchRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <Ionicons
                name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                size={15}
                color={passwordsMatch ? COLORS.teal : COLORS.danger}
              />
              <Text style={[styles.matchText, { color: passwordsMatch ? COLORS.teal : COLORS.danger }]}>
                {passwordsMatch
                  ? (isAr ? 'كلمتا المرور متطابقتان' : 'Passwords match')
                  : (isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')}
              </Text>
            </View>
          )}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.btn, (!canSubmit || loading) && styles.btnDisabled]}
          onPress={handleReset}
          disabled={!canSubmit || loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={canSubmit && !loading ? ['#007A6E', '#00B4A0'] : ['#a0aabf', '#b0bcd4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Ionicons
              name={loading ? 'hourglass-outline' : 'shield-checkmark-outline'}
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.btnText}>
              {loading
                ? (isAr ? 'جاري التغيير...' : 'Changing...')
                : t('resetPasswordBtn')}
            </Text>
          </LinearGradient>
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
  },
  heroSub: {
    fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 22,
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
  inputShellError: {
    borderColor: COLORS.danger,
  },
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  inputFlex: { flex: 1 },
  eyeBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },

  // ── Strength bar ─────────────────────────────────────────────────────────
  strengthRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginTop: SPACING.xs,
  },
  strengthTrack: {
    flex: 1, height: 4, borderRadius: RADIUS.full,
    backgroundColor: COLORS.borderLight, overflow: 'hidden',
  },
  strengthFill: {
    height: '100%', borderRadius: RADIUS.full,
  },
  strengthLabel: {
    fontSize: FONTS.xs, fontWeight: FONTS.semibold, minWidth: 40,
  },

  // ── Match indicator ───────────────────────────────────────────────────────
  matchRow: {
    alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs,
  },
  matchText: { fontSize: FONTS.xs, fontWeight: FONTS.medium },

  // ── Button ──────────────────────────────────────────────────────────────
  btn: {
    borderRadius: RADIUS.base, overflow: 'hidden',
    marginTop: SPACING.sm, marginBottom: SPACING.base,
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
});
