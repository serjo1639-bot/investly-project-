/**
 * EditAccountScreen.js — Profile editor
 *
 * Pre-fills all fields from the current user object in AuthContext.
 * On save: usersAPI.update(userId, payload) → updateUser(result) updates
 * both React state and AsyncStorage so changes persist across restarts.
 *
 * Read-only fields: role, account type (shown but not editable — changing
 * these requires a support request).
 *
 * Validation:
 *   name    — required, non-empty
 *   phone   — 7–10 digits after stripping non-digits
 *   email   — optional but validated if provided
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SCREEN, SHADOWS, SPACING } from '../constants/theme';
import { usersAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTopPopup } from '../hooks/useTopPopup';

const EditAccountScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const popup = useTopPopup();
  const { user, activeRole, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const isOwner = activeRole === 'owner';
  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  const normalizedEmail = email.trim();
  const normalizedCompany = companyName.trim();
  const normalizedBio = bio.trim();

  // useMemo recalculates canSubmit only when the listed fields change,
  // not on every render. This keeps the Save button state accurate without wasted work.
  // Regex patterns: \+? = optional leading +,  [0-9\s]{7,20} = 7–20 digits/spaces.
  const canSubmit = useMemo(() => {
    if (!normalizedName) return false;
    if (normalizedPhone && !/^\+?[0-9\s]{7,20}$/.test(normalizedPhone)) return false;
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return false;
    if (isOwner && !normalizedCompany) return false;
    return true;
  }, [isOwner, normalizedCompany, normalizedEmail, normalizedName, normalizedPhone]);

  const handleSave = async () => {
    if (!canSubmit || !user?.id || saving) return;

    setSaving(true);
    try {
      const payload = {
        name:        normalizedName,
        phone:       normalizedPhone || null,
        email:       normalizedEmail || null,
        role:        activeRole,
        companyName: isOwner ? normalizedCompany : null,
        bio:         normalizedBio || null,
      };

      const response = await usersAPI.update(user.id, payload);
      const updatedUser = response?.data || payload;
      await updateUser(updatedUser);

      popup.success(
        isAr ? 'تم تحديث بيانات الحساب بنجاح' : 'Account details updated successfully',
        { title: isAr ? 'تم التحديث' : 'Updated' },
      );

      navigation.goBack && navigation.goBack();
    } catch (error) {
      popup.error(
        error?.message || (isAr ? 'تعذر تحديث البيانات حالياً' : 'Unable to update account details right now'),
        { title: isAr ? 'فشل التحديث' : 'Update failed' },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#000000" translucent={false} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingTop: Math.max(insets.top + SPACING.sm, SPACING.lg), paddingBottom: SPACING.xxxl },
          ]}
        >
          <View style={styles.headerCard}>
            <View style={styles.headerGlowPrimary} />
            <View style={styles.headerGlowSecondary} />

            <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack && navigation.goBack()}>
                <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>
                {isAr ? 'تعديل بيانات الحساب' : 'Edit Account Details'}
              </Text>

              <View style={styles.headerSpacer} />
            </View>

            <Text style={styles.headerSubTitle}>
              {isAr ? 'حدّث بياناتك بنفس نسق الواجهات الأخرى' : 'Update your details to match the rest of the app'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <FieldLabel label={isAr ? 'الاسم' : 'Name'} alignRight={isAr} />
            <PlainInput
              value={name}
              onChangeText={setName}
              placeholder={isAr ? 'اكتب الاسم الكامل' : 'Enter full name'}
              isAr={isAr}
            />

            <FieldLabel label={isAr ? 'رقم الهاتف' : 'Phone Number'} alignRight={isAr} />
            {/*
              Phone input — three sibling elements inside one row:
                [badge]  [divider]  [TextInput]
              With flexDirection:'row-reverse' (Arabic) the visual order becomes:
                [TextInput]  [divider]  [badge]
              The divider stays between input and badge in BOTH directions
              because it is positioned between them in JSX.
            */}
            {/* +218 badge always on the LEFT */}
            <View style={[styles.phoneShell, { flexDirection: 'row' }]}>
              <View style={styles.phoneBadge}>
                <Text style={styles.phoneFlag}>🇱🇾</Text>
                <Text style={styles.phoneCode}>+218</Text>
              </View>
              <View style={styles.phoneSep} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="91 234 5678"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                selectionColor={COLORS.primary}
                textAlign="left"
                style={styles.phoneInput}
              />
              <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} style={styles.phoneIconEnd} />
            </View>

            <FieldLabel label={isAr ? 'البريد الإلكتروني' : 'Email'} alignRight={isAr} />
            <PlainInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="example@email.com"
              isAr={isAr}
              trailing={<Ionicons name="mail-outline" size={20} color={COLORS.textMuted} />}
            />

            {isOwner ? (
              <>
                <FieldLabel label={isAr ? 'اسم الجهة / المشروع' : 'Company / Project Name'} alignRight={isAr} />
                <PlainInput
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder={isAr ? 'اسم الجهة' : 'Company name'}
                  isAr={isAr}
                  trailing={<Ionicons name="business-outline" size={20} color={COLORS.textMuted} />}
                />
              </>
            ) : null}

            <FieldLabel label={isAr ? 'نبذة قصيرة' : 'Short Bio'} alignRight={isAr} />
            <View style={styles.textAreaWrap}>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder={isAr ? 'اكتب نبذة مختصرة عن الحساب' : 'Write a short bio about your account'}
                placeholderTextColor={COLORS.textMuted}
                multiline
                textAlignVertical="top"
                selectionColor={COLORS.primary}
                style={[styles.textArea, { textAlign: isAr ? 'right' : 'left' }]}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!canSubmit || saving) && styles.submitButtonDisabled]}
              onPress={handleSave}
              disabled={!canSubmit || saving}
              activeOpacity={0.88}
            >
              <Text style={styles.submitText}>
                {saving
                  ? (isAr ? 'جاري التحديث...' : 'Updating...')
                  : (isAr ? 'تحديث' : 'Update')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const FieldLabel = ({ label, alignRight }) => (
  <Text style={[styles.fieldLabel, { textAlign: alignRight ? 'right' : 'left' }]}>{label}</Text>
);

/**
 * PlainInput — clean flexbox input with optional leading / trailing adornments.
 *
 * Layout (LTR):  [leading] [TextInput] [trailing]
 * Layout (RTL):  [trailing] [TextInput] [leading]   ← row-reverse flips the order
 *
 * textAlignLeft — forces the input text to be LTR (use for phone / code fields).
 */
const PlainInput = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
  isAr,
  leading = null,
  trailing = null,
  textAlignLeft = false,
  ...rest
}) => (
  <View style={[
    styles.inputShell,
    { flexDirection: isAr ? 'row-reverse' : 'row' },
    !editable && styles.inputShellMuted,
  ]}>
    {leading ? <View style={styles.affixWrap} pointerEvents="none">{leading}</View> : null}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      editable={editable}
      selectTextOnFocus={editable}
      selectionColor={COLORS.primary}
      style={[
        styles.input,
        { textAlign: textAlignLeft ? 'left' : (isAr ? 'right' : 'left') },
      ]}
      {...rest}
    />
    {trailing ? <View style={styles.affixWrap} pointerEvents="none">{trailing}</View> : null}
  </View>
);


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN.isCompactWidth ? SPACING.base : SPACING.lg,
  },
  headerCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 28,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  headerGlowPrimary: {
    position: 'absolute',
    top: -42,
    right: -12,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerGlowSecondary: {
    position: 'absolute',
    left: -40,
    bottom: -74,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  headerSubTitle: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.78)',
    fontSize: FONTS.sm,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
  },
  fieldLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
  },
  inputShell: {
    // flexDirection set inline: 'row' (LTR) or 'row-reverse' (RTL)
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfd5df',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  inputShellMuted: {
    backgroundColor: '#fbfbfc',
  },
  input: {
    flex: 1,
    color: '#111111',
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'transparent',
  },
  affixWrap: {
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Phone input (sibling-pattern, mirrors LoginScreen) ────────────────────
  // [badge] [sep] [input] — row-reverse flips all three, sep stays between badge & input
  phoneShell: {
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfd5df',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
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
  phoneInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    minHeight: 54,
  },
  phoneFlag: { fontSize: 16 },
  phoneCode: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.primaryDark,
  },
  phoneIconEnd: {
    paddingHorizontal: SPACING.sm,
  },
  textAreaWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cfd5df',
    minHeight: 114,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 96,
    color: COLORS.textPrimary,
    fontSize: FONTS.base,
  },
  submitButton: {
    alignSelf: 'center',
    minWidth: 180,
    marginTop: SPACING.xxl,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    ...SHADOWS.button,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitText: {
    textAlign: 'center',
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
  },
});

export default EditAccountScreen;
