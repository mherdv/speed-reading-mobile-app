import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GAME_DESCRIPTIONS } from '../../data/gameDescriptions';

const GAME_ID = 'TextSearch';

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

type Props = {
  paragraph?: string;
  targetWord?: string;
  difficulty?: Difficulty;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

// 15 different text variations with target words
const TEXT_VARIATIONS: { text: string; target: string }[] = [
  { text: 'The quick brown fox jumps over the lazy dog. The fox is very quick and agile. Dogs often chase after the fox but rarely catch it. The fox hides in the forest.', target: 'fox' },
  { text: 'A cat sat on the mat looking at the rat. The cat was very patient. Every cat knows how to wait. The other cat watched from the window.', target: 'cat' },
  { text: 'The dog ran through the park chasing butterflies. Every dog loves to run. The neighbor dog joined in the fun. My dog is the fastest.', target: 'dog' },
  { text: 'The sun rose over the mountains casting golden light. The morning sun warmed the valley. By noon the sun was bright. The setting sun painted the sky.', target: 'sun' },
  { text: 'Rain fell softly on the roof throughout the night. The rain brought fresh air. After the rain stopped flowers bloomed. Children played in the rain puddles.', target: 'rain' },
  { text: 'The bird sang a beautiful melody from the tree. Another bird joined in harmony. The small bird flew away. A colorful bird landed on the fence.', target: 'bird' },
  { text: 'The book on the shelf was old and dusty. I love to read a good book. The library has every book you need. My favorite book is about adventure.', target: 'book' },
  { text: 'The tree in the garden grew tall and strong. Under the tree we had picnics. The old tree had many stories. Birds nested in the tree branches.', target: 'tree' },
  { text: 'A fish swam in the clear blue water. The little fish was curious. Bigger fish swam nearby. We watched the fish for hours.', target: 'fish' },
  { text: 'The road stretched far into the distance. We traveled down the long road. Every road leads somewhere new. The dusty road was quiet today.', target: 'road' },
  { text: 'Stars appeared one by one in the night sky. Countless stars sparkled above. The brightest star guided travelers. We made wishes on falling stars.', target: 'star' },
  { text: 'The moon shone brightly over the ocean. A full moon lit up the night. The moon reflected on the water. We gazed at the moon together.', target: 'moon' },
  { text: 'The wind blew through the open window. A gentle wind carried autumn leaves. The strong wind bent the trees. The cold wind signaled winter.', target: 'wind' },
  { text: 'Fire crackled in the old stone fireplace. The campfire provided warmth. Fire danced in the darkness. We gathered around the fire to share stories.', target: 'fire' },
  { text: 'Water flowed gently down the mountain stream. Clean water filled the glass. The water was cool and refreshing. We swam in the crystal clear water.', target: 'water' },
];

function getDifficultyConfig(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return { timeLimit: null, showCount: true }; // No time limit, show target count
    case 'medium':
      return { timeLimit: 30000, showCount: true }; // 30 second limit
    case 'hard':
      return { timeLimit: 20000, showCount: false }; // 20 seconds, hidden count
  }
}

function getRandomVariation(): { text: string; target: string } {
  return TEXT_VARIATIONS[Math.floor(Math.random() * TEXT_VARIATIONS.length)];
}

