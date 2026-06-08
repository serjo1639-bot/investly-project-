/**
 * useTopPopup.js — Global toast / confirm popup system
 *
 * Architecture
 * ────────────
 * TopPopupProvider renders a single overlay at the top of the screen.
 * It uses two Animated values to slide the popup in from above and fade it in:
 *
 *   translateY  — starts at -180 (off-screen), springs to 0 on show
 *   opacity     — starts at 0, times to 1 on show
 *
 * useTopPopup() returns the `api` object with these methods:
 *
 *   success(message, options?)  — teal gradient, checkmark icon
 *   error(message, options?)    — red gradient, alert icon
 *   warning(message, options?)  — amber gradient, warning icon
 *   info(message, options?)     — indigo gradient, sparkles icon
 *   confirm({ title, message, confirmText, cancelText, onConfirm, onCancel })
 *     — shows a popup with two action buttons (no auto-dismiss)
 *
 * Auto-dismiss
 * ────────────
 * Popups without `actions` dismiss automatically after `duration` ms.
 * Confirm popups (duration: 0) stay until the user taps a button.
 *
 * Interruption handling
 * ─────────────────────
 * Calling show() while a popup is visible replaces it immediately —
 * the old timer is cleared, translateY/opacity reset, and the new popup
 * animates in fresh.
 *
 * تأثيرات الرسوميات المتحركة:
 * ───────────────────────────
 * 1. Slide-in من الأعلى (translateY):
 *    - المنطق: تراكم الإشعارات يحدث "تأثير نصف علوي"
 *    - الحل: كل popup جديد ينزلق من -180 إلى 0
 *    
 * 2. Fade-in (opacity):
 *    - تجعل الظهور أكثر سلاسة وأقل حدة
 *    
 * 3. Parallel animations:
 *    - Animated.parallel يشغل كلا الحركتين معاً لـ تأثير متسق
 *    
 * 4. Auto-dismiss timer:
 *    - بعد 'duration' ms يتم استدعاء hide()
 *    - إذا ظهرت popup جديدة قبل انتهاء الوقت يتم إلغاء الـ timer القديم
 */

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

const TopPopupContext = createContext(null);

// ── Visual metadata per popup type ───────────────────────────────────────────
// colors: [gradientStart, gradientEnd] (used in LinearGradient)
// tint:   light version for the icon circle background
const TYPE_META = {
  success: {
    icon:   'checkmark-circle',
    colors: ['#007A6E', '#00B4A0'],  // teal gradient
    tint:   '#C8F5F0',
  },
  error: {
    icon:   'alert-circle',
    colors: ['#8f2037', '#d94a67'],  // red gradient
    tint:   '#ffe3ea',
  },
  warning: {
    icon:   'warning',
    colors: ['#9a5d0a', '#dd8f1b'],  // amber gradient
    tint:   '#fff0d2',
  },
  info: {
    icon:   'sparkles',
    colors: ['#1A237E', '#4361EE'],  // indigo/brand gradient
    tint:   '#DDE4FF',
  },
};

