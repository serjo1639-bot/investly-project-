/**
 * Logo — the Investly brand mark, drawn as scalable SVG (no binary asset).
 * A rounded indigo tile with an upward growth chart + the wordmark beside it.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Polyline, Circle } from 'react-native-svg';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

function LogoBase({ size = 40, showWordmark = true, style }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="inv-g" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#7C8CF2" />
            <Stop offset="1" stopColor="#5B4CE7" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="48" height="48" rx="13" fill="url(#inv-g)" />
        <Polyline
          points="11,31 21,22 28,27 38,15"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="38" cy="15" r="3.2" fill="#FFFFFF" />
      </Svg>
      {showWordmark ? (
        <Text variant="h3" style={[styles.word, { color: theme.colors.text }]}>
          Investly
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { marginLeft: 10, fontWeight: '800', letterSpacing: -0.5 },
});

export const Logo = memo(LogoBase);
