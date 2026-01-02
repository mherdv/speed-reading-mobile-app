import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { colors, gameColors } from '../theme/colors';

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
};

function groupByGame(results: AttemptResult[]): GameStats[] {
  const groups = new Map<string, AttemptResult[]>();
  
  for (const r of results) {
    const key = r.sampleTitle;
    const list = groups.get(key) || [];
    list.push(r);
    groups.set(key, list);
  }
  
  const stats: GameStats[] = [];
  groups.forEach((attempts, gameName) => {
    // Sort by date (newest first)
    const sorted = attempts.sort((a, b) => 
      new Date(b.finishedAtIso).getTime() - new Date(a.finishedAtIso).getTime()
    );
    
    // Get scores (use score or accuracy * 100)
    const scores = sorted.map(a => a.score ?? Math.round((a.accuracy ?? 0) * 100)).filter(s => s > 0);
    const recentScores = scores.slice(0, 10).reverse(); // Last 10, oldest to newest
    
    stats.push({
      gameId: sorted[0].sampleId || gameName,
      gameName,
      attempts: attempts.length,
      bestScore: scores.length > 0 ? Math.max(...scores) : null,
      latestScore: scores[0] ?? null,
      recentScores,
    });
  });
  
  return stats.sort((a, b) => b.attempts - a.attempts);
}

function MiniBarChart({ scores, color }: { scores: number[]; color: string }) {
  if (scores.length === 0) return null;
  
  const maxScore = Math.max(...scores, 1);
  const barWidth = Math.min(20, 150 / scores.length);
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {scores.map((score, idx) => (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: Math.max(4, (score / maxScore) * 40),
                backgroundColor: color,
                opacity: 0.5 + (idx / scores.length) * 0.5, // Fade in effect
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
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
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Progress by Exercise</Text>
      {stats.map((stat) => {
        const color = gameColors[stat.gameId] || colors.primary;
        return (
          <View key={stat.gameName} style={styles.gameCard}>
            <View style={styles.gameHeader}>
              <View style={[styles.colorDot, { backgroundColor: color }]} />
              <Text style={styles.gameName} numberOfLines={1}>{stat.gameName}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stat.attempts}</Text>
                <Text style={styles.statLabel}>Attempts</Text>
              </View>
              
              {stat.bestScore !== null && (
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color }]}>{stat.bestScore}</Text>
                  <Text style={styles.statLabel}>Best</Text>
                </View>
              )}
              
              {stat.latestScore !== null && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.latestScore}</Text>
                  <Text style={styles.statLabel}>Latest</Text>
                </View>
              )}
            </View>
            
            {stat.recentScores.length > 1 && (
              <View style={styles.chartSection}>
                <Text style={styles.chartLabel}>Recent trend:</Text>
                <MiniBarChart scores={stat.recentScores} color={color} />
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gameCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chartContainer: {
    height: 44,
    justifyContent: 'flex-end',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    borderRadius: 2,
  },
});
