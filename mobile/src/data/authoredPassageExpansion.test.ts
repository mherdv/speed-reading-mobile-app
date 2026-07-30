import {
  MAIN_IDEA_PASSAGES,
  validateMainIdeaPassages,
} from './mainIdeaPassages';
import {
  STRUCTURE_SCAN_ROUNDS,
  validateStructureScanRounds,
} from './structureScanPassages';

describe('authored passage expansion', () => {
  it('ships twelve unique, answer-balanced Main Idea passages per level', () => {
    expect(validateMainIdeaPassages()).toEqual([]);
    expect(new Set(MAIN_IDEA_PASSAGES.map((passage) => passage.id)).size).toBe(
      MAIN_IDEA_PASSAGES.length
    );

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const passages = MAIN_IDEA_PASSAGES.filter(
        (passage) => passage.difficulty === difficulty
      );
      expect(passages).toHaveLength(12);
      expect(
        passages.every(
          (passage) =>
            passage.choices.length === 4 &&
            new Set(
              passage.choices.map((choice) =>
                choice.toLocaleLowerCase('en')
              )
            ).size === 4
        )
      ).toBe(true);
      expect(
        [0, 1, 2, 3].map(
          (position) =>
            passages.filter(
              (passage) => passage.correctIndex === position
            ).length
        )
      ).toEqual([3, 3, 3, 3]);
    }
  });

  it('ships twenty-four complete and uniquely identified Structure Scan maps', () => {
    expect(validateStructureScanRounds()).toEqual([]);
    expect(STRUCTURE_SCAN_ROUNDS).toHaveLength(24);
    expect(
      new Set(STRUCTURE_SCAN_ROUNDS.map((round) => round.id)).size
    ).toBe(24);
    expect(
      STRUCTURE_SCAN_ROUNDS.every(
        (round) =>
          round.sections.length === 5 &&
          new Set(
            round.sections.map((section) =>
              section.heading.toLocaleLowerCase('en')
            )
          ).size === 5 &&
          round.sections.filter(
            (section) => section.heading === round.correctHeading
          ).length === 1
      )
    ).toBe(true);
  });
});
