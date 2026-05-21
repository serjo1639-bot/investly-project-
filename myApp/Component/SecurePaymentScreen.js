/**
 * SecurePaymentScreen.js — Secure payment form
 *
 * Shows the amount from global.paymentAmount set by PaymentsScreen.
 * Collects: card holder name, card number (auto-formatted), expiry (MM/YY),
 * CVV, IBAN/account number, bank name, billing address.
 *
 * On submit: calls paymentsAPI.initiatePayment() then navigates back to Payments.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { paymentsAPI } from '../services/api';
import { useTopPopup } from '../hooks/useTopPopup';

/**
 * Formats a number as Libyan Dinar (LYD only — no other currency).
 * isAr = true  → "12,500 د.ل"   (Arabic: symbol after number)
 * isAr = false → "LYD 12,500"   (English: symbol before number)
 */
const formatCurrency = (value, isAr) => {
  const amount = Number(value || 0).toLocaleString('en-US');
  return isAr ? `${amount} د.ل` : `LYD ${amount}`;
};

/**
 * Format card number: inserts a space every 4 digits, max 19 chars (16 digits + 3 spaces).
 * Runs on every keystroke.
 */
const formatCardNumber = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/**
 * Format expiry: inserts '/' after the first 2 digits automatically.
 */
const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

/**
 * Determine card brand from the first digit of the card number.
 * 4 → Visa, 5 → Mastercard, everything else → unknown.
 */
const getCardType = (number) => {
  const first = (number || '').replace(/\s/g, '')[0];
  if (first === '4') return 'Visa';
  if (first === '5') return 'Mastercard';
  return null;
};

const FormSection = ({ title, children }) => (
  <View style={styles.formSection}>
    <Text style={styles.formSectionTitle}>{title}</Text>
    {children}
  </View>
);

const FormField = ({ icon, label, isAr, children }) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { textAlign: isAr ? 'right' : 'left' }]}>{label}</Text>
    <View style={[styles.inputRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} style={isAr ? styles.iconRight : styles.iconLeft} />
      {children}
    </View>
  </View>
);

const inputStyle = (isAr) => ({
  flex: 1,
  minHeight: 52,
  paddingVertical: SPACING.sm,
  paddingHorizontal: SPACING.xs,
  fontSize: FONTS.base,
  color: COLORS.textPrimary,
  textAlign: isAr ? 'right' : 'left',
});

// ── Validation ────────────────────────────────────────────────────────────────
const isValidCardNumber = (val) => val.replace(/\s/g, '').length === 16;
const isValidExpiry = (val) => {
  const m = val.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  return month >= 1 && month <= 12;
};
const isValidCVV = (val) => /^\d{3,4}$/.test(val);

