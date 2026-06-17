/**
 * ProgressBar — animated funding/progress indicator (0..100).
 * The fill animates smoothly whenever `percent` changes.
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function ProgressBarBase({ percent = 0, height = 8, color, trackColor, style }) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, percent));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height, backgroundColor: trackColor || theme.colors.surfaceAlt },
        style,
      ]}
    >
      <Animated.View
        style={{
          width,
          height,
          borderRadius: height,
          backgroundColor: color || theme.colors.primary,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});

export const ProgressBar = memo(ProgressBarBase);
