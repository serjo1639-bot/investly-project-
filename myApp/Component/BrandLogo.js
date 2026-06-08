/**
 * BrandLogo.js — Investly wordmark component
 *
 * Props:
 *   compact      — smaller size for tight spaces (e.g. tab bar)
 *   showTagline  — show the Arabic/English tagline below the name
 *   light        — white text for use on dark/gradient backgrounds
 *   style        — additional container styles
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

const BrandLogo = ({ compact = false, showTagline = false, light = false, style }) => {
  const textColor = light ? COLORS.white : '#07194b';
  const accentColor = light ? '#67c8ff' : '#2f5be7';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <View style={styles.row}>
        <Text
          style={[
            styles.invest,
            compact && styles.investCompact,
            { color: textColor },
          ]}
        >
          Invest
        </Text>
        <Text
          style={[
            styles.ly,
            compact && styles.lyCompact,
            { color: accentColor },
          ]}
        >
          ly
        </Text>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
      </View>
      {showTagline ? (
        <Text style={[styles.tagline, { color: light ? 'rgba(255,255,255,0.75)' : COLORS.textMuted }]}>
          Smart giving. Confident growth.
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
  },
  wrapCompact: {},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  invest: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 32,
  },
  investCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  ly: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginLeft: 1,
  },
  lyCompact: {
    fontSize: 21,
    lineHeight: 25,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 5,
    marginLeft: 2,
  },
  tagline: {
    fontSize: FONTS.xs,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default BrandLogo;
