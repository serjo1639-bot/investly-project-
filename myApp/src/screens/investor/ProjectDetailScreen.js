/**
 * ProjectDetailScreen — full project view with cover, funding progress, key
 * stats, description and the primary "Invest now" CTA. Records a view on mount.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Text, Badge, Button, Card, Divider, IconButton, Avatar, Spinner, ErrorState, FundingProgress,
} from '../../components';
import { useTheme } from '../../hooks/useTheme';
import { useProject, useRecordView } from '../../hooks/useProjects';
import { formatCurrency, formatCompact, formatDate } from '../../utils/format';
import { ROUTES } from '../../navigation/routes';

export default function ProjectDetailScreen({ navigation, route }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = route.params ?? {};
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const recordView = useRecordView();

  useEffect(() => {
    if (id) recordView.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <Spinner label={t('common.loading')} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!project) return <ErrorState onRetry={refetch} title="Project not found" />;

  const canInvest = project.status === 'active';

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View>
          <Image
            source={project.coverUrl ? { uri: project.coverUrl } : undefined}
            placeholder="L6Pj0^jE.AyE_3t7t7R**0o#DgR4"
            style={styles.cover}
            contentFit="cover"
            transition={250}
          />
          <SafeAreaView edges={['top']} style={styles.coverBar} pointerEvents="box-none">
            <IconButton icon="chevron-back" variant="soft" onPress={() => navigation.goBack()} />
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.rowBetween}>
            {project.categoryName ? (
              <Text variant="tiny" style={{ color: theme.colors.primary }}>{project.categoryName.toUpperCase()}</Text>
            ) : <View />}
            <Badge status={project.status} />
          </View>

          <Text variant="h1" style={styles.title}>{project.title}</Text>

          <Card style={styles.fundingCard}>
            <FundingProgress raised={project.raisedAmount} goal={project.goalAmount} />
            <Divider spacing={16} />
            <View style={styles.statsRow}>
              <Stat icon="people-outline" value={formatCompact(project.investorsCount || 0)} label={t('project.investors')} theme={theme} />
              <Stat icon="wallet-outline" value={formatCurrency(project.minInvestment || 0)} label={t('project.minInvestment')} theme={theme} />
              <Stat icon="time-outline" value={project.deadline ? formatDate(project.deadline) : '—'} label={t('project.deadline')} theme={theme} />
            </View>
          </Card>

          {project.ownerName ? (
            <View style={styles.owner}>
              <Avatar name={project.ownerName} size={38} />
              <View style={{ marginLeft: 12 }}>
                <Text variant="caption" color="textSecondary">{t('auth.owner')}</Text>
                <Text variant="bodyStrong">{project.ownerName}</Text>
              </View>
            </View>
          ) : null}

          <Text variant="h3" style={styles.aboutTitle}>{t('project.about')}</Text>
          <Text variant="body" color="textSecondary" style={styles.desc}>
            {project.description || project.summary || '—'}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.cta, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <Button
          title={canInvest ? t('project.invest') : 'Not available'}
          icon="trending-up"
          size="lg"
          disabled={!canInvest}
          onPress={() => navigation.navigate(ROUTES.CHECKOUT, { project })}
        />
      </SafeAreaView>
    </View>
  );
}

function Stat({ icon, value, label, theme }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text variant="bodyStrong" numberOfLines={1} style={styles.statValue}>{value}</Text>
      <Text variant="tiny" color="textMuted">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 24 },
  cover: { width: '100%', height: 280, backgroundColor: '#E7E9F1' },
  coverBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8 },
  body: { paddingHorizontal: 16, marginTop: 18 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginTop: 8, marginBottom: 16 },
  fundingCard: { marginBottom: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { marginTop: 6, marginBottom: 2 },
  owner: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  aboutTitle: { marginBottom: 8 },
  desc: { lineHeight: 24 },
  cta: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});
