/**
 * OwnerDashboardScreen — Project Manager home: headline metrics, a "new
 * project" CTA, and a preview of their projects.
 */
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  Text, Avatar, IconButton, Button, StatTile, SectionHeader, Card, Badge,
  Skeleton, EmptyState, ProgressBar,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { useOwnerDashboard, useOwnerProjects, useOwnerStats } from '../../hooks/useOwner';
import { useUnreadCount } from '../../hooks/useNotifications';
import { formatCurrency, formatCompact, toPercent } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function OwnerDashboardScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user } = useAuth();
  const openDrawer = useUiStore((s) => s.openDrawer);
  const dashboard = useOwnerDashboard();
  const stats = useOwnerStats();
  const projects = useOwnerProjects();
  const unread = useUnreadCount();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dashboard.refetch(), stats.refetch(), projects.refetch()]);
    setRefreshing(false);
  }, [dashboard, stats, projects]);

  // Merge whichever source carries the metrics.
  const metrics = { ...(stats.data || {}), ...(dashboard.data || {}) };
  const projectItems = Array.isArray(projects.data) ? projects.data : projects.data?.items ?? [];
  const loading = dashboard.isLoading || stats.isLoading;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.headerRow}>
          <IconButton icon="menu" onPress={openDrawer} style={styles.menuBtn} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="textSecondary">{t('owner.dashboard')}</Text>
            <Text variant="h2" numberOfLines={1}>{user?.name}</Text>
          </View>
          <IconButton icon="notifications-outline" badge={unread.data} onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)} />
          <Avatar uri={user?.avatarUrl} name={user?.name} size={42} style={{ marginLeft: 10 }} />
        </View>

        {(dashboard.isError || stats.isError) && !loading ? (
          <Card style={styles.banner}>
            <Text variant="bodyStrong">{t('common.somethingWrong')}</Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
              We couldn't load your latest numbers. Pull to refresh or try again.
            </Text>
            <Button title={t('common.retry')} icon="refresh" variant="outline" size="sm" fullWidth={false}
              style={{ marginTop: 12, paddingHorizontal: 22 }} onPress={onRefresh} />
          </Card>
        ) : null}

        {loading ? (
          <View style={styles.statsRow}>
            <Skeleton height={104} radius={16} style={styles.statSkeleton} />
            <Skeleton height={104} radius={16} style={styles.statSkeleton} />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatTile icon="cash-outline" value={formatCurrency(metrics.totalRaised ?? metrics.raisedAmount ?? 0)} label={t('owner.totalRaised')} />
              <View style={{ width: 12 }} />
              <StatTile icon="briefcase-outline" tone="info" value={metrics.activeProjects ?? metrics.projectsCount ?? projectItems.length} label={t('owner.activeProjects')} />
            </View>
            <View style={styles.statsRow}>
              <StatTile icon="people-outline" tone="success" value={formatCompact(metrics.totalInvestors ?? 0)} label={t('project.investors')} />
              <View style={{ width: 12 }} />
              <StatTile icon="eye-outline" tone="warning" value={formatCompact(metrics.totalViews ?? 0)} label="Views" />
            </View>
          </>
        )}

        <Button title={t('owner.newProject')} icon="add" size="lg" style={styles.cta} onPress={() => navigation.navigate(ROUTES.CREATE_PROJECT)} />

        <SectionHeader title={t('owner.myProjects')} actionLabel={t('common.seeAll')}
          onAction={() => navigation.navigate(ROUTES.PROJECTS_TAB)} style={styles.section} />

        {projects.isLoading ? (
          [1, 2].map((i) => <Skeleton key={i} height={84} radius={16} style={{ marginBottom: 12 }} />)
        ) : projectItems.length === 0 ? (
          <EmptyState icon="briefcase-outline" title="No projects yet" message="Create your first project to start raising funds."
            actionLabel={t('owner.newProject')} onAction={() => navigation.navigate(ROUTES.CREATE_PROJECT)} />
        ) : (
          projectItems.slice(0, 3).map((p) => (
            <Card key={p.id} style={styles.projectRow} onPress={() => navigation.navigate(ROUTES.PROJECT_STATS, { id: p.id })}>
              <View style={styles.projectTop}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{p.title}</Text>
                <Badge status={p.status} />
              </View>
              <ProgressBar percent={toPercent(p.raisedAmount, p.goalAmount)} style={{ marginTop: 12 }} />
              <Text variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                {formatCurrency(p.raisedAmount)} / {formatCurrency(p.goalAmount)}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuBtn: { marginLeft: -8, marginRight: 4 },
  banner: { marginBottom: 14, borderColor: 'transparent' },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statSkeleton: { flex: 1, marginRight: 12 },
  cta: { marginTop: 6, marginBottom: 8 },
  section: { marginTop: 22 },
  projectRow: { marginBottom: 12 },
  projectTop: { flexDirection: 'row', alignItems: 'center' },
});
