/**
 * MyProjectsScreen — list of the owner's projects with funding progress.
 * Tap a project to view its stats; FAB-style button to create a new one.
 */
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  Text, IconButton, Card, Badge, ProgressBar, Skeleton, EmptyState, ErrorState,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useOwnerProjects } from '../../hooks/useOwner';
import { formatCurrency, toPercent } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function MyProjectsScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch } = useOwnerProjects();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text variant="h1">{t('owner.myProjects')}</Text>
        <IconButton icon="add" variant="soft" onPress={() => navigation.navigate(ROUTES.CREATE_PROJECT)} />
      </View>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate(ROUTES.PROJECT_STATS, { id: item.id })}>
              <View style={styles.top}>
                <Text variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>{item.title}</Text>
                <Badge status={item.status} />
              </View>
              <ProgressBar percent={toPercent(item.raisedAmount, item.goalAmount)} style={{ marginTop: 12 }} />
              <View style={styles.metaRow}>
                <Text variant="caption" color="textSecondary">{formatCurrency(item.raisedAmount)} / {formatCurrency(item.goalAmount)}</Text>
                <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '700' }}>
                  {toPercent(item.raisedAmount, item.goalAmount)}%
                </Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View>{[1, 2, 3].map((i) => <Skeleton key={i} height={110} radius={16} style={{ marginBottom: 12 }} />)}</View>
            ) : (
              <EmptyState icon="briefcase-outline" title="No projects yet" message="Create your first project to start raising funds."
                actionLabel={t('owner.newProject')} onAction={() => navigation.navigate(ROUTES.CREATE_PROJECT)} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  card: { marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
