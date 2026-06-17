/**
 * AuthHero — compact branded header for secondary auth screens (Register,
 * Forgot, Verify, Reset). A back button + title/subtitle over the brand art,
 * mirroring the LoginScreen hero so the whole flow feels cohesive.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text, IconButton, HeroBackground } from '../../components';
import { IMAGES } from '../../constants/images';

export function AuthHero({ title, subtitle, image = IMAGES.authBg, height = 168 }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <HeroBackground image={image} height={height} contentStyle={{ paddingTop: insets.top + 4 }}>
      <StatusBar style="light" />
      <View style={styles.top}>
        <IconButton
          icon="chevron-back"
          variant="ghost"
          color="#FFFFFF"
          onPress={() => navigation.canGoBack() && navigation.goBack()}
        />
      </View>
      <View style={styles.body}>
        <Text variant="h1" color="textInverse">{title}</Text>
        {subtitle ? <Text variant="body" style={styles.sub}>{subtitle}</Text> : null}
      </View>
    </HeroBackground>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 8, paddingTop: 4 },
  body: { paddingHorizontal: 20, paddingBottom: 20, marginTop: 6 },
  sub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
});
