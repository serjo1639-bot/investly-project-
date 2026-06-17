/**
 * ProjectsScreen — searchable, filterable, infinitely-scrolling project list.
 * Search is debounced; category chips filter server-side. Handles loading,
 * empty, error and "load more" states.
 */
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  Input, Chip, ProjectCard, SkeletonCard, EmptyState, ErrorState, Text,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useProjectsList, useCategories } from '../../hooks/useProjects';
import { useDebounce } from '../../hooks/useDebounce';
import { ROUTES } from '../../navigation/routes';

export default function ProjectsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(route.params?.categoryId ?? null);
  const debouncedSearch = useDebounce(search, 400);

  // Backend GetAll expects `category` (id), `search`, `status` query params.
  const filters = useMemo(
    () => ({ search: debouncedSearch || undefined, category: categoryId || undefined }),
    [debouncedSearch, categoryId]
  );

  const categories = useCategories();
  const query = useProjectsList(filters);

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const categoryItems = Array.isArray(categories.data) ? categories.data : categories.data?.items ?? [];

  const renderHeader = () => (
    <View>
      <Text variant="h1" style={styles.title}>{t('home.explore')}</Text>
      <Input
        icon="search-outline"
        placeholder={t('common.search')}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        style={styles.search}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Chip label={t('common.seeAll')} selected={!categoryId} onPress={() => setCategoryId(null)} />
        {categoryItems.map((c) => (
          <Chip key={c.id ?? c.name} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={query.refetch} />
      ) : (
        <FlatList
          data={query.isLoading ? [] : items}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => navigation.navigate(ROUTES.PROJECT_DETAIL, { id: item.id })} />
          )}
          ListEmptyComponent={
            query.isLoading ? (
              <View>{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</View>
            ) : (
              <EmptyState icon="search-outline" title="No projects found" message="Try a different search or category." />
            )
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={
            query.isFetchingNextPage ? <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 104 },
  title: { marginTop: 12, marginBottom: 16 },
  search: { marginBottom: 8 },
  chips: { flexDirection: 'row', marginBottom: 16 },
});
