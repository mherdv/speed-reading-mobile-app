import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import {
  areResultsComparable,
  areResultsSameContent,
  getResultComparison,
  isMeasuredReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import { loadResults } from '../data/resultsStore';
import { normalizeGameId } from '../data/gameIds';
import { ResponsiveLineChart } from './ResponsiveLineChart';
import { colors } from '../theme/colors';

type Props = {
  gameId: string;
  currentResult: AttemptResult;
  maxResults?: number;
};

export function ProgressChart({
  gameId,
  currentResult,
  maxResults = 10,
}: Props) {
  const [history, setHistory] = useState<AttemptResult[]>([]);
  const [samePassagePracticeCount, setSamePassagePracticeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const normalizedGameId = normalizeGameId(gameId);
      const currentIsMeasuredReading =
        isMeasuredReadingResult(currentResult);
      const all = await loadResults();
      const deduped = [currentResult, ...all].filter(
        (result, index, source) =>
          source.findIndex((candidate) => candidate.id === result.id) === index
      );
      const comparableResults = deduped
        .filter(
          (result) =>
            (currentIsMeasuredReading ||
              normalizeGameId(result.sampleId) === normalizedGameId) &&
            isValidProgressMeasurement(result) &&
            areResultsComparable(result, currentResult)
        );
      setSamePassagePracticeCount(
        comparableResults.filter(
          (result) =>
            result.id !== currentResult.id &&
            areResultsSameContent(result, currentResult)
        ).length
      );
      const gameResults = comparableResults
        .filter(
          (result) =>
            result.id === currentResult.id ||
            !areResultsSameContent(result, currentResult)
        )
        .sort(
          (first, second) =>
            new Date(second.finishedAtIso).getTime() -
            new Date(first.finishedAtIso).getTime()
        )
        .slice(0, maxResults)
        .reverse(); // Oldest first for chart
      setHistory(gameResults);
      setLoading(false);
    }
    loadHistory();
  }, [currentResult, gameId, maxResults]);

  if (!isValidProgressMeasurement(currentResult)) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>
          Raw result saved, but this attempt is excluded from progress trends.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>This is your first recorded attempt.</Text>
      </View>
    );
  }

  const comparison = getResultComparison(currentResult);
  const tracksPassagePractice =
    isMeasuredReadingResult(currentResult) &&
    typeof currentResult.details?.contentId === 'string';
  const scores = history.map(
    (result) => getResultComparison(result).metric.value
  );
  const metricLabel = comparison.metric.label;

  // Calculate stats
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const latestScore = scores[scores.length - 1] ?? 0;
  const improvement = scores.length > 1 ? latestScore - scores[0] : 0;
  return (
    <View style={styles.container}>
      <View testID="progress-metric-cards" style={styles.statsRowNew}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{scores.length}</Text>
          <Text style={styles.summaryLabel}>
            {scores.length === 1 ? 'Attempt' : 'Attempts'}
          </Text>
        </View>

        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{bestScore}</Text>
          <Text style={styles.summaryLabel}>Best {metricLabel}</Text>
        </View>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryValue}>{Math.round(avgScore)}</Text>
          <Text style={styles.summaryLabel}>Average {metricLabel}</Text>
        </View>
        {scores.length > 1 && (
          <View style={styles.summaryStat}>
            <Text
              style={[
                styles.summaryValue,
                improvement > 0 && styles.positive,
                improvement < 0 && styles.negative,
              ]}
            >
              {improvement > 0 ? '+' : ''}{improvement}
            </Text>
            <Text style={styles.summaryLabel}>Change in {metricLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{metricLabel} trend</Text>
        <ResponsiveLineChart
          data={scores}
          height={140}
          color={colors.interactivePrimary}
          gradientColor={colors.interactivePrimary}
          showDots={scores.length <= 8}
          yAxisTicks={4}
          metricLabel={metricLabel}
        />
      </View>

      <Text style={styles.chartCaption}>
        Last {history.length}{' '}
        {tracksPassagePractice ? 'cross-passage comparisons' : 'comparable attempts'} ·{' '}
        {comparison.label}
      </Text>
      {tracksPassagePractice && (
        <Text testID="same-passage-practice" style={styles.practiceCaption}>
          Same-passage practice: {samePassagePracticeCount}{' '}
          {samePassagePracticeCount === 1 ? 'attempt' : 'attempts'} kept separate
          from the baseline trend
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  noData: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statsRowNew: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  summaryStat: {
    minWidth: 108,
    minHeight: 76,
    flexGrow: 1,
    flexBasis: 108,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceTonal,
  },
  summaryValue: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  positive: {
    color: colors.successForeground,
  },
  negative: {
    color: colors.errorForeground,
  },
  chartContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  chartCaption: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  practiceCaption: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
