/**
 * theme.js — Design tokens for Investly
 *
 * All visual constants (colors, spacing, typography, shadows, radius) are
 * defined here so every screen shares a single source of truth.
 *
 * Responsive scaling strategy
 * ───────────────────────────
 * The design was created on an iPhone 14 canvas (390 × 844 pt).
 * Four scaling helpers map those design values onto any real device:
 *
 *   scale(n)          — horizontal proportional scaling
 *   verticalScale(n)  — vertical proportional scaling
 *   moderateScale(n)  — blended scale (less aggressive, used for spacing/radius)
 *   responsiveFont(n) — font size with accessibility-compensation + hard clamp
 *   responsiveHeight  — card/hero heights clamped to avoid stretching on tablets
 *
 * Why moderateScale instead of plain scale?
 *   Pure scale(16) on a 430 pt iPad would give 17.7 pt — too wide.
 *   moderateScale(16, 0.35) only moves 35 % of the way, giving ~16.6 pt.
 *   The factor 0.35 is a project-wide tuning constant.
 */

import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Reference canvas used by the designer (iPhone 14 / 390 × 844 pt)
const BASE_WIDTH  = 390;
const BASE_HEIGHT = 844;

// System font-scale (1.0 = default, >1 = user increased text size in accessibility)
const fontScale = PixelRatio.getFontScale();

// ── Internal helpers ──────────────────────────────────────────────────────────

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// How much wider/taller the real screen is relative to the design canvas
const scaleRatio    = width  / BASE_WIDTH;
const verticalRatio = height / BASE_HEIGHT;

/**
 * When the user bumps up system font size we intentionally shrink the
 * responsive multiplier so that fonts don't grow *doubly* (once from
 * the system and once from our scaling math).
 * The 0.45 factor is a partial compensation — we still allow some growth.
 */
const accessibilityCompensation = fontScale > 1 ? 1 + (fontScale - 1) * 0.45 : 1;

// ── Exported scaling functions ────────────────────────────────────────────────

/** Scale a horizontal dimension proportionally to screen width. */
export const scale = (size) => Math.round(size * scaleRatio);

/** Scale a vertical dimension proportionally to screen height. */
export const verticalScale = (size) => Math.round(size * verticalRatio);

/**
 * Blended scale: moves only `factor` fraction of the way from the original
 * size to the fully-scaled size.
 * Default factor 0.5 → halfway between original and full scale.
 */
export const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

/**
 * Font size that:
 *   1. Scales modestly with screen width (factor 0.35)
 *   2. Compensates for system accessibility font-scale
 *   3. Is clamped to [min, max] so it never looks broken on tiny/huge screens
 */
export const responsiveFont = (size, options = {}) => {
  const { min = size * 0.88, max = size * 1.18 } = options;
  const adjusted = moderateScale(size, 0.35) / accessibilityCompensation;
  return Math.round(clamp(adjusted, min, max));
};

/**
 * Card/hero height that scales with screen height but stays within a safe
 * range so cards don't become too tall on tablets or too small on compact phones.
 */
export const responsiveHeight = (size, options = {}) => {
  const { min = size * 0.9, max = size * 1.15 } = options;
  return Math.round(clamp(verticalScale(size), min, max));
};

/** Convenience bag of device metrics for conditional layouts. */
export const SCREEN = {
  width,
  height,
  fontScale,
  isCompactWidth: width < 360,   // very narrow phones (e.g. iPhone SE 1st gen)
  isShortHeight:  height < 720,  // short phones — avoid tall hero sections
};

// ─── COLORS ───────────────────────────────────────────────────────────────────
export const darkColors = {
  primary:      '#D2AF26',
  primaryDark:  '#A68A1E',
  primaryLight: '#2A2412',
  teal:         '#00B4A0',
  tealLight:    '#C8F5F0',
  tealDark:     '#007A6E',
  amber:        '#F59E0B',
  amberLight:   '#FEF3C7',
  background:     '#0F1115',
  backgroundDark: '#0A0A0A',
  surface:        '#1A1D24',
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A6B2',
  textMuted:     '#A0A6B2',
  textLight:     '#4D4D4D',
  border:      '#2C313A',
  borderLight: '#2C313A',
  danger:       '#EF4444',
  dangerLight:  '#4A1515',
  success:      '#22C55E',
  successLight: '#0E3A2A',
  warning:      '#F59E0B',
  warningLight: '#4A3408',
  info:         '#0EA5E9',
  infoLight:    '#0A374F',
  white:   '#FFFFFF',
  black:   '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: '#2A2A2A',
};

