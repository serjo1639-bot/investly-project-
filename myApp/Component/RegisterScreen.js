/**
 * RegisterScreen.js — New user registration
 *
 * Collects: account type (Investor / Project Manager), full name, age,
 * gender, location, phone (+218 Libya prefix), optional email, passport
 * photo (for identity verification), password, and terms acceptance.
 *
 * Flow:
 *   1. User fills in all required fields
 *   2. On submit: upload passport photo → register account → navigate Home
 *
 * Validation rules (checked before submit):
 *   - name        required
 *   - age         18–100
 *   - gender      required
 *   - location    required
 *   - phone       ≥ 7 digits
 *   - passport    required (image from gallery)
 *   - password    ≥ 6 characters, confirmed
 *   - companyName required only for Project Manager role
 */

import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, RADIUS, SCREEN, SHADOWS } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';
import BrandLogo from './BrandLogo';
import { mediaAPI } from '../services/api';

const ROLE_OPTIONS = [
  {
    key: 'investor',
    titleAr: 'مستثمر',
    titleEn: 'Investor',
    descAr: 'تصفح المشاريع وتتبع استثماراتك',
    descEn: 'Browse projects and track your investments',
    icon: 'trending-up-outline',
  },
  {
    key: 'owner',
    titleAr: 'مدير مشروع',
    titleEn: 'Project Manager',
    descAr: 'أضف مشاريعك وأدر الطلبات والإحصائيات',
    descEn: 'Add your projects and manage requests',
    icon: 'briefcase-outline',
  },
];

const GENDER_OPTIONS = [
  { key: 'male',   labelAr: 'ذكر',               labelEn: 'Male' },
  { key: 'female', labelAr: 'أنثى',              labelEn: 'Female' },
  { key: 'other',  labelAr: 'أفضل عدم الإفصاح', labelEn: 'Prefer not to say' },
];

// ── Reusable sub-components ───────────────────────────────────────────────────

const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const FieldLabel = ({ label, required, isAr }) => (
  <Text style={[styles.label, { textAlign: isAr ? 'right' : 'left' }]}>
    {label}
    {required ? <Text style={styles.requiredStar}> *</Text> : null}
  </Text>
);

