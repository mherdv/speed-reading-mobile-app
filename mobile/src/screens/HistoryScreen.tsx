import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AttemptResult } from '../domain/types';
import {
  formatDuration,
  getResultMetric,
  isMeasuredReadingResult,
  isReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import {
  calculatePersonalPracticeEstimate,
  getComprehensionCounts,
} from '../domain/readingPlan';
import { clearResults, loadResults } from '../data/resultsStore';
import { getGameCatalogEntry } from '../data/gameCatalog';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { ProgressCharts } from '../ui/ProgressCharts';
import { ResponsiveShell } from '../ui/ResponsiveShell';
import { colors } from '../theme/colors';

type Props = {
  onBack: () => void;
  refreshToken: number;
  optimisticResult?: AttemptResult;
};

type Tab = 'charts' | 'history';
export type HistoryFilter = 'reading' | 'practice' | 'labs';

export function classifyHistoryResult(
  result: AttemptResult
): HistoryFilter {
  if (isMeasuredReadingResult(result)) return 'reading';
  const activityType = result.details?.activityType;
  if (
    activityType === 'evidence-hunt' ||
    activityType === 'context-builder' ||
    result.sampleId === 'ContextBuilder'
  ) {
    return 'practice';
  }
  const catalog = getGameCatalogEntry(result.sampleId);
  if (
    catalog?.tier === 'reading-practice' ||
    catalog?.tier === 'wellness'
  ) {
    return 'practice';
  }
  return 'labs';
}

function calculateTotalTime(results: AttemptResult[]): string {
  const totalMs = results.reduce((sum, r) => sum + r.elapsedMs, 0);
  return formatDuration(totalMs);
}

export function calculateAverageValidMeasuredSpeed(
  results: AttemptResult[]
): string {
  const wpmResults = results.filter(
    (result) =>
      isMeasuredReadingResult(result) &&
      isValidProgressMeasurement(result)
  );
  if (wpmResults.length === 0) return '—';
  const avgWpm = Math.round(wpmResults.reduce((sum, r) => sum + r.wpm, 0) / wpmResults.length);
  return `${avgWpm} wpm`;
}

export function HistoryScreen({
  onBack,
  refreshToken,
  optimisticResult,
}: Props) {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('charts');
  const [historyFilter, setHistoryFilter] =
    useState<HistoryFilter>('reading');
  const filteredResults = results.filter(
    (result) => classifyHistoryResult(result) === historyFilter
  );
  const personalEstimate = calculatePersonalPracticeEstimate(results);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const loaded = await loadResults();
      if (cancelled) return;
      setResults(
        optimisticResult
          ? [
              optimisticResult,
              ...loaded.filter((result) => result.id !== optimisticResult.id),
            ]
          : loaded
      );
    }

    refresh();

    return () => {
      cancelled = true;
    };
  }, [optimisticResult, refreshToken]);

  async function onClear() {
    await clearResults();
    setResults([]);
  }

  function confirmClear() {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Clear all session history? This cannot be undone.')) {
        void onClear();
      }
      return;
    }
    Alert.alert(
      'Clear session history?',
      'This permanently removes every saved result. Game levels are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear history', style: 'destructive', onPress: onClear },
      ]
    );
  }

  return (
    <View style={styles.screen}>
    <ResponsiveShell style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} />
        <Text style={styles.title}>History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Stats */}
      {historyFilter === 'reading' ? (
        <View testID="reading-history-summary">
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Personal practice estimate</Text>
              <Text style={styles.summaryValue}>
                {personalEstimate.ready
                  ? `${personalEstimate.medianWpm} wpm`
                  : 'Not enough readings'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Comprehension</Text>
              <Text style={styles.summaryValue}>
                {personalEstimate.correct}/{personalEstimate.total}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valid passages</Text>
              <Text style={styles.summaryValue}>
                {personalEstimate.validPassageCount}/3
              </Text>
            </View>
          </View>
          <Text style={styles.uncertaintyText}>
            {personalEstimate.ready
              ? 'A median across different valid passages is a personal practice estimate, not a diagnostic score.'
              : 'Not enough readings for a personal estimate. Complete three different valid passages; short or extreme attempts remain visible but are excluded.'}
          </Text>
        </View>
      ) : (
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Visible sessions</Text>
            <Text style={styles.summaryValue}>{filteredResults.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Practice time</Text>
            <Text style={styles.summaryValue}>
              {calculateTotalTime(filteredResults)}
            </Text>
          </View>
        </View>
      )}

      <View
        accessibilityRole="tablist"
        accessibilityLabel="History category"
        style={styles.filterRow}
      >
        {(['reading', 'practice', 'labs'] as const).map((filter) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: historyFilter === filter }}
            key={filter}
            testID={`history-filter-${filter}`}
            style={[
              styles.filter,
              historyFilter === filter && styles.filterActive,
            ]}
            onPress={() => setHistoryFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                historyFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter[0].toUpperCase() + filter.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable 
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'charts' }}
          style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
          onPress={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>Charts</Text>
        </Pressable>
        <Pressable 
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'history' }}
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Sessions</Text>
        </Pressable>
      </View>

      {activeTab === 'charts' ? (
        <ScrollView style={styles.scrollArea}>
          <ProgressCharts results={filteredResults} />
        </ScrollView>
      ) : (
        <>
          <FlatList
            style={styles.list}
            data={filteredResults}
            keyExtractor={(r) => r.id}
            ListEmptyComponent={(
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No sessions yet</Text>
                <Text style={styles.empty}>
                  Complete a measured read or skill drill to start your history.
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.sampleTitle}</Text>
                  <Text style={styles.itemMetric}>
                    {getResultMetric(item).value} {getResultMetric(item).label}
                  </Text>
                </View>
                <Text style={styles.itemMeta}>{formatHistoryMeta(item)}</Text>
                {!isValidProgressMeasurement(item) && (
                  <Text
                    testID={`history-quality-${item.id}`}
                    style={styles.qualityFlag}
                  >
                    Not used for progress
                  </Text>
                )}
                <Text style={styles.itemDate}>
                  {new Date(item.finishedAtIso).toLocaleString()}
                </Text>
              </View>
            )}
          />
        </>
      )}

      <View style={styles.bottomRow}>
        <Button testID="history-back" label="Back" variant="secondary" onPress={onBack} />
        <View style={styles.spacer} />
        <Button
          testID="history-clear"
          label="Clear history"
          variant="destructive"
          onPress={confirmClear}
          disabled={results.length === 0}
        />
      </View>
    </ResponsiveShell>
    </View>
  );
}

