import { countWords } from '../domain/wpm';
import { ADDITIONAL_REPEATED_READING_SAMPLES } from './additionalRepeatedReadingSamples';
import {
  MIN_REPEATED_READING_SAMPLES,
  REPEATED_READING_TEXT_SAMPLES,
  validateRepeatedReadingTextSamples,
} from './textSamples';

describe('Repeated Reading training content', () => {
  it('provides thirty original non-baseline passages with valid computed lengths', () => {
    expect(REPEATED_READING_TEXT_SAMPLES).toHaveLength(
      MIN_REPEATED_READING_SAMPLES
    );
    expect(ADDITIONAL_REPEATED_READING_SAMPLES).toHaveLength(13);
    expect(validateRepeatedReadingTextSamples()).toEqual([]);

    for (const sample of REPEATED_READING_TEXT_SAMPLES) {
      expect(sample.complexityBand).not.toBe('baseline-brief');
      expect(countWords(sample.text)).toBeGreaterThanOrEqual(80);
      expect(countWords(sample.text)).toBeLessThanOrEqual(220);
    }
  });

  it('gives every new passage complete authorship and dependent-question metadata', () => {
    for (const sample of ADDITIONAL_REPEATED_READING_SAMPLES) {
      expect(sample.version).toBe(1);
      expect(sample.language).toBe('en');
      expect(sample.source).toBe('Original editorial content');
      expect(sample.license).toBe('Original content for this application');
      expect(sample.genre?.trim()).toBeTruthy();
      expect(sample.accessibilityNotes?.trim()).toBeTruthy();
      expect(sample.question.answerDependency).toBe('passage-required');
      expect(sample.question.rationale?.trim()).toBeTruthy();
      expect(sample.question.type).toBeTruthy();
      expect(sample.question.choices).toHaveLength(4);
      expect(countWords(sample.text)).toBeGreaterThanOrEqual(120);
      expect(countWords(sample.text)).toBeLessThanOrEqual(220);
      expect(
        new Set(
          sample.question.choices.map((choice) =>
            choice.trim().toLocaleLowerCase('en')
          )
        ).size
      ).toBe(4);
    }
  });

  it('balances source answer positions across the complete training bank', () => {
    const positionCounts = REPEATED_READING_TEXT_SAMPLES.reduce(
      (counts, sample) => {
        counts[sample.question.correctIndex] += 1;
        return counts;
      },
      [0, 0, 0, 0]
    );

    expect(positionCounts).toEqual([8, 8, 7, 7]);
  });

  it('reports malformed content instead of silently accepting it', () => {
    const source = REPEATED_READING_TEXT_SAMPLES[0]!;
    const malformed = [
      {
        ...source,
        id: 'duplicate-training',
        title: '',
        text: 'Too short.',
        version: undefined,
        language: 'fr',
        genre: '',
        complexityBand: 'baseline-brief',
        source: '',
        license: '',
        accessibilityNotes: '',
        question: {
          ...source.question,
          prompt: '',
          choices: ['same', 'same', '', 'different'],
          correctIndex: 9,
        },
      },
      {
        ...source,
        id: 'duplicate-training',
      },
    ];

    expect(validateRepeatedReadingTextSamples(malformed)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('at least 30'),
        expect.stringContaining('every difficulty pool'),
        expect.stringContaining('duplicate Repeated Reading passage ID'),
        expect.stringContaining('title cannot be empty'),
        expect.stringContaining('baseline passage'),
        expect.stringContaining('content version'),
        expect.stringContaining('English language metadata'),
        expect.stringContaining('genre metadata'),
        expect.stringContaining('source and license'),
        expect.stringContaining('accessibility notes'),
        expect.stringContaining('computed words'),
        expect.stringContaining('question prompt'),
        expect.stringContaining('nonempty and unique'),
        expect.stringContaining('invalid correct answer'),
      ])
    );
  });
});
