/**
 * Toast — lightweight global toast system.
 *
 * Wrap the app once in <ToastProvider>, then call the imperative helper from
 * anywhere (even outside React, e.g. mutation handlers):
 *
 *   import { toast } from '.../components/feedback/Toast';
 *   toast.success('Saved!');  toast.error('Failed');  toast.info('Heads up');
 *
 * Inside components you can also use the `useToast()` hook.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { useTheme } from '../../hooks/useTheme';

const ToastContext = createContext({ show: () => {} });

// Imperative bridge so non-React code can trigger toasts.
let externalShow = null;
export const toast = {
  show: (opts) => externalShow?.(opts),
  success: (message, title) => externalShow?.({ type: 'success', message, title }),
  error: (message, title) => externalShow?.({ type: 'error', message, title }),
  info: (message, title) => externalShow?.({ type: 'info', message, title }),
};

const TONE = {
  success: { icon: 'checkmark-circle', key: 'success' },
  error: { icon: 'alert-circle', key: 'danger' },
  info: { icon: 'information-circle', key: 'info' },
};

export function ToastProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const hideTimer = useRef(null);

  const hide = useRef(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => setCurrent(null));
  }).current;

  const show = useRef(({ type = 'info', message, title, duration = 2800 }) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setCurrent({ type, message, title });
    opacity.setValue(0);
    translateY.setValue(-20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 8 }),
    ]).start();
    hideTimer.current = setTimeout(hide, duration);
  }).current;

  useEffect(() => {
    externalShow = show;
    return () => {
      externalShow = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {current ? <ToastView toast={current} opacity={opacity} translateY={translateY} onPress={hide} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast: t, opacity, translateY, onPress }) {
  const theme = useTheme();
  const tone = TONE[t.type] ?? TONE.info;
  const accent = theme.colors[tone.key]?.solid ?? theme.colors.primary;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safe}>
      <Animated.View
        style={[
          styles.toast,
          theme.shadows.lg,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radii.lg,
            borderLeftColor: accent,
            opacity,
            transform: [{ translateY }],
          },
        ]}
        onTouchEnd={onPress}
      >
        <Ionicons name={tone.icon} size={22} color={accent} style={styles.icon} />
        <View style={styles.body}>
          {t.title ? (
            <Text variant="bodyStrong" numberOfLines={1}>
              {t.title}
            </Text>
          ) : null}
          <Text variant="caption" color="textSecondary" numberOfLines={3}>
            {t.message}
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  safe: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    maxWidth: 480,
    width: '92%',
  },
  icon: { marginRight: 12 },
  body: { flex: 1 },
});
