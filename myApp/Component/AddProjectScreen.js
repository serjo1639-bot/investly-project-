/**
 * AddProjectScreen.js — Multi-step project submission form (owner only)
 *
 * Steps:
 *   1. Basic Info    — titles (AR + EN), category, city
 *   2. Funding       — goal amount, min investment, duration
 *   3. Description   — long text (AR + EN)
 *   4. Media         — hero image via expo-image-picker
 *   5. Team          — founder name/email/phone, team size, website
 *   6. Review        — summary of all fields before submit
 *
 * On submit: ownerAPI.createProject(ownerId, formData)
 *   → In mock mode: saves to AsyncStorage as a local draft with id "local_<timestamp>"
 *   → In real mode: POST /projects + mediaAPI.upload() for the image
 *
 * Local drafts appear immediately in HomeScreen and OwnerDashboard
 * because getFeatured / getAll always merge local projects on top of server data.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, StatusBar, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, SCREEN } from '../constants/theme';
import { ownerAPI, mediaAPI } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

// All projects are Technology — category is fixed, no picker needed
const FIXED_CATEGORY = {
  id: 'tech', labelAr: 'تقنية', labelEn: 'Technology',
};

const TOTAL_STEPS = 4;

// ─── Shared helpers ───────────────────────────────────────────────────────────
const Field = ({ label, required, isAr, icon, hint, error, children }) => (
  <View style={styles.field}>
    <View style={[styles.fieldLabelRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      {icon && (
        <Ionicons
          name={icon} size={15} color={error ? COLORS.danger : COLORS.primary}
          style={{ marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0 }}
        />
      )}
      <Text style={[styles.labelTxt, { textAlign: isAr ? 'right' : 'left' }]}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    {children}
    {error  && <Text style={[styles.errorTxt, { textAlign: isAr ? 'right' : 'left' }]}>{error}</Text>}
    {!error && hint && <Text style={[styles.hint, { textAlign: isAr ? 'right' : 'left' }]}>{hint}</Text>}
  </View>
);

const TextF = ({ value, onChange, placeholder, multiline, keyboardType, isAr, hasError }) => (
  <TextInput
    style={[
      styles.input,
      multiline && styles.inputMulti,
      hasError && styles.inputError,
      { textAlign: isAr ? 'right' : 'left' },
    ]}
    placeholder={placeholder}
    placeholderTextColor={COLORS.textMuted}
    value={value}
    onChangeText={onChange}
    multiline={multiline}
    keyboardType={keyboardType || 'default'}
    textAlignVertical={multiline ? 'top' : 'center'}
    blurOnSubmit={!multiline}
    autoCorrect={false}
    autoCapitalize="none"
  />
);

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <View style={styles.stepBar}>
    {Array.from({ length: TOTAL_STEPS }, (_, i) => {
      const n = i + 1; const active = n === current; const done = n < current;
      return (
        <React.Fragment key={n}>
          <View style={[styles.stepCircle, active && styles.stepCircleActive, done && styles.stepCircleDone]}>
            {done
              ? <Ionicons name="checkmark" size={13} color={COLORS.white} />
              : <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>{n}</Text>}
          </View>
          {n < TOTAL_STEPS && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Step 1: Basic info ───────────────────────────────────────────────────────
const Step1 = React.memo(({ form, set, isAr, errors }) => (
  <View style={styles.card}>
    <View style={[styles.cardHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <View style={styles.cardHeaderIcon}>
        <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
      </View>
      <Text style={[styles.stepTitle, { textAlign: isAr ? 'right' : 'left' }]}>
        {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
      </Text>
    </View>

    <Field
      label={isAr ? 'عنوان المشروع (عربي)' : 'Project Title (Arabic)'}
      required isAr={isAr} icon="text-outline"
      error={errors?.titleAr}
    >
      <TextF
        value={form.titleAr}
        onChange={(v) => set('titleAr', v)}
        placeholder={isAr ? 'مثال: منصة تقنية متقدمة' : 'e.g. Advanced Tech Platform'}
        isAr={isAr} hasError={!!errors?.titleAr}
      />
    </Field>

    <Field
      label={isAr ? 'عنوان المشروع (إنجليزي)' : 'Project Title (English)'}
      isAr={isAr} icon="language-outline"
      hint={isAr ? 'اختياري — يُستخدم العنوان العربي إذا تُرك فارغاً' : 'Optional — Arabic title used if blank'}
    >
      <TextF
        value={form.titleEn}
        onChange={(v) => set('titleEn', v)}
        placeholder="e.g. Advanced Tech Platform"
        isAr={false}
      />
    </Field>

    <Field
      label={isAr ? 'المدينة' : 'City'}
      required isAr={isAr} icon="location-outline"
      error={errors?.cityAr}
    >
      <TextF
        value={form.cityAr}
        onChange={(v) => set('cityAr', v)}
        placeholder={isAr ? 'مثال: طرابلس' : 'e.g. Tripoli'}
        isAr={isAr} hasError={!!errors?.cityAr}
      />
    </Field>

    {/* Category — fixed to Technology, shown as read-only info pill */}
    <View style={[styles.categoryFixed, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <Ionicons name="hardware-chip-outline" size={16} color={COLORS.primary} />
      <Text style={styles.categoryFixedLbl}>
        {isAr ? 'التصنيف:' : 'Category:'}
      </Text>
      <View style={styles.categoryFixedPill}>
        <Text style={styles.categoryFixedPillTxt}>
          {isAr ? FIXED_CATEGORY.labelAr : FIXED_CATEGORY.labelEn}
        </Text>
      </View>
    </View>
  </View>
));

