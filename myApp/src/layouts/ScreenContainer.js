/**
 * ScreenContainer — the base wrapper every screen uses.
 *
 * Handles: safe-area insets, themed background, status-bar style, optional
 * scrolling, optional keyboard avoidance, and consistent horizontal padding.
 */
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../hooks/useTheme';

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  keyboardAvoiding = false,
  edges = ['top', 'bottom'],
  refreshControl,
  contentContainerStyle,
  style,
}) {
  const theme = useTheme();
  const padding = padded ? { paddingHorizontal: theme.spacing.lg } : null;

  const inner = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, padding, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.colors.background }, style]}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32, flexGrow: 1 },
});
