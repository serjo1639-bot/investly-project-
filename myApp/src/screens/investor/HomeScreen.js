/**
 * HomeScreen — the investor landing: greeting, wallet balance, a featured
 * projects carousel, category chips and a shortcut into the full projects list.
 * Each section handles its own loading (skeleton) and error states.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Text, Avatar, IconButton, Card, Button, Chip,
  SectionHeader, ProjectCard, Skeleton, SkeletonCard, EmptyState,
} from '../../components';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useFeaturedProjects, useCategories } from '../../hooks/useProjects';
import { useWallet } from '../../hooks/useWallet';
import { useUnreadCount } from '../../hooks/useNotifications';
import { formatCurrency } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';
import { queryKeys } from '../../constants/queryKeys';

export default function HomeScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const openDrawer = useUiStore((s) => s.openDrawer);
  const qc = useQueryClient();

  const featured = useFeaturedProjects();
  const categories = useCategories();
  const wallet = useWallet();
  const unread = useUnreadCount();
  const appSettings = useAppSettings();
  const [refreshing, setRefreshing] = useState(false);

  const settings = appSettings.data;
  const isAr = (i18n.language || 'ar').startsWith('ar');
  const announcement = isAr ? settings?.announcementAr : settings?.announcementEn;
  const showAnnouncement = settings?.announcementActive && !!announcement;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  }, [qc]);

  const featuredItems = Array.isArray(featured.data) ? featured.data : featured.data?.items ?? [];
  const categoryItems = Array.isArray(categories.data) ? categories.data : categories.data?.items ?? [];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* Greeting row */}
        <View style={styles.headerRow}>
          <IconButton icon="menu" onPress={openDrawer} style={styles.menuBtn} />
          <View style={styles.greetWrap}>
            <Text variant="caption" color="textSecondary">{t('home.greeting')} 👋</Text>
            <Text variant="h2" numberOfLines={1}>{user?.name || 'Investor'}</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton icon="notifications-outline" badge={unread.data} onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)} />
            <Avatar uri={user?.avatarUrl} name={user?.name} size={42} style={{ marginLeft: 10 }} />
          </View>
        </View>

        {/* Admin announcement banner (controlled from the dashboard) */}
        {showAnnouncement && (
          <View style={[styles.announcement, { backgroundColor: theme.colors.primary + '14', borderColor: theme.colors.primary + '33' }]}>
            <Ionicons name="megaphone-outline" size={18} color={theme.colors.primary} style={{ marginTop: 1 }} />
            <Text variant="caption" color="textSecondary" style={styles.announcementText}>{announcement}</Text>
          </View>
        )}

        {/* Wallet balance card */}
        <Card elevation="md" style={[styles.walletCard, { backgroundColor: theme.colors.primary }]}>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('home.walletBalance')}</Text>
          {wallet.isLoading ? (
            <Skeleton width={160} height={30} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <Text variant="display" style={styles.walletAmount}>
              {formatCurrency(wallet.data?.balance ?? 0)}
            </Text>
          )}
          <View style={styles.walletActions}>
            <Button title={t('wallet.topup')} icon="add-circle-outline" variant="secondary" size="sm" fullWidth={false}
              style={styles.walletBtn} onPress={() => navigation.navigate(ROUTES.TOPUP)} />
            <Button title={t('wallet.withdraw')} icon="arrow-up-circle-outline" variant="secondary" size="sm" fullWidth={false}
              style={styles.walletBtn} onPress={() => navigation.navigate(ROUTES.WITHDRAW)} />
          </View>
        </Card>

        {/* Categories */}
        <SectionHeader title={t('home.categories')} style={styles.section} />
        {categories.isLoading ? (
          <View style={styles.chipsRow}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} width={92} height={36} radius={999} style={{ marginRight: 8 }} />)}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
            {categoryItems.map((cat) => (
              <Chip key={cat.id ?? cat.name} label={cat.name} icon="pricetag-outline"
                onPress={() => navigation.navigate(ROUTES.PROJECTS_TAB, { categoryId: cat.id })} />
            ))}
          </ScrollView>
        )}

        {/* Featured carousel */}
        <SectionHeader title={t('home.featured')} actionLabel={t('common.seeAll')}
          onAction={() => navigation.navigate(ROUTES.PROJECTS_TAB)} style={styles.section} />
        {featured.isLoading ? (
          <View style={{ width: 280 }}><SkeletonCard /></View>
        ) : featuredItems.length === 0 ? (
          <EmptyState icon="sparkles-outline" title="No featured projects" message="Check back soon for hand-picked opportunities." />
        ) : (
          <FlatList
            horizontal
            data={featuredItems}
            keyExtractor={(item) => String(item.id)}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProjectCard project={item} variant="wide"
                onPress={() => navigation.navigate(ROUTES.PROJECT_DETAIL, { id: item.id })} />
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  menuBtn: { marginLeft: -8, marginRight: 4 },
  greetWrap: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  announcement: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  announcementText: { flex: 1, lineHeight: 18 },
  walletCard: { marginTop: 8, borderWidth: 0 },
  walletAmount: { color: '#fff', marginTop: 6 },
  walletActions: { flexDirection: 'row', marginTop: 18 },
  walletBtn: { paddingHorizontal: 16, marginRight: 10 },
  walletBtnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  section: { marginTop: 26 },
  chipsRow: { flexDirection: 'row', marginBottom: 4 },
});
