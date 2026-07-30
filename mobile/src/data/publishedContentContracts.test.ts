import {
  ARTICLES,
  validateArticles,
} from './articles';
import {
  CONTEXT_BUILDER_ROUNDS,
  validateContextBuilderContent,
} from './contextBuilderContent';
import {
  EVIDENCE_HUNT_ROUNDS,
  validateEvidenceHuntContent,
} from './evidenceHuntContent';
import {
  MAIN_IDEA_PASSAGES,
  validateMainIdeaPassages,
} from './mainIdeaPassages';
import {
  STRUCTURE_SCAN_ROUNDS,
  validateStructureScanRounds,
} from './structureScanPassages';
import {
  REPEATED_READING_TEXT_SAMPLES,
  validateRepeatedReadingTextSamples,
} from './textSamples';

describe('published content-count contracts', () => {
  it('rejects silent Main Idea and Structure Scan count drift', () => {
    expect(
      validateMainIdeaPassages([
        ...MAIN_IDEA_PASSAGES,
        {
          ...MAIN_IDEA_PASSAGES[0]!,
          id: 'extra-main-idea-contract-probe',
        },
      ])
    ).toContain('easy: exactly 12 Main Idea passages required');

    expect(
      validateStructureScanRounds([
        ...STRUCTURE_SCAN_ROUNDS,
        {
          ...STRUCTURE_SCAN_ROUNDS[0]!,
          id: 'extra-structure-contract-probe',
        },
      ])
    ).toContain('Structure Scan requires exactly 24 reviewed scenarios');
  });

  it('rejects silent Evidence Hunt and Context Builder count drift', () => {
    expect(
      validateEvidenceHuntContent([
        ...EVIDENCE_HUNT_ROUNDS,
        {
          ...EVIDENCE_HUNT_ROUNDS[0]!,
          id: 'extra-evidence-contract-probe',
        },
      ])
    ).toContain('easy: exactly 12 reviewed rounds required');

    expect(
      validateContextBuilderContent([
        ...CONTEXT_BUILDER_ROUNDS,
        {
          ...CONTEXT_BUILDER_ROUNDS[0]!,
          id: 'extra-context-contract-probe',
        },
      ])
    ).toContain('easy: exactly 24 reviewed rounds required');
  });

  it('rejects silent Repeated Reading and Power Reader count drift', () => {
    expect(
      validateRepeatedReadingTextSamples([
        ...REPEATED_READING_TEXT_SAMPLES,
        {
          ...REPEATED_READING_TEXT_SAMPLES[0]!,
          id: 'extra-repeated-contract-probe',
          title: 'Extra repeated-reading contract probe',
        },
      ])
    ).toContain('Repeated Reading requires exactly 30 training passages');

    expect(
      validateArticles([
        ...ARTICLES,
        {
          ...ARTICLES[0]!,
          id: 'extra-article-contract-probe',
          title: 'Extra article contract probe',
        },
      ])
    ).toContain('easy: exactly 8 articles required');
  });
});