const SecurePaymentScreen = ({ navigation }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const popup = useTopPopup();

  // Read the amount set by PaymentsScreen/RechargeWalletScreen before navigating here.
  // Defaults to 0 if somehow reached directly without setting the global first.
  const amount = global.paymentAmount || 0;

  // ── Form state ────────────────────────────────────────────────────────────
  const [cardHolder, setCardHolder]   = useState('');
  const [cardNumber, setCardNumber]   = useState('');
  const [expiry, setExpiry]           = useState('');
  const [cvv, setCvv]                 = useState('');
  const [iban, setIban]               = useState('');
  const [bankName, setBankName]       = useState('');
  const [address, setAddress]         = useState('');
  const [city, setCity]               = useState('');
  const [country, setCountry]         = useState('Libya');

  const [submitting, setSubmitting]   = useState(false);
  const [errors, setErrors]           = useState({});

  const cardType = getCardType(cardNumber);

  // All required fields must be non-empty and pass basic validation
  const isFormValid =
    cardHolder.trim() &&
    isValidCardNumber(cardNumber) &&
    isValidExpiry(expiry) &&
    isValidCVV(cvv) &&
    iban.trim() &&
    bankName.trim() &&
    address.trim() &&
    city.trim() &&
    country.trim();

  const validate = () => {
    const newErrors = {};
    if (!cardHolder.trim()) newErrors.cardHolder = isAr ? 'مطلوب' : 'Required';
    if (!isValidCardNumber(cardNumber)) newErrors.cardNumber = isAr ? 'رقم البطاقة غير صحيح (16 رقماً)' : 'Invalid card number (16 digits)';
    if (!isValidExpiry(expiry)) newErrors.expiry = isAr ? 'تاريخ انتهاء غير صحيح (MM/YY)' : 'Invalid expiry (MM/YY)';
    if (!isValidCVV(cvv)) newErrors.cvv = isAr ? 'CVV غير صحيح (3-4 أرقام)' : 'Invalid CVV (3-4 digits)';
    if (!iban.trim()) newErrors.iban = isAr ? 'مطلوب' : 'Required';
    if (!bankName.trim()) newErrors.bankName = isAr ? 'مطلوب' : 'Required';
    if (!address.trim()) newErrors.address = isAr ? 'مطلوب' : 'Required';
    if (!city.trim()) newErrors.city = isAr ? 'مطلوب' : 'Required';
    if (!country.trim()) newErrors.country = isAr ? 'مطلوب' : 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await paymentsAPI.initiatePayment({
        amount,
        cardHolder,
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry,
        cvv,
        iban,
        bankName,
        address,
        city,
        country,
      });
      popup.success(isAr ? 'تم إرسال الدفعة بنجاح' : 'Payment submitted successfully');
      setTimeout(() => navigation.navigate && navigation.navigate('Payments'), 400);
    } catch (error) {
      popup.error(error?.message || (isAr ? 'فشلت عملية الدفع، يرجى المحاولة مجدداً' : 'Payment failed, please try again'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldInputStyle = [styles.fieldInput, { textAlign: isAr ? 'right' : 'left' }];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D1B4B" translucent={false} />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={['#0D1B4B', '#1A237E', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 8, SPACING.xl) }]}
      >
        <View style={styles.headerGlowPrimary} />
        <View style={styles.headerGlowSecondary} />

        <View style={[styles.headerRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack && navigation.goBack()}>
            <Ionicons name={isAr ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isAr ? 'الدفع الآمن' : 'Secure Payment'}</Text>
            <View style={styles.sslBadge}>
              <Ionicons name="lock-closed" size={11} color="#4dd9c0" />
              <Text style={styles.sslText}>SSL Encrypted</Text>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Card 1: Payment Summary ── */}
        <FormSection title={isAr ? 'ملخص الدفعة' : 'Payment Summary'}>
          <View style={styles.summaryRow}>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountLabel}>{isAr ? 'المبلغ المستحق' : 'Amount Due'}</Text>
              <Text style={styles.amountValue}>{formatCurrency(amount, isAr)}</Text>
            </View>
            <View style={styles.providerBadge}>
              <View style={styles.providerLogoSmall}>
                <Text style={styles.providerLogoSmallText}>I</Text>
              </View>
              <View>
                <Text style={styles.providerBadgeName}>Investly</Text>
                <Text style={styles.providerBadgePowered}>{isAr ? 'مدعوم من Investly' : 'Powered by Investly'}</Text>
              </View>
            </View>
          </View>
        </FormSection>

        {/* ── Card 2: Card Information ── */}
        <FormSection title={isAr ? 'بيانات البطاقة' : 'Card Information'}>
          {/* Card Holder Name */}
          <FormField icon="person-outline" label={isAr ? 'اسم حامل البطاقة' : 'Card Holder Name'} isAr={isAr}>
            <TextInput
              value={cardHolder}
              onChangeText={setCardHolder}
              placeholder={isAr ? 'الاسم كما هو على البطاقة' : 'Name as it appears on card'}
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.cardHolder ? <Text style={styles.errorText}>{errors.cardHolder}</Text> : null}

          {/* Card Number */}
          <FormField icon="card-outline" label={isAr ? 'رقم البطاقة' : 'Card Number'} isAr={isAr}>
            <TextInput
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
              maxLength={19}
              selectionColor={COLORS.primary}
              style={[fieldInputStyle, { letterSpacing: 1.5 }]}
            />
            {cardType ? (
              <View style={styles.cardTypeChip}>
                <Text style={styles.cardTypeText}>{cardType}</Text>
              </View>
            ) : null}
          </FormField>
          {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}

          {/* Expiry + CVV row */}
          <View style={[styles.halfRow, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <View style={styles.halfField}>
              <FormField icon="calendar-outline" label={isAr ? 'تاريخ الانتهاء' : 'Expiry (MM/YY)'} isAr={isAr}>
                <TextInput
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/YY"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={5}
                  selectionColor={COLORS.primary}
                  style={fieldInputStyle}
                />
              </FormField>
              {errors.expiry ? <Text style={styles.errorText}>{errors.expiry}</Text> : null}
            </View>
            <View style={styles.halfField}>
              <FormField icon="lock-closed-outline" label="CVV" isAr={isAr}>
                <TextInput
                  value={cvv}
                  onChangeText={setCvv}
                  placeholder="•••"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  selectionColor={COLORS.primary}
                  style={fieldInputStyle}
                />
              </FormField>
              {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
            </View>
          </View>
        </FormSection>

        {/* ── Card 3: Bank Account ── */}
        <FormSection title={isAr ? 'الحساب البنكي' : 'Bank Account'}>
          <FormField icon="barcode-outline" label={isAr ? 'IBAN / رقم الحساب' : 'IBAN / Account Number'} isAr={isAr}>
            <TextInput
              value={iban}
              onChangeText={setIban}
              placeholder={isAr ? 'LY00 0000 0000 0000 ...' : 'LY00 0000 0000 0000 ...'}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.iban ? <Text style={styles.errorText}>{errors.iban}</Text> : null}

          <FormField icon="business-outline" label={isAr ? 'اسم البنك' : 'Bank Name'} isAr={isAr}>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder={isAr ? 'مصرف الوحدة' : 'Bank of Commerce & Development'}
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.bankName ? <Text style={styles.errorText}>{errors.bankName}</Text> : null}
        </FormSection>

        {/* ── Card 4: Billing Information ── */}
        <FormSection title={isAr ? 'معلومات الفوترة' : 'Billing Information'}>
          <FormField icon="location-outline" label={isAr ? 'العنوان' : 'Address Line 1'} isAr={isAr}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder={isAr ? 'شارع، حي، رقم المبنى...' : 'Street, district, building no...'}
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

          <FormField icon="map-outline" label={isAr ? 'المدينة' : 'City'} isAr={isAr}>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder={isAr ? 'طرابلس' : 'Tripoli'}
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

          <FormField icon="globe-outline" label={isAr ? 'الدولة' : 'Country'} isAr={isAr}>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder={isAr ? 'ليبيا' : 'Libya'}
              placeholderTextColor={COLORS.textMuted}
              selectionColor={COLORS.primary}
              style={fieldInputStyle}
            />
          </FormField>
          {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
        </FormSection>

        {/* ── Submit Button ── */}
        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>{isAr ? 'ادفع الآن' : 'Pay Now'}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.securityNote}>
          {isAr
            ? 'مدفوعاتك محمية بتشفير SSL 256-bit. معلوماتك البنكية لن تُخزَّن.'
            : 'Your payment is secured with 256-bit SSL encryption. Your banking details are never stored.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.base,
    overflow: 'hidden',
  },
  headerGlowPrimary: {
    position: 'absolute',
    top: -62,
    right: -22,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerGlowSecondary: {
    position: 'absolute',
    left: -46,
    bottom: -76,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    marginBottom: 4,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(77,217,192,0.4)',
  },
  sslText: {
    color: '#4dd9c0',
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
  },
  content: {
    padding: SPACING.base,
    gap: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  formSectionTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  amountDisplay: {
    flex: 1,
  },
  amountLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: FONTS.bold,
    color: COLORS.teal,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: SPACING.sm,
  },
  providerLogoSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLogoSmallText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
  },
  providerBadgeName: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
  },
  providerBadgePowered: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FONTS.xs,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semibold,
    marginBottom: 2,
  },
  inputRow: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.base,
    minHeight: 54,
  },
  iconLeft: {
    marginRight: SPACING.sm,
    opacity: 0.6,
  },
  iconRight: {
    marginLeft: SPACING.sm,
    opacity: 0.6,
  },
  fieldInput: {
    flex: 1,
    fontSize: FONTS.base,
    color: '#111111',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  cardTypeChip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
  },
  cardTypeText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
  },
  halfRow: {
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  errorText: {
    fontSize: FONTS.xs,
    color: COLORS.danger,
    paddingLeft: SPACING.xs,
    marginTop: -4,
  },
  submitButton: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: SPACING.md + 2,
    ...SHADOWS.button,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.bold,
  },
  securityNote: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
});

export default SecurePaymentScreen;
