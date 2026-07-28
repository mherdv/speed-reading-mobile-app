import {
  EVIDENCE_HUNT_ROUNDS,
  validateEvidenceHuntContent,
} from '../evidenceHuntContent';
import {
  CONTEXT_BUILDER_ROUNDS,
  validateContextBuilderContent,
} from '../contextBuilderContent';
import {
  BASELINE_TEXT_SAMPLES,
  validateBaselineTextSamples,
} from '../textSamples';

describe('research-cycle reviewed content', () => {
  it('ships twelve valid Evidence Hunt rounds at every difficulty', () => {
    expect(validateEvidenceHuntContent()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const rounds = EVIDENCE_HUNT_ROUNDS.filter(
        (round) => round.difficulty === difficulty
      );
      expect(rounds).toHaveLength(12);
      expect(new Set(rounds.map((round) => round.id)).size).toBe(12);
    }
  });

  it('renders genuine Medium paraphrases and two-role Hard synthesis items', () => {
    const medium = EVIDENCE_HUNT_ROUNDS.filter(
      (round) => round.difficulty === 'medium'
    );
    for (const round of medium) {
      const answer = round.options.find(
        (option) => option.id === round.correctOptionId
      )!.text;
      const passage = round.sentences.map((sentence) => sentence.text).join(' ');
      expect(passage.toLocaleLowerCase()).not.toContain(
        answer.toLocaleLowerCase()
      );
      expect(round.evidenceRequirements).toEqual([
        expect.objectContaining({ role: 'outcome' }),
      ]);
    }

    const hard = EVIDENCE_HUNT_ROUNDS.filter(
      (round) => round.difficulty === 'hard'
    );
    for (const round of hard) {
      const answer = round.options.find(
        (option) => option.id === round.correctOptionId
      )!.text;
      const passage = round.sentences.map((sentence) => sentence.text).join(' ');
      const keyedText = round.sentences
        .filter((sentence) => round.evidenceSentenceIds.includes(sentence.id))
        .map((sentence) => sentence.text)
        .join(' ');
      expect(
        new Set(
          round.evidenceRequirements.map((requirement) => requirement.role)
        )
      ).toEqual(new Set(['outcome', 'limitation']));
      expect(round.evidenceRequirements.every(
        (requirement) => requirement.purpose === 'synthesis-input'
      )).toBe(true);
      expect(passage.toLocaleLowerCase()).not.toContain(
        answer.toLocaleLowerCase()
      );
      expect(keyedText.toLocaleLowerCase()).not.toContain(
        answer.toLocaleLowerCase()
      );
    }
  });

  it('ships twenty-four valid Context Builder rounds at every difficulty', () => {
    expect(validateContextBuilderContent()).toEqual([]);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const rounds = CONTEXT_BUILDER_ROUNDS.filter(
        (round) => round.difficulty === difficulty
      );
      expect(rounds).toHaveLength(24);
      expect(new Set(rounds.map((round) => round.targetWord)).size).toBe(24);
    }
    expect(
      new Set(CONTEXT_BUILDER_ROUNDS.map((round) => round.partOfSpeech))
    ).toEqual(new Set(['adjective', 'verb', 'noun', 'adverb']));
  });

  it('uses word-specific meanings and sentence-referenced clue spans', () => {
    const bannedTemplateText = [
      'related only to speed or urgency',
      'a person, place, or physical object',
      'the title alone, without the paragraph',
      'the number of sentences in the paragraph',
      'the punctuation immediately after the target word',
    ];
    const distractorSets = new Set<string>();
    for (const round of CONTEXT_BUILDER_ROUNDS) {
      const meaningText = round.meaningOptions.map((option) =>
        option.text.toLocaleLowerCase()
      );
      expect(
        meaningText.some((text) =>
          bannedTemplateText.some((banned) => text.includes(banned))
        )
      ).toBe(false);
      distractorSets.add(
        meaningText
          .filter((_, index) => round.meaningOptions[index]!.id !== round.correctMeaningOptionId)
          .sort()
          .join('|')
      );
      const sentenceIds = new Set(
        round.sentences.map((sentence) => sentence.id)
      );
      expect(
        round.clueOptions.every(
          (option) =>
            option.sentenceIds.length > 0 &&
            option.sentenceIds.every((id) => sentenceIds.has(id))
        )
      ).toBe(true);
    }
    expect(distractorSets.size).toBe(CONTEXT_BUILDER_ROUNDS.length);
    expect(
      new Set(
        CONTEXT_BUILDER_ROUNDS.flatMap((round) => round.acceptedClueIds)
          .map((id) => id.slice(id.lastIndexOf('-c')))
      )
    ).toEqual(new Set(['-c1', '-c2', '-c3', '-c4']));
  });

  it('keeps every reviewed Hard target sentence grammatical and integrated', () => {
    const expectedHardTargets = [
      'Because one survey favored the change while another showed no difference, the evidence remained equivocal.',
      'The recently formed workshop network was still nascent, with routines that had not settled.',
      'Researchers called the two-factor model parsimonious because it explained the pattern without unsupported causes.',
      'The lone winter-heat reading was anomalous beside the frost reported by every nearby sensor.',
      'The table containing the safety threshold was the most salient part of the report for the decision.',
      'Historians described the claimed connection as tenuous because it rested on one much-later memory.',
      'Charging ports had become ubiquitous, appearing in homes, buses, cafés, and offices.',
      'The negotiator remained intransigent, rejecting every revision before considering its details.',
      'The review was nuanced: it recognized broad reach while distinguishing unequal local effects.',
      'The rain-fed desert pool was ephemeral, disappearing only days after it formed.',
      'The independent diary could corroborate the reported storm date because it described the same event from another village.',
      'The new shade could ameliorate the platform heat, although it could not remove every hot-day discomfort.',
      'The field survey remained contingent on river levels falling below the safety mark.',
      'The archive’s color-based filing system was idiosyncratic, unlike the standard methods used elsewhere.',
      'The dust problem was pervasive, reaching homes, schools, vehicles, and sealed storage rooms.',
      'The building’s paint color was orthogonal to the water-quality question under review.',
      'Adding the station name could disambiguate “bank” by identifying the intended riverbank sense.',
      'Analysts used five years of measurements to extrapolate demand beyond the observed period.',
      'Dated receipts and independent letters could substantiate the historian’s claim.',
      'Correcting for the time-zone difference helped researchers reconcile the two apparently conflicting logs.',
      'The convergence of independent model estimates increased confidence in the revised forecast.',
      'Treating every proposal as total success or complete failure created a false dichotomy.',
      'The rule was ostensibly about safety, although internal notes emphasized staffing costs.',
      'The analyst inadvertently separated names from addresses while sorting the spreadsheet.',
    ];
    const hardTargets = CONTEXT_BUILDER_ROUNDS.filter(
      (round) => round.difficulty === 'hard'
    ).map(
      (round) =>
        round.sentences.find(
          (sentence) => sentence.id === round.targetSentenceId
        )!.text
    );
    expect(hardTargets).toEqual(expectedHardTargets);
    for (const round of CONTEXT_BUILDER_ROUNDS.filter(
      (candidate) => candidate.difficulty === 'hard'
    )) {
      const accepted = round.clueOptions.find((option) =>
        round.acceptedClueIds.includes(option.id)
      )!;
      expect(accepted.role).toBe('combined-context');
      expect(accepted.sentenceIds).toHaveLength(2);
    }
  });

  it('rejects malformed versioned content', () => {
    expect(
      validateEvidenceHuntContent([
        EVIDENCE_HUNT_ROUNDS[0]!,
        { ...EVIDENCE_HUNT_ROUNDS[0]!, wordCount: 1 },
      ])
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Duplicate round id'),
        expect.stringContaining('wordCount'),
      ])
    );
    expect(
      validateContextBuilderContent([
        {
          ...CONTEXT_BUILDER_ROUNDS[0]!,
          acceptedClueIds: ['missing'],
          rationale: '',
        },
      ])
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('accepted clue key'),
        expect.stringContaining('rationale'),
      ])
    );
  });

  it('encodes the requested difficulty dimensions', () => {
    const evidenceDimensions = new Map(
      (['easy', 'medium', 'hard'] as const).map((difficulty) => {
        const round = EVIDENCE_HUNT_ROUNDS.find(
          (candidate) => candidate.difficulty === difficulty
        )!;
        return [
          difficulty,
          [
            round.questionType,
            round.complexityBand,
            round.evidenceSentenceIds.length,
            round.wordCount,
          ],
        ];
      })
    );
    expect(evidenceDimensions.get('easy')).not.toEqual(
      evidenceDimensions.get('medium')
    );
    expect(evidenceDimensions.get('medium')).not.toEqual(
      evidenceDimensions.get('hard')
    );

    const contextDimensions = (['easy', 'medium', 'hard'] as const).map(
      (difficulty) => {
        const round = CONTEXT_BUILDER_ROUNDS.find(
          (candidate) => candidate.difficulty === difficulty
        )!;
        return [
          round.clueType,
          round.frequencyBand,
          round.complexityBand,
        ];
      }
    );
    expect(new Set(contextDimensions.map((value) => value.join('|'))).size).toBe(
      3
    );
  });

  it('keeps a diverse nine-passage baseline with three dependent items each', () => {
    expect(validateBaselineTextSamples()).toEqual([]);
    expect(BASELINE_TEXT_SAMPLES).toHaveLength(9);
    expect(new Set(BASELINE_TEXT_SAMPLES.map((sample) => sample.id)).size).toBe(
      9
    );
    expect(
      new Set(BASELINE_TEXT_SAMPLES.map((sample) => sample.genre)).size
    ).toBeGreaterThanOrEqual(5);
    expect(
      BASELINE_TEXT_SAMPLES.every(
        (sample) => (sample.questions?.length ?? 0) >= 3
      )
    ).toBe(true);
  });
});