export default function TextSearch({ 
  paragraph: paragraphProp, 
  targetWord: targetWordProp, 
  difficulty = 'medium',
  autoStart = false,
  onReportResult 
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [currentVariation, setCurrentVariation] = useState(getRandomVariation);
  
  const config = getDifficultyConfig(selectedDifficulty);
  const paragraph = paragraphProp ?? currentVariation.text;
  const targetWord = targetWordProp ?? currentVariation.target;
  
  const words = useMemo(() => paragraph.split(/\s+/).filter(Boolean), [paragraph]);
  const [found, setFound] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const foundRef = useRef<number[]>([]);

  const targetIndices = useMemo(() => {
    return words
      .map((w, i) => (w.toLowerCase().replace(/[^a-z]/gi, '') === targetWord.toLowerCase() ? i : -1))
      .filter((i) => i >= 0);
  }, [words, targetWord]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-start when autoStart prop is true
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && phase === 'idle' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      start();
    }
  }, [autoStart, phase]);

  function start() {
    if (phase !== 'idle') return;
    // Pick a new random variation each game
    setCurrentVariation(getRandomVariation());
    reportedRef.current = false;
    foundRef.current = [];
    setPhase('running');
    setFound([]);
    setElapsed(0);
    setFeedback(null);
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - startRef.current;
      setElapsed(elapsedMs);
      
      // Check time limit
      if (config.timeLimit && elapsedMs >= config.timeLimit) {
        finish();
      }
    }, 100);
  }

  function finish() {
    if (reportedRef.current) return;
    reportedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const now = Date.now();
    const elapsedMs = now - startRef.current;
    const accuracy = targetIndices.length > 0 ? foundRef.current.length / targetIndices.length : 0;

    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: foundRef.current.length * 10,
      accuracy,
      details: { targetWord, totalTargets: targetIndices.length, found: foundRef.current.length },
    });

    if (!onReportResult) {
      setPhase('ended');
    }
  }

  function tapWord(index: number) {
    if (phase !== 'running') return;
    if (found.includes(index)) return;

    if (targetIndices.includes(index)) {
      foundRef.current = [...foundRef.current, index];
      setFound([...foundRef.current]);
      setFeedback(index);
      setTimeout(() => setFeedback(null), 300);

      if (foundRef.current.length === targetIndices.length) {
        finish();
      }
    }
  }

  function playAgain() {
    start();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Text Search</Text>
        <Text testID="target-word" style={styles.subtitle}>Find all: <Text style={styles.targetHighlight}>"{targetWord}"</Text></Text>
      </View>

      {phase === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.descriptionText}>{GAME_DESCRIPTIONS[GAME_ID]}</Text>
          <Text style={styles.sectionLabel}>Select Difficulty:</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <Pressable
                key={d}
                testID={`difficulty-${d}`}
                style={[
                  styles.difficultyBtn,
                  selectedDifficulty === d && styles.difficultyBtnActive,
                ]}
                onPress={() => setSelectedDifficulty(d)}
              >
                <Text
                  style={[
                    styles.difficultyBtnText,
                    selectedDifficulty === d && styles.difficultyBtnTextActive,
                  ]}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
                <Text style={styles.difficultyMeta}>
                  {d === 'easy' ? 'No limit' : d === 'medium' ? '30s' : '20s'}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <Pressable testID="start-button" style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>Start Search</Text>
          </Pressable>
        </View>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <View testID="score-display" style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {config.showCount ? `${found.length}/${targetIndices.length}` : `${found.length}/?`}
              </Text>
              <Text style={styles.statLabel}>Found</Text>
            </View>
            <View style={[styles.statBox, styles.timerBox]}>
              <Text style={styles.statValue}>
                {config.timeLimit 
                  ? `${Math.max(0, (config.timeLimit - elapsed) / 1000).toFixed(1)}s`
                  : `${(elapsed / 1000).toFixed(1)}s`
                }
              </Text>
              <Text style={styles.statLabel}>{config.timeLimit ? 'Left' : 'Time'}</Text>
            </View>
          </View>

          <ScrollView testID="paragraph-display" style={styles.textBox}>
            <View style={styles.wordWrap}>
              {words.map((word, i) => {
                const isTarget = targetIndices.includes(i);
                const isFound = found.includes(i);
                const isFeedback = feedback === i;
                return (
                  <Pressable key={i} onPress={() => tapWord(i)}>
                    <Text
                      testID={`word-${i}`}
                      style={[
                        styles.word,
                        isFound && styles.wordFound,
                        isFeedback && styles.wordFeedback,
                      ]}
                    >
                      {word}{' '}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>🔍</Text>
          <Text style={styles.endTitle}>All Found!</Text>
          <Text style={styles.endScore}>{found.length * 10}</Text>
          <Text style={styles.endMeta}>Found {found.length} of {targetIndices.length} in {(elapsed / 1000).toFixed(1)}s</Text>
          <Pressable testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Search Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  targetHighlight: { color: '#0891B2', fontWeight: '700' },
  startBtn: { backgroundColor: '#0891B2', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  gameArea: { flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#CFFAFE', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  timerBox: { backgroundColor: '#A5F3FC' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#155E75' },
  statLabel: { fontSize: 10, color: '#0E7490' },
  textBox: { flex: 1, backgroundColor: '#ECFEFF', borderRadius: 12, padding: 12, borderWidth: 2, borderColor: '#67E8F9' },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  word: { fontSize: 16, color: '#155E75', lineHeight: 28 },
  wordFound: { backgroundColor: '#22D3EE', borderRadius: 4, color: 'white' },
  wordFeedback: { backgroundColor: '#10B981' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#0891B2', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  playAgainBtn: { marginTop: 16, backgroundColor: '#0891B2', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
  idleContent: { flex: 1 },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  difficultyRow: { flexDirection: 'row', marginBottom: 16 },
  difficultyBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 8, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: 'white' },
  difficultyBtnActive: { borderColor: '#0891B2', backgroundColor: '#CFFAFE' },
  difficultyBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  difficultyBtnTextActive: { color: '#155E75' },
  difficultyMeta: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
});
