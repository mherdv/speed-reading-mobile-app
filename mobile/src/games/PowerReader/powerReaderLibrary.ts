import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { PowerReaderArticle } from './powerReaderContent';

export const POWER_READER_LIBRARY_KEY = 'powerReaderLocalLibrary:v1';
export const MAX_LOCAL_ARTICLES = 20;
export const MAX_IMPORTED_CHARACTERS = 1_500_000;
export const MAX_LOCAL_LIBRARY_CHARACTERS = 2_000_000;

type ImportedTextFile = {
  name: string;
  text: string;
};

function decodeCommonHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&apos;': "'",
    '&#39;': "'",
    '&gt;': '>',
    '&lt;': '<',
    '&nbsp;': ' ',
    '&quot;': '"',
  };
  return text.replace(
    /&(amp|apos|#39|gt|lt|nbsp|quot);/gi,
    (entity) => entities[entity.toLocaleLowerCase()] ?? entity
  );
}

export function normalizeLocalText(text: string, fileName = ''): string {
  let normalized = text;
  if (/\.html?$/i.test(fileName) || /<\/?[a-z][\s\S]*>/i.test(text)) {
    normalized = normalized
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, '. ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  }
  return decodeCommonHtmlEntities(normalized)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*\.(?=\s|$)/g, '$1')
    .trim();
}

function titleFromFileName(fileName: string): string {
  const title = fileName
    .replace(/\.(txt|md|markdown|html?)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return title || 'Imported reading';
}

export function createLocalArticle({
  name,
  text,
  difficulty,
  now = Date.now(),
}: ImportedTextFile & {
  difficulty: PowerReaderArticle['difficulty'];
  now?: number;
}): PowerReaderArticle {
  const normalized = normalizeLocalText(text, name);
  if (!normalized) {
    throw new Error('The selected file does not contain readable text.');
  }
  if (normalized.length > MAX_IMPORTED_CHARACTERS) {
    throw new Error('This file is too large. Choose a text under 1.5 MB.');
  }
  const wordCount = normalized.split(/\s+/).length;
  return {
    id: `local-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: titleFromFileName(name),
    author: 'You',
    description: `${wordCount} words · saved on this device`,
    text: normalized,
    source: 'My offline library',
    difficulty,
    wordCount,
  };
}

function isLocalArticle(value: unknown): value is PowerReaderArticle {
  if (!value || typeof value !== 'object') return false;
  const article = value as Partial<PowerReaderArticle>;
  return (
    typeof article.id === 'string' &&
    typeof article.title === 'string' &&
    typeof article.text === 'string' &&
    article.text.length > 0 &&
    typeof article.wordCount === 'number' &&
    (article.difficulty === 'easy' ||
      article.difficulty === 'medium' ||
      article.difficulty === 'hard')
  );
}

export async function loadLocalArticles(): Promise<PowerReaderArticle[]> {
  try {
    const raw = await AsyncStorage.getItem(POWER_READER_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter(isLocalArticle).slice(0, MAX_LOCAL_ARTICLES)
      : [];
  } catch {
    return [];
  }
}

export async function saveLocalArticle(
  article: PowerReaderArticle
): Promise<PowerReaderArticle[]> {
  const current = await loadLocalArticles();
  const ordered = [
    article,
    ...current.filter((candidate) => candidate.id !== article.id),
  ];
  let storedCharacters = 0;
  const next = ordered
    .filter((candidate) => {
      if (
        storedCharacters + candidate.text.length >
        MAX_LOCAL_LIBRARY_CHARACTERS
      ) {
        return false;
      }
      storedCharacters += candidate.text.length;
      return true;
    })
    .slice(0, MAX_LOCAL_ARTICLES);
  await AsyncStorage.setItem(POWER_READER_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export async function removeLocalArticle(
  articleId: string
): Promise<PowerReaderArticle[]> {
  const current = await loadLocalArticles();
  const next = current.filter((article) => article.id !== articleId);
  await AsyncStorage.setItem(POWER_READER_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export async function pickLocalTextFile(): Promise<ImportedTextFile> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('File import is available in the browser app. Paste text here on this device.');
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    let settled = false;
    const rejectCancelled = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const error = new Error('File selection cancelled.');
      error.name = 'AbortError';
      reject(error);
    };
    const cleanup = () => {
      window.removeEventListener('focus', detectCancelledSelection);
    };
    const detectCancelledSelection = () => {
      window.setTimeout(() => {
        if (!input.files?.length) rejectCancelled();
      }, 300);
    };
    input.type = 'file';
    input.accept = '.txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html';
    input.addEventListener('cancel', rejectCancelled, { once: true });
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        rejectCancelled();
        return;
      }
      settled = true;
      cleanup();
      file
        .text()
        .then((text) => resolve({ name: file.name, text }))
        .catch(() => reject(new Error('Unable to read this file.')));
    };
    window.addEventListener('focus', detectCancelledSelection, { once: true });
    input.click();
  });
}
