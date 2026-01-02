import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { loadResults } from '../data/resultsStore';

type Props = {
  gameId: string;
  currentScore?: number;
  maxResults?: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ProgressChart({ gameId, currentScore, maxResults = 10 }: Props) {
  const [history, setHistory] = useState<AttemptResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const all = await loadResults();
      const gameResults = all
        .filter((r) => r.sampleId === gameId)
        .slice(0, maxResults)
        .reverse(); // Oldest first for chart
      setHistory(gameResults);
      setLoading(false);
    }
    loadHistory();
  }, [gameId, maxResults]);

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
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.noData}>No previous results for this exercise.</Text>
      </View>
    );
  }

  // Get scores for chart
  const scores = history.map((r) => r.score ?? 0);
  const maxScore = Math.max(...scores, currentScore ?? 0, 1);
  const barWidth = Math.min(30, (SCREEN_WIDTH - 80) / history.length);

  // Calculate stats
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const latestScore = scores[scores.length - 1] ?? 0;
  const improvement = scores.length > 1 ? latestScore - scores[0] : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress History</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{Math.round(avgScore)}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{bestScore}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, improvement > 0 && styles.positive, improvement < 0 && styles.negative]}>
            {improvement > 0 ? '+' : ''}{Math.round(improvement)}
          </Text>
          <Text style={styles.statLabel}>Change</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {scores.map((score, idx) => {
            const height = maxScore > 0 ? (score / maxScore) * 80 : 0;
            return (
              <View key={idx} style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: Math.max(4, height), 
                      width: barWidth - 4,
                      backgroundColor: idx === scores.length - 1 ? '#10B981' : '#93C5FD',
                    }
                  ]} 
                />
                <Text style={styles.barLabel}>{idx + 1}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.chartCaption}>Last {history.length} attempts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  noData: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
  },
  statLabel: {
    fontSize: 10,
    color: '#3B82F6',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#DC2626',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 100,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    borderRadius: 4,
    minWidth: 12,
  },
  barLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    marginTop: 4,
  },
  chartCaption: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
});
