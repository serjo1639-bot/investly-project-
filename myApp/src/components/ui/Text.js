/**
 * Text — themed Text primitive. Pick a typographic `variant` and an optional
 * semantic `color` key; everything else falls through to RN <Text> props.
 */
import React, { memo } from 'react';
import { Text as RNText } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

function TextBase({
  variant = 'body',
  color = 'text',
  align,
  style,
  weight,
  children,
  ...rest
}) {
  const theme = useTheme();
  const base = theme.typography[variant] ?? theme.typography.body;
  const c = theme.colors[color];
  // Semantic colors (danger/success/warning/info) are { fg, bg, solid } objects.
  const resolvedColor = c && typeof c === 'object' ? c.fg : c ?? color;

  return (
    <RNText
      style={[
        base,
        { color: resolvedColor },
        align && { textAlign: align },
        weight && { fontWeight: weight },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export const Text = memo(TextBase);
