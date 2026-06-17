/**
 * FundingProgress — animated funding bar with raised/goal figures and the
 * computed percentage. Reused on cards and the project detail screen.
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/Text';
import { ProgressBar } from '../ui/ProgressBar';
import { formatCurrency, toPercent } from '../../utils/format';

function FundingProgressBase({ raised = 0, goal = 0, compact = false, style }) {
  const { t } = useTranslation();
  const percent = toPercent(raised, goal);

  return (
    <View style={style}>
      <ProgressBar percent={percent} height={compact ? 6 : 8} />
      <View style={styles.row}>
        <Text variant="caption" color="textSecondary">
          {formatCurrency(raised)} {t('project.raised').toLowerCase()}
        </Text>
        <Text variant="caption" style={styles.percent}>
          {percent}%
        </Text>
      </View>
      {!compact ? (
        <Text variant="caption" color="textMuted" style={styles.goal}>
          {t('project.goal')}: {formatCurrency(goal)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  percent: { fontWeight: '800' },
  goal: { marginTop: 2 },
});

export const FundingProgress = memo(FundingProgressBase);