const InputField = ({
  label, placeholder, value, onChange, keyboardType,
  icon, isAr, multiline = false, secureTextEntry = false, required = false,
}) => (
  <View style={styles.fieldGroup}>
    <FieldLabel label={label} required={required} isAr={isAr} />
    <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline]}>
      <TextInput
        style={[styles.input, { textAlign: isAr ? 'right' : 'left' }, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
      />
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
    </View>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────

const RegisterScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const popup = useTopPopup();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [role,            setRole]            = useState('investor');
  const [name,            setName]            = useState('');
  const [age,             setAge]             = useState('');
  const [gender,          setGender]          = useState('');
  const [location,        setLocation]        = useState('');
  const [phone,           setPhone]           = useState('');
  const [email,           setEmail]           = useState('');
  const [companyName,     setCompanyName]     = useState('');
  const [passport,        setPassport]        = useState(null);
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed,          setAgreed]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [passportUploading, setPassportUploading] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────────
  // +218 is the Libya international dialling code.
  // useMemo recalculates only when `phone` changes — avoids recalculating on every render.
  const normalizedPhone    = useMemo(() => `+218${phone.replace(/\D/g, '')}`, [phone]);
  const isValidEmail       = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const passwordsMatch     = password === confirmPassword;
  const isPasswordValid    = password.length >= 6;
  const ageNum             = Number(age);
  const isAgeValid         = age.trim() && ageNum >= 18 && ageNum <= 100;
  const isProjectManager   = role === 'owner';

  // canSubmit is true only when every required field is valid.
  // The Submit button is disabled while this is false so the user
  // gets instant visual feedback without needing to tap Submit first.
  const canSubmit =
    name.trim() &&
    isAgeValid &&
    gender &&
    location.trim() &&
    phone.replace(/\D/g, '').length >= 7 &&
    passport &&
    agreed &&
    (!email || isValidEmail(email.trim())) &&
    isPasswordValid &&
    passwordsMatch &&
    (!isProjectManager || companyName.trim());

  // ── Passport picker ─────────────────────────────────────────────────────────
  const handlePickPassport = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        popup.warning(isAr ? 'يجب منح إذن الوصول للصور' : 'Photo library access is required');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setPassport({
          uri:  asset.uri,
          name: asset.fileName || 'passport.jpg',
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch {
      popup.error(isAr ? 'تعذر فتح المعرض' : 'Could not open photo library');
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim()) {
      popup.warning(isAr ? 'الرجاء إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }
    if (!isAgeValid) {
      popup.warning(isAr ? 'العمر يجب أن يكون بين 18 و100 سنة' : 'Age must be between 18 and 100');
      return;
    }
    if (!gender) {
      popup.warning(isAr ? 'الرجاء اختيار الجنس' : 'Please select your gender');
      return;
    }
    if (!location.trim()) {
      popup.warning(isAr ? 'الرجاء إدخال موقعك أو بلدك' : 'Please enter your location or country');
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      popup.warning(isAr ? 'الرجاء إدخال رقم هاتف صحيح' : 'Please enter a valid phone number');
      return;
    }
    if (!passport) {
      popup.warning(
        isAr ? 'الرجاء رفع صورة جواز السفر للتحقق من الهوية' : 'Please upload your passport for identity verification'
      );
      return;
    }
    if (!isPasswordValid) {
      popup.warning(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف أو أكثر' : 'Password must be at least 6 characters');
      return;
    }
    if (!passwordsMatch) {
      popup.warning(isAr ? 'كلمة المرور وتأكيدها غير متطابقان' : 'Passwords do not match');
      return;
    }
    if (email && !isValidEmail(email.trim())) {
      popup.warning(isAr ? 'الرجاء إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (isProjectManager && !companyName.trim()) {
      popup.warning(isAr ? 'الرجاء إدخال اسم الشركة أو المشروع' : 'Please enter your company or project name');
      return;
    }
    if (!agreed) {
      popup.warning(isAr ? 'يجب الموافقة على الشروط والأحكام' : 'You must accept the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload passport image first
      let passportUrl = null;
      setPassportUploading(true);
      const uploadResult = await mediaAPI.upload(passport);
      setPassportUploading(false);
      passportUrl = uploadResult?.url || null;

      // 2. Register with all data including passport URL
      await register({
        name:         name.trim(),
        phone:        normalizedPhone,
        email:        email.trim() || null,
        role,
        age:          ageNum,
        gender,
        location:     location.trim(),
        passportUrl,
        companyName:  companyName.trim() || null,
        password,
        termsAccepted: agreed,
      });

      navigation.replace && navigation.replace('Home');
    } catch (error) {
      setPassportUploading(false);
      const msg = error?.message || '';
      if (msg.includes('phone') && msg.includes('already exists')) {
        popup.warning(
          isAr
            ? 'رقم الهاتف الذي أدخلته موجود مسبقاً. جرب رقم آخر أو سجل دخول.'
            : 'This phone number is already registered. Try a different one or log in.',
          { title: isAr ? 'رقم هاتف مكرر' : 'Duplicate Phone', duration: 4300 }
        );
      } else if (msg.includes('email') || msg.includes('already exists')) {
        popup.warning(
          isAr
            ? 'البريد الإلكتروني موجود مسبقاً. جرب بريداً آخر أو سجل دخول.'
            : 'This email is already registered. Try a different one or log in.',
          { title: isAr ? 'بريد مكرر' : 'Duplicate Email', duration: 4300 }
        );
      } else {
        popup.error(msg || (isAr ? 'حدث خطأ أثناء التسجيل' : 'Registration failed'), { title: t('error') });
      }
    }
    setLoading(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#07194b" translucent={false} />

      {/* ── Gradient header ──────────────────────────────────────────── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.base) }]}
      >
        <View style={styles.glowCircle1} />
        <View style={styles.glowCircle2} />

        <View style={[styles.headerNav, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack && navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
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

        <View style={styles.headerContent}>
          <BrandLogo compact light />
          <Text style={styles.headerTitle}>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</Text>
          <Text style={styles.headerSub}>
            {isAr
              ? 'أدخل بياناتك وابدأ رحلتك الاستثمارية معنا'
              : 'Fill in your details and start your investment journey'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step hint */}
        <View style={styles.stepBanner}>
          <Ionicons name="create-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.stepBannerText}>
            {isAr ? 'أكمل جميع الحقول المطلوبة للتسجيل' : 'Complete all required fields to register'}
          </Text>
        </View>

        {/* ── Section 1: Account Type ───────────────────────────────── */}
        <SectionCard title={isAr ? 'نوع الحساب' : 'Account Type'} icon="people-circle-outline">
          <View style={styles.roleGrid}>
            {ROLE_OPTIONS.map((option) => {
              const active = role === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setRole(option.key)}
                  style={[styles.roleCard, active && styles.roleCardActive]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={active ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>
                    {isAr ? option.titleAr : option.titleEn}
                  </Text>
                  <Text style={[styles.roleDesc, active && styles.roleDescActive]} numberOfLines={2}>
                    {isAr ? option.descAr : option.descEn}
                  </Text>
                  {active && (
                    <View style={styles.roleCheckBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Section 2: Personal Information ─────────────────────────── */}
        <SectionCard title={isAr ? 'المعلومات الشخصية' : 'Personal Information'} icon="person-outline">

          {/* Full Name */}
          <InputField
            label={isAr ? 'الاسم الكامل' : 'Full Name'}
            placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}
            value={name}
            onChange={setName}
            icon="person-outline"
            isAr={isAr}
            required
          />

          {/* Age */}
          <View style={styles.fieldGroup}>
            <FieldLabel label={isAr ? 'العمر' : 'Age'} required isAr={isAr} />
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { textAlign: isAr ? 'right' : 'left' }]}
                placeholder={isAr ? 'أدخل عمرك (18 سنة فأكثر)' : 'Enter your age (18+)'}
                placeholderTextColor={COLORS.textMuted}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            </View>
            {age.trim() !== '' && !isAgeValid && (
              <Text style={styles.fieldError}>
                {isAr ? 'العمر يجب أن يكون بين 18 و100 سنة' : 'Age must be between 18 and 100'}
              </Text>
            )}
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <FieldLabel label={isAr ? 'الجنس' : 'Gender'} required isAr={isAr} />
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((g) => {
                const active = gender === g.key;
                return (
                  <TouchableOpacity
                    key={g.key}
                    onPress={() => setGender(g.key)}
                    style={[styles.genderBtn, active && styles.genderBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderBtnText, active && styles.genderBtnTextActive]}>
                      {isAr ? g.labelAr : g.labelEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location / Country */}
          <InputField
            label={isAr ? 'الموقع / البلد' : 'Location / Country'}
            placeholder={isAr ? 'أدخل بلدك أو مدينتك' : 'Enter your country or city'}
            value={location}
            onChange={setLocation}
            icon="location-outline"
            isAr={isAr}
            required
          />
        </SectionCard>

        {/* ── Section 3: Contact Information ──────────────────────────── */}
        <SectionCard title={isAr ? 'معلومات التواصل' : 'Contact Information'} icon="call-outline">

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <FieldLabel label={t('phoneNumber')} required isAr={isAr} />
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
              <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            </View>
          </View>

          {/* Email (optional) */}
          <InputField
            label={isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (optional)'}
            placeholder={isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            icon="mail-outline"
            isAr={isAr}
          />
        </SectionCard>

        {/* ── Section 4: Identity Verification ────────────────────────── */}
        <SectionCard title={isAr ? 'التحقق من الهوية' : 'Identity Verification'} icon="shield-checkmark-outline">

          {/* Info note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
            <Text style={styles.infoNoteText}>
              {isAr
                ? 'يُقبل جواز السفر فقط كوثيقة للتحقق من الهوية. لا تُقبل أي وثائق أخرى.'
                : 'Only a passport is accepted for identity verification. No other documents are accepted.'}
            </Text>
          </View>

          {/* Passport upload button */}
          <TouchableOpacity
            style={[styles.passportBtn, passport && styles.passportBtnFilled]}
            onPress={handlePickPassport}
            activeOpacity={0.85}
          >
            {passport ? (
              /* ── Filled state: show thumbnail ── */
              <View style={styles.passportPreviewRow}>
                <Image
                  source={{ uri: passport.uri }}
                  style={styles.passportThumb}
                  resizeMode="cover"
                />
                <View style={styles.passportPreviewText}>
                  <View style={styles.passportSuccessRow}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={styles.passportSuccessLabel}>
                      {isAr ? 'تم رفع جواز السفر' : 'Passport uploaded'}
                    </Text>
                  </View>
                  <Text style={styles.passportFileName} numberOfLines={1}>{passport.name}</Text>
                  <Text style={styles.passportTapChange}>
                    {isAr ? 'اضغط لتغيير الصورة' : 'Tap to change image'}
                  </Text>
                </View>
              </View>
            ) : (
              /* ── Empty state ── */
              <View style={styles.passportEmptyState}>
                <View style={styles.passportIconCircle}>
                  <Ionicons name="id-card-outline" size={38} color={COLORS.primary} />
                </View>
                <Text style={styles.passportUploadTitle}>
                  {isAr ? 'رفع جواز السفر' : 'Upload Passport'}
                </Text>
                <Text style={styles.passportUploadDesc}>
                  {isAr
                    ? 'اضغط لاختيار صورة واضحة من جواز سفرك'
                    : 'Tap to select a clear photo of your passport'}
                </Text>
                <View style={styles.passportUploadPill}>
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.passportUploadPillText}>
                    {isAr ? 'اختر من المعرض' : 'Choose from Gallery'}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.passportRestrictionNote}>
            {isAr
              ? '* جواز السفر فقط — لا يُقبل أي نوع آخر من الوثائق'
              : '* Passport only — no other document types are accepted'}
          </Text>
        </SectionCard>

        {/* ── Section 5: Project Manager extra field ───────────────────── */}
        {isProjectManager && (
          <SectionCard title={isAr ? 'معلومات المشروع' : 'Project Information'} icon="business-outline">
            <InputField
              label={isAr ? 'اسم الشركة / المشروع' : 'Company / Project Name'}
              placeholder={isAr ? 'أدخل اسم شركتك أو مشروعك' : 'Enter your company or project name'}
              value={companyName}
              onChange={setCompanyName}
              icon="business-outline"
              isAr={isAr}
              required
            />
          </SectionCard>
        )}

        {/* ── Section 6: Account Security ──────────────────────────────── */}
        <SectionCard title={isAr ? 'أمان الحساب' : 'Account Security'} icon="lock-closed-outline">

          <InputField
            label={isAr ? 'كلمة المرور' : 'Password'}
            placeholder={isAr ? 'أدخل كلمة مرور قوية (6 أحرف+)' : 'Enter a strong password (6+ chars)'}
            value={password}
            onChange={setPassword}
            icon="lock-closed-outline"
            isAr={isAr}
            secureTextEntry
            required
          />
          {password.length > 0 && !isPasswordValid && (
            <Text style={styles.fieldError}>
              {isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters'}
            </Text>
          )}

          <InputField
            label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            placeholder={isAr ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon="shield-checkmark-outline"
            isAr={isAr}
            secureTextEntry
            required
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.fieldError}>
              {isAr ? 'كلمتا المرور غير متطابقتان' : 'Passwords do not match'}
            </Text>
          )}
        </SectionCard>

        {/* ── Section 7: Terms & Submit ─────────────────────────────────── */}
        <View style={styles.submitCard}>
          <TouchableOpacity
            style={[styles.checkRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.checkLabel}>{t('agreeTerms')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerBtn, (!canSubmit || loading) && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.registerBtnInner}>
                <ActivityIndicator color={COLORS.white} size="small" />
                <Text style={styles.registerBtnText}>
                  {passportUploading
                    ? (isAr ? 'جارٍ رفع جواز السفر...' : 'Uploading passport...')
                    : (isAr ? 'جارٍ التسجيل...' : 'Creating account...')}
                </Text>
              </View>
            ) : (
              <View style={styles.registerBtnInner}>
                <Ionicons name="person-add-outline" size={20} color={COLORS.white} />
                <Text style={styles.registerBtnText}>{t('register')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Login link ─────────────────────────────────────────────────── */}
        <View style={styles.loginCard}>
          <Text style={styles.loginCardLabel}>
            {isAr ? 'لديك حساب سابق؟' : 'Already have an account?'}
          </Text>
          <TouchableOpacity
            style={styles.loginCardBtn}
            onPress={() => navigation.navigate && navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginCardBtnText}>{t('loginTitle')}</Text>
            <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Gradient header ──────────────────────────────────────────────────────────
  gradientHeader: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  glowCircle1: {
    position: 'absolute', top: -40, right: -30,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  glowCircle2: {
    position: 'absolute', bottom: -50, left: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(47,91,231,0.22)',
  },
  headerNav: {
    alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  langBtnText: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white, letterSpacing: 0.5 },
  headerContent: { marginTop: SPACING.xs },
  headerTitle: {
    fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.white, marginTop: SPACING.md,
  },
  headerSub: {
    fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: SPACING.xs, lineHeight: 21,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: { padding: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.md, paddingBottom: 60 },

  // ── Step banner ──────────────────────────────────────────────────────────────
  stepBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.base,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base,
    borderWidth: 1, borderColor: COLORS.border,
  },
  stepBannerText: { fontSize: FONTS.sm, color: COLORS.primaryDark, fontWeight: FONTS.medium, flex: 1 },

  // ── Section card ─────────────────────────────────────────────────────────────
  sectionCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.md, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  sectionTitle: { fontSize: FONTS.base, fontWeight: FONTS.semibold, color: COLORS.textPrimary },

  // ── Role grid ────────────────────────────────────────────────────────────────
  roleGrid: { flexDirection: SCREEN.isCompactWidth ? 'column' : 'row', gap: SPACING.sm },
  roleCard: {
    flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5,
    borderColor: COLORS.borderLight, padding: SPACING.base,
    backgroundColor: COLORS.background, position: 'relative', overflow: 'hidden',
  },
  roleCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  roleIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  roleTitle: { fontSize: FONTS.base, color: COLORS.textPrimary, fontWeight: FONTS.bold, marginBottom: SPACING.xs },
  roleTitleActive: { color: COLORS.white },
  roleDesc: { fontSize: FONTS.xs, color: COLORS.textMuted, lineHeight: 18 },
  roleDescActive: { color: 'rgba(255,255,255,0.85)' },
  roleCheckBadge: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },

  // ── Form fields ──────────────────────────────────────────────────────────────
  fieldGroup: { marginBottom: SPACING.sm },
  label: {
    fontSize: FONTS.sm, color: COLORS.textSecondary,
    marginBottom: SPACING.xs, fontWeight: FONTS.semibold,
  },
  requiredStar: { color: COLORS.danger },
  fieldError: { fontSize: FONTS.xs, color: COLORS.danger, marginTop: 3 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.base, paddingHorizontal: SPACING.base,
    borderWidth: 1.5, borderColor: COLORS.borderLight, minHeight: 56,
  },
  inputWrapMultiline: { alignItems: 'flex-start', paddingTop: SPACING.md },
  input: {
    flex: 1,
    fontSize: FONTS.base,
    color: '#111111',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  inputIcon: { marginLeft: SPACING.sm, opacity: 0.65 },

  // ── Country code ─────────────────────────────────────────────────────────────
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: SPACING.sm, marginRight: SPACING.sm,
    borderRightWidth: 1, borderRightColor: COLORS.borderLight,
  },
  flag: { fontSize: 16 },
  code: { fontSize: FONTS.base, color: COLORS.textPrimary, marginLeft: SPACING.xs },

  // ── Gender picker ─────────────────────────────────────────────────────────────
  genderRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  genderBtn: {
    flex: 1, minWidth: 85, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.base, borderWidth: 1.5, borderColor: COLORS.borderLight,
    backgroundColor: COLORS.background, alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  genderBtnText: { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.medium },
  genderBtnTextActive: { color: COLORS.primaryDark, fontWeight: FONTS.semibold },

  // ── Info note ─────────────────────────────────────────────────────────────────
  infoNote: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight, borderRadius: RADIUS.md,
    padding: SPACING.base, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: `${COLORS.info}30`,
  },
  infoNoteText: { flex: 1, fontSize: FONTS.sm, color: COLORS.info, lineHeight: 20 },

  // ── Passport upload ──────────────────────────────────────────────────────────
  passportBtn: {
    borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.borderLight,
    borderStyle: 'dashed', overflow: 'hidden', marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  passportBtnFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.successLight}60`,
  },
  passportEmptyState: { padding: SPACING.xl, alignItems: 'center' },
  passportIconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base,
  },
  passportUploadTitle: {
    fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs,
  },
  passportUploadDesc: {
    fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 20, marginBottom: SPACING.base,
  },
  passportUploadPill: {
    flexDirection: 'row', gap: SPACING.xs, alignItems: 'center',
    backgroundColor: COLORS.primaryLight, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
  },
  passportUploadPillText: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: FONTS.semibold },
  passportPreviewRow: {
    flexDirection: 'row', padding: SPACING.base,
    alignItems: 'center', gap: SPACING.base,
  },
  passportThumb: { width: 84, height: 64, borderRadius: RADIUS.md, backgroundColor: COLORS.borderLight },
  passportPreviewText: { flex: 1 },
  passportSuccessRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs,
  },
  passportSuccessLabel: { fontSize: FONTS.sm, color: COLORS.success, fontWeight: FONTS.semibold },
  passportFileName: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: SPACING.xs },
  passportTapChange: { fontSize: FONTS.xs, color: COLORS.primary },
  passportRestrictionNote: { fontSize: FONTS.xs, color: COLORS.danger, textAlign: 'center' },

  // ── Submit card ──────────────────────────────────────────────────────────────
  submitCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight, ...SHADOWS.sm,
  },
  checkRow: { alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap', marginBottom: SPACING.md },
  checkbox: {
    width: 24, height: 24, borderRadius: RADIUS.sm,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkLabel: { fontSize: FONTS.sm, color: COLORS.textPrimary, flex: 1 },
  registerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.base,
    paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOWS.button,
  },
  registerBtnDisabled: { opacity: 0.42 },
  registerBtnInner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  registerBtnText: { color: COLORS.white, fontSize: FONTS.base, fontWeight: FONTS.bold },

  // ── Login link card ──────────────────────────────────────────────────────────
  loginCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm, alignItems: 'center', gap: SPACING.sm,
  },
  loginCardLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  loginCardBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  loginCardBtnText: { fontSize: FONTS.base, color: COLORS.primary, fontWeight: FONTS.semibold },
});

export default RegisterScreen;
