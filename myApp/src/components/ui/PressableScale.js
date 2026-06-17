/**
 * PressableScale — a Pressable that springs down slightly on press for
 * tactile feedback. Built on the RN Animated API (no extra native deps).
 */
import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export function PressableScale({ children, onPress, disabled, scaleTo = 0.97, style, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animate(scaleTo)}
      onPressOut={() => animate(1)}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
