/**
 * AppHeader — consistent screen header with optional back button, title,
 * subtitle and a right-hand action slot.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '../components/ui/Text';
import { IconButton } from '../components/ui/IconButton';
import { useTheme } from '../hooks/useTheme';

export function AppHeader({ title, subtitle, showBack = false, right, onBack, style }) {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={[styles.row, { paddingHorizontal: theme.spacing.lg }, style]}>
      <View style={styles.left}>
        {showBack ? (
          <IconButton icon="chevron-back" onPress={handleBack} style={styles.back} />
        ) : null}
        <View style={styles.titles}>
          {title ? (
            <Text variant="h2" numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  back: { marginRight: 8 },
  titles: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
});
