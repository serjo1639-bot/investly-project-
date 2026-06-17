/**
 * AboutScreen — a rich, informative "About" page covering the organization,
 * the platform/system, its services and goals. The drawer passes a `focus`
 * param ('org' | 'system') to tailor the hero; the page itself documents both.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { Text, Card, IconButton, HeroBackground } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { IMAGES } from '../../constants/images';

const SERVICES = [
  { icon: 'search-outline', title: 'Discover projects', body: 'Browse vetted local opportunities with clear goals, progress and risk.' },
  { icon: 'wallet-outline', title: 'Invest securely', body: 'Fund projects straight from your in-app wallet in just a few taps.' },
  { icon: 'briefcase-outline', title: 'Raise funding', body: 'Project managers launch campaigns and track contributions in real time.' },
  { icon: 'stats-chart-outline', title: 'Track performance', body: 'Follow your portfolio and each project’s funding journey live.' },
];

const GOALS = [
  'Make investing accessible to everyone, not just institutions.',
  'Help local project owners reach the capital they need to grow.',
  'Keep every transaction transparent, secure and easy to understand.',
];

function FeatureRow({ icon, title, body }) {
  const theme = useTheme();
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { backgroundColor: theme.colors.primarySoft }]}>
        <Ionicons name={icon} size={19} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="textSecondary" style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

export default function AboutScreen({ route }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const focus = route?.params?.focus; // 'org' | 'system' | undefined

  const isSystem = focus === 'system';
  const heroImage = isSystem ? IMAGES.heroCosmos : IMAGES.heroBeam;
  const heroTitle = isSystem ? 'About the platform' : 'About Investly';
  const heroSub = isSystem
    ? 'How the system works end to end'
    : 'Investing, made simple for everyone';

  return (
    <ScreenContainer scroll padded={false} edges={['bottom']}>
      <HeroBackground image={heroImage} height={210} contentStyle={{ paddingTop: insets.top + 4 }}>
        <StatusBar style="light" />
        <View style={styles.heroTop}>
          <IconButton icon="chevron-back" variant="ghost" color="#FFFFFF" onPress={() => navigation.canGoBack() && navigation.goBack()} />
        </View>
        <View style={styles.heroBody}>
          <Text variant="h1" color="textInverse">{heroTitle}</Text>
          <Text variant="body" style={styles.heroSub}>{heroSub}</Text>
        </View>
      </HeroBackground>

      <View style={styles.body}>
        <Card style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Who we are</Text>
          <Text variant="body" color="textSecondary" style={styles.paragraph}>
            Investly is a micro-investment platform that connects everyday investors with vetted
            local projects. We make it simple to grow your money while supporting the businesses
            and ideas you believe in — all from your phone.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>The platform</Text>
          <Text variant="body" color="textSecondary" style={styles.paragraph}>
            Investors discover and fund campaigns; project managers create them and watch funding
            arrive in real time. A secure wallet handles top-ups, investments and withdrawals,
            while identity verification keeps the marketplace trustworthy for everyone.
          </Text>
        </Card>

        <Text variant="h3" style={styles.sectionTitle}>What we offer</Text>
        <Card style={styles.card}>
          {SERVICES.map((s, i) => (
            <View key={s.title}>
              {i > 0 ? <View style={[styles.sep, { backgroundColor: theme.colors.divider }]} /> : null}
              <FeatureRow {...s} />
            </View>
          ))}
        </Card>

        <Text variant="h3" style={styles.sectionTitle}>Our goals</Text>
        <Card style={styles.card}>
          {GOALS.map((g, i) => (
            <View key={i} style={styles.goalRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success.solid} style={styles.goalIcon} />
              <Text variant="body" color="textSecondary" style={{ flex: 1, lineHeight: 22 }}>{g}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text variant="h3" style={styles.cardTitle}>Security &amp; trust</Text>
          <Text variant="body" color="textSecondary" style={styles.paragraph}>
            Your account is protected with industry-standard authentication and encrypted token
            storage. Identity verification (KYC) and transparent project data keep the platform
            safe and reliable for investors and project owners alike.
          </Text>
        </Card>

        <Text variant="caption" color="textMuted" align="center" style={styles.version}>
          Investly · Version 1.0.0
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroTop: { paddingHorizontal: 8, paddingTop: 4 },
  heroBody: { paddingHorizontal: 20, paddingBottom: 20, marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { paddingHorizontal: 16, paddingTop: 18 },
  card: { marginBottom: 14 },
  cardTitle: { marginBottom: 8 },
  paragraph: { lineHeight: 23 },
  sectionTitle: { marginTop: 6, marginBottom: 12, marginLeft: 2 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  featureBody: { marginTop: 3, lineHeight: 19 },
  sep: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  goalIcon: { marginRight: 10, marginTop: 1 },
  version: { marginTop: 10, marginBottom: 8 },
});
