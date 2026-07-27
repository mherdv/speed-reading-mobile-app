import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import {
  getResultComparison,
  getResultComparisonKeyForMetric,
  getResultMetrics,
  isMeasuredReadingResult,
  isValidProgressMeasurement,
  type ResultMetric,
} from '../domain/results';
import { colors, gameColors } from '../theme/colors';
import { normalizeGameId } from '../data/gameIds';
import { getGameTitle } from '../games/registry';
import { ResponsiveLineChart } from './ResponsiveLineChart';

type Props = {
  results: AttemptResult[];
};

type GameStats = {
  key: string;
  gameId: string;
  gameName: string;
  attempts: number;
  bestScore: number | null;
  latestScore: number | null;
  recentScores: number[];
  improvement: number;
  metricLabel: string;
  comparisonLabel: string;
};

export function groupByComparableGame(results: AttemptResult[]): GameStats[] {
  const groups = new Map<
    string,
    Array<{ result: AttemptResult; metric: ResultMetric }>
  >();
  
  for (const r of results) {
    if (!isValidProgressMeasurement(r)) continue;
    const normalizedId = normalizeGameId(r.sampleId);
    const scope = isMeasuredReadingResult(r)
      ? 'measured-reading'
      : normalizedId;
    for (const metric of getResultMetrics(r)) {
      const key = `${scope}|${getResultComparisonKeyForMetric(r, metric)}`;
      const list = groups.get(key) || [];
      list.push({ result: r, metric });
      groups.set(key, list);
    }
  }
  
  const stats: GameStats[] = [];
  groups.forEach((attempts, key) => {
    // Sort by date (newest first)
    const sorted = attempts.sort((a, b) => 
      new Date(b.result.finishedAtIso).getTime() -
      new Date(a.result.finishedAtIso).getTime()
    );
    
    const latestAttempt = sorted[0];
    if (!latestAttempt) return;
    const comparison = getResultComparison(latestAttempt.result);
    const measuredReading = isMeasuredReadingResult(latestAttempt.result);
    const gameId = measuredReading
      ? 'MeasuredReading'
      : normalizeGameId(latestAttempt.result.sampleId);
    const scores = sorted
      .map((attempt) => attempt.metric.value)
      .filter(Number.isFinite);
    const recentScores = scores.slice(0, 10).reverse(); // Last 10, oldest to newest
    
    // Calculate improvement
    const improvement = recentScores.length > 1 
      ? recentScores[recentScores.length - 1] - recentScores[0]
      : 0;
    
    stats.push({
      key,
      gameId,
      gameName: measuredReading
        ? 'Measured reading baseline'
        : sorted[0]?.result.sampleTitle ?? getGameTitle(gameId),
      attempts: attempts.length,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      latestScore: scores[0] ?? null,
      recentScores,
      improvement,
      metricLabel: latestAttempt.metric.label,
      comparisonLabel:
        latestAttempt.metric.label === comparison.metric.label
          ? comparison.label
          : `${latestAttempt.metric.label} · ${
              typeof latestAttempt.result.details?.difficulty === 'string'
                ? latestAttempt.result.details.difficulty
                : 'comparable sessions'
            }`,
    });
  });
  
  return stats.sort((a, b) => b.attempts - a.attempts);
}

export function ProgressCharts({ results }: Props) {
  const stats = groupByComparableGame(results);
  
  if (stats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Complete some exercises to see your progress charts.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Progress by Exercise</Text>
      {stats.map((stat) => {
        const color = gameColors[stat.gameId] || colors.primary;
        const improvementColor =
          stat.improvement >= 0
            ? colors.successForeground
            : colors.errorForeground;
        
        return (
          <View key={stat.key} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={styles.gameName} numberOfLines={1}>{stat.gameName}</Text>
            </View>
            <Text style={styles.comparisonLabel}>{stat.comparisonLabel}</Text>
            
            <View testID="history-metric-cards" style={styles.mainContent}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{stat.latestScore ?? '—'}</Text>
                <Text style={styles.metricLabel}>Latest {stat.metricLabel}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{stat.attempts}</Text>
                <Text style={styles.metricLabel}>Comparable attempts</Text>
              </View>
              {stat.bestScore !== null && (
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{stat.bestScore}</Text>
                  <Text style={styles.metricLabel}>Best {stat.metricLabel}</Text>
                </View>
              )}
              {stat.recentScores.length > 1 && (
                <View style={styles.metricCard}>
                  <Text style={[styles.metricValue, { color: improvementColor }]}>
                    {stat.improvement >= 0 ? '+' : ''}{stat.improvement}
                  </Text>
                  <Text style={styles.metricLabel}>Change in {stat.metricLabel}</Text>
                </View>
              )}
            </View>
            
            {/* Line Chart for Progress Trend */}
            {stat.recentScores.length > 1 && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Recent Progress</Text>
                <ResponsiveLineChart
                  data={stat.recentScores}
                  height={120}
                  color={color}
                  showDots={stat.recentScores.length <= 6}
                  yAxisTicks={3}
                  metricLabel={stat.metricLabel}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
  },
  gameCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  comparisonLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 12,
  },
  mainContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    minWidth: 120,
    minHeight: 72,
    flexGrow: 1,
    flexBasis: 120,
    justifyContent: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceTonal,
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  chartSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },
});