export const lightColors = {
  primary:      '#4361EE',
  primaryDark:  '#1A237E',
  primaryLight: '#DDE4FF',
  teal:      '#00B4A0',
  tealLight: '#C8F5F0',
  tealDark:  '#007A6E',
  amber:      '#F59E0B',
  amberLight: '#FEF3C7',
  background:     '#EFF1FF',
  backgroundDark: '#E2E8FF',
  surface:        '#FFFFFF',
  textPrimary:   '#0D1B4B',
  textSecondary: '#374375',
  textMuted:     '#8892AD',
  textLight:     '#BDC5DC',
  border:      '#C8D3F5',
  borderLight: '#E4EBFF',
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',
  success:      '#10B981',
  successLight: '#D1FAE5',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  info:         '#0EA5E9',
  infoLight:    '#E0F2FE',
  white:   '#FFFFFF',
  black:   '#000000',
  overlay: 'rgba(13, 27, 75, 0.52)',
  shimmer: '#E8EDFF',
};

export const COLORS = lightColors; // Temporary fallback

// ─── FONTS ────────────────────────────────────────────────────────────────────
// Sizes scale responsively; weight tokens are plain string values for fontWeight.
export const FONTS = {
  xs:   responsiveFont(11, { min: 10, max: 12 }),
  sm:   responsiveFont(13, { min: 11, max: 14 }),
  base: responsiveFont(15, { min: 13, max: 16 }),
  md:   responsiveFont(17, { min: 15, max: 18 }),
  lg:   responsiveFont(20, { min: 17, max: 21 }),
  xl:   responsiveFont(24, { min: 20, max: 25 }),
  xxl:  responsiveFont(28, { min: 24, max: 29 }),
  xxxl: responsiveFont(32, { min: 27, max: 33 }),

  bold:     '700',
  semibold: '600',
  medium:   '500',
  regular:  '400',
};

// ─── SPACING ──────────────────────────────────────────────────────────────────
// All spacing uses moderateScale so it grows modestly on large screens.
export const SPACING = {
  xs:   moderateScale(4,  0.3),
  sm:   moderateScale(8,  0.35),
  md:   moderateScale(12, 0.35),
  base: moderateScale(16, 0.35),
  lg:   moderateScale(20, 0.35),
  xl:   moderateScale(24, 0.35),
  xxl:  moderateScale(32, 0.35),
  xxxl: moderateScale(48, 0.3),
};

// ─── RADIUS ───────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:   moderateScale(6,  0.25),
  md:   moderateScale(10, 0.25),
  base: moderateScale(14, 0.25),
  lg:   moderateScale(20, 0.25),
  xl:   moderateScale(28, 0.2),
  full: 9999,  // produces a perfect pill/circle regardless of element size
};

// ─── SHADOWS ──────────────────────────────────────────────────────────────────
// iOS uses shadow* props; Android uses elevation.
// Colors are tinted with the brand navy so shadows feel cohesive.
export const SHADOWS_DARK = {
  sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2 },
  md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 7 },
  xl: { shadowColor: '#000000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.6, shadowRadius: 28, elevation: 10 },
  glow: { shadowColor: '#D2AF26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 9 },
  button: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
};

export const SHADOWS_LIGHT = {
  sm: { shadowColor: '#4361EE', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  md: { shadowColor: '#1A237E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 },
  lg: { shadowColor: '#1A237E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 7 },
  xl: { shadowColor: '#1A237E', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.20, shadowRadius: 28, elevation: 10 },
  glow: { shadowColor: '#4361EE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 9 },
  button: { shadowColor: '#4361EE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
};

export const SHADOWS = SHADOWS_LIGHT; // Temporary fallback