// ─── Step 2: Funding details ──────────────────────────────────────────────────
const Step2 = React.memo(({ form, set, isAr, errors }) => {
  const goal = Number(form.fundingGoal) || 0;
  const min  = Number(form.minInvestment) || 0;
  const minExceedsGoal = goal > 0 && min > 0 && min > goal;

  return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
        </View>
        <Text style={[styles.stepTitle, { textAlign: isAr ? 'right' : 'left' }]}>
          {isAr ? 'تفاصيل التمويل' : 'Funding Details'}
        </Text>
      </View>

      <Field
        label={isAr ? 'هدف التمويل (د.ل)' : 'Funding Goal (LYD)'}
        required isAr={isAr} icon="cash-outline"
        error={errors?.fundingGoal}
      >
        <TextF
          value={form.fundingGoal}
          onChange={(v) => set('fundingGoal', v.replace(/[^0-9]/g, ''))}
          placeholder={isAr ? 'مثال: 50000' : 'e.g. 50000'}
          keyboardType="numeric" isAr={isAr} hasError={!!errors?.fundingGoal}
        />
      </Field>

      <Field
        label={isAr ? 'الحد الأدنى للمساهمة (د.ل)' : 'Minimum Investment (LYD)'}
        required isAr={isAr} icon="trending-up-outline"
        error={errors?.minInvestment || (minExceedsGoal
          ? (isAr ? 'يجب أن يكون أقل من هدف التمويل' : 'Must be less than the funding goal')
          : undefined)}
      >
        <TextF
          value={form.minInvestment}
          onChange={(v) => set('minInvestment', v.replace(/[^0-9]/g, ''))}
          placeholder={isAr ? 'مثال: 500' : 'e.g. 500'}
          keyboardType="numeric" isAr={isAr}
          hasError={!!errors?.minInvestment || minExceedsGoal}
        />
      </Field>

      <Field
        label={isAr ? 'مدة الاستثمار (بالأيام)' : 'Investment Duration (days)'}
        required isAr={isAr} icon="time-outline"
        error={errors?.durationDays}
      >
        <TextF
          value={form.durationDays}
          onChange={(v) => set('durationDays', v.replace(/[^0-9]/g, ''))}
          placeholder={isAr ? 'مثال: 90' : 'e.g. 90'}
          keyboardType="numeric" isAr={isAr} hasError={!!errors?.durationDays}
        />
      </Field>

      {goal > 0 && min > 0 && !minExceedsGoal && (
        <View style={[styles.infoBox, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Ionicons name="people-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.infoTxt, { textAlign: isAr ? 'right' : 'left' }]}>
            {isAr
              ? `يحتاج إلى ${Math.ceil(goal / min).toLocaleString()} مستثمر على الأقل للوصول للهدف`
              : `Needs at least ${Math.ceil(goal / min).toLocaleString()} investors to reach the goal`}
          </Text>
        </View>
      )}
    </View>
  );
});

// ─── Step 3: Description & image ──────────────────────────────────────────────
const Step3 = React.memo(({ form, set, setForm, isAr, errors, onImagePick }) => (
  <View style={styles.card}>
    <View style={[styles.cardHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <View style={styles.cardHeaderIcon}>
        <Ionicons name="image-outline" size={20} color={COLORS.primary} />
      </View>
      <Text style={[styles.stepTitle, { textAlign: isAr ? 'right' : 'left' }]}>
        {isAr ? 'الوصف والصورة' : 'Description & Image'}
      </Text>
    </View>

    <Field
      label={isAr ? 'وصف المشروع (عربي)' : 'Description (Arabic)'}
      required isAr={isAr} icon="document-text-outline"
      error={errors?.descriptionAr}
    >
      <TextF
        value={form.descriptionAr}
        onChange={(v) => set('descriptionAr', v)}
        placeholder={isAr ? 'اكتب وصفاً تفصيلياً للمشروع...' : 'Write a detailed project description...'}
        multiline isAr={isAr} hasError={!!errors?.descriptionAr}
      />
    </Field>

    <Field
      label={isAr ? 'وصف المشروع (إنجليزي)' : 'Description (English)'}
      isAr={isAr} icon="document-outline"
      hint={isAr ? 'اختياري' : 'Optional'}
    >
      <TextF
        value={form.descriptionEn}
        onChange={(v) => set('descriptionEn', v)}
        placeholder="Write a detailed project description..."
        multiline isAr={false}
      />
    </Field>

    {/* ── Image picker — gallery only, no URL input ── */}
    <Field label={isAr ? 'صورة المشروع' : 'Project Image'} isAr={isAr} icon="camera-outline">
      <TouchableOpacity style={styles.imageBox} onPress={onImagePick} activeOpacity={0.88}>
        {form.imageUri ? (
          <>
            <Image
              source={{ uri: form.imageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            {/* Dim overlay + change label */}
            <View style={styles.imageSelectedOverlay}>
              <View style={styles.imageChangePill}>
                <Ionicons name="camera-outline" size={16} color={COLORS.white} />
                <Text style={styles.imageChangeTxt}>
                  {isAr ? 'تغيير الصورة' : 'Change photo'}
                </Text>
              </View>
            </View>
            {/* Remove button */}
            <TouchableOpacity
              style={styles.imageRemoveBtn}
              onPress={() => setForm((p) => ({ ...p, imageUri: null, imageAsset: null }))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.imageIconCircle}>
              <Ionicons name="image-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.imageTitle}>
              {isAr ? 'أضف صورة المشروع' : 'Add Project Photo'}
            </Text>
            <Text style={styles.imageSub}>
              {isAr ? 'اضغط لفتح معرض الصور' : 'Tap to open photo gallery'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Field>
  </View>
));

// ─── Step 4: Team info + review ───────────────────────────────────────────────
const Step4 = React.memo(({ form, set, isAr, errors }) => (
  <View style={styles.card}>
    <View style={[styles.cardHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <View style={styles.cardHeaderIcon}>
        <Ionicons name="people-outline" size={20} color={COLORS.primary} />
      </View>
      <Text style={[styles.stepTitle, { textAlign: isAr ? 'right' : 'left' }]}>
        {isAr ? 'معلومات الفريق' : 'Team Information'}
      </Text>
    </View>

    <Field
      label={isAr ? 'اسم المؤسس' : 'Founder Name'}
      required isAr={isAr} icon="person-outline"
      error={errors?.founderName}
    >
      <TextF
        value={form.founderName}
        onChange={(v) => set('founderName', v)}
        placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. Ahmed Mohammed'}
        isAr={isAr} hasError={!!errors?.founderName}
      />
    </Field>

    <Field
      label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
      required isAr={isAr} icon="mail-outline"
      error={errors?.founderEmail}
    >
      <TextF
        value={form.founderEmail}
        onChange={(v) => set('founderEmail', v)}
        placeholder="example@email.com"
        keyboardType="email-address"
        isAr={false} hasError={!!errors?.founderEmail}
      />
    </Field>

    <Field
      label={isAr ? 'رقم الهاتف' : 'Phone Number'}
      required isAr={isAr} icon="call-outline"
      error={errors?.founderPhone}
    >
      {/*
        Phone input — three siblings in one row:
          [badge]  [sep]  [TextInput]
        flexDirection:'row-reverse' flips ALL THREE together in Arabic,
        so the separator always stays between badge and input.
          LTR: [🇱🇾 +218] | [91 234 5678        ]
          RTL: [        91 234 5678] | [+218 🇱🇾]
      */}
      {/* +218 badge always on the LEFT */}
      <View style={[
        styles.phoneRow,
        { flexDirection: 'row' },
        !!errors?.founderPhone && styles.phoneRowError,
      ]}>
        <View style={styles.phoneBadge}>
          <Text style={styles.phoneFlag}>🇱🇾</Text>
          <Text style={styles.phoneCode}>+218</Text>
        </View>
        <View style={styles.phoneSep} />
        <TextInput
          style={styles.phoneInput}
          value={form.founderPhone}
          onChangeText={(v) => set('founderPhone', v)}
          placeholder="91 234 5678"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          textAlign="left"
        />
      </View>
    </Field>

    <Field
      label={isAr ? 'حجم الفريق' : 'Team Size'}
      isAr={isAr} icon="people-outline"
      hint={isAr ? 'اختياري' : 'Optional'}
    >
      <TextF
        value={form.teamSize}
        onChange={(v) => set('teamSize', v.replace(/[^0-9]/g, ''))}
        placeholder={isAr ? 'مثال: 5' : 'e.g. 5'}
        keyboardType="numeric" isAr={isAr}
      />
    </Field>

    <Field
      label={isAr ? 'الموقع الإلكتروني' : 'Website'}
      isAr={isAr} icon="globe-outline"
      hint={isAr ? 'اختياري' : 'Optional'}
    >
      <TextF
        value={form.website}
        onChange={(v) => set('website', v)}
        placeholder="https://yourproject.com"
        keyboardType="url" isAr={false}
      />
    </Field>

    {/* ── Quick review summary ── */}
    <View style={styles.summaryCard}>
      <View style={[styles.summaryHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <Ionicons name="checkmark-circle" size={18} color={COLORS.teal} />
        <Text style={styles.summaryTitle}>{isAr ? 'مراجعة سريعة' : 'Quick Review'}</Text>
      </View>

      {[
        { lbl: isAr ? 'العنوان'     : 'Title',     val: form.titleAr || '—' },
        { lbl: isAr ? 'التصنيف'    : 'Category',  val: isAr ? FIXED_CATEGORY.labelAr : FIXED_CATEGORY.labelEn },
        { lbl: isAr ? 'المدينة'    : 'City',      val: form.cityAr || '—' },
        { lbl: isAr ? 'الهدف'      : 'Goal',      val: form.fundingGoal ? `${Number(form.fundingGoal).toLocaleString()} د.ل` : '—' },
        { lbl: isAr ? 'الحد الأدنى': 'Min. inv.', val: form.minInvestment ? `${Number(form.minInvestment).toLocaleString()} د.ل` : '—' },
        { lbl: isAr ? 'المدة'      : 'Duration',  val: form.durationDays ? `${form.durationDays} ${isAr ? 'يوم' : 'days'}` : '—' },
        { lbl: isAr ? 'الصورة'     : 'Photo',     val: form.imageUri ? (isAr ? '✓ تم الاختيار' : '✓ Selected') : (isAr ? 'لا توجد صورة' : 'No photo') },
      ].map((row) => (
        <View key={row.lbl} style={[styles.summaryRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <Text style={styles.summaryLbl}>{row.lbl}</Text>
          <Text style={styles.summaryVal} numberOfLines={1}>{row.val}</Text>
        </View>
      ))}
    </View>
  </View>
));

// ─── AddProjectScreen ─────────────────────────────────────────────────────────
export default function AddProjectScreen({ navigation }) {
  const { user }     = useAuth();
  const { t, i18n } = useTranslation();
  const isAr         = i18n.language === 'ar';
  const insets       = useSafeAreaInsets();
  const popup        = useTopPopup();
  const scrollRef    = useRef(null);

  const [step, setStep]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'submitting'
  const [fieldErrors, setFieldErrors]   = useState({});

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', cityAr: '',
    fundingGoal: '', minInvestment: '', durationDays: '',
    descriptionAr: '', descriptionEn: '',
    imageUri: null, imageAsset: null,
    founderName: '', founderEmail: '', founderPhone: '',
    teamSize: '', website: '',
  });

  const set = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  // ── Per-step validation ─────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (step === 1) {
      if (!form.titleAr.trim()) errs.titleAr = isAr ? 'العنوان مطلوب' : 'Title is required';
      if (!form.cityAr.trim())  errs.cityAr  = isAr ? 'المدينة مطلوبة' : 'City is required';
    }
    if (step === 2) {
      const goal = Number(form.fundingGoal);
      const min  = Number(form.minInvestment);
      if (!form.fundingGoal || goal <= 0)         errs.fundingGoal  = isAr ? 'أدخل هدف تمويل صحيح' : 'Enter a valid funding goal';
      if (!form.minInvestment || min <= 0)         errs.minInvestment = isAr ? 'أدخل حداً أدنى صحيح' : 'Enter a valid minimum';
      if (min > goal)                              errs.minInvestment = isAr ? 'يجب أن يكون أقل من الهدف' : 'Must be less than the goal';
      if (!form.durationDays || Number(form.durationDays) <= 0) errs.durationDays = isAr ? 'أدخل مدة صحيحة' : 'Enter a valid duration';
    }
    if (step === 3) {
      if (!form.descriptionAr.trim()) errs.descriptionAr = isAr ? 'الوصف مطلوب' : 'Description is required';
    }
    if (step === 4) {
      if (!form.founderName.trim())                          errs.founderName  = isAr ? 'الاسم مطلوب' : 'Name is required';
      if (!/\S+@\S+\.\S+/.test(form.founderEmail.trim()))   errs.founderEmail = isAr ? 'بريد إلكتروني غير صحيح' : 'Invalid email';
      if (!form.founderPhone.trim())                         errs.founderPhone = isAr ? 'رقم الهاتف مطلوب' : 'Phone is required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  const goNext = () => {
    if (!validate()) {
      popup.warning(isAr ? 'يرجى تصحيح الأخطاء المُشار إليها' : 'Please fix the highlighted errors');
      return;
    }
    setStep((prev) => prev + 1);
    scrollToTop();
  };

  const goPrev = () => {
    setFieldErrors({});
    setStep((prev) => prev - 1);
    scrollToTop();
  };

  // ── Gallery image picker ────────────────────────────────────────────────────
  const handleImagePick = useCallback(async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'ios') {
        Alert.alert(
          isAr ? 'الوصول للصور مرفوض' : 'Photo Access Denied',
          isAr
            ? 'يرجى السماح بالوصول للصور من إعدادات الجهاز: الإعدادات ← الخصوصية ← الصور'
            : 'Please allow photo access in Settings → Privacy → Photos',
          [{ text: isAr ? 'موافق' : 'OK' }],
        );
      } else {
        popup.warning(isAr ? 'يرجى السماح بالوصول للمعرض من إعدادات التطبيق' : 'Grant gallery permission in app settings');
      }
      return;
    }

    // MediaType (v17+) preferred; fall back to MediaTypeOptions for older SDKs
    const mediaTypes = ImagePicker.MediaType?.Images
      ?? ImagePicker.MediaTypeOptions?.Images
      ?? 'images';

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      const rawExt = asset.uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const ext    = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
      const mime   = asset.mimeType || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);

      setForm((prev) => ({
        ...prev,
        imageUri: asset.uri,
        imageAsset: {
          uri:  asset.uri,
          name: asset.fileName || `project_${Date.now()}.${ext}`,
          type: mime,
        },
      }));
    }
  }, [isAr, popup]);

  // ── Submit: upload image → create project ───────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      popup.warning(isAr ? 'يرجى تصحيح الأخطاء أولاً' : 'Please fix errors first');
      return;
    }

    setLoading(true);
    let finalImageUrl = null;

    try {
      // Step A — upload gallery image to backend (skip for HTTP URLs or no image)
      if (form.imageAsset?.uri) {
        setUploadStatus('uploading');
        try {
          const uploadRes = await mediaAPI.upload(form.imageAsset);
          finalImageUrl   = uploadRes?.url || form.imageAsset.uri;
        } catch {
          // Non-fatal: backend unavailable or mock mode — use local URI
          finalImageUrl = form.imageAsset.uri;
        }
        setUploadStatus('submitting');
      } else {
        setUploadStatus('submitting');
      }

      // Step B — send project data to backend
      const ownerId = user?.id || 'default_owner';

      const payload = {
        // Identity
        titleAr:          form.titleAr.trim(),
        titleEn:          form.titleEn.trim()        || form.titleAr.trim(),
        // Category — fixed
        category:         FIXED_CATEGORY.id,
        categoryAr:       FIXED_CATEGORY.labelAr,
        categoryEn:       FIXED_CATEGORY.labelEn,
        // Location
        cityAr:           form.cityAr.trim(),
        cityEn:           form.cityAr.trim(),
        // Funding
        fundingGoal:      Number(form.fundingGoal),
        minInvestment:    Number(form.minInvestment),
        durationDays:     Number(form.durationDays),
        duration:         Number(form.durationDays),
        // Description
        descriptionAr:    form.descriptionAr.trim(),
        descriptionEn:    form.descriptionEn.trim()  || form.descriptionAr.trim(),
        // Image — server URL after upload, or null
        image:            finalImageUrl,
        // Team
        founderName:      form.founderName.trim(),
        founderEmail:     form.founderEmail.trim(),
        founderPhone:     form.founderPhone.trim(),
        teamSize:         form.teamSize ? Number(form.teamSize) : 1,
        website:          form.website.trim() || null,
        // Owner meta
        ownerName:        user?.name        || form.founderName.trim(),
        ownerCompanyName: user?.companyName || null,
        ownerId,
      };

      const res = await ownerAPI.createProject(ownerId, payload);
      if (!res?.success) throw new Error('create failed');

      popup.success(
        isAr
          ? 'تم إرسال مشروعك وسيظهر في لوحة التحكم قريباً.'
          : 'Project submitted! It will appear in your dashboard shortly.',
        { title: isAr ? '✓ تم بنجاح' : '✓ Success', duration: 3200 },
      );
      setTimeout(() => navigation.navigate('OwnerDashboard'), 350);

    } catch {
      popup.error(
        isAr ? 'حدث خطأ أثناء إرسال المشروع، يرجى المحاولة مجدداً' : 'Failed to submit project. Please try again.',
        { title: t('error') },
      );
    } finally {
      setLoading(false);
      setUploadStatus(null);
    }
  };

  const stepLabels = [
    isAr ? 'الأساسيات' : 'Basics',
    isAr ? 'التمويل'   : 'Funding',
    isAr ? 'الوصف'     : 'Details',
    isAr ? 'الفريق'    : 'Team',
  ];

  const submitLabel = () => {
    if (!loading) return isAr ? 'إرسال المشروع' : 'Submit Project';
    if (uploadStatus === 'uploading')  return isAr ? 'جاري رفع الصورة...' : 'Uploading photo...';
    return isAr ? 'جاري الإرسال...' : 'Submitting...';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B4B" translucent={false} />

      {/* ── Header ── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.base) }]}
      >
        <View style={styles.headerGlow1} />
        <View style={styles.headerGlow2} />

        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isAr ? 'إضافة مشروع جديد' : 'Add New Project'}</Text>
            <Text style={styles.headerSub}>
              {stepLabels[step - 1]} · {isAr ? `خطوة ${step} من ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}
            </Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.stepBarWrap}>
          <StepBar current={step} />
        </View>
      </LinearGradient>

      {/* ── Form body ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {step === 1 && <Step1 form={form} set={set} isAr={isAr} errors={fieldErrors} />}
        {step === 2 && <Step2 form={form} set={set} isAr={isAr} errors={fieldErrors} />}
        {step === 3 && (
          <Step3
            form={form} set={set} setForm={setForm}
            isAr={isAr} errors={fieldErrors}
            onImagePick={handleImagePick}
          />
        )}
        {step === 4 && <Step4 form={form} set={set} isAr={isAr} errors={fieldErrors} />}

        <View style={{ height: Math.max(130, 90 + (insets.bottom || 0)) }} />
      </ScrollView>

      {/* ── Footer navigation ── */}
      <View
        style={[
          styles.footer,
          { flexDirection: isAr ? 'row-reverse' : 'row', paddingBottom: Math.max(insets.bottom + SPACING.xs, SPACING.base) },
        ]}
      >
        {step > 1 ? (
          <TouchableOpacity style={styles.prevBtn} onPress={goPrev} disabled={loading} activeOpacity={0.8}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={18} color={COLORS.primary} />
            <Text style={styles.prevTxt}>{isAr ? 'السابق' : 'Back'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 0.35 }} />
        )}

        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.88}>
            <LinearGradient
              colors={['#1A237E', '#4361EE']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              <Text style={styles.nextTxt}>{isAr ? 'التالي' : 'Next'}</Text>
              <Ionicons name={isAr ? 'chevron-back' : 'chevron-forward'} size={18} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={loading ? ['#888', '#aaa'] : ['#007A6E', '#00B4A0']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={COLORS.white} size="small" />
                  <Text style={styles.nextTxt}>{submitLabel()}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
                  <Text style={styles.nextTxt}>{isAr ? 'إرسال المشروع' : 'Submit Project'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerGlow1: {
    position: 'absolute', top: -40, right: -20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerGlow2: {
    position: 'absolute', left: -44, bottom: -70,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow:    { alignItems: 'center' },
  backBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle:  { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.white },
  headerSub:    { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.68)' },
  stepBarWrap:  { alignItems: 'center', marginTop: SPACING.base },

  // ── Step bar ──────────────────────────────────────────────────────────────
  stepBar:            { flexDirection: 'row', alignItems: 'center' },
  stepCircle:         { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive:   { backgroundColor: COLORS.white, borderColor: COLORS.white },
  stepCircleDone:     { backgroundColor: COLORS.teal,  borderColor: COLORS.teal  },
  stepNum:            { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: 'rgba(255,255,255,0.8)' },
  stepNumActive:      { color: COLORS.primaryDark },
  stepLine:           { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  stepLineDone:       { backgroundColor: COLORS.teal },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingTop: SPACING.lg, gap: SPACING.base },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.base,
    ...SHADOWS.sm,
  },
  cardHeader:     { alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  cardHeaderIcon: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepTitle: { flex: 1, fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary },

  // ── Field ─────────────────────────────────────────────────────────────────
  field:        { gap: 6 },
  fieldLabelRow: { alignItems: 'center', gap: 4 },
  labelTxt:     { flex: 1, fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.textPrimary },
  required:     { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: FONTS.bold },
  hint:         { fontSize: FONTS.xs, color: COLORS.textMuted },
  errorTxt:     { fontSize: FONTS.xs, color: COLORS.danger, fontWeight: FONTS.medium },

  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.base,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm + 2,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },
  inputMulti:  { minHeight: 120, paddingTop: SPACING.md },
  inputError:  { borderColor: COLORS.danger },

  // ── Phone field — sibling-pattern mirrors LoginScreen ────────────────────
  // [badge] [sep] [input] — row-reverse keeps sep between badge & input in RTL
  phoneRow: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.base,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  phoneRowError: { borderColor: COLORS.danger },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    gap: 4,
    backgroundColor: COLORS.primaryLight,
  },
  phoneSep: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.borderLight,
  },
  phoneFlag: { fontSize: 16 },
  phoneCode: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primaryDark },
  phoneInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : SPACING.sm + 2,
    paddingHorizontal: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.textPrimary,
  },

  // ── Category fixed display ────────────────────────────────────────────────
  categoryFixed: {
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  categoryFixedLbl:     { fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.medium },
  categoryFixedPill:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.full, paddingVertical: 5, paddingHorizontal: SPACING.base },
  categoryFixedPillTxt: { fontSize: FONTS.sm, color: COLORS.white, fontWeight: FONTS.bold },

  // ── Info box ──────────────────────────────────────────────────────────────
  infoBox: {
    alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.base,
    padding: SPACING.sm,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  infoTxt: { flex: 1, fontSize: FONTS.xs, color: COLORS.primaryDark, lineHeight: 18 },

  // ── Image picker ──────────────────────────────────────────────────────────
  imageBox: {
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundDark,
  },
  imagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    padding: SPACING.base,
  },
  imageIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  imageTitle: { fontSize: FONTS.base, fontWeight: FONTS.bold, color: COLORS.primary, textAlign: 'center' },
  imageSub:   { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center' },

  imageSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: SPACING.base,
  },
  imageChangePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  imageChangeTxt: { fontSize: FONTS.sm, color: COLORS.white, fontWeight: FONTS.semibold },
  imageRemoveBtn: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm,
  },

  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryHeader: { alignItems: 'center', gap: SPACING.sm, marginBottom: 2 },
  summaryTitle:  { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primaryDark },
  summaryRow:    { justifyContent: 'space-between', alignItems: 'center' },
  summaryLbl:    { fontSize: FONTS.sm, color: COLORS.textMuted },
  summaryVal:    { fontSize: FONTS.sm, color: COLORS.primaryDark, fontWeight: FONTS.semibold, maxWidth: '58%', textAlign: 'right' },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  prevBtn: {
    flex: 0.35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: SPACING.md, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  prevTxt:     { fontSize: FONTS.sm, fontWeight: FONTS.semibold, color: COLORS.primary },
  nextBtn:     { flex: 0.60, borderRadius: RADIUS.full, overflow: 'hidden' },
  nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md + 2 },
  nextTxt:     { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.white },
  btnDisabled: { opacity: 0.5 },
});
