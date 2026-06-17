/**
 * HeroBackground — a decorative banner surface.
 *
 * Layers (bottom → top):
 *   1. optional photographic art (expo-image, cover)
 *   2. a brand gradient scrim for readability + identity
 *   3. children (titles, avatars, actions…)
 *
 * Used by auth screens, the profile header, the drawer header and the About
 * pages so every "hero" area shares one cohesive, on-brand look. Purely
 * presentational — it never affects layout flow beyond its own height.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

function HeroBackgroundBase({
  image,
  height,
  colors,
  radius = 0,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
  children,
  contentStyle,
  style,
}) {
  const theme = useTheme();
  // With art behind it we use the photographic scrim; without art a solid
  // brand gradient keeps the same silhouette.
  const scrim = colors ?? (image ? theme.gradients.heroScrim : theme.gradients.brandDeep);

  return (
    <View
      style={[
        styles.wrap,
        { borderRadius: radius, height },
        style,
      ]}
    >
      {image ? (
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      ) : null}
      <LinearGradient colors={scrim} start={start} end={end} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', justifyContent: 'flex-end' },
  content: { flex: 1 },
});

export const HeroBackground = memo(HeroBackgroundBase);
