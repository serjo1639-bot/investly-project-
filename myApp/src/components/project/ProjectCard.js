/**
 * ProjectCard — the primary project tile used in lists and carousels.
 * Two layouts: 'full' (vertical, default) and 'wide' (horizontal carousel).
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { FundingProgress } from './FundingProgress';
import { useTheme } from '../../hooks/useTheme';
import { formatCompact } from '../../utils/format';

const BLUR_HASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

function ProjectCardBase({ project, onPress, variant = 'full', style }) {
  const theme = useTheme();
  const c = theme.colors;
  const wide = variant === 'wide';

  return (
    <Card
      onPress={onPress}
      padded={false}
      style={[wide ? styles.wide : styles.full, style]}
    >
      <View>
        <Image
          source={project?.coverUrl ? { uri: project.coverUrl } : undefined}
          placeholder={BLUR_HASH}
          style={[styles.cover, { borderTopLeftRadius: theme.radii.lg, borderTopRightRadius: theme.radii.lg }]}
          contentFit="cover"
          transition={250}
        />
        {project?.featured ? (
          <View style={[styles.featured, { backgroundColor: c.primary }]}>
            <Ionicons name="star" size={11} color={c.onPrimary} />
            <Text style={[styles.featuredText, { color: c.onPrimary }]}>Featured</Text>
          </View>
        ) : null}
        {project?.status ? (
          <Badge status={project.status} style={styles.statusBadge} />
        ) : null}
      </View>

      <View style={styles.body}>
        {project?.categoryName ? (
          <Text variant="tiny" style={{ color: c.primary }} numberOfLines={1}>
            {project.categoryName.toUpperCase()}
          </Text>
        ) : null}
        <Text variant="subtitle" numberOfLines={1} style={styles.title}>
          {project?.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2} style={styles.summary}>
          {project?.summary || project?.description}
        </Text>

        <FundingProgress raised={project?.raisedAmount} goal={project?.goalAmount} compact style={styles.funding} />

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={c.textMuted} />
            <Text variant="caption" color="textMuted" style={styles.metaText}>
              {formatCompact(project?.investorsCount || 0)}
            </Text>
          </View>
          {project?.views != null ? (
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color={c.textMuted} />
              <Text variant="caption" color="textMuted" style={styles.metaText}>
                {formatCompact(project.views)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  full: { marginBottom: 16, overflow: 'hidden' },
  wide: { width: 280, marginRight: 14, overflow: 'hidden' },
  cover: { width: '100%', height: 150, backgroundColor: '#E7E9F1' },
  featured: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredText: { fontSize: 10, fontWeight: '800', marginLeft: 4 },
  statusBadge: { position: 'absolute', top: 10, right: 10 },
  body: { padding: 14 },
  title: { marginTop: 4 },
  summary: { marginTop: 4, minHeight: 34 },
  funding: { marginTop: 12 },
  meta: { flexDirection: 'row', marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaText: { marginLeft: 4 },
});

export const ProjectCard = memo(ProjectCardBase);
