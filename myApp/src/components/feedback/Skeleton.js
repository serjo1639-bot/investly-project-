/**
 * Skeleton — shimmering placeholder block. Use plain <Skeleton/> for a box,
 * or the exported presets (SkeletonText, SkeletonCard) for common shapes.
 * Animation uses a looping opacity pulse (Animated, native driver).
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function SkeletonBase({ width = '100%', height = 16, radius, style }) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: theme.colors.skeleton,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export const Skeleton = memo(SkeletonBase);

export const SkeletonText = memo(function SkeletonText({ lines = 3, lastWidth = '60%' }) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? lastWidth : '100%'}
          style={{ marginBottom: 8 }}
        />
      ))}
    </View>
  );
});

export const SkeletonCard = memo(function SkeletonCard() {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderColor: theme.colors.border },
      ]}
    >
      <Skeleton height={140} radius={theme.radii.md} style={{ marginBottom: 14 }} />
      <Skeleton height={16} width="80%" style={{ marginBottom: 10 }} />
      <SkeletonText lines={2} />
      <Skeleton height={8} radius={8} style={{ marginTop: 14 }} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
});
