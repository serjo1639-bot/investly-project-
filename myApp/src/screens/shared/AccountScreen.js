/**
 * AccountScreen — profile header, KYC status, settings menu and sign-out.
 * The header is a branded hero; the menu button opens the global side drawer.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  Text, Avatar, Card, Badge, ListRow, Divider, Button, IconButton, HeroBackground, PressableScale, toast,
} from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useUiStore } from '../../store/uiStore';
import { ROUTES } from '../../navigation/routes';
import { KycStatus } from '../../constants/enums';
import { IMAGES } from '../../constants/images';
import { formatCurrency } from '../../utils/format';

export default function AccountScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, logout } = useAuth();
  const wallet = useWallet();
  const openDrawer = useUiStore((s) => s.openDrawer);

  const onLogout = () =>
    logout.mutate(undefined, {
      onSettled: () => toast.info('Signed out'),
    });

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Branded hero header */}
        <HeroBackground image={IMAGES.heroGlow} height={264} radius={theme.radii['2xl']} style={styles.hero}>
          <View style={styles.heroTop}>
            <IconButton icon="menu" variant="ghost" color="#FFFFFF" onPress={openDrawer} />
            <Text variant="subtitle" color="textInverse">{t('account.title')}</Text>
            <IconButton icon="settings-outline" variant="ghost" color="#FFFFFF" onPress={() => navigation.navigate(ROUTES.SETTINGS)} />
          </View>

          <PressableScale scaleTo={0.99} onPress={() => navigation.navigate(ROUTES.EDIT_ACCOUNT)}>
            <View style={styles.heroProfile}>
              <Avatar uri={user?.avatarUrl} name={user?.name} size={66} style={styles.heroAvatar} />
              <View style={styles.heroInfo}>
                <Text variant="h3" color="textInverse" numberOfLines={1}>{user?.name}</Text>
                <Text variant="caption" numberOfLines={1} style={styles.heroEmail}>
                  {user?.email || user?.phone}
                </Text>
                <View style={styles.badges}>
                  <View style={styles.rolePill}>
                    <Ionicons name={user?.role === 'owner' ? 'briefcase' : 'trending-up'} size={11} color="#FFFFFF" />
                    <Text variant="tiny" style={styles.rolePillText}>
                      {user?.role === 'owner' ? t('auth.owner') : t('auth.investor')}
                    </Text>
                  </View>
                  {user?.kycStatus && user.kycStatus !== KycStatus.NONE ? (
                    <Badge status={user.kycStatus} style={{ marginLeft: 8 }} />
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
            </View>
          </PressableScale>

          {/* Wallet balance — the user's total available money. */}
          <PressableScale scaleTo={0.99} onPress={() => navigation.navigate(ROUTES.WALLET_TAB)}>
            <View style={styles.balanceStrip}>
              <View style={styles.balanceInfo}>
                <Text variant="tiny" style={styles.balanceLabel}>{t('home.walletBalance').toUpperCase()}</Text>
                <Text variant="h2" color="textInverse" numberOfLines={1}>
                  {wallet.isLoading ? '…' : formatCurrency(wallet.data?.balance ?? 0)}
                </Text>
              </View>
              <View style={styles.balanceIcon}>
                <Ionicons name="wallet" size={20} color="#FFFFFF" />
              </View>
            </View>
          </PressableScale>
        </HeroBackground>

        <View style={styles.bodyPad}>
          {/* Account section */}
          <Text variant="tiny" color="textMuted" style={styles.sectionLabel}>{t('menu.general').toUpperCase()}</Text>
          <Card padded={false} style={styles.menu}>
            <ListRow icon="person-outline" title={t('account.editProfile')} onPress={() => navigation.navigate(ROUTES.EDIT_ACCOUNT)} />
            <Divider />
            <ListRow icon="shield-checkmark-outline" title={t('account.kyc')}
              value={user?.kycStatus && user.kycStatus !== 'none' ? undefined : 'Verify'}
              right={user?.kycStatus && user.kycStatus !== 'none' ? <Badge status={user.kycStatus} /> : undefined}
              onPress={() => navigation.navigate(ROUTES.KYC)} />
            <Divider />
            <ListRow icon="trending-up-outline" title={t('tabs.projects')} onPress={() => navigation.navigate(ROUTES.MY_INVESTMENTS)} />
            <Divider />
            <ListRow icon="card-outline" title="Payments" onPress={() => navigation.navigate(ROUTES.PAYMENTS)} />
            <Divider />
            <ListRow icon="lock-closed-outline" title={t('account.changePassword')} onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)} />
          </Card>

          {/* Preferences + info */}
          <Text variant="tiny" color="textMuted" style={styles.sectionLabel}>{t('menu.support').toUpperCase()}</Text>
          <Card padded={false} style={styles.menu}>
            <ListRow icon="settings-outline" title={t('account.settings')} onPress={() => navigation.navigate(ROUTES.SETTINGS)} />
            <Divider />
            <ListRow icon="help-buoy-outline" title={t('account.help')} onPress={() => navigation.navigate(ROUTES.FAQ)} />
            <Divider />
            <ListRow icon="chatbubbles-outline" title={t('account.contact')} onPress={() => navigation.navigate(ROUTES.CONTACT)} />
            <Divider />
            <ListRow icon="information-circle-outline" title={t('account.about')} onPress={() => navigation.navigate(ROUTES.ABOUT)} />
            <Divider />
            <ListRow icon="document-text-outline" title={t('account.privacy')} onPress={() => navigation.navigate(ROUTES.PRIVACY)} />
            <Divider />
            <ListRow icon="reader-outline" title={t('account.terms')} onPress={() => navigation.navigate(ROUTES.TERMS)} />
          </Card>

          <Button title={t('auth.logout')} icon="log-out-outline" variant="danger" loading={logout.isPending} onPress={onLogout} style={styles.logout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 104 },
  hero: { marginHorizontal: 12, marginTop: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 10 },
  heroProfile: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 20, paddingTop: 8 },
  heroAvatar: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  heroInfo: { flex: 1, marginLeft: 14 },
  heroEmail: { color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  rolePillText: { color: '#FFFFFF', marginLeft: 5, letterSpacing: 0.3 },
  balanceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  balanceInfo: { flex: 1 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', letterSpacing: 0.6, marginBottom: 3 },
  balanceIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  bodyPad: { paddingHorizontal: 16, marginTop: 18 },
  sectionLabel: { marginLeft: 4, marginBottom: 8, letterSpacing: 0.6 },
  menu: { paddingHorizontal: 16, marginBottom: 18 },
  logout: { marginTop: 6 },
});
