/**
 * MyInvestmentsScreen — the investor's portfolio of investments.
 */
import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, Card, Badge, Skeleton, EmptyState, ErrorState } from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useMyInvestments } from '../../hooks/useInvestments';
import { formatCurrency, formatDate } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function MyInvestmentsScreen({ navigation }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch } = useMyInvestments();
  const items = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <FlatList
          data={isLoading ? [] : items}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text variant="h1" style={styles.title}>{t('tabs.projects')}</Text>}
          renderItem={({ item }) => (
            <Card style={styles.row} onPress={() => item.projectId && navigation.navigate(ROUTES.PROJECT_DETAIL, { id: item.projectId })}>
              <View style={[styles.icon, { backgroundColor: theme.colors.primarySoft }]}>
                <Ionicons name="trending-up" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.body}>
                <Text variant="bodyStrong" numberOfLines={1}>{item.projectTitle || 'Investment'}</Text>
                <Text variant="caption" color="textMuted">{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.right}>
                <Text variant="bodyStrong">{formatCurrency(item.amount)}</Text>
                {item.status ? <Badge status={item.status} style={{ marginTop: 4 }} /> : null}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            isLoading ? (
              <View>{[1, 2, 3].map((i) => <Skeleton key={i} height={72} radius={16} style={{ marginBottom: 12 }} />)}</View>
            ) : (
              <EmptyState icon="trending-up-outline" title="No investments yet"
                message="Explore projects and start building your portfolio."
                actionLabel={t('home.explore')} onAction={() => navigation.navigate(ROUTES.PROJECTS_TAB)} />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  title: { marginTop: 12, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  body: { flex: 1 },
  right: { alignItems: 'flex-end' },
});
