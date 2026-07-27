export type PowerReaderArticle = {
  id: string;
  title: string;
  author: string;
  description: string;
  text: string;
  source: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  imageUrl?: string;
  downloadUrl?: string;
  formats?: Record<string, string>;
};

import { Platform } from 'react-native';

const DEFAULT_WORD_RANGE = { min: 300, max: 800 };
const GUTENDEX_API = 'https://gutendex.com/books';

export type FreeBooksPage = {
  items: PowerReaderArticle[];
  nextPage: number | null;
  totalCount: number;
};

type GutendexBook = {
  id: number;
  title: string;
  authors?: Array<{ name?: string }>;
  subjects?: string[];
  formats?: Record<string, string>;
};

type GutendexResponse = {
  count?: number;
  next?: string | null;
  results?: GutendexBook[];
};

export async function fetchFreeBooksPage(
  page = 1,
  count = 12,
  searchQuery?: string
): Promise<FreeBooksPage> {
  const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
  const url = `${GUTENDEX_API}?languages=en&mime_type=text/plain&sort=popular&page=${page}${searchParam}`;
  const data = await fetchJson<GutendexResponse>(url);
  const results = data?.results ?? [];
  const totalCount = Number(data?.count ?? results.length);
  const nextPage = parseNextPage(data?.next);

  const items = results.slice(0, count).map<PowerReaderArticle>((book) => {
    const author = (book.authors ?? [])[0]?.name ?? 'Unknown author';
    const subjects = Array.isArray(book.subjects) ? book.subjects.slice(0, 2).join(' • ') : '';
    const description = subjects ? `${author} · ${subjects}` : author;
    const formats = book.formats ?? {};
    const imageUrl = normalizeUrl(formats['image/jpeg']);
    const downloadUrl = normalizeUrl(
      formats['application/epub+zip'] ||
        formats['text/plain; charset=utf-8'] ||
        formats['text/plain'] ||
        formats['application/pdf']
    );
    return {
      id: String(book.id),
      title: book.title,
      author,
      description,
      text: '',
      source: 'Project Gutenberg',
      difficulty: 'medium',
      wordCount: 0,
      imageUrl,
      downloadUrl,
      formats,
    };
  });

  return { items, nextPage, totalCount };
}

export async function fetchFreeBookText(formats: Record<string, string>): Promise<string> {
  const preferred = [
    'text/plain; charset=utf-8',
    'text/plain; charset=us-ascii',
    'text/plain; charset=iso-8859-1',
    'text/plain',
  ];

  const formatUrl =
    preferred.map((key) => formats[key]).find(Boolean) || formats['text/plain'];
  if (!formatUrl) return '';

  const normalizedUrl = normalizeUrl(formatUrl);
  if (!normalizedUrl) return '';
  const raw = await fetchText(normalizedUrl);
  const cleaned = normalizeText(stripGutenbergHeaders(raw));
  return cleaned;
}

export function finalizeBookArticle(article: PowerReaderArticle, text: string): PowerReaderArticle {
  const wordCount = countWords(text);
  return {
    ...article,
    text,
    wordCount,
    difficulty: estimateDifficulty(text),
  };
}

function stripGutenbergHeaders(text: string): string {
  const startMatch = text.match(/\*\*\* START OF(.*?)\*\*\*/i);
  const endMatch = text.match(/\*\*\* END OF(.*?)\*\*\*/i);
  if (!startMatch) return text;
  const startIndex = startMatch.index ?? 0;
  const endIndex = endMatch?.index ?? text.length;
  return text.slice(startIndex + startMatch[0].length, endIndex);
}

function normalizeText(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\(.*?\d{4}.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimToWordRange(text: string, minWords: number, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords && words.length >= minWords) return text;
  if (words.length <= maxWords) return text;

  const trimmed = words.slice(0, maxWords).join(' ');
  const lastSentenceEnd = Math.max(
    trimmed.lastIndexOf('. '),
    trimmed.lastIndexOf('! '),
    trimmed.lastIndexOf('? ')
  );

  if (lastSentenceEnd > 100) {
    return trimmed.slice(0, lastSentenceEnd + 1).trim();
  }
  return trimmed.trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function estimateDifficulty(text: string): 'easy' | 'medium' | 'hard' {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);
  const averageSentenceLength = words.length / Math.max(sentences.length, 1);
  const score = averageWordLength * 0.6 + averageSentenceLength * 0.4;

  if (score < 8) return 'easy';
  if (score < 11) return 'medium';
  return 'hard';
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(withCorsProxy(url), {
    headers: {
      Accept: 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.text();
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

function parseNextPage(nextUrl?: string | null): number | null {
  if (!nextUrl) return null;
  const match = nextUrl.match(/[?&]page=(\d+)/);
  if (!match) return null;
  const page = Number(match[1]);
  return Number.isFinite(page) ? page : null;
}

function withCorsProxy(url: string): string {
  if (Platform.OS !== 'web') return url;
  if (!/gutenberg\.org/.test(url)) return url;
  const stripped = url.replace(/^https?:\/\//, '');
  return `https://r.jina.ai/http://${stripped}`;
}
