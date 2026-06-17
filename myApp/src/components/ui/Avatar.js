/**
 * Avatar — circular user image with graceful initials fallback.
 */
import React, { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './Text';
import { useTheme } from '../../hooks/useTheme';
import { initials } from '../../utils/format';

function AvatarBase({ uri, name = '', size = 44, style }) {
  const theme = useTheme();
  const [errored, setErrored] = useState(false);
  const showImage = uri && !errored;

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.primarySoft,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          transition={200}
          onError={() => setErrored(true)}
        />
      ) : (
        <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: size * 0.38 }}>
          {initials(name) || '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

export const Avatar = memo(AvatarBase);
