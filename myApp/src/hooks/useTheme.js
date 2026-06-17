/**
 * useTheme — access the active design-system theme anywhere in the tree.
 * Returns { mode, isDark, colors, spacing, radii, typography, shadows }.
 */
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeProvider';

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * useThemedStyles — memoized StyleSheet factory.
 * Usage:
 *   const styles = useThemedStyles(makeStyles);
 *   const makeStyles = (theme) => StyleSheet.create({ ... });
 */
import { useMemo } from 'react';

export function useThemedStyles(factory) {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
