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
export const COLORS = {
  // ── Brand blues ───────────────────────────────────────────────────────────
  primary:      '#4361EE',   // main CTA, active icons, highlighted text
  primaryDark:  '#1A237E',   // header backgrounds, gradient start
  primaryLight: '#DDE4FF',   // light backgrounds, hover states

  // ── Teal accent — used for positive financial figures & success states ────
  teal:      '#00B4A0',
  tealLight: '#C8F5F0',
  tealDark:  '#007A6E',

  // ── Amber — used for warnings and monetary highlights ─────────────────────
  amber:      '#F59E0B',
  amberLight: '#FEF3C7',

  // ── Surfaces ──────────────────────────────────────────────────────────────
  background:     '#EFF1FF',  // lavender-tinted app background (replaces plain white)
  backgroundDark: '#E2E8FF',  // slightly darker — used to separate sections
  surface:        '#FFFFFF',  // card/modal background — pops against background

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#0D1B4B',  // headings, primary labels
  textSecondary: '#374375',  // secondary labels, descriptions
  textMuted:     '#8892AD',  // hints, placeholders, inactive tab labels
  textLight:     '#BDC5DC',  // very subtle details

  // ── Borders ───────────────────────────────────────────────────────────────
  border:      '#C8D3F5',
  borderLight: '#E4EBFF',

  // ── Semantic ──────────────────────────────────────────────────────────────
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',
  success:      '#10B981',
  successLight: '#D1FAE5',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  info:         '#0EA5E9',
  infoLight:    '#E0F2FE',

  // ── Base ──────────────────────────────────────────────────────────────────
  white:   '#FFFFFF',
  black:   '#000000',
  overlay: 'rgba(13, 27, 75, 0.52)',  // dark navy overlay for modals/drawer
  shimmer: '#E8EDFF',                 // skeleton loading shimmer color
};

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

// ─── GRADIENTS ────────────────────────────────────────────────────────────────
// Pre-defined gradient colour arrays used across the app.
// Import and pass directly to LinearGradient's `colors` prop.
export const GRADIENTS = {
  // Primary CTA button gradient (left → right)
  primary:   ['#4361EE', '#2D4EF5'],
  // Hero / header backgrounds
  hero:      ['#0D1B4B', '#1A237E', '#3a56e8'],
  heroTeal:  ['#006064', '#00838F', '#004D40'],
  heroGreen: ['#0D5A2C', '#1B6B3A', '#0A3B1C'],
  // Dark overlay used on project card images (bottom-heavy gradient)
  cardDark:  ['rgba(0,0,0,0)', 'rgba(8,12,46,0.68)', 'rgba(5,8,35,0.97)'],
  // Softer overlay for hero images (top-heavy + bottom)
  heroOverlay: ['rgba(0,0,0,0.28)', 'transparent', 'rgba(7,11,44,0.85)'],
  // Progress / funding bars
  accent:    ['#00B4A0', '#4361EE'],
  // Positive / success states
  success:   ['#059669', '#10B981'],
  teal:      ['#00B4A0', '#059669'],
  // Danger
  danger:    ['#EF4444', '#DC2626'],
  // Warm amber
  amber:     ['#F59E0B', '#D97706'],
};

// ─── SHADOWS ──────────────────────────────────────────────────────────────────
// iOS uses shadow* props; Android uses elevation.
// Colors are tinted with the brand navy so shadows feel cohesive.
export const SHADOWS = {
  sm: {
    shadowColor:   '#4361EE',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  6,
    elevation:     2,
  },
  md: {
    shadowColor:   '#1A237E',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#1A237E',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  20,
    elevation:     7,
  },
  xl: {
    shadowColor:   '#1A237E',
    shadowOffset:  { width: 0, height: 14 },
    shadowOpacity: 0.20,
    shadowRadius:  28,
    elevation:     10,
  },
  // Intense blue glow — used on CTA buttons
  glow: {
    shadowColor:   '#4361EE',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius:  14,
    elevation:     9,
  },
  // Standard button lift
  button: {
    shadowColor:   '#4361EE',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius:  10,
    elevation:     5,
  },
};
