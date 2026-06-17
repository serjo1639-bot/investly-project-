/**
 * ProjectStatsScreen — performance view for one of the owner's projects:
 * funding progress + key metrics, with an edit shortcut.
 */
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../layouts/ScreenContainer';
import { AppHeader } from '../../layouts/AppHeader';
import {
  Text, Card, Badge, Button, StatTile, Spinner, ErrorState, FundingProgress, IconButton,
} from '../../components';
import { useProject, useProjectStats } from '../../hooks/useProjects';
import { formatCompact, formatCurrency } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function ProjectStatsScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { id } = route.params ?? {};
  const project = useProject(id);
  const stats = useProjectStats(id);

  if (project.isLoading) return <Spinner label={t('common.loading')} />;
  if (project.isError) return <ErrorState error={project.error} onRetry={project.refetch} />;

  const p = project.data ?? {};
  const s = stats.data ?? {};

  return (
    <ScreenContainer padded={false}>
      <AppHeader
        title={p.title}
        showBack
        right={<IconButton icon="create-outline" onPress={() => navigation.navigate(ROUTES.CREATE_PROJECT, { project: p })} />}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <Badge status={p.status} />
        </View>

        <Card style={styles.card}>
          <FundingProgress raised={p.raisedAmount} goal={p.goalAmount} />
        </Card>

        <View style={styles.statsRow}>
          <StatTile icon="people-outline" value={formatCompact(s.investorsCount ?? p.investorsCount ?? 0)} label={t('project.investors')} />
          <View style={{ width: 12 }} />
          <StatTile icon="eye-outline" tone="info" value={formatCompact(s.views ?? p.views ?? 0)} label="Views" />
        </View>
        <View style={styles.statsRow}>
          <StatTile icon="cash-outline" tone="success" value={formatCurrency(p.raisedAmount ?? 0)} label={t('project.raised')} />
          <View style={{ width: 12 }} />
          <StatTile icon="flag-outline" tone="warning" value={formatCurrency(p.goalAmount ?? 0)} label={t('project.goal')} />
        </View>

        <Button title="Edit project" icon="create-outline" variant="outline" style={styles.edit}
          onPress={() => navigation.navigate(ROUTES.CREATE_PROJECT, { project: p })} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  statusRow: { marginBottom: 12, marginTop: 4 },
  card: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  edit: { marginTop: 10 },
});
