import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ScrollView } from 'react-native';

import type { AttemptResult } from '../domain/types';
import { clearResults, loadResults } from '../data/resultsStore';
import { Button } from '../ui/Button';
import { ProgressCharts } from '../ui/ProgressCharts';
import { colors } from '../theme/colors';

type Props = {
  onBack: () => void;
  refreshToken: number;
};

type Tab = 'charts' | 'history';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress & History</Text>

      <View style={styles.tabRow}>
        <View 
          style={[styles.tab, activeTab === 'charts' && styles.tabActive]}
          onTouchEnd={() => setActiveTab('charts')}
        >
          <Text style={[styles.tabText, activeTab === 'charts' && styles.tabTextActive]}>📊 Charts</Text>
        </View>
        <View 
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onTouchEnd={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>📋 History</Text>
        </View>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: colors.backgroundDark,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
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
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.cardBackground,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: colors.textPrimary,
  },
  itemMeta: {
    color: colors.textSecondary,
  },
});
