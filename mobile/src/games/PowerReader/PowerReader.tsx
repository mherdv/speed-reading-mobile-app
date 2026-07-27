import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Popover, { PopoverPlacement, Rect } from 'react-native-popover-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { updateProgress, levelToStars } from '../../data/progressStore';
import { colors } from '../../theme/colors';
import { loadResults } from '../../data/resultsStore';
import { ARTICLES } from '../../data/articles';
import { useAutoStart, useGameProgress } from '../gameHooks';
import { StatsRow } from '../../ui/StatsRow';
import { GameDifficultyControl } from '../../ui/GameDifficultyControl';
import {
  fetchFreeBooksPage,
  fetchFreeBookText,
  finalizeBookArticle,
  type FreeBooksPage,
  type PowerReaderArticle,
} from './powerReaderContent';

const GAME_ID = 'PowerReader';
const BOOK_PROGRESS_KEY = 'powerReaderBookProgress';
const RECENT_BOOKS_KEY = 'powerReaderRecentBooks';
const MAX_RECENT_BOOKS = 3;

type Intensity = 'beginner' | 'intermediate' | 'advanced';

const INTENSITY_CONFIG: Record<Intensity, { wpm: number; label: string; chunkSize: number; color: string }> = {
  beginner: { wpm: 150, label: 'Beginner', chunkSize: 2, color: '#10B981' },
  intermediate: { wpm: 300, label: 'Intermediate', chunkSize: 3, color: colors.interactivePrimary },
  advanced: { wpm: 500, label: 'Advanced', chunkSize: 5, color: '#6366F1' },
};

function difficultyToIntensity(difficulty: Difficulty): Intensity {
  if (difficulty === 'easy') return 'beginner';
  if (difficulty === 'hard') return 'advanced';
  return 'intermediate';
}

type GameReportPayload = {
  elapsedMs?: number;
  startedAtIso?: string;
  finishedAtIso?: string;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
};

type Props = {
  text?: string;
  chunkSize?: number;
  intervalMs?: number;
  autoStart?: boolean;
  onReportResult?: (payload: GameReportPayload) => void;
};

type Phase = 'idle' | 'running' | 'ended';

