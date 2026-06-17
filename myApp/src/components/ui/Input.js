/**
 * Input — themed text field with label, leading icon, error state, and an
 * optional password visibility toggle. Designed to pair with react-hook-form
 * Controller (pass value/onChangeText/onBlur + error message).
 */
import React, { memo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';

function InputBase({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  icon, // Ionicons name
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  editable = true,
  style,
  ...rest
}) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  const borderColor = error ? c.danger.solid : focused ? c.primary : c.inputBorder;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: c.inputBg,
            borderColor,
            borderRadius: theme.radii.md,
            minHeight: multiline ? 96 : 52,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={error ? c.danger.solid : focused ? c.primary : c.textMuted}
            style={styles.icon}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholder={placeholder}
          placeholderTextColor={c.placeholder}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          style={[styles.input, { color: c.text, paddingTop: multiline ? 14 : 0 }]}
          {...rest}
        />

        {secureTextEntry ? (
          <Ionicons
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={c.textMuted}
            onPress={() => setHidden((h) => !h)}
            style={styles.toggle}
            suppressHighlighting
          />
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color="danger" style={styles.error}>
          {typeof error === 'string' ? error : error?.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { marginBottom: 6, marginLeft: 2 },
  field: { flexDirection: 'row', borderWidth: 1.5, paddingHorizontal: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  toggle: { marginLeft: 8, padding: 4 },
  error: { marginTop: 5, marginLeft: 2 },
});

export const Input = memo(InputBase);
