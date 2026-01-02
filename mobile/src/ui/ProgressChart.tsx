import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { loadResults } from '../data/resultsStore';
import { LineChart } from './LineChart';
import { CircularProgress } from './CircularProgress';

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
        <Text style={styles.title}>📈 Progress</Text>
        <Text style={styles.noData}>No previous results for this exercise.</Text>
      </View>
    );
  }

  // Get scores for chart
  const scores = history.map((r) => r.score ?? 0);
  const maxScore = Math.max(...scores, currentScore ?? 0, 1);

  // Calculate stats
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const latestScore = scores[scores.length - 1] ?? 0;
  const improvement = scores.length > 1 ? latestScore - scores[0] : 0;
  const improvementPercent = scores[0] > 0 ? Math.round((improvement / scores[0]) * 100) : 0;
  
  // Calculate performance percentage (latest vs best possible, capped at 100)
  const performancePercent = Math.min(100, Math.round((latestScore / Math.max(bestScore, 1)) * 100));

  // Generate labels for x-axis
  const labels = scores.map((_, i) => `#${i + 1}`);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 Progress History</Text>
      
      {/* Stats Row with Circular Progress */}
      <View style={styles.statsRowNew}>
        <View style={styles.circularContainer}>
          <CircularProgress
            percentage={performancePercent}
            size={80}
            strokeWidth={8}
            color="#6366F1"
            gradientEnd="#EC4899"
            subLabel="Performance"
          />
        </View>
        
        <View style={styles.statsColumn}>
          <View style={styles.statRowItem}>
            <Text style={styles.statIcon}>🎯</Text>
            <View>
              <Text style={styles.statValueNew}>{bestScore}</Text>
              <Text style={styles.statLabelNew}>Best Score</Text>
            </View>
          </View>
          <View style={styles.statRowItem}>
            <Text style={styles.statIcon}>📊</Text>
            <View>
              <Text style={styles.statValueNew}>{Math.round(avgScore)}</Text>
              <Text style={styles.statLabelNew}>Average</Text>
            </View>
          </View>
          <View style={styles.statRowItem}>
            <Text style={styles.statIcon}>{improvement >= 0 ? '📈' : '📉'}</Text>
            <View>
              <Text style={[styles.statValueNew, improvement > 0 && styles.positive, improvement < 0 && styles.negative]}>
                {improvement > 0 ? '+' : ''}{improvementPercent}%
              </Text>
              <Text style={styles.statLabelNew}>Trend</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Line Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Score Trend</Text>
        <LineChart
          data={scores}
          width={SCREEN_WIDTH - 64}
          height={140}
          color="#6366F1"
          gradientColor="#6366F1"
          showDots={scores.length <= 8}
          showArea={true}
          showYAxis={true}
          showXAxis={true}
          yAxisTicks={4}
        />
      </View>

      <Text style={styles.chartCaption}>Last {history.length} attempts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  noData: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  statsRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circularContainer: {
    marginRight: 20,
  },
  statsColumn: {
    flex: 1,
    gap: 8,
  },
  statRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statValueNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabelNew: {
    fontSize: 11,
    color: '#6B7280',
  },
  positive: {
    color: '#059669',
  },
  negative: {
    color: '#DC2626',
  },
  chartContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  chartCaption: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});