const WORDS_PER_PAGE = 180;
const starterArticle = ARTICLES[0];
const STARTER_ARTICLE: PowerReaderArticle = {
  id: `starter-${starterArticle.id}`,
  title: starterArticle.title,
  author: 'SpeedRead library',
  description: 'A short offline article, ready whenever you are.',
  text: starterArticle.text,
  source: 'Built-in library',
  difficulty: starterArticle.difficulty,
  wordCount: starterArticle.wordCount,
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export default function PowerReader({
  text: textProp,
  chunkSize: chunkSizeProp,
  intervalMs: intervalMsProp,
  autoStart = false,
  onReportResult,
  difficulty = 'medium',
}: Props & { difficulty?: Difficulty }) {
  const [articles, setArticles] = useState<PowerReaderArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<PowerReaderArticle | null>(
    textProp
      ? {
          id: 'custom-text',
          title: 'Custom Text',
          author: 'Provided',
          description: 'Provided text',
          text: textProp,
          source: 'Custom',
          difficulty: 'medium',
          wordCount: textProp.split(/\s+/).filter(Boolean).length,
        }
      : STARTER_ARTICLE
  );
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articlesError, setArticlesError] = useState<string | null>(null);
  const [booksRequested, setBooksRequested] = useState(false);
  const [loadingBook, setLoadingBook] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [booksPage, setBooksPage] = useState(1);
  const [nextBooksPage, setNextBooksPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [booksTotalCount, setBooksTotalCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentBooks, setRecentBooks] = useState<PowerReaderArticle[]>([]);
  const [resumeFromSaved, setResumeFromSaved] = useState(false);
  const [recentProgress, setRecentProgress] = useState<Record<string, { pageIndex: number; highlightIndex: number }>>({});
  const [translateVisible, setTranslateVisible] = useState(false);
  const [translateSource, setTranslateSource] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState<'word' | 'phrase' | 'sentence'>('word');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ru');
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const pageCardRef = useRef<View | null>(null);
  const [translateAnchorRect, setTranslateAnchorRect] = useState<Rect | null>(null);

  const activeArticle = selectedArticle;
  const text = activeArticle?.text ?? '';

  const [phase, setPhase] = useState<Phase>('idle');
  const {
    gameProgress,
    setGameProgress,
    selectedDifficulty,
    progressLoaded,
  } = useGameProgress(GAME_ID, difficulty);
  const selectedIntensity = difficultyToIntensity(difficulty);
  const [targetWpm, setTargetWpm] = useState(
    INTENSITY_CONFIG[selectedIntensity].wpm
  );
  const [bestWpm, setBestWpm] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadBestWpm() {
      const results = await loadResults();
      const powerReaderResults = results.filter(r => r.sampleId === GAME_ID);
      const maxWpm = powerReaderResults.reduce((max, r) => Math.max(max, r.wpm || r.score || 0), 0);
      setBestWpm(maxWpm);
    }
    loadBestWpm();
  }, []);

  useEffect(() => {
    if (!textProp) return;
    setSelectedArticle({
      id: 'custom-text',
      title: 'Custom Text',
      author: 'Provided',
      description: 'Provided text',
      text: textProp,
      source: 'Custom',
      difficulty: 'medium',
      wordCount: textProp.split(/\s+/).filter(Boolean).length,
    });
  }, [textProp]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (textProp) return;
    loadRecentBooks()
      .then((items) => setRecentBooks(items))
      .catch(() => undefined);
    loadRecentProgress()
      .then((items) => setRecentProgress(items))
      .catch(() => undefined);
  }, [textProp]);

  useEffect(() => {
    if (textProp || !booksRequested) return;
    let isActive = true;
    async function loadBooks() {
      setLoadingArticles(true);
      setArticlesError(null);
      try {
        const pageResponse: FreeBooksPage = await fetchFreeBooksPage(1, 12, debouncedQuery);
        if (!isActive) return;
        setArticles(pageResponse.items);
        setBooksPage(1);
        setNextBooksPage(pageResponse.nextPage);
        setBooksTotalCount(pageResponse.totalCount);
        if (pageResponse.items.length === 0) {
          setArticlesError(debouncedQuery ? 'No matching books found.' : 'No books found. Pull to refresh.');
        }
      } catch (error) {
        if (!isActive) return;
        setArticlesError('Unable to load free books. Try again.');
      } finally {
        if (isActive) setLoadingArticles(false);
      }
    }

    loadBooks();
    return () => {
      isActive = false;
    };
  }, [textProp, booksRequested, debouncedQuery]);


  useAutoStart(autoStart, phase, progressLoaded, start);

  const intensityConfig = INTENSITY_CONFIG[selectedIntensity];
  const chunkSize = chunkSizeProp ?? intensityConfig.chunkSize;

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const pages = useMemo(() => {
    const list: string[][] = [];
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      list.push(words.slice(i, i + WORDS_PER_PAGE));
    }
    return list;
  }, [words]);

  useEffect(() => {
    if (!pendingStart) return;
    if (!text.trim() || pages.length === 0 || phase !== 'idle') return;
    setPendingStart(false);
    start(true);
  }, [pendingStart, text, pages.length, phase]);

  const [pageIndex, setPageIndex] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(0);
  const reportedRef = useRef(false);
  const cancelledRef = useRef(false);
  const pageIndexRef = useRef(0);
  const highlightIndexRef = useRef(0);
  const pagesRef = useRef<string[][]>([]);
  const selectedArticleIdRef = useRef<string | null>(null);
  const targetWpmRef = useRef(200);
  const pausedRef = useRef(false);
  const pauseStartedAtRef = useRef<number | null>(null);
  const resumeFromSavedRef = useRef(false);
  const wordLayoutsRef = useRef<Record<number, { x: number; y: number; width: number; height: number }>>({});

  async function loadBookProgress(bookId: string) {
    const raw = await AsyncStorage.getItem(BOOK_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, { pageIndex: number; highlightIndex: number }>;
    return parsed[bookId] ?? null;
  }

  async function saveBookProgress(bookId: string, pageIndexValue: number, highlightIndexValue: number) {
    const raw = await AsyncStorage.getItem(BOOK_PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { pageIndex: number; highlightIndex: number }>) : {};
    const next = {
      ...parsed,
      [bookId]: { pageIndex: pageIndexValue, highlightIndex: highlightIndexValue },
    };
    await AsyncStorage.setItem(BOOK_PROGRESS_KEY, JSON.stringify(next));
    setRecentProgress(next);
  }

  async function loadRecentBooks() {
    const raw = await AsyncStorage.getItem(RECENT_BOOKS_KEY);
    if (!raw) return [] as PowerReaderArticle[];
    return JSON.parse(raw) as PowerReaderArticle[];
  }

  async function loadRecentProgress() {
    const raw = await AsyncStorage.getItem(BOOK_PROGRESS_KEY);
    if (!raw) return {} as Record<string, { pageIndex: number; highlightIndex: number }>;
    return JSON.parse(raw) as Record<string, { pageIndex: number; highlightIndex: number }>;
  }

  async function saveRecentBook(book: PowerReaderArticle) {
    const raw = await AsyncStorage.getItem(RECENT_BOOKS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PowerReaderArticle[]) : [];
    const minimal: PowerReaderArticle = { ...book, text: '' };
    const next = [minimal, ...parsed.filter((item) => item.id !== minimal.id)].slice(0, MAX_RECENT_BOOKS);
    await AsyncStorage.setItem(RECENT_BOOKS_KEY, JSON.stringify(next));
    setRecentBooks(next);
  }

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
    };
  }, []);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    selectedArticleIdRef.current = selectedArticle?.id ?? null;
  }, [selectedArticle?.id]);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
    highlightIndexRef.current = highlightIndex;
  }, [pageIndex, highlightIndex]);

  useEffect(() => {
    if (isPaused) return;
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionBox(null);
    setTranslateVisible(false);
    setTranslateSource('');
    setTranslateResult('');
    setTranslateError(null);
  }, [isPaused]);


  useEffect(() => {
    if (!selectedArticle?.id) return;
    saveBookProgress(selectedArticle.id, pageIndex, highlightIndex).catch(() => undefined);
  }, [selectedArticle?.id, pageIndex, highlightIndex]);

  useEffect(() => {
    return () => {
      const id = selectedArticleIdRef.current;
      if (!id) return;
      saveBookProgress(id, pageIndexRef.current, highlightIndexRef.current).catch(() => undefined);
    };
  }, []);

  function scheduleNextChunk() {
    if (pausedRef.current) return;
    const currentInterval =
      intervalMsProp ?? Math.round((chunkSize / targetWpmRef.current) * 60000);
    chunkTimerRef.current = setTimeout(() => {
      if (cancelledRef.current || pausedRef.current) return;
      const pageWords = pagesRef.current[pageIndexRef.current] ?? [];
      const nextHighlight = highlightIndexRef.current + chunkSize;

      if (nextHighlight >= pageWords.length) {
        const nextPage = pageIndexRef.current + 1;
        if (nextPage >= pagesRef.current.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          finish();
          return;
        }
        pageIndexRef.current = nextPage;
        highlightIndexRef.current = 0;
        setPageIndex(nextPage);
        setHighlightIndex(0);
      } else {
        highlightIndexRef.current = nextHighlight;
        setHighlightIndex(nextHighlight);
      }
      scheduleNextChunk();
    }, currentInterval);
  }

  function start(force = false) {
    cancelledRef.current = false;
    if (!force && phase !== 'idle') return;
    if (!text.trim() || pages.length === 0) return;
    reportedRef.current = false;
    if (!resumeFromSavedRef.current) {
      pageIndexRef.current = 0;
      highlightIndexRef.current = 0;
      setPageIndex(0);
      setHighlightIndex(0);
    }
    targetWpmRef.current = intensityConfig.wpm;
    setTargetWpm(intensityConfig.wpm);
    setPhase('running');
    setElapsed(0);
    startRef.current = Date.now();
    pausedRef.current = false;
    setIsPaused(false);
    pauseStartedAtRef.current = null;
    setResumeFromSaved(false);
    resumeFromSavedRef.current = false;

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);

    scheduleNextChunk();
  }

  function adjustSpeed(delta: number) {
    const newWpm = Math.max(50, Math.min(600, targetWpmRef.current + delta));
    targetWpmRef.current = newWpm;
    setTargetWpm(newWpm);
  }

  function togglePause() {
    if (phase !== 'running') return;
    if (pausedRef.current) {
      pausedRef.current = false;
      setIsPaused(false);
      if (pauseStartedAtRef.current) {
        const pausedFor = Date.now() - pauseStartedAtRef.current;
        startRef.current += pausedFor;
        pauseStartedAtRef.current = null;
      }
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 100);
      scheduleNextChunk();
      return;
    }
    pausedRef.current = true;
    setIsPaused(true);
    pauseStartedAtRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
  }

  function finish() {
    if (reportedRef.current || cancelledRef.current) return;
    reportedRef.current = true;

    const now = Date.now();
    const elapsedMs = Math.max(1, now - startRef.current);
    const wordsRead = words.length;
    const wpm = Math.round((wordsRead / elapsedMs) * 60000);

    // Save progress - completing the reading is always success
    updateProgress(GAME_ID, true, wpm).then(({ progress }) => {
      if (cancelledRef.current) return;
      setGameProgress(progress);
    }).catch(() => undefined);

    setPhase('ended');
    onReportResult?.({
      startedAtIso: new Date(startRef.current).toISOString(),
      finishedAtIso: new Date(now).toISOString(),
      elapsedMs,
      score: wpm,
      details: {
        activityType: 'paced-reading',
        wordCount: wordsRead,
        wpm,
        wordsRead,
        pagesShown: pages.length,
        difficulty: selectedDifficulty,
        articleTitle: activeArticle?.title,
      },
    });
  }

  function playAgain() {
    start(true);
  }

  function goToNextPage() {
    if (pageIndexRef.current + 1 >= pages.length) return;
    const nextPage = pageIndexRef.current + 1;
    pageIndexRef.current = nextPage;
    highlightIndexRef.current = 0;
    setPageIndex(nextPage);
    setHighlightIndex(0);
  }

  function goToPrevPage() {
    if (pageIndexRef.current <= 0) return;
    const prevPage = pageIndexRef.current - 1;
    pageIndexRef.current = prevPage;
    highlightIndexRef.current = 0;
    setPageIndex(prevPage);
    setHighlightIndex(0);
  }

  async function handleSelectArticle(article: PowerReaderArticle) {
    if (loadingBook) return;
    setLoadingBook(true);
    setArticlesError(null);
    try {
      const textContent = article.text || (article.formats ? await fetchFreeBookText(article.formats) : '');
      if (!textContent) {
        setArticlesError('No readable text found for this book.');
        return;
      }
      const finalized = finalizeBookArticle(article, textContent);
      const saved = await loadBookProgress(finalized.id);
      if (saved) {
        setResumeFromSaved(true);
        resumeFromSavedRef.current = true;
        setPageIndex(saved.pageIndex);
        setHighlightIndex(saved.highlightIndex);
        pageIndexRef.current = saved.pageIndex;
        highlightIndexRef.current = saved.highlightIndex;
      } else {
        setResumeFromSaved(false);
        resumeFromSavedRef.current = false;
        setPageIndex(0);
        setHighlightIndex(0);
        pageIndexRef.current = 0;
        highlightIndexRef.current = 0;
      }
      setSelectedArticle(finalized);
      await saveRecentBook(finalized);
      setPendingStart(true);
    } catch (error) {
      setArticlesError('Unable to load book text. Try another book.');
    } finally {
      setLoadingBook(false);
    }
  }

  function handleDownloadBook(article: PowerReaderArticle) {
    if (!article.downloadUrl) {
      setArticlesError('No download available for this book.');
      return;
    }
    Linking.openURL(article.downloadUrl).catch(() => {
      setArticlesError('Unable to open download link.');
    });
  }

  async function handleLoadMoreBooks() {
    if (!nextBooksPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetchFreeBooksPage(nextBooksPage, 12, debouncedQuery);
      setArticles((prev) => [...prev, ...response.items]);
      setNextBooksPage(response.nextPage);
      setBooksPage(nextBooksPage);
      setBooksTotalCount(response.totalCount);
    } catch (error) {
      setArticlesError('Unable to load more books.');
    } finally {
      setLoadingMore(false);
    }
  }

  const pageWords = pages[pageIndex] ?? [];
  const highlightStart = highlightIndex;
  const highlightEnd = Math.min(highlightIndex + chunkSize, pageWords.length);
  const wordsRead = Math.min(words.length, pageIndex * WORDS_PER_PAGE + highlightEnd);
  const progress = words.length > 0 ? (wordsRead / words.length) * 100 : 0;

  const filteredArticles = articles;

  const translateAnchor = useMemo(() => {
    if (!selectionBox) return null;
    return {
      left: selectionBox.left,
      right: selectionBox.right,
      top: selectionBox.top,
      bottom: selectionBox.bottom,
    };
  }, [selectionBox]);

  useEffect(() => {
    if (!selectionBox || !pageCardRef.current) {
      setTranslateAnchorRect(null);
      return;
    }
    pageCardRef.current.measure((x, y, width, height, pageX, pageY) => {
      const rectWidth = Math.max(2, selectionBox.right - selectionBox.left);
      const rectHeight = Math.max(2, selectionBox.bottom - selectionBox.top);
      const left = pageX + selectionBox.left;
      const top = pageY + selectionBox.top;
      setTranslateAnchorRect(new Rect(left, top, rectWidth, rectHeight));
    });
  }, [selectionBox]);

  async function translateText(textToTranslate: string) {
    const trimmed = textToTranslate.trim();
    if (!trimmed) return;
    setTranslateVisible(true);
    setTranslateSource(trimmed);
    setTranslateResult('');
    setTranslateError(null);
    setTranslateLoading(true);
    try {
      if (Platform.OS === 'web') {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${sourceLanguage}|${targetLanguage}`
        );
        if (!response.ok) throw new Error('Translation failed');
        const data = (await response.json()) as { responseData?: { translatedText?: string } };
        setTranslateResult(data.responseData?.translatedText ?? '');
      } else {
        const response = await fetch('https://libretranslate.de/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: trimmed, source: sourceLanguage, target: targetLanguage, format: 'text' }),
        });
        if (!response.ok) {
          throw new Error('Translation failed');
        }
        const data = (await response.json()) as { translatedText?: string };
        setTranslateResult(data.translatedText ?? '');
      }
    } catch (error) {
      setTranslateError('Translation unavailable.');
    } finally {
      setTranslateLoading(false);
    }
  }

  function handleTranslateHighlight() {
    if (!isPaused) return;
    const selection = getSelectionText();
    ensureSelectionBox();
    translateText(selection);
  }

  function getSelectionText() {
    if (selectionStart === null || selectionEnd === null) return '';
    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    return pageWords.slice(start, end + 1).join(' ');
  }

  function getSentenceRange(index: number) {
    let start = index;
    let end = index;
    for (let i = index - 1; i >= 0; i -= 1) {
      start = i;
      if (/[.!?]$/.test(pageWords[i])) break;
    }
    for (let i = index; i < pageWords.length; i += 1) {
      end = i;
      if (/[.!?]$/.test(pageWords[i])) break;
    }
    return { start, end };
  }

  function updateSelectionBox(startIndex: number, endIndex: number) {
    const start = Math.min(startIndex, endIndex);
    const end = Math.max(startIndex, endIndex);
    const boxes = [] as Array<{ x: number; y: number; width: number; height: number }>;
    for (let i = start; i <= end; i += 1) {
      const layout = wordLayoutsRef.current[i];
      if (layout) boxes.push(layout);
    }
    if (boxes.length === 0) {
      setSelectionBox(null);
      return;
    }
    const left = Math.min(...boxes.map((b) => b.x));
    const right = Math.max(...boxes.map((b) => b.x + b.width));
    const top = Math.min(...boxes.map((b) => b.y));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    setSelectionBox({ left, right, top, bottom });
  }

  function ensureSelectionBox() {
    if (selectionStart === null || selectionEnd === null) return;
    updateSelectionBox(selectionStart, selectionEnd);
  }

  function handleSelectWord(index: number) {
    if (!isPaused) return;
    setTranslateVisible(false);
    setTranslateSource('');
    setTranslateResult('');
    setTranslateError(null);
    if (selectionMode === 'word') {
      setSelectionStart(index);
      setSelectionEnd(index);
      updateSelectionBox(index, index);
      return;
    }
    if (selectionMode === 'sentence') {
      const range = getSentenceRange(index);
      setSelectionStart(range.start);
      setSelectionEnd(range.end);
      updateSelectionBox(range.start, range.end);
      return;
    }
    if (selectionStart === null) {
      setSelectionStart(index);
      setSelectionEnd(index);
      updateSelectionBox(index, index);
      return;
    }
    setSelectionEnd(index);
    updateSelectionBox(selectionStart, index);
  }

  function findWordIndexAtPoint(x: number, y: number) {
    const entries = Object.entries(wordLayoutsRef.current);
    for (const [key, layout] of entries) {
      if (x >= layout.x && x <= layout.x + layout.width && y >= layout.y && y <= layout.y + layout.height) {
        return Number(key);
      }
    }
    return null;
  }

  function handleSelectionStart(x: number, y: number) {
    const index = findWordIndexAtPoint(x, y);
    if (index === null) return;
    setTranslateVisible(false);
    setTranslateSource('');
    setTranslateResult('');
    setTranslateError(null);
    handleSelectWord(index);
  }

  function handleSelectionMove(x: number, y: number) {
    if (selectionMode !== 'phrase') return;
    if (selectionStart === null) return;
    const index = findWordIndexAtPoint(x, y);
    if (index === null) return;
    setSelectionEnd(index);
    updateSelectionBox(selectionStart, index);
  }

  return (
    <View style={styles.container}>
      {phase === 'idle' && (
        <ScrollView contentContainerStyle={styles.idleContent}>
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <Svg width={48} height={48} viewBox="0 0 100 100" fill="none">
              {/* Speedometer outline */}
              <Path
                d="M20 60 A35 35 0 1 1 80 60"
                stroke="#4B5563"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              {/* Speedometer tick marks */}
              <Path d="M25 50 L30 52" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M35 38 L38 42" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M50 32 L50 38" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M65 38 L62 42" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              <Path d="M75 50 L70 52" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
              {/* Needle */}
              <Path d="M50 55 L68 40" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
              <Circle cx="50" cy="55" r="5" fill="#4B5563" />
            </Svg>
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>Power Reader</Text>

          {/* Description */}
          <Text style={styles.heroDescription}>
            Start with an offline article, or choose a free book to train guided pacing.
          </Text>

          {!textProp && (
            <View style={styles.contentPanel}>
              <Text style={styles.sectionLabel}>Ready offline</Text>
              <View style={[styles.articleCard, styles.articleCardActive]}>
                <View style={styles.articleMain}>
                  <View style={styles.articleCoverFallback}>
                    <Text style={styles.articleCoverText}>A</Text>
                  </View>
                  <View style={styles.articleInfo}>
                    <Text style={[styles.articleTitle, styles.articleTitleActive]}>
                      {STARTER_ARTICLE.title}
                    </Text>
                    <Text style={styles.articleAuthor}>{STARTER_ARTICLE.author}</Text>
                    <Text style={[styles.articleDescription, styles.articleDescriptionActive]}>
                      {STARTER_ARTICLE.wordCount} words · {STARTER_ARTICLE.difficulty}
                    </Text>
                  </View>
                </View>
              </View>

              {recentBooks.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={styles.sectionLabel}>Recently Read</Text>
                  <View style={styles.articleList}>
                    {recentBooks.map((article) => (
                      <View key={article.id} style={styles.articleCard}>
                        <Pressable accessibilityRole="button"
                          style={styles.articleMain}
                          onPress={() => handleSelectArticle(article)}
                        >
                          {article.imageUrl ? (
                            <Image source={{ uri: article.imageUrl }} style={styles.articleCover} />
                          ) : (
                            <View style={styles.articleCoverFallback}>
                              <Text style={styles.articleCoverText}>📖</Text>
                            </View>
                          )}
                          <View style={styles.articleInfo}>
                            <Text style={styles.articleTitle}>{article.title}</Text>
                            <Text style={styles.articleAuthor}>{article.author}</Text>
                            <Text style={styles.articleMeta}>{article.source}</Text>
                            {recentProgress[article.id] && (
                              <Text style={styles.articleProgress}>
                                Page {recentProgress[article.id].pageIndex + 1}
                              </Text>
                            )}
                          </View>
                        </Pressable>
                        <View style={styles.articleActions}>
                          <Pressable accessibilityRole="button"
                            style={styles.actionButton}
                            onPress={() => handleSelectArticle(article)}
                          >
                            <Text style={styles.actionButtonText}>Resume</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.sectionLabel}>
                Free Books{booksTotalCount ? ` (${booksTotalCount})` : ''}
              </Text>

              {!booksRequested ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.actionButtonOutline}
                  onPress={() => setBooksRequested(true)}
                >
                  <Text style={styles.actionButtonOutlineText}>Browse Project Gutenberg</Text>
                </Pressable>
              ) : (
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search title or author"
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                />
              )}

              {loadingArticles && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#6366F1" />
                  <Text style={styles.loadingText}>Loading free books...</Text>
                </View>
              )}
              {loadingBook && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#6366F1" />
                  <Text style={styles.loadingText}>Loading book text...</Text>
                </View>
              )}
              {articlesError && <Text style={styles.errorText}>{articlesError}</Text>}

              {filteredArticles.length > 0 && (
                <View style={styles.articleList}>
                  {filteredArticles.map((article) => {
                    const isActive = selectedArticle?.id === article.id;
                    return (
                      <View key={article.id} style={[styles.articleCard, isActive && styles.articleCardActive]}>
                        <Pressable accessibilityRole="button"
                          style={styles.articleMain}
                          onPress={() => handleSelectArticle(article)}
                        >
                          {article.imageUrl ? (
                            <Image source={{ uri: article.imageUrl }} style={styles.articleCover} />
                          ) : (
                            <View style={styles.articleCoverFallback}>
                              <Text style={styles.articleCoverText}>📖</Text>
                            </View>
                          )}
                          <View style={styles.articleInfo}>
                            <Text style={[styles.articleTitle, isActive && styles.articleTitleActive]}>
                              {article.title}
                            </Text>
                            <Text style={styles.articleAuthor}>{article.author}</Text>
                            <Text style={[styles.articleDescription, isActive && styles.articleDescriptionActive]}>
                              {article.description}
                            </Text>
                            <Text style={styles.articleMeta}>{article.source}</Text>
                          </View>
                        </Pressable>
                        <View style={styles.articleActions}>
                          <Pressable accessibilityRole="button"
                            style={styles.actionButton}
                            onPress={() => handleSelectArticle(article)}
                          >
                            <Text style={styles.actionButtonText}>Read</Text>
                          </Pressable>
                          <Pressable accessibilityRole="button"
                            style={styles.actionButtonOutline}
                            onPress={() => handleDownloadBook(article)}
                          >
                            <Text style={styles.actionButtonOutlineText}>Download</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                  {nextBooksPage && (
                    <Pressable accessibilityRole="button"
                      style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
                      onPress={handleLoadMoreBooks}
                      disabled={loadingMore}
                    >
                      <Text style={styles.loadMoreText}>
                        {loadingMore ? 'Loading…' : 'Load More Books'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}

          <GameDifficultyControl />

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{bestWpm || '—'}</Text>
              <Text style={styles.statDescription}>Best WPM</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>Lvl {gameProgress.level}</Text>
              <Text style={styles.statDescription}>Current Mastery</Text>
            </View>
          </View>

          {/* Start Button */}
          <Pressable accessibilityRole="button"
            testID="start-button"
            style={[styles.startBtnWrapper, !text.trim() && styles.startBtnDisabled]}
            onPress={() => start()}
            disabled={!text.trim()}
          >
            <LinearGradient
              colors={[colors.interactivePrimary, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtnGradient}
            >
              <Text style={styles.startBtnText}>
                {text.trim() ? 'START TRAINING' : 'SELECT A BOOK'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      )}

      {phase === 'running' && (
        <View style={styles.gameArea}>
          <StatsRow
            style={styles.statsRow}
            items={[
              {
                key: 'progress',
                value: `${Math.round(progress)}%`,
                label: 'Progress',
                containerStyle: [styles.statBox, styles.progressBox],
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
              {
                key: 'page',
                value: `${Math.min(pageIndex + 1, pages.length)}/${Math.max(pages.length, 1)}`,
                label: 'Page',
                containerStyle: styles.statBox,
                valueStyle: styles.statValue,
                labelStyle: styles.statLabel,
              },
            ]}
          />

          <View style={styles.speedControlRow}>
            <Pressable accessibilityRole="button"
              testID="speed-decrease"
              style={[styles.speedBtn, targetWpm <= 50 && styles.speedBtnDisabled]}
              onPress={() => adjustSpeed(-25)}
              disabled={targetWpm <= 50}
            >
              <Text style={styles.speedBtnText}>−</Text>
            </Pressable>
            <View style={styles.speedDisplay}>
              <Text style={styles.speedValue}>{targetWpm}</Text>
              <Text style={styles.speedLabel}>WPM</Text>
            </View>
            <Pressable accessibilityRole="button"
              testID="speed-increase"
              style={[styles.speedBtn, targetWpm >= 600 && styles.speedBtnDisabled]}
              onPress={() => adjustSpeed(25)}
              disabled={targetWpm >= 600}
            >
              <Text style={styles.speedBtnText}>+</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button"
            style={[styles.pauseButton, isPaused && styles.pauseButtonActive]}
            onPress={togglePause}
          >
            <Text style={styles.pauseButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </Pressable>

          {isPaused && (
            <View style={styles.selectionControls}>
              {(['word', 'phrase', 'sentence'] as const).map((mode) => (
                <Pressable accessibilityRole="button"
                  key={mode}
                  style={[styles.selectionChip, selectionMode === mode && styles.selectionChipActive]}
                  onPress={() => setSelectionMode(mode)}
                >
                  <Text
                    style={[styles.selectionChipText, selectionMode === mode && styles.selectionChipTextActive]}
                  >
                    {mode}
                  </Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" style={styles.selectionClear} onPress={() => {
                setSelectionStart(null);
                setSelectionEnd(null);
                setSelectionBox(null);
                setTranslateVisible(false);
              }}>
                <Text style={styles.selectionClearText}>Clear</Text>
              </Pressable>
            </View>
          )}

          {isPaused && (
            <View style={styles.languageControls}>
              <Text style={styles.languageLabel}>From</Text>
              {['en', 'ru', 'es', 'fr', 'de'].map((lang) => (
                <Pressable accessibilityRole="button"
                  key={`from-${lang}`}
                  style={[styles.languageChip, sourceLanguage === lang && styles.languageChipActive]}
                  onPress={() => setSourceLanguage(lang)}
                >
                  <Text
                    style={[styles.languageChipText, sourceLanguage === lang && styles.languageChipTextActive]}
                  >
                    {lang.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.languageLabel}>To</Text>
              {['ru', 'en', 'es', 'fr', 'de'].map((lang) => (
                <Pressable accessibilityRole="button"
                  key={`to-${lang}`}
                  style={[styles.languageChip, targetLanguage === lang && styles.languageChipActive]}
                  onPress={() => setTargetLanguage(lang)}
                >
                  <Text
                    style={[styles.languageChipText, targetLanguage === lang && styles.languageChipTextActive]}
                  >
                    {lang.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {isPaused && selectionStart !== null && selectionEnd !== null && !translateAnchor && (
            <Pressable accessibilityRole="button" style={styles.translateFallbackButton} onPress={handleTranslateHighlight}>
              <Text style={styles.translateFallbackText}>Translate</Text>
            </Pressable>
          )}

          <View style={styles.pageControls}>
            <Pressable accessibilityRole="button"
              style={[styles.pageButton, pageIndex <= 0 && styles.pageButtonDisabled]}
              onPress={goToPrevPage}
              disabled={pageIndex <= 0}
            >
              <Text style={styles.pageButtonText}>Prev Page</Text>
            </Pressable>
            <Text style={styles.pageProgressText}>
              Page {Math.min(pageIndex + 1, pages.length)} of {Math.max(pages.length, 1)}
            </Text>
            <Pressable accessibilityRole="button"
              style={[styles.pageButton, pageIndex + 1 >= pages.length && styles.pageButtonDisabled]}
              onPress={goToNextPage}
              disabled={pageIndex + 1 >= pages.length}
            >
              <Text style={styles.pageButtonText}>Next Page</Text>
            </Pressable>
          </View>

          <View
            testID="chunk-display"
            style={styles.pageCard}
            ref={pageCardRef}
            onStartShouldSetResponder={() => isPaused && selectionMode === 'phrase'}
            onMoveShouldSetResponder={() => isPaused && selectionMode === 'phrase'}
            onResponderGrant={(event) => {
              if (!isPaused || selectionMode !== 'phrase') return;
              const { locationX, locationY } = event.nativeEvent;
              handleSelectionStart(locationX, locationY);
            }}
            onResponderMove={(event) => {
              if (!isPaused || selectionMode !== 'phrase') return;
              const { locationX, locationY } = event.nativeEvent;
              handleSelectionMove(locationX, locationY);
            }}
          >
            <Text style={styles.pageText}>
              {pageWords.map((word, index) => {
                const isHighlighted = index >= highlightStart && index < highlightEnd;
                const isSelected =
                  selectionStart !== null &&
                  selectionEnd !== null &&
                  index >= Math.min(selectionStart, selectionEnd) &&
                  index <= Math.max(selectionStart, selectionEnd);
                return (
                  <Text
                    key={`${pageIndex}-${index}`}
                    style={[
                      styles.pageWord,
                      isHighlighted && styles.highlightWord,
                      isSelected && styles.selectedWord,
                    ]}
                    onPress={() => handleSelectWord(index)}
                    onLayout={(event) => {
                      const { x, y, width, height } = event.nativeEvent.layout;
                      wordLayoutsRef.current[index] = { x, y, width, height };
                      if (selectionStart !== null && selectionEnd !== null) {
                        updateSelectionBox(selectionStart, selectionEnd);
                      }
                    }}
                  >
                    {word}{' '}
                  </Text>
                );
              })}
            </Text>

            {isPaused && selectionStart !== null && selectionEnd !== null && translateAnchor && (
              <Pressable accessibilityRole="button"
                style={[
                  styles.translateIconButton,
                  {
                    position: 'absolute',
                    left: Math.max(translateAnchor.left + 10, 12),
                    top: Math.max(translateAnchor.top - 5, 6),
                  },
                ]}
                onPress={handleTranslateHighlight}
              >
                <Text style={styles.translateIconText}>🌐</Text>
              </Pressable>
            )}

            {isPaused && translateVisible && translateAnchorRect && (
              <Popover
                isVisible={translateVisible}
                onRequestClose={() => setTranslateVisible(false)}
                from={translateAnchorRect}
                placement={PopoverPlacement.TOP}
                popoverStyle={styles.translateTooltip}
              >
                <View>
                  <View style={styles.translateHeader}>
                    <Text style={styles.translateTitle}>Translation</Text>
                    <Pressable accessibilityRole="button" onPress={() => setTranslateVisible(false)}>
                      <Text style={styles.translateClose}>✕</Text>
                    </Pressable>
                  </View>
                  <ScrollView contentContainerStyle={styles.translateBodyContent}>
                    <Text style={styles.translateSourceText}>{translateSource}</Text>
                    {translateLoading && <Text style={styles.translateStatus}>Translating…</Text>}
                    {translateError && <Text style={styles.translateError}>{translateError}</Text>}
                    {!translateLoading && !translateError && (
                      <Text style={styles.translateResultText}>{translateResult || '—'}</Text>
                    )}
                  </ScrollView>
                </View>
              </Popover>
            )}
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      )}

      {phase === 'ended' && (
        <View testID="end-screen" style={styles.endCard}>
          <Text style={styles.endEmoji}>⚡</Text>
          <Text style={styles.endTitle}>Complete!</Text>
          <Text style={styles.endScore}>{Math.round((words.length / elapsed) * 60000)} WPM</Text>
          <Text style={styles.endMeta}>{words.length} words read</Text>
          <View style={styles.progressRow}>
            <Text style={styles.levelText}>Level {gameProgress.level}</Text>
            <Text style={styles.starsText}>
              {'★'.repeat(levelToStars(gameProgress.level))}
              {'☆'.repeat(5 - levelToStars(gameProgress.level))}
            </Text>
          </View>
          <Pressable accessibilityRole="button" testID="play-again" style={styles.playAgainBtn} onPress={playAgain}>
            <Text style={styles.playAgainText}>Read Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  idleContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  contentPanel: {
    marginBottom: 24,
  },
  recentSection: {
    marginBottom: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  articleList: {
    marginTop: 8,
  },
  articleCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  articleCardActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  articleMain: {
    flexDirection: 'row',
    gap: 12,
  },
  articleCover: {
    width: 64,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  articleCoverFallback: {
    width: 64,
    height: 96,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleCoverText: {
    fontSize: 24,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  articleTitleActive: {
    color: '#4338CA',
  },
  articleAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 4,
  },
  articleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  articleDescriptionActive: {
    color: '#4B5563',
  },
  articleMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 8,
  },
  articleProgress: {
    fontSize: 11,
    color: '#4F46E5',
    marginTop: 6,
    fontWeight: '600',
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonOutline: {
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionButtonOutlineText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loadMoreBtnDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  intensityLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  intensityWpm: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  selectedDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  statDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  startBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnDisabled: {
    opacity: 0.6,
  },
  startBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  // Running phase styles
  header: { marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  gameArea: { flex: 1, paddingHorizontal: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, marginTop: 12 },
  statBox: { alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  progressBox: { backgroundColor: '#E0E7FF' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
  statLabel: { fontSize: 10, color: '#6366F1' },
  speedControlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pauseButton: {
    alignSelf: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 16,
  },
  pauseButtonActive: {
    backgroundColor: '#4B5563',
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  selectionChip: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectionChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  selectionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    textTransform: 'capitalize',
  },
  selectionChipTextActive: {
    color: '#FFFFFF',
  },
  selectionClear: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectionClearText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  languageControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginRight: 6,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  languageChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  languageChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  translateIconButton: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  translateIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  translateFallbackButton: {
    alignSelf: 'center',
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  translateFallbackText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  translateTooltip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 260,
    zIndex: 20,
    elevation: 6,
    minWidth: 300
  },
  translateBodyContent: {
    paddingBottom: 2,
  },
  translateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  translateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  translateClose: {
    fontSize: 14,
    color: colors.textMuted,
  },
  translateSourceText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  translateResultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  translateStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  translateError: {
    fontSize: 12,
    color: '#EF4444',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  pageButton: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  pageProgressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  speedBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  speedBtnText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    lineHeight: 28,
  },
  speedDisplay: {
    alignItems: 'center',
    marginHorizontal: 16,
    minWidth: 70,
  },
  speedValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  speedLabel: {
    fontSize: 10,
    color: '#6366F1',
  },
  pageCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 200,
    position: 'relative',
  },
  pageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  pageWord: {
    color: '#111827',
  },
  highlightWord: {
    color: '#4F46E5',
  },
  selectedWord: {
    backgroundColor: '#FEF08A',
  },
  progressBar: { height: 8, backgroundColor: '#E0E7FF', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1' },
  endCard: { alignItems: 'center', paddingVertical: 20 },
  endEmoji: { fontSize: 40, marginBottom: 8 },
  endTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  endScore: { fontSize: 48, fontWeight: '800', color: '#6366F1', marginVertical: 8 },
  endMeta: { fontSize: 14, color: '#6B7280' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  levelText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  starsText: { fontSize: 16, color: colors.warningForeground },
  playAgainBtn: { marginTop: 16, backgroundColor: '#6366F1', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  playAgainText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
