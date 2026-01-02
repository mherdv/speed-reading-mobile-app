import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { clearResults, loadResults } from '../data/resultsStore';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { ProgressCharts } from '../ui/ProgressCharts';
import { LineChart } from '../ui/LineChart';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  onBack: () => void;
  refreshToken: number;
};

type Tab = 'charts' | 'history';

function calculateTotalTime(results: AttemptResult[]): string {
  const totalMs = results.reduce((sum, r) => sum + r.elapsedMs, 0);
  const totalMinutes = Math.floor(totalMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function calculateAverageSpeed(results: AttemptResult[]): string {
  const wpmResults = results.filter(r => r.wpm > 0);
  if (wpmResults.length === 0) return '0';
  const avgWpm = Math.round(wpmResults.reduce((sum, r) => sum + r.wpm, 0) / wpmResults.length);
  return `${avgWpm}`;
}

export function HistoryScreen({ onBack, refreshToken }: Props) {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('charts');

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const loaded = await loadResults();
      if (cancelled) return;
      setResults(loaded);
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  async function onClear() {
    await clearResults();
    setResults([]);
  }

  // Get daily scores for the main chart
  const getDailyScores = () => {
    const last30Days = results
      .filter(r => r.score !== undefined)
      .slice(0, 30)
      .reverse();
    return last30Days.map(r => r.score ?? 0);
  };

  const getDayLabels = () => {
    const last30Days = results.slice(0, 30).reverse();
    return last30Days.map((r, i) => {
      if (i % 5 === 0) return `${i + 1}`;
      return '';
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Training Time</Text>
          <Text style={styles.summaryValue}>{calculateTotalTime(results)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average Speed</Text>
          <Text style={styles.summaryValue}>{calculateAverageSpeed(results)} wpm</Text>
        </View>
      </View>

      {/* Main Progress Chart */}
      {results.length > 1 && (
        <View style={styles.mainChartCard}>
          <LineChart
            data={getDailyScores().length > 0 ? getDailyScores() : [0]}
            width={SCREEN_WIDTH - 64}
            height={180}
            color={colors.primary}
            showDots={getDailyScores().length <= 10}
            showArea={true}
            showYAxis={true}
            showXAxis={true}
            yAxisTicks={4}
          />
          <Text style={styles.chartCaption}>Days</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable 
          style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>📊 Charts</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>📋 History</Text>
        </Pressable>
      </View>

      {activeTab === 'charts' ? (
        <ScrollView style={styles.scrollArea}>
          <ProgressCharts results={results} />
        </ScrollView>
      ) : (
        <>
          <FlatList
            style={styles.list}
            data={results}
            keyExtractor={(r) => r.id}
            ListEmptyComponent={<Text style={styles.empty}>No results yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <Text style={styles.itemTitle}>{item.sampleTitle}</Text>
                <Text style={styles.itemMeta}>{formatHistoryMeta(item)}</Text>
              </View>
            )}
          />
        </>
      )}

      <View style={styles.bottomRow}>
        <Button testID="history-back" label="Back" onPress={onBack} />
        <View style={styles.spacer} />
        <Button
          testID="history-clear"
          label="Clear All"
          onPress={onClear}
          disabled={results.length === 0}
        />
      </View>
    </View>
  );
}

function formatHistoryMeta(item: AttemptResult): string {
  const hasWpm = item.wordCount > 0 && item.wpm > 0;
  const base = `${(item.elapsedMs / 1000).toFixed(1)}s`;
  if (hasWpm) {
    return `${item.wpm} WPM · ${base} · ${item.comprehensionCorrect ? 'Correct' : 'Incorrect'}`;
  }

  const parts: string[] = [base];
  if (typeof item.score === 'number') parts.unshift(`Score: ${item.score}`);
  if (typeof item.accuracy === 'number') parts.push(`${Math.round(item.accuracy * 100)}%`);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mainChartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  chartCaption: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.backgroundDark,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  scrollArea: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  spacer: {
    width: 10,
  },
  list: {
    flex: 1,
  },
  empty: {
    color: colors.textSecondary,
    marginTop: 20,
    textAlign: 'center',
  },
  item: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
