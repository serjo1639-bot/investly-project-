/**
 * tokens.js — Design tokens for the Investly design system.
 *
 * Everything visual derives from these primitives: a premium indigo brand,
 * a neutral gray ramp, semantic colors, plus scales for spacing, radius,
 * typography and elevation. Screens never hardcode hex values — they read
 * `theme.colors.*`, `theme.spacing.*`, etc. via the `useTheme()` hook.
 */

// ── Brand & semantic palette (shared across modes) ──────────────────────────
const palette = {
  brand: {
    50: '#EEF0FE',
    100: '#DCE0FD',
    200: '#BAC1FB',
    300: '#959FF8',
    400: '#7C8CF2',
    500: '#5B4CE7', // primary
    600: '#4A3BD4',
    700: '#3B2EAC',
    800: '#2D2384',
    900: '#1F1860',
  },
  success: { fg: '#0F9D58', bg: '#E6F7EE', solid: '#16A34A' },
  warning: { fg: '#B45309', bg: '#FEF3E2', solid: '#F59E0B' },
  danger: { fg: '#DC2626', bg: '#FEECEC', solid: '#EF4444' },
  info: { fg: '#2563EB', bg: '#E8F0FE', solid: '#3B82F6' },
};

// ── Spacing scale (4pt grid) ────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
};

// ── Border radius scale ─────────────────────────────────────────────────────
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
};

// ── Typography scale ────────────────────────────────────────────────────────
export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.3 },
};

// ── Light mode ──────────────────────────────────────────────────────────────
const lightColors = {
  brand: palette.brand,
  primary: palette.brand[500],
  primaryDark: palette.brand[600],
  onPrimary: '#FFFFFF',
  primarySoft: palette.brand[50],

  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F8',
  surfaceElevated: '#FFFFFF',

  text: '#13151B',
  textSecondary: '#5A6072',
  textMuted: '#8A90A2',
  textInverse: '#FFFFFF',

  border: '#E6E8F0',
  borderStrong: '#D2D6E2',
  divider: '#EDEFF5',

  inputBg: '#FFFFFF',
  inputBorder: '#DFE2EC',
  placeholder: '#9AA0B2',

  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  overlay: 'rgba(17, 21, 27, 0.45)',
  skeleton: '#E7E9F1',
  skeletonHighlight: '#F3F4FA',
  tabBar: '#FFFFFF',
  icon: '#5A6072',
};

// ── Dark mode ───────────────────────────────────────────────────────────────
const darkColors = {
  brand: palette.brand,
  primary: palette.brand[400],
  primaryDark: palette.brand[500],
  onPrimary: '#0B0D12',
  primarySoft: 'rgba(124, 140, 242, 0.14)',

  background: '#0B0D12',
  surface: '#151823',
  surfaceAlt: '#1C2030',
  surfaceElevated: '#1E2230',

  text: '#F2F3F7',
  textSecondary: '#AEB4C6',
  textMuted: '#727892',
  textInverse: '#0B0D12',

  border: '#262B3A',
  borderStrong: '#333A4D',
  divider: '#202532',

  inputBg: '#1A1E2B',
  inputBorder: '#2C3242',
  placeholder: '#6B7288',

  success: { fg: '#4ADE80', bg: 'rgba(22,163,74,0.16)', solid: '#22C55E' },
  warning: { fg: '#FBBF24', bg: 'rgba(245,158,11,0.16)', solid: '#F59E0B' },
  danger: { fg: '#F87171', bg: 'rgba(239,68,68,0.16)', solid: '#EF4444' },
  info: { fg: '#60A5FA', bg: 'rgba(59,130,246,0.16)', solid: '#3B82F6' },

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#1E2330',
  skeletonHighlight: '#272D3D',
  tabBar: '#12141D',
  icon: '#AEB4C6',
};

// ── Shadow / elevation presets (platform-aware via shadowColor) ─────────────
const makeShadows = (isDark) => {
  const c = isDark ? '#000000' : '#1A2A6C';
  return {
    none: {},
    sm: {
      shadowColor: c,
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    md: {
      shadowColor: c,
      shadowOpacity: isDark ? 0.45 : 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    lg: {
      shadowColor: c,
      shadowOpacity: isDark ? 0.5 : 0.14,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    },
  };
};

// ── Gradient presets (consumed by expo-linear-gradient) ─────────────────────
// All brand-derived so decorative surfaces stay on-identity in both modes.
const gradients = {
  brand: ['#7C8CF2', '#5B4CE7'],
  brandDeep: ['#5B4CE7', '#3B2EAC'],
  night: ['#3B2EAC', '#1F1860'],
  // Readability scrim laid over photographic hero art (top → bottom).
  heroScrim: ['rgba(31,24,96,0.30)', 'rgba(31,24,96,0.78)', 'rgba(20,15,70,0.96)'],
};

export const buildTheme = (mode) => {
  const isDark = mode === 'dark';
  return {
    mode,
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radii,
    typography,
    shadows: makeShadows(isDark),
    gradients,
  };
};

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
