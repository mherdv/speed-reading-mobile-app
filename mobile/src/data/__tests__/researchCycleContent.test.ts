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

  it('keys each Evidence Hunt role to its semantic source sentence', () => {
    const expectedPrefix = {
      'tested-change': 'The team ',
      outcome: 'Records showed that ',
      limitation: 'The report also notes that ',
    } as const;

    for (const round of EVIDENCE_HUNT_ROUNDS) {
      for (const requirement of round.evidenceRequirements) {
        const sentence = round.sentences.find(
          (candidate) => candidate.id === requirement.sentenceId
        );
        expect(sentence?.text).toEqual(
          expect.stringMatching(
            new RegExp(`^${expectedPrefix[requirement.role]}`)
          )
        );
      }
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

  it('accepts both independently sufficient Medium clue routes', () => {
    const mediumRounds = CONTEXT_BUILDER_ROUNDS.filter(
      (round) => round.difficulty === 'medium'
    );

    for (const round of mediumRounds) {
      const accepted = round.clueOptions.filter((option) =>
        round.acceptedClueIds.includes(option.id)
      );
      expect(accepted).toHaveLength(2);
      expect(new Set(accepted.map((option) => option.role))).toEqual(
        new Set(['contrast', 'consequence'])
      );
    }

    for (const targetWord of ['sporadic', 'obsolete']) {
      const round = mediumRounds.find(
        (candidate) => candidate.targetWord === targetWord
      )!;
      expect(round.acceptedClueIds).toHaveLength(2);
    }
  });

  it('uses every Easy and Medium non-adjective in a natural target sentence', () => {
    const expectedTargets: Readonly<Record<string, string>> = {
      verify:
        'The editor used the recording to verify each quotation—to check that it was accurate.',
      retain:
        'The bottle could retain heat, meaning to keep it instead of losing it quickly.',
      adapt:
        'The library had to adapt, or change its services in response to the repairs.',
      contrast:
        'The report revealed a contrast, a noticeable difference between the two districts.',
      priority:
        'Restoring the water line was the team’s priority, the task considered more important than the others.',
      evidence:
        'The photographs, measurements, and field notes were evidence—information that could support or challenge the claim.',
      routine:
        'Sam’s nightly backup became a routine, a regular way of doing the same important tasks.',
      steadily:
        'The reservoir rose steadily, at a consistent rate without sudden changes.',
      mitigate:
        'The team hoped the shade cloth would mitigate the problem.',
      allocate:
        'The council voted to allocate the grant that evening.',
      synthesize:
        'The reviewer had one afternoon to synthesize the material.',
      infer:
        'The students were asked to infer the answer.',
      constraint:
        'The bridge height became the central constraint in the route discussion.',
      consensus:
        'The chair recorded a consensus before closing the meeting.',
      inference:
        'The observers labeled the conclusion an inference.',
      subsequently:
        'The pipe was subsequently replaced.',
      predominantly:
        'The survey described the station’s riders as predominantly local.',
    };
    const nonAdjectiveRounds = CONTEXT_BUILDER_ROUNDS.filter(
      (round) =>
        round.difficulty !== 'hard' && round.partOfSpeech !== 'adjective'
    );

    expect(nonAdjectiveRounds).toHaveLength(
      Object.keys(expectedTargets).length
    );
    for (const round of nonAdjectiveRounds) {
      const targetSentence = round.sentences.find(
        (sentence) => sentence.id === round.targetSentenceId
      )!.text;
      expect(targetSentence).toBe(expectedTargets[round.targetWord]);
      expect(targetSentence).not.toMatch(
        /calls this response|response is described as|labels the response/u
      );
    }
  });

  it('keeps every reviewed Hard target sentence grammatical and integrated', () => {
    const expectedHardTargets = [
      'After reviewing both surveys, the panel classified the evidence as equivocal.',
      'The workshop network was still nascent when the grant review began.',
      'The reviewers selected the parsimonious model for the next analysis.',
      'Technicians marked the winter-heat reading as anomalous.',
      'During the decision meeting, the safety table became the most salient section.',
      'Historians classified the proposed connection as tenuous.',
      'Within a decade, the charging port had become ubiquitous.',
      'The lead negotiator remained intransigent through the final session.',
      'The committee described its final assessment as nuanced.',
      'Ecologists classified the rain-fed pool as ephemeral.',
      'The historian asked whether the second diary could corroborate the reported date.',
      'Planners hoped the new shade would ameliorate conditions on the platform.',
      'The field survey remained contingent when the provisional date was announced.',
      'Researchers recorded the archive’s filing system as idiosyncratic.',
      'The district review classified the dust problem as pervasive.',
      'Reviewers judged the paint-color proposal orthogonal to the water-quality analysis.',
      'The editor added a station name to disambiguate the disputed word.',
      'Analysts were asked to extrapolate cautiously in the final forecast.',
      'The historian needed to substantiate the claim before publication.',
      'Researchers met to reconcile the two logs.',
      'The final report noted a convergence in the revised estimates.',
      'The moderator challenged the proposed dichotomy during the debate.',
      'The rule was ostensibly introduced for safety.',
      'The analyst inadvertently altered the address column during the sort.',
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

  it('keeps a diverse eighteen-passage baseline with three dependent items each', () => {
    expect(validateBaselineTextSamples()).toEqual([]);
    expect(BASELINE_TEXT_SAMPLES).toHaveLength(18);
    expect(new Set(BASELINE_TEXT_SAMPLES.map((sample) => sample.id)).size).toBe(
      18
    );
    expect(
      new Set(BASELINE_TEXT_SAMPLES.map((sample) => sample.genre)).size
    ).toBeGreaterThanOrEqual(5);
    expect(
      BASELINE_TEXT_SAMPLES.every(
        (sample) =>
          sample.questions?.length === 3 &&
          sample.questions.every(
            (question) =>
              question.choices.length === 4 &&
              new Set(
                question.choices.map((choice) =>
                  choice.toLocaleLowerCase('en')
                )
              ).size === 4
          )
      )
    ).toBe(true);
    const allPositionCounts = [0, 0, 0, 0];
    const mainIdeaPositionCounts = [0, 0, 0, 0];
    for (const sample of BASELINE_TEXT_SAMPLES) {
      for (const question of sample.questions ?? []) {
        allPositionCounts[question.correctIndex] += 1;
        if (question.type === 'main-idea') {
          mainIdeaPositionCounts[question.correctIndex] += 1;
        }
      }
    }
    expect(Math.max(...allPositionCounts) - Math.min(...allPositionCounts))
      .toBeLessThanOrEqual(1);
    expect(
      Math.max(...mainIdeaPositionCounts) -
        Math.min(...mainIdeaPositionCounts)
    ).toBeLessThanOrEqual(1);
  });
});
