/**
 * validation.js — Reusable validation rules for react-hook-form.
 *
 * Each helper returns an RHF `rules` object so screens stay declarative:
 *   <Controller rules={rules.email(t)} ... />
 *
 * The optional `t` translator lets messages localize; falls back to English.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Libyan numbers + general international; lenient on purpose.
const PHONE_RE = /^\+?[0-9]{7,15}$/;

const msg = (t, key, fallback) => (t ? t(key, { defaultValue: fallback }) : fallback);

export const rules = {
  required: (t, label = 'This field') => ({
    required: msg(t, 'validation.required', `${label} is required`),
  }),

  email: (t) => ({
    required: msg(t, 'validation.emailRequired', 'Email is required'),
    pattern: {
      value: EMAIL_RE,
      message: msg(t, 'validation.emailInvalid', 'Enter a valid email address'),
    },
  }),

  phone: (t) => ({
    required: msg(t, 'validation.phoneRequired', 'Phone number is required'),
    pattern: {
      value: PHONE_RE,
      message: msg(t, 'validation.phoneInvalid', 'Enter a valid phone number'),
    },
  }),

  password: (t) => ({
    required: msg(t, 'validation.passwordRequired', 'Password is required'),
    minLength: {
      value: 8,
      message: msg(t, 'validation.passwordMin', 'Password must be at least 8 characters'),
    },
  }),

  name: (t) => ({
    required: msg(t, 'validation.nameRequired', 'Name is required'),
    minLength: {
      value: 2,
      message: msg(t, 'validation.nameMin', 'Name is too short'),
    },
  }),

  confirmPassword: (t, getValues, field = 'password') => ({
    required: msg(t, 'validation.confirmRequired', 'Please confirm your password'),
    validate: (v) =>
      v === getValues(field) || msg(t, 'validation.passwordMatch', 'Passwords do not match'),
  }),

  positiveAmount: (t, { min = 1, max } = {}) => ({
    required: msg(t, 'validation.amountRequired', 'Amount is required'),
    validate: (v) => {
      const n = Number(v);
      if (Number.isNaN(n)) return msg(t, 'validation.amountInvalid', 'Enter a valid amount');
      if (n < min) return msg(t, 'validation.amountMin', `Minimum is ${min}`);
      if (max != null && n > max) return msg(t, 'validation.amountMax', `Maximum is ${max}`);
      return true;
    },
  }),

  age: (t) => ({
    required: msg(t, 'validation.ageRequired', 'Age is required'),
    validate: (v) => {
      const n = Number(v);
      if (Number.isNaN(n) || n < 18) return msg(t, 'validation.ageMin', 'You must be at least 18');
      if (n > 120) return msg(t, 'validation.ageMax', 'Enter a valid age');
      return true;
    },
  }),

  otp: (t, length = 6) => ({
    required: msg(t, 'validation.otpRequired', 'Enter the verification code'),
    minLength: { value: length, message: msg(t, 'validation.otpLen', `Code must be ${length} digits`) },
  }),
};
