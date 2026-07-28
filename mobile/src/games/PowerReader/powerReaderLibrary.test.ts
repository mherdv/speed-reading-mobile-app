import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createLocalArticle,
  loadLocalArticles,
  normalizeLocalText,
  POWER_READER_LIBRARY_KEY,
  removeLocalArticle,
  saveLocalArticle,
} from './powerReaderLibrary';

describe('Power Reader local library', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('turns simple HTML into readable plain text', () => {
    expect(
      normalizeLocalText(
        '<style>hidden</style><h1>My title</h1><p>Read &amp; remember.</p>',
        'notes.html'
      )
    ).toBe('My title. Read & remember.');
  });

  it('creates and persists an offline article with a useful title', async () => {
    const article = createLocalArticle({
      name: 'chapter_one.md',
      text: 'A short chapter with useful ideas.',
      difficulty: 'medium',
      now: 123,
    });
    expect(article).toMatchObject({
      title: 'chapter one',
      source: 'My offline library',
      wordCount: 6,
      difficulty: 'medium',
    });

    await saveLocalArticle(article);
    expect(await loadLocalArticles()).toEqual([article]);

    await removeLocalArticle(article.id);
    expect(await loadLocalArticles()).toEqual([]);
  });

  it('recovers safely from malformed saved library data', async () => {
    await AsyncStorage.setItem(POWER_READER_LIBRARY_KEY, '{not-json');
    expect(await loadLocalArticles()).toEqual([]);
  });
});
