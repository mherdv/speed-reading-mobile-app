import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { colors, gameColors } from '../theme/colors';
import { normalizeGameId } from '../data/gameIds';
import { getGameTitle } from '../games/registry';
import { LineChart } from './LineChart';
import { CircularProgress } from './CircularProgress';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  results: AttemptResult[];
};

type GameStats = {
  gameId: string;
  gameName: string;
  attempts: number;
  bestScore: number | null;
  latestScore: number | null;
  recentScores: number[];
  improvement: number;
};

function groupByGame(results: AttemptResult[]): GameStats[] {
  const groups = new Map<string, AttemptResult[]>();
  
  for (const r of results) {
    const normalizedId = normalizeGameId(r.sampleId);
    const key = normalizedId;
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }
  
  const stats: GameStats[] = [];
  groups.forEach((attempts, gameId) => {
    // Sort by date (newest first)
    const sorted = attempts.sort((a, b) => 
      new Date(b.finishedAtIso).getTime() - new Date(a.finishedAtIso).getTime()
    );
    
    // Get scores (use score or accuracy * 100)
    const scores = sorted.map(a => a.score ?? Math.round((a.accuracy ?? 0) * 100)).filter(s => s > 0);
    const recentScores = scores.slice(0, 10).reverse(); // Last 10, oldest to newest
    
    // Calculate improvement
    const improvement = recentScores.length > 1 
      ? recentScores[recentScores.length - 1] - recentScores[0]
      : 0;
    
    stats.push({
      gameId,
      gameName: getGameTitle(gameId),
      attempts: attempts.length,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      latestScore: scores[0] ?? null,
      recentScores,
      improvement,
    });
  });
  
  return stats.sort((a, b) => b.attempts - a.attempts);
}

export function ProgressCharts({ results }: Props) {
  const stats = groupByGame(results);
  
  if (stats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Complete some exercises to see your progress charts.</Text>
      </View>
    );
  }
  
  const chartWidth = Math.min(SCREEN_WIDTH - 80, 280);
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Progress by Exercise</Text>
      {stats.map((stat) => {
        const color = gameColors[stat.gameId] || colors.primary;
        const latestPercent = stat.latestScore !== null ? Math.min(100, stat.latestScore) : 0;
        const improvementColor = stat.improvement >= 0 ? '#4CAF50' : '#F44336';
        
        return (
          <View key={stat.gameId} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={styles.gameName} numberOfLines={1}>{stat.gameName}</Text>
            </View>
            
            <View style={styles.mainContent}>
              {/* Circular Progress for Latest Score */}
              <View style={styles.circularSection}>
                <CircularProgress
                  percentage={latestPercent}
                  size={80}
                  strokeWidth={8}
                  color={color}
                  centerLabel={`${latestPercent}`}
                  subLabel="Latest"
                />
              </View>
              
              {/* Stats */}
              <View style={styles.statsSection}>
                <View style={styles.statRow}>
                  <Text style={styles.statIcon}>🎮</Text>
                  <Text style={styles.statLabel}>Attempts:</Text>
                  <Text style={styles.statValue}>{stat.attempts}</Text>
                </View>
                
                {stat.bestScore !== null && (
                  <View style={styles.statRow}>
                    <Text style={styles.statIcon}>🏆</Text>
                    <Text style={styles.statLabel}>Best:</Text>
                    <Text style={[styles.statValue, { color }]}>{stat.bestScore}</Text>
                  </View>
                )}
                
                {stat.recentScores.length > 1 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statIcon}>{stat.improvement >= 0 ? '📈' : '📉'}</Text>
                    <Text style={styles.statLabel}>Trend:</Text>
                    <Text style={[styles.statValue, { color: improvementColor }]}>
                      {stat.improvement >= 0 ? '+' : ''}{stat.improvement}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Line Chart for Progress Trend */}
            {stat.recentScores.length > 1 && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Recent Progress</Text>
                <LineChart
                  data={stat.recentScores}
                  width={chartWidth}
                  height={120}
                  color={color}
                  showDots={stat.recentScores.length <= 6}
                  showArea={true}
                  showYAxis={true}
                  showXAxis={true}
                  yAxisTicks={3}
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
    shadowColor: '#000',
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
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  circularSection: {
    alignItems: 'center',
  },
  statsSection: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    fontSize: 14,
    width: 22,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 'auto',
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
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