function formatHistoryMeta(item: AttemptResult): string {
  const base = formatDuration(item.elapsedMs);
  if (isReadingResult(item)) {
    if (isMeasuredReadingResult(item)) {
      const comprehension = getComprehensionCounts(item);
      return `${base} · ${comprehension.correct}/${comprehension.total} comprehension`;
    }
    return `${base} · Guided pacing`;
  }

  const parts: string[] = [base];
  if (item.details?.activityType === 'evidence-hunt') {
    parts.push(
      `${item.details.answerCorrect ?? 0}/${item.details.rounds ?? 0} answers`,
      `${item.details.evidenceCorrect ?? 0}/${item.details.evidenceRequired ?? 0} evidence`
    );
    return parts.join(' · ');
  }
  if (item.details?.activityType === 'context-builder') {
    parts.push(
      `${item.details.meaningCorrect ?? 0}/${item.details.attempts ?? 0} meanings`,
      `${item.details.clueCorrect ?? 0}/${item.details.attempts ?? 0} clues`
    );
    return parts.join(' · ');
  }
  if (typeof item.accuracy === 'number') parts.push(`${Math.round(item.accuracy * 100)}%`);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
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
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  uncertaintyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -8,
    marginBottom: 16,
  },
  filterRow: {
    minHeight: 52,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: colors.backgroundDark,
  },
  filter: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  filterActive: {
    backgroundColor: colors.cardBackground,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.primaryDark,
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
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 20,
    padding: 28,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
  },
  emptyIcon: {
    color: colors.primary,
    fontSize: 34,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
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
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  qualityFlag: {
    color: colors.warningForeground,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemMetric: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  itemDate: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 5,
  },
});
