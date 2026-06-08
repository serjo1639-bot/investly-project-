/**
 * RegisterScreen.js — New user registration
 *
 * Collects: role, name, phone,
 * email, bio (optional), password, terms agreement.
 *
 * Conditional fields:
 *   company name — required when role === 'owner' (legal entity for crowdfunding)
 *
 * Hard-coded values:
 *   '+218'  — Libya's dialling prefix, prepended before sending to the server
 *   6       — minimum password length
 *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/ — basic email format regex (not exhaustive by design)
 *   /^[0-9]{7,10}$/ — valid local phone digits: 7–10 digits after stripping the country code
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SCREEN, SHADOWS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';
import BrandLogo from './BrandLogo';

const ROLE_OPTIONS = [
  {
    key: 'investor',
    titleAr: 'مستثمر',
    titleEn: 'Investor',
    descAr: 'للتصفح والاستثمار ومتابعة المساهمات',
    descEn: 'For browsing, investing, and tracking contributions',
  },
  {
    key: 'owner',
    titleAr: 'صاحب مشروع',
    titleEn: 'Project Owner',
    descAr: 'لإضافة المشاريع ومتابعة الطلبات والإحصائيات',
    descEn: 'For adding projects and managing requests and stats',
  },
];

const Button = ({ title, onPress, style, loading, disabled, variant = 'solid' }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.btn, variant === 'outline' && styles.btnOutline, (disabled || loading) && styles.btnDisabled, style]}
    disabled={disabled || loading}
  >
    <Text style={[styles.btnText, variant === 'outline' && styles.btnTextOutline]}>
      {loading ? '...' : title}
    </Text>
  </TouchableOpacity>
);

const InputField = ({
  label,
  placeholder,
  value,
  onChange,
  keyboardType,
  icon,
  isAr,
  multiline = false,
  secureTextEntry = false,
  showSecureToggle = false,
  secureVisible = false,
  onToggleSecure,
}) => (
  <View>
    <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}>{label}</Text>
    <View style={[styles.inputWrap, { flexDirection: isAr ? 'row-reverse' : 'row' }, multiline && styles.inputWrapMultiline]}>
      <TextInput
        style={[styles.input, { textAlign: isAr ? 'right' : 'left' }, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        secureTextEntry={secureTextEntry && !secureVisible}
      />
      {showSecureToggle ? (
        <TouchableOpacity style={styles.secureToggle} onPress={onToggleSecure} activeOpacity={0.75}>
          <Ionicons
            name={secureVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>
      ) : null}
      <Ionicons name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const popup = useTopPopup();

  const [role, setRole] = useState('investor');
  const [accountType, setAccountType] = useState('individual');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const requiresCompanyName = role === 'owner';
  const normalizedPhone = useMemo(() => `+218${phone.replace(/\D/g, '')}`, [phone]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword;
  const isPasswordValid = password.length >= 6;
  const canSubmit = name.trim()
    && phone.replace(/\D/g, '').length >= 7
    && agreed
    && (!requiresCompanyName || companyName.trim())
    && isValidEmail(email.trim())
    && isPasswordValid
    && passwordsMatch;

  const handleRegister = async () => {
    if (!canSubmit) {
      if (!isPasswordValid) {
        popup.warning(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف أو أكثر' : 'Password must be at least 6 characters long');
        return;
      }
      if (!passwordsMatch) {
        popup.warning(isAr ? 'تأكيد كلمة المرور غير مطابق' : 'Password confirmation does not match');
        return;
      }
      if (!isValidEmail(email.trim())) {
        popup.warning(isAr ? 'يرجى إدخال إيميل صحيح' : 'Please enter a valid email');
        return;
      }
      popup.warning(isAr ? 'يرجى استكمال الحقول المطلوبة والموافقة على الشروط' : 'Please complete the required fields and accept the terms');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim(),
        role,
        type: role === 'owner' ? 'organization' : 'individual',
        companyName: companyName.trim(),
        bio: bio.trim(),
        password,
        termsAccepted: agreed,
      });
      navigation.replace && navigation.replace('Home');
    } catch (error) {
      const errorMessage = error?.message || '';
      if (errorMessage.includes('phone') && errorMessage.includes('already exists')) {
        popup.warning(
          isAr ? 'رقم الهاتف الذي أدخلته موجود مسبقاً. جرب رقم آخر أو سجل دخول إذا كان حسابك موجود.' : 'The phone number you entered already exists. Try a different number or log in if you already have an account.',
          { title: isAr ? 'رقم هاتف مكرر' : 'Duplicate Phone', duration: 4300 }
        );
      } else if (errorMessage.includes('email') || errorMessage.includes('already exists')) {
        popup.warning(
          isAr ? 'الإيميل الذي أدخلته موجود مسبقاً. جرب إيميل آخر أو سجل دخول إذا كان حسابك موجود.' : 'The email you entered already exists. Try a different email or log in if you already have an account.',
          { title: isAr ? 'إيميل مكرر' : 'Duplicate Email', duration: 4300 }
        );
      } else {
        popup.error(errorMessage, { title: t('error') });
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#07194b" translucent={false} />

      {/* ── Gradient header ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.base) }]}
      >
        <View style={styles.glowCircle1} />
        <View style={styles.glowCircle2} />

        {/* Back button + language toggle */}
        <View style={[styles.headerNav, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack && navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>

          {/* Language toggle */}
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => i18n.changeLanguage(isAr ? 'en' : 'ar')}
            activeOpacity={0.8}
          >
            <Ionicons name="language-outline" size={16} color={COLORS.white} />
            <Text style={styles.langBtnText}>{isAr ? 'EN' : 'ع'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <BrandLogo compact light />
          <Text style={styles.headerTitle}>
            {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
          </Text>
          <Text style={styles.headerSub}>
            {isAr
              ? 'رتّب بياناتك بشكل واضح وابدأ رحلتك'
              : 'Set up your structured profile and start your journey'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>{isAr ? 'مستخدم جديد' : 'New account'}</Text>
          <Text style={styles.title}>{t('registerTitle')}</Text>
          <Text style={styles.subtitle}>
            {isAr ? 'سجّل معلوماتك واختر نوع حسابك للبدء.' : 'Enter your details and choose your account type to get started.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr ? 'نوع المستخدم' : 'User role'}
          </Text>
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map((option) => {
              const active = role === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => {
                    setRole(option.key);
                    // Investor accounts are individuals; owner accounts are organizations.
                    // Keeping this derived from the role avoids hidden state making
                    // CompanyName required for investor registration.
                    setAccountType(option.key === 'owner' ? 'organization' : 'individual');
                  }}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                >
                  <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                    {isAr ? option.titleAr : option.titleEn}
                  </Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]}>
                    {isAr ? option.descAr : option.descEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.typeInfo}>
            <Ionicons
              name={role === 'owner' ? 'business-outline' : 'person-outline'}
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.typeInfoText}>
              {role === 'owner' ? t('organization') : t('individual')}
            </Text>
          </View>

          <InputField
            label={t('name')}
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={setName}
            icon="person-outline"
            isAr={isAr}
          />

          {requiresCompanyName ? (
            <InputField
              label={isAr ? 'اسم الجهة / المشروع' : 'Business or project name'}
              placeholder={isAr ? 'اكتب اسم الجهة أو المشروع' : 'Enter the business or project name'}
              value={companyName}
              onChange={setCompanyName}
              icon="business-outline"
              isAr={isAr}
            />
          ) : null}

          <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}>{t('phoneNumber')}</Text>
          {/*
            Phone input — badge flips side with language direction:
              LTR (English) : [🇱🇾 +218] | [input] [icon]
              RTL (Arabic)  : [icon] [input] | [+218 🇱🇾]
            row-reverse handles the flip automatically.
            Phone digits always type LTR (textAlign: 'left').
          */}
          {/* +218 badge always on the LEFT */}
          <View style={[styles.inputWrap, { flexDirection: 'row' }]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇱🇾</Text>
              <Text style={styles.code}>+218</Text>
            </View>
            <TextInput
              style={[styles.input, { textAlign: 'left', flex: 1 }]}
              placeholder="91 234 5678"
              placeholderTextColor={COLORS.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Ionicons name="phone-portrait-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          </View>

          <InputField
            label={t('email')}
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
            isAr={isAr}
          />

          <InputField
            label={isAr ? 'نبذة قصيرة' : 'Short bio'}
            placeholder={isAr ? 'عرف بنفسك أو بفكرة المشروع باختصار' : 'Briefly describe yourself or the project idea'}
            value={bio}
            onChange={setBio}
            icon="document-text-outline"
            isAr={isAr}
            multiline
          />

          <InputField
            label={isAr ? 'كلمة المرور' : 'Password'}
            placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter your password'}
            value={password}
            onChange={setPassword}
            icon="lock-closed-outline"
            isAr={isAr}
            secureTextEntry
            showSecureToggle
            secureVisible={showPassword}
            onToggleSecure={() => setShowPassword((value) => !value)}
          />

          <InputField
            label={isAr ? 'تأكيد كلمة المرور' : 'Confirm password'}
            placeholder={isAr ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon="shield-checkmark-outline"
            isAr={isAr}
            secureTextEntry
            showSecureToggle
            secureVisible={showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword((value) => !value)}
          />

          <View style={styles.hintsCard}>
            <Text style={styles.hintsTitle}>{isAr ? 'البيانات التي سيتم تجهيزها' : 'Prepared data structure'}</Text>
            <Text style={styles.hintsText}>
              {isAr ? 'الاسم، رقم الهاتف، البريد، الدور، نوع الحساب، اسم الجهة، النبذة، والموافقة على الشروط.' : 'Name, phone, email, role, account type, company name, bio, and terms acceptance.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.checkRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed ? <Ionicons name="checkmark" size={14} color={COLORS.white} /> : null}
            </View>
            <Text style={styles.checkLabel}>{t('agreeTerms')}</Text>
          </TouchableOpacity>

          <Button
            title={t('register')}
            onPress={handleRegister}
            loading={loading}
            disabled={!canSubmit || loading}
            style={{ marginTop: SPACING.lg }}
          />
        </View>

        <View style={styles.switchCard}>
          <Text style={styles.switchTitle}>{isAr ? 'لديك حساب سابق؟' : 'Already have an account?'}</Text>
          <Text style={styles.switchDesc}>
            {isAr ? 'يمكنك الرجوع إلى تسجيل الدخول والمتابعة برقم الهاتف.' : 'Go back to login and continue with phone verification.'}
          </Text>
          <Button
            title={t('loginTitle')}
            onPress={() => navigation.navigate && navigation.navigate('Login')}
            variant="outline"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Gradient header ─────────────────────────────────────────────────────
  gradientHeader: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  glowCircle1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  glowCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(47,91,231,0.22)',
  },
  headerNav: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  headerSub: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: SPACING.xs,
    lineHeight: 21,
  },

  scroll: { padding: SPACING.lg, paddingTop: SPACING.lg, gap: SPACING.lg },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  eyebrow: { textAlign: 'center', color: COLORS.primary, fontSize: FONTS.sm, fontWeight: FONTS.bold, marginBottom: SPACING.xs },
  title: { fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  roleGrid: {
    flexDirection: SCREEN.isCompactWidth ? 'column' : 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.base,
    backgroundColor: COLORS.background,
  },
  roleCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleTitle: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: FONTS.bold, marginBottom: SPACING.xs },
  roleTitleActive: { color: COLORS.white },
  roleDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 20 },
  roleDescActive: { color: 'rgba(255,255,255,0.9)' },
  label: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.xs, fontWeight: FONTS.semibold },
  typeToggle: { flexDirection: 'row', marginBottom: SPACING.lg, gap: SPACING.sm },
  typeToggleStack: { flexDirection: 'column' },
  typeBtn: { flex: 1, paddingVertical: SPACING.sm, backgroundColor: COLORS.white, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight },
  typeBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeBtnText: { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.medium },
  typeBtnTextActive: { color: COLORS.primaryDark, fontWeight: FONTS.semibold },
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  typeInfoText: {
    fontSize: FONTS.sm,
    color: COLORS.primaryDark,
    fontWeight: FONTS.semibold,
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.base, paddingHorizontal: SPACING.base, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderLight },
  inputWrapMultiline: { alignItems: 'flex-start', paddingTop: SPACING.md },
  input: { flex: 1, paddingVertical: SPACING.md, fontSize: FONTS.base, color: COLORS.textPrimary },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  secureToggle: { paddingHorizontal: SPACING.xs, paddingVertical: SPACING.sm },
  inputIcon: { marginHorizontal: SPACING.sm, marginTop: 2 },
  countryCode: { flexDirection: 'row', alignItems: 'center', paddingRight: SPACING.sm, borderRightWidth: 1, borderRightColor: COLORS.borderLight, marginRight: SPACING.sm },
  countryCodeAr: { paddingRight: 0, marginRight: 0, paddingLeft: SPACING.sm, marginLeft: SPACING.sm, borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: COLORS.borderLight },
  flag: { fontSize: 16 },
  code: { fontSize: FONTS.base, color: COLORS.textPrimary, marginLeft: SPACING.xs },
  hintsCard: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hintsTitle: { fontSize: FONTS.base, color: COLORS.primaryDark, fontWeight: FONTS.bold, marginBottom: SPACING.xs },
  hintsText: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 21 },
  checkRow: { alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm, flexWrap: 'wrap' },
  checkbox: { width: 24, height: 24, borderRadius: RADIUS.sm, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel: { fontSize: FONTS.sm, color: COLORS.textPrimary },
  switchCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  switchTitle: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: FONTS.bold, marginBottom: SPACING.xs, textAlign: 'center' },
  switchDesc: { fontSize: FONTS.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: SPACING.md },
  btn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.base, alignItems: 'center', ...SHADOWS.button },
  btnOutline: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary, shadowOpacity: 0, elevation: 0 },
  btnDisabled: { opacity: 0.48 },
  btnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold, textAlign: 'center' },
  btnTextOutline: { color: COLORS.primary },
});

export default RegisterScreen;
