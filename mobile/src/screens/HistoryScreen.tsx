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
  getSchulteGridModeLabel,
  isMeasuredReadingResult,
  isReadingResult,
  isValidProgressMeasurement,
} from '../domain/results';
import {
  calculateReadingPerformanceProfile,
  calculateTrainingSkillProfile,
  getComprehensionCounts,
} from '../domain/readingPlan';
import { clearResults, loadResults } from '../data/resultsStore';
import {
  downloadDataBackup,
  pickDataBackup,
  restoreDataBackup,
} from '../data/dataBackup';
import { getGameCatalogEntry } from '../data/gameCatalog';
import { Button } from '../ui/Button';
import { BackButton } from '../ui/BackButton';
import { ProgressCharts } from '../ui/ProgressCharts';
import { ResponsiveShell } from '../ui/ResponsiveShell';
import { colors } from '../theme/colors';

type Props = {
  onBack: () => void;
  onDataRestored?: () => void | Promise<void>;
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
  onDataRestored,
  refreshToken,
  optimisticResult,
}: Props) {
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('charts');
  const [historyFilter, setHistoryFilter] =
    useState<HistoryFilter>('reading');
  const [dataTransferBusy, setDataTransferBusy] = useState(false);
  const [dataTransferMessage, setDataTransferMessage] = useState<string | null>(
    null
  );
  const [showDataTools, setShowDataTools] = useState(false);
  const filteredResults = results.filter(
    (result) => classifyHistoryResult(result) === historyFilter
  );
  const readingProfile = calculateReadingPerformanceProfile(results);
  const weakestMeasuredSkill = calculateTrainingSkillProfile(results)
    .filter((skill) => skill.score !== undefined)
    .sort(
      (first, second) => (first.score ?? 101) - (second.score ?? 101)
    )[0];

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

  async function exportData() {
    if (dataTransferBusy) return;
    setDataTransferBusy(true);
    setDataTransferMessage(null);
    try {
      await downloadDataBackup();
      setDataTransferMessage('Backup downloaded.');
    } catch {
      setDataTransferMessage('Unable to create the backup file.');
    } finally {
      setDataTransferBusy(false);
    }
  }

  async function importData() {
    if (dataTransferBusy) return;
    setDataTransferBusy(true);
    setDataTransferMessage(null);
    try {
      const backup = await pickDataBackup();
      await restoreDataBackup(backup);
      setResults(await loadResults());
      await onDataRestored?.();
      setDataTransferMessage('Backup restored. Your saved data is ready.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setDataTransferMessage(
        error instanceof Error ? error.message : 'Unable to restore this backup.'
      );
    } finally {
      setDataTransferBusy(false);
    }
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
              <Text style={styles.summaryLabel}>Sustainable pace</Text>
              <Text style={styles.summaryValue}>
                {readingProfile.sustainableWpm !== undefined
                  ? `${readingProfile.sustainableWpm} wpm`
                  : readingProfile.ready
                    ? 'Build comprehension'
                  : 'Not enough readings'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Comprehension</Text>
              <Text style={styles.summaryValue}>
                {readingProfile.total > 0
                  ? `${readingProfile.comprehensionPercent}%`
                  : '—'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Confidence</Text>
              <Text style={styles.summaryValue}>
                {readingProfile.confidence[0].toUpperCase() +
                  readingProfile.confidence.slice(1)}
              </Text>
              <Text style={styles.summaryDetail}>
                {readingProfile.validPassageCount} valid passage
                {readingProfile.validPassageCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
          <Text style={styles.uncertaintyText}>
            {readingProfile.recommendation}{' '}
            {readingProfile.ready
              ? 'This is a personal training estimate, not a diagnostic score.'
              : 'Short or extreme attempts remain visible but are excluded.'}
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
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Next focus</Text>
            <Text style={styles.summaryValue}>
              {weakestMeasuredSkill?.label ?? 'Build a baseline'}
            </Text>
            {weakestMeasuredSkill && (
              <Text style={styles.summaryDetail}>
                {weakestMeasuredSkill.score}% ·{' '}
                {weakestMeasuredSkill.sessionCount} scored session
                {weakestMeasuredSkill.sessionCount === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        </View>
      )}

      {Platform.OS === 'web' && (
        <View style={styles.dataCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showDataTools }}
            onPress={() => setShowDataTools((visible) => !visible)}
            style={styles.dataToggle}
            testID="toggle-data-tools"
          >
            <Text style={styles.dataTitle}>Backup & restore</Text>
            <Text style={styles.dataToggleIcon}>
              {showDataTools ? '−' : '+'}
            </Text>
          </Pressable>
          {showDataTools && (
            <>
              <Text style={styles.dataDescription}>
                Download history, levels, preferences, favorites, and your
                offline reading library. Restore it after changing browsers or
                reinstalling the app.
              </Text>
              {dataTransferMessage && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.dataMessage}
                >
                  {dataTransferMessage}
                </Text>
              )}
              <View style={styles.dataActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={dataTransferBusy}
                  onPress={exportData}
                  style={styles.dataButton}
                  testID="export-app-data"
                >
                  <Text style={styles.dataButtonText}>Download backup</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={dataTransferBusy}
                  onPress={importData}
                  style={[styles.dataButton, styles.dataButtonSecondary]}
                  testID="import-app-data"
                >
                  <Text style={styles.dataButtonSecondaryText}>
                    Restore backup
                  </Text>
                </Pressable>
              </View>
            </>
          )}
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
  const schulteGridMode = getSchulteGridModeLabel(item);
  if (schulteGridMode) parts.push(schulteGridMode);
  const mistakes = item.details?.mistakes;
  if (
    schulteGridMode &&
    typeof mistakes === 'number' &&
    Number.isFinite(mistakes)
  ) {
    parts.push(`${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}`);
  }
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
  dataCard: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.cardBackground,
  },
  dataToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  dataToggleIcon: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '700',
  },
  dataDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  dataMessage: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  dataActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  dataButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: colors.interactivePrimary,
  },
  dataButtonSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  dataButtonText: {
    color: colors.onInteractive,
    fontSize: 12,
    fontWeight: '800',
  },
  dataButtonSecondaryText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
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
  summaryDetail: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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