// ─── TopPopupProvider ─────────────────────────────────────────────────────────
export const TopPopupProvider = ({ children }) => {
  const insets     = useSafeAreaInsets();

  // Animation values — created once with useRef so they survive re-renders
  const translateY = useRef(new Animated.Value(-180)).current;  // off-screen upward
  const opacity    = useRef(new Animated.Value(0)).current;

  // Holds the reference for the auto-dismiss timer so we can cancel it
  const timerRef   = useRef(null);

  // The currently displayed popup config (null = nothing visible)
  const [popup, setPopup] = useState(null);

  const clearPopupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── hide ──────────────────────────────────────────────────────────────────
  /**
   * Animates the popup out (slide up + fade), then clears popup state.
   * @param {Function} [callback] - Optional fn to call after animation ends
   */
  const hide = useCallback((callback) => {
    clearPopupTimer();

    Animated.parallel([
      Animated.timing(translateY, {
        toValue:        -180,
        duration:       220,
        easing:         Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:        0,
        duration:       190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPopup(null);
      callback?.();
    });
  }, [clearPopupTimer, opacity, translateY]);

  // ── show ──────────────────────────────────────────────────────────────────
  /**
   * Show a new popup, replacing any currently visible one.
   *
   * Steps:
   *   1. Cancel the previous auto-dismiss timer (if any)
   *   2. Merge the config with defaults
   *   3. Reset animation values to "off-screen" so we can re-animate
   *   4. Run the spring (slide) + timing (fade) entrance animations in parallel
   *   5. If no action buttons, start an auto-dismiss timer
   */
  const show = useCallback((config) => {
    clearPopupTimer();

    const nextPopup = {
      type:     'info',
      title:    '',
      message:  '',
      duration: 2800,
      actions:  [],
      closable: true,
      ...config,
    };
    setPopup(nextPopup);

    // Reset to starting position so the animation replays cleanly
    translateY.setValue(-180);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue:         0,
        friction:        8,  // damping — lower = more oscillation
        tension:         75, // stiffness — higher = faster
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:         1,
        duration:        180,
        easing:          Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss only when there are no action buttons and duration > 0
    if (!nextPopup.actions?.length && nextPopup.duration !== 0) {
      timerRef.current = setTimeout(() => hide(), nextPopup.duration ?? 2800);
    }
  }, [clearPopupTimer, hide, opacity, translateY]);

  // ── Public API ────────────────────────────────────────────────────────────
  /**
   * useMemo ensures the api object reference is stable across renders so
   * child components that receive it as a prop don't re-render unnecessarily.
   */
  const api = useMemo(() => ({
    show,
    hide,
    success: (message, options = {}) =>
      show({ ...options, type: 'success', message }),
    error: (message, options = {}) =>
      show({ ...options, type: 'error', message, duration: options.duration ?? 3600 }),
    warning: (message, options = {}) =>
      show({ ...options, type: 'warning', message }),
    info: (message, options = {}) =>
      show({ ...options, type: 'info', message }),
    /**
     * Confirm popup — two buttons, no auto-dismiss (duration: 0).
     * Hides itself before invoking onConfirm / onCancel so the callback
     * can safely navigate or show another popup.
     */
    confirm: ({ title, message, confirmText, cancelText, onConfirm, onCancel, type = 'warning' }) =>
      show({
        title,
        message,
        type,
        duration: 0,
        closable: true,
        actions: [
          {
            label:   cancelText || 'Cancel',
            variant: 'ghost',
            onPress: () => { hide(() => onCancel?.()); },
          },
          {
            label:   confirmText || 'OK',
            variant: 'solid',
            onPress: () => { hide(() => onConfirm?.()); },
          },
        ],
      }),
  }), [hide, show]);

  const meta = popup ? TYPE_META[popup.type] || TYPE_META.info : TYPE_META.info;

  return (
    <TopPopupContext.Provider value={api}>
      {children}

      {popup ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + SPACING.sm,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Tapping the backdrop dismisses non-confirm popups */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => popup.actions?.length ? null : hide()}
          />

          <LinearGradient
            colors={meta.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.popupCard}
          >
            {/* Decorative glow circle — purely visual */}
            <View style={styles.glow} />

            <View style={styles.popupTopRow}>
              <View style={[styles.iconWrap, { backgroundColor: meta.tint }]}>
                <Ionicons name={meta.icon} size={21} color={meta.colors[0]} />
              </View>

              <View style={styles.textWrap}>
                {popup.title ? <Text style={styles.popupTitle}>{popup.title}</Text> : null}
                <Text style={styles.popupMessage}>{popup.message}</Text>
              </View>

              {popup.closable ? (
                <TouchableOpacity style={styles.closeBtn} onPress={() => hide()}>
                  <Ionicons name="close" size={18} color={COLORS.white} />
                </TouchableOpacity>
              ) : null}
            </View>

            {popup.actions?.length ? (
              <View style={styles.actionsRow}>
                {popup.actions.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={[
                      styles.actionBtn,
                      action.variant === 'ghost' ? styles.actionBtnGhost : styles.actionBtnSolid,
                    ]}
                    onPress={action.onPress}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        action.variant === 'ghost' ? styles.actionTextGhost : styles.actionTextSolid,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </LinearGradient>
        </Animated.View>
      ) : null}
    </TopPopupContext.Provider>
  );
};

// ─── useTopPopup ──────────────────────────────────────────────────────────────
export const useTopPopup = () => {
  const value = useContext(TopPopupContext);
  if (!value) {
    throw new Error('useTopPopup must be used within TopPopupProvider');
  }
  return value;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Full-width overlay anchored to the top of the screen
  overlay: {
    position:        'absolute',
    left:            0,
    right:           0,
    top:             0,
    zIndex:          999,
    paddingHorizontal: SPACING.base,
  },
  popupCard: {
    borderRadius: RADIUS.xl,
    padding:      SPACING.base,
    overflow:     'hidden',
    ...SHADOWS.xl,
  },
  // Subtle decorative glow in top-right corner of the card
  glow: {
    position:        'absolute',
    top:             -32,
    right:           -18,
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  popupTopRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  iconWrap: {
    width:           40,
    height:          40,
    borderRadius:    20,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     SPACING.sm,
  },
  textWrap: {
    flex:       1,
    paddingTop: 1,
  },
  popupTitle: {
    color:        COLORS.white,
    fontSize:     FONTS.base,
    fontWeight:   FONTS.bold,
    marginBottom: 2,
  },
  popupMessage: {
    color:      'rgba(255,255,255,0.96)',
    fontSize:   FONTS.sm,
    lineHeight: 20,
  },
  closeBtn: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      SPACING.sm,
  },
  actionsRow: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    gap:            SPACING.sm,
    marginTop:      SPACING.base,
  },
  actionBtn: {
    minWidth:       88,
    borderRadius:   RADIUS.full,
    paddingVertical: 10,
    paddingHorizontal: SPACING.base,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actionBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.24)',
  },
  actionBtnSolid: {
    backgroundColor: COLORS.white,
  },
  actionText: {
    fontSize:   FONTS.sm,
    fontWeight: FONTS.bold,
  },
  actionTextGhost: {
    color: COLORS.white,
  },
  actionTextSolid: {
    color: COLORS.primaryDark,
  },
});
