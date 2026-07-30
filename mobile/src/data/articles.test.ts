import {
  ARTICLES,
  MIN_ARTICLES_PER_DIFFICULTY,
  countArticleWords,
  getRandomArticle,
  validateArticles,
} from './articles';

describe('Power Reader article library', () => {
  it('versions replaced passages separately from newly authored passages', () => {
    const replacedArticleIds = [
      'sci-001',
      'sci-002',
      'sci-003',
      'nat-001',
      'nat-002',
      'nat-003',
      'his-001',
      'his-002',
      'hea-002',
      'spa-001',
      'spa-002',
      'spa-003',
      'tec-001',
      'tec-002',
      'psy-001',
    ];
    const newArticleIds = [
      'psy-002',
      'sci-004',
      'his-003',
      'sci-005',
      'sci-006',
      'tec-003',
      'nat-004',
      'his-004',
      'nat-005',
    ];
    const versions = new Map(
      ARTICLES.map((article) => [article.id, article.version])
    );

    expect(replacedArticleIds.map((id) => versions.get(id))).toEqual(
      replacedArticleIds.map(() => 2)
    );
    expect(newArticleIds.map((id) => versions.get(id))).toEqual(
      newArticleIds.map(() => 1)
    );
  });

  it('ships a validated eight-article library at every difficulty', () => {
    expect(validateArticles()).toEqual([]);
    expect(ARTICLES).toHaveLength(MIN_ARTICLES_PER_DIFFICULTY * 3);

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const articles = ARTICLES.filter(
        (article) => article.difficulty === difficulty
      );
      expect(articles).toHaveLength(MIN_ARTICLES_PER_DIFFICULTY);
      expect(new Set(articles.map((article) => article.id)).size).toBe(
        MIN_ARTICLES_PER_DIFFICULTY
      );
    }
  });

  it('derives exact word counts and balances answer positions per level', () => {
    for (const article of ARTICLES) {
      expect(article.wordCount).toBe(countArticleWords(article.text));
      expect(article.comprehensionQuestions).toHaveLength(2);
    }

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const positionCounts = [0, 0, 0, 0];
      for (const article of ARTICLES.filter(
        (candidate) => candidate.difficulty === difficulty
      )) {
        for (const question of article.comprehensionQuestions) {
          positionCounts[question.correctIndex] += 1;
        }
      }
      expect(positionCounts).toEqual([4, 4, 4, 4]);
    }
  });

  it('returns undefined rather than indexing an empty filtered pool', () => {
    expect(getRandomArticle('hard', 'health', () => 0)).toBeUndefined();
    expect(getRandomArticle('easy', 'history', () => 0)?.difficulty).toBe(
      'easy'
    );
  });

  it('reports malformed metadata, questions, counts, and inventory', () => {
    const first = ARTICLES[0]!;
    const malformed = {
      ...first,
      wordCount: 1,
      comprehensionQuestions: [
        {
          question: '',
          options: ['same', 'same', '', 'other'],
          correctIndex: 9,
        },
      ],
    };
    const errors = validateArticles([first, malformed]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('article ID must be unique'),
        expect.stringContaining('article title must be present and unique'),
        expect.stringContaining('wordCount'),
        expect.stringContaining('at least two comprehension questions'),
        expect.stringContaining('question prompts'),
        expect.stringContaining('options must be present and unique'),
        expect.stringContaining('correct index is invalid'),
        expect.stringContaining('at least 8 articles required'),
      ])
    );
  });

  it('rejects non-positive and fractional content versions', () => {
    for (const version of [0, -1, 1.5]) {
      const invalidArticles = ARTICLES.map((article, index) =>
        index === 0 ? { ...article, version } : article
      );
      expect(validateArticles(invalidArticles)).toContain(
        `${ARTICLES[0]!.id}: original-content metadata is incomplete`
      );
    }
  });
});
