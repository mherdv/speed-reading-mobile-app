import type { TextSample } from '../domain/types';
import type { Difficulty } from './difficultyPreferences';
import { BASELINE_TEXT_SAMPLES, TEXT_SAMPLES } from './textSamples';

export type CuratedComprehensionQuestion =
  NonNullable<TextSample['questions']>[number];

export type CuratedComprehensionItem = {
  sample: TextSample;
  questions: readonly CuratedComprehensionQuestion[];
};

/**
 * Paced Comprehension deliberately uses training passages rather than personal
 * baseline forms. Keeping the exact IDs here makes difficulty membership and
 * replay capacity reviewable without relying on array position.
 */
export const CURATED_TRAINING_SAMPLE_IDS_BY_DIFFICULTY = {
  easy: [
    'sample-5',
    'sample-8',
    'sample-9',
    'sample-11',
    'sample-12',
    'sample-13',
    'sample-14',
    'sample-15',
    'sample-19',
    'sample-20',
  ],
  medium: [
    'sample-4',
    'sample-6',
    'sample-7',
    'sample-10',
    'sample-16',
    'sample-17',
    'sample-18',
    'repeated-training-01',
    'repeated-training-02',
    'repeated-training-03',
  ],
  hard: [
    'repeated-training-04',
    'repeated-training-05',
    'repeated-training-06',
    'repeated-training-07',
    'repeated-training-08',
    'repeated-training-09',
    'repeated-training-10',
    'repeated-training-11',
    'repeated-training-12',
    'repeated-training-13',
  ],
} as const satisfies Record<Difficulty, readonly string[]>;

/** Compatibility name used by the paced-comprehension validator and tests. */
export const CURATED_COMPREHENSION_SAMPLE_IDS =
  CURATED_TRAINING_SAMPLE_IDS_BY_DIFFICULTY;

const REQUIRED_QUESTION_COUNT: Readonly<Record<Difficulty, number>> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * The source passage's primary question is always retained. These questions
 * add distinct passage-dependent checks only where Medium and Hard require
 * broader comprehension sampling.
 */
export const SUPPLEMENTAL_COMPREHENSION_QUESTIONS: Readonly<
  Record<string, readonly CuratedComprehensionQuestion[]>
> = {
  'sample-4': [
    {
      id: 'sample-4-supplemental-1',
      prompt:
        'Why does the author recommend returning to the smallest section likely to contain the answer?',
      choices: [
        'It resolves the specific gap without rereading unrelated material',
        'It guarantees that every difficult argument needs only one pass',
        'It removes the need to state the answer in the reader’s own words',
        'It makes the longest paragraph easier to skip permanently',
      ],
      correctIndex: 0,
      type: 'inference-purpose',
      rationale:
        'The passage contrasts a precise return with drifting across earlier lines and says the targeted approach saves time while protecting understanding.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-6': [
    {
      id: 'sample-6-supplemental-1',
      prompt: 'What should a reader state before reopening the hidden passage?',
      choices: [
        'The exact wording of every sentence',
        'The main idea and one supporting detail',
        'A new title and a list of unfamiliar words',
        'The reading speed without any account of meaning',
      ],
      correctIndex: 1,
      type: 'detail-evidence',
      rationale:
        'The retrieval sequence explicitly asks for the main idea and one supporting detail before the passage is reopened.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-7': [
    {
      id: 'sample-7-supplemental-1',
      prompt:
        'Which relationship between transition words and paragraph roles does the passage give?',
      choices: [
        '“Therefore” introduces an unrelated example',
        '“For example” signals the final conclusion',
        '“For example” introduces support, while “therefore” may signal a conclusion',
        'Both expressions indicate that the main idea should be ignored',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'The passage names “for example” as a support signal and “therefore” as a possible conclusion signal.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-10': [
    {
      id: 'sample-10-supplemental-1',
      prompt: 'What does “budget your attention” imply in this passage?',
      choices: [
        'Give every paragraph exactly the same amount of time',
        'Read repeated background more slowly than the key argument',
        'Avoid any sentence that requires a second look',
        'Spend more attention on important, dense sections than on simple background',
      ],
      correctIndex: 3,
      type: 'inference-purpose',
      rationale:
        'The passage pairs the metaphor with slowing for key material and moving faster through repeated background.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-16': [
    {
      id: 'sample-16-supplemental-1',
      prompt: 'Why should each attempt use the same kind of recall check?',
      choices: [
        'So changes in pace and understanding can be compared meaningfully',
        'So every text produces exactly the same reading boundary',
        'So a higher WPM can replace a comprehension result',
        'So fatigue and vocabulary no longer affect the session',
      ],
      correctIndex: 0,
      type: 'inference-purpose',
      rationale:
        'The passage says a consistent recall check keeps comparisons meaningful while pace changes in small steps.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-17': [
    {
      id: 'sample-17-supplemental-1',
      prompt:
        'Which signs does the passage give that a reading setting should be changed?',
      choices: [
        'A technical argument and a familiar story',
        'Eye strain, headaches, or repeatedly losing one’s place',
        'A quiet layout and predictable line spacing',
        'A comfortable text size and strong contrast',
      ],
      correctIndex: 1,
      type: 'detail-evidence',
      rationale:
        'The passage explicitly says to change a setting that causes eye strain, headaches, or repeated loss of place.',
      answerDependency: 'passage-required',
    },
  ],
  'sample-18': [
    {
      id: 'sample-18-supplemental-1',
      prompt: 'According to the passage, what relationship can “therefore” signal?',
      choices: [
        'Chronological order',
        'A compare-and-contrast example',
        'Cause and effect',
        'An executive summary',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'The passage lists “therefore” as a signal for a cause-effect structure.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-01': [
    {
      id: 'repeated-training-01-supplemental-1',
      prompt:
        'Why did the librarian ask which clue changed Mara’s guess instead of asking only how many pages she marked?',
      choices: [
        'The librarian wanted Mara to replace the field guide’s drawings',
        'The number of marked pages identified the bird’s habitat',
        'The blue thread could record only birds seen over open water',
        'Explaining the clue showed whether Mara’s identification was evidence-based',
      ],
      correctIndex: 3,
      type: 'inference-purpose',
      rationale:
        'The ending contrasts merely recording a sighting with using the calling location to make the identification reliable.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-02': [
    {
      id: 'repeated-training-02-supplemental-1',
      prompt:
        'What happened when the bakery grouped deliveries by street while marking the urgent order?',
      choices: [
        'The same number of boxes was delivered with less travel, and the urgent order stayed on time',
        'The bakery delivered fewer boxes because every deadline was removed',
        'The van crossed the neighborhood more often and returned later',
        'The driver ignored the north streets until all southern orders were complete',
      ],
      correctIndex: 0,
      type: 'detail-evidence',
      rationale:
        'The passage reports the same box count, a shorter route, an earlier return, and on-time delivery of the starred order.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-03': [
    {
      id: 'repeated-training-03-supplemental-1',
      prompt: 'Which statement best captures the passage’s main point?',
      choices: [
        'Warm metal gains new material that must be removed each summer',
        'Planned gaps give metal rail sections room for predictable temperature-driven expansion',
        'A continuous rail is safer because it cannot contract in cold weather',
        'Builders use identical gap sizes without considering material or climate',
      ],
      correctIndex: 1,
      type: 'main-idea',
      rationale:
        'The passage explains thermal expansion and shows that engineers size gaps to prevent pressure and strain.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-04': [
    {
      id: 'repeated-training-04-supplemental-1',
      prompt: 'Which statement best captures the passage’s main point?',
      choices: [
        'A printed date should always replace later evidence in a museum catalog',
        'Physical and documentary clues can reveal that an object was altered at a later date',
        'Railway stations were commonly drawn on maps before they were planned',
        'Travel diaries are useful only when every entry has the same date',
      ],
      correctIndex: 1,
      type: 'main-idea',
      rationale:
        'The passage combines ink, crease, station, and diary evidence to reconstruct the map’s printed and handwritten history.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-04-supplemental-2',
      prompt:
        'Which pair of physical details suggested that the railway branch was added after the map had been used?',
      choices: [
        'The cover date and the station’s location beside the river',
        'The folded diary and the museum’s new catalog entry',
        'The branch’s darker ink and its line crossing an already worn crease',
        'The angled light and the traveler’s purchase of a new map',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'Darker ink distinguishes the addition, while crossing an already worn crease shows it was drawn after the map had been folded and used.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-05': [
    {
      id: 'repeated-training-05-supplemental-1',
      prompt: 'Which statement best captures the restoration lesson in the passage?',
      choices: [
        'Healthy-looking plants prove that a restored wetland has enough water',
        'Concrete drains always improve marsh habitat by moving water quickly',
        'Restoring the water process can matter more than simply adding more plants',
        'Seasonal changes must be eliminated before reeds can survive',
      ],
      correctIndex: 2,
      type: 'main-idea',
      rationale:
        'The team improved existing plants’ conditions by restoring slower runoff, showing why plant counts alone were insufficient.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-05-supplemental-2',
      prompt: 'Where did most street runoff go before the curb was changed?',
      choices: [
        'Into the marsh through a planted channel',
        'Into storage pools beside the existing reeds',
        'Across the broad stone-lined opening',
        'Through a concrete drain that carried it past the marsh to the river',
      ],
      correctIndex: 3,
      type: 'detail-evidence',
      rationale:
        'The passage identifies the concrete drain as the route that bypassed the marsh and emptied into the river.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-06': [
    {
      id: 'repeated-training-06-supplemental-1',
      prompt: 'Which statement best expresses the passage’s main point?',
      choices: [
        'A checksum is a useful but limited way to flag likely transmission damage before deciding what to do next',
        'A checksum identifies and repairs every altered character in a message',
        'Battery level alone determines whether a weather reading is trustworthy',
        'Remote sensors should stop sending data after the first failed message',
      ],
      correctIndex: 0,
      type: 'main-idea',
      rationale:
        'The passage explains both the checksum’s inexpensive error-detection value and its limits, then separates detection from response.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-06-supplemental-2',
      prompt:
        'Why does the station request another transmission after several messages fail?',
      choices: [
        'The checksum has already proved which exact character changed',
        'Repeated failures suggest that the data or radio link may be unreliable',
        'The sensor sends temperature only when its battery is completely full',
        'A fresh message guarantees that no two errors can share a checksum',
      ],
      correctIndex: 1,
      type: 'inference-purpose',
      rationale:
        'Several consecutive failures raise concern about the link, so the system seeks fresh data and alerts a technician.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-07': [
    {
      id: 'repeated-training-07-supplemental-1',
      prompt: 'Which principle does the library’s new process illustrate?',
      choices: [
        'One physical arrangement should display every kind of information',
        'Different tools can handle fast retrieval and time-based follow-up separately',
        'Requested books should be ordered by publication date',
        'Old requests no longer need attention when lookup becomes faster',
      ],
      correctIndex: 1,
      type: 'main-idea',
      rationale:
        'The shelf supports quick lookup by card number, while the review list preserves waiting-time information for follow-up.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-07-supplemental-2',
      prompt: 'How were the requested books arranged after the change?',
      choices: [
        'By the date on which each title was published',
        'By the number of days each request had waited',
        'By the last four digits of the borrower’s card number',
        'By the order in which visitors joined the desk line',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'The passage explicitly identifies the borrower card’s last four digits as the new shelf order.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-08': [
    {
      id: 'repeated-training-08-supplemental-1',
      prompt: 'Which statement best captures the passage’s main point?',
      choices: [
        'Written observations are more accurate than measurements in every case',
        'A single unusually high value should define the normal pattern',
        'Measurements and contextual observations are stronger when interpreted together',
        'Traffic noise can be understood without recording locations or events',
      ],
      correctIndex: 2,
      type: 'main-idea',
      rationale:
        'The meters enabled comparison, while the log explained causes and distinguished the recurring pattern from an exception.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-08-supplemental-2',
      prompt:
        'Why did the group treat the loud repair-day afternoon differently from the morning peak?',
      choices: [
        'The afternoon meter had not recorded a numerical value',
        'The loading area was closed during every morning measurement',
        'Rain made all afternoon observations impossible to compare',
        'The log tied the afternoon value to a temporary event rather than a repeated traffic pattern',
      ],
      correctIndex: 3,
      type: 'inference-purpose',
      rationale:
        'The log identified stone cutting as a one-time cause, whereas the morning loading-area peak recurred.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-09': [
    {
      id: 'repeated-training-09-supplemental-1',
      prompt: 'Which statement best captures the passage’s main point?',
      choices: [
        'Lake layers provide direct written records of past weather',
        'One pollen type is sufficient to identify the cause of every environmental change',
        'Modern vegetation should be excluded when interpreting old sediment',
        'Lake cores preserve proxy evidence whose interpretation must be tested with multiple clues',
      ],
      correctIndex: 3,
      type: 'main-idea',
      rationale:
        'The passage emphasizes that cores preserve evidence, not self-explanatory answers, and that competing interpretations require independent checks.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-09-supplemental-2',
      prompt:
        'What is the usual age relationship between materials in an undisturbed lake core?',
      choices: [
        'Younger material is generally above older material',
        'Younger material is always below older material',
        'All layers formed at the same time',
        'Mineral grains are always younger than pollen',
      ],
      correctIndex: 0,
      type: 'detail-evidence',
      rationale:
        'The passage describes the core sequence as younger sediment generally resting above older sediment.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-10': [
    {
      id: 'repeated-training-10-supplemental-1',
      prompt:
        'What should happen across a large group of events assigned a seventy-percent chance by a calibrated system?',
      choices: [
        'The predicted outcome should occur about seventy percent of the time',
        'Every individual event should produce the predicted outcome',
        'Exactly thirty events should be removed before evaluation',
        'The system should give every prediction equal confidence',
      ],
      correctIndex: 0,
      type: 'detail-evidence',
      rationale:
        'The passage defines calibration by comparing stated probabilities with frequencies across sufficiently large, comparable groups.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-10-supplemental-2',
      prompt:
        'Why can calibration help a decision maker even when two systems have the same hit rate?',
      choices: [
        'It shows which system never makes an incorrect prediction',
        'It distinguishes tentative predictions from those backed by stronger evidence',
        'It converts every probability into a certain outcome',
        'It eliminates the need to compare predictions over repeated cases',
      ],
      correctIndex: 1,
      type: 'inference-purpose',
      rationale:
        'Honest confidence lets a decision maker tell a weak signal from a strong one even when overall accuracy matches.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-11': [
    {
      id: 'repeated-training-11-supplemental-1',
      prompt: 'Which statement best captures the passage’s main point?',
      choices: [
        'The shortest distance between protected areas always forms the best corridor',
        'Functional wildlife connection depends on species-specific barriers, resources, and actual use',
        'Separate habitat patches can never support animal movement',
        'A continuous band on a map proves that breeding populations are connected',
      ],
      correctIndex: 1,
      type: 'main-idea',
      rationale:
        'The passage replaces map-line continuity with a species-specific account of crossings, cover, water, disturbance, and monitored movement.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-11-supplemental-2',
      prompt: 'What two outcomes does corridor monitoring examine?',
      choices: [
        'Whether every route is the same width and distance',
        'Whether maps show one continuous strip of color',
        'Whether animals use the route and movement supports breeding between populations',
        'Whether all species prefer bright roads and dry-season travel',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'The passage explicitly names actual route use and breeding-supported connection as monitoring questions.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-12': [
    {
      id: 'repeated-training-12-supplemental-1',
      prompt: 'Which processes can move material between archaeological layers?',
      choices: [
        'Only laboratory dating and cataloging',
        'Printing maps and folding diaries',
        'Roots, burrowing animals, floods, and later construction',
        'Calibration and probability grouping',
      ],
      correctIndex: 2,
      type: 'detail-evidence',
      rationale:
        'The passage lists roots, animal burrows, floods, and later building as sources of disturbance.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-12-supplemental-2',
      prompt:
        'Why do excavators record where one context cuts through another feature?',
      choices: [
        'To prove that every deeper object is automatically older',
        'To avoid comparing artifacts found together',
        'To replace spatial evidence with a single depth measurement',
        'To reconstruct the sequence of disturbances and deposits rather than relying on depth alone',
      ],
      correctIndex: 3,
      type: 'inference-purpose',
      rationale:
        'Cut relationships show which feature came later and help build a chronology that accounts for disturbance.',
      answerDependency: 'passage-required',
    },
  ],
  'repeated-training-13': [
    {
      id: 'repeated-training-13-supplemental-1',
      prompt: 'Which statement best captures the final queue design?',
      choices: [
        'Every visitor received the fastest possible service regardless of task',
        'Separate lines were retained for every clerk and transaction',
        'The express desk replaced the main line for complicated interviews',
        'One main line balanced waiting and clerk use, with a limited shortcut for reliably brief tasks',
      ],
      correctIndex: 3,
      type: 'main-idea',
      rationale:
        'The final system combines a shared queue with narrowly defined express work to balance several competing goals.',
      answerDependency: 'passage-required',
    },
    {
      id: 'repeated-training-13-supplemental-2',
      prompt: 'What weakness did the center observe in separate clerk lines?',
      choices: [
        'A complicated case could hold up one line while another clerk became available',
        'Visitors could never see which line looked shorter',
        'Every clerk handled only thirty-second document pickups',
        'The lines always distributed delays evenly across all visitors',
      ],
      correctIndex: 0,
      type: 'detail-evidence',
      rationale:
        'The passage says one difficult case could trap its chosen line even while another clerk became free.',
      answerDependency: 'passage-required',
    },
  ],
};

function primaryQuestionFor(
  sample: TextSample
): CuratedComprehensionQuestion {
  return {
    id: `${sample.id}-legacy-question`,
    prompt: sample.question.prompt,
    choices: sample.question.choices,
    correctIndex: sample.question.correctIndex,
    type: sample.question.type ?? 'main-idea',
    rationale: sample.question.rationale ?? '',
    answerDependency:
      sample.question.answerDependency ?? 'passage-required',
  };
}

export function getCuratedComprehensionPool(
  difficulty: Difficulty,
  samples: readonly TextSample[] = TEXT_SAMPLES
): CuratedComprehensionItem[] {
  return getCuratedTrainingSamples(difficulty, samples).map((sample) => {
    const sampleId = sample.id;
    return {
      sample,
      questions: [
        primaryQuestionFor(sample),
        ...(SUPPLEMENTAL_COMPREHENSION_QUESTIONS[sampleId] ?? []),
      ],
    };
  });
}

export function getCuratedTrainingSamples(
  difficulty: Difficulty,
  samples: readonly TextSample[] = TEXT_SAMPLES
): TextSample[] {
  return CURATED_TRAINING_SAMPLE_IDS_BY_DIFFICULTY[difficulty].flatMap(
    (sampleId) => {
      const sample = samples.find((candidate) => candidate.id === sampleId);
      if (!sample) return [];
      return [sample];
    }
  );
}

const QUESTION_TYPES = [
  'main-idea',
  'detail-evidence',
  'inference-purpose',
] as const;

export function validateCuratedComprehensionContent(
  samples: readonly TextSample[] = TEXT_SAMPLES
): string[] {
  const errors: string[] = [];
  const baselineIds = new Set(
    BASELINE_TEXT_SAMPLES.map((sample) => sample.id)
  );
  const selectedIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const ids = CURATED_TRAINING_SAMPLE_IDS_BY_DIFFICULTY[difficulty];
    if (ids.length !== 10 || new Set(ids).size !== 10) {
      errors.push(`${difficulty}: exactly ten unique passage IDs required`);
    }

    const pool = getCuratedComprehensionPool(difficulty, samples);
    if (pool.length !== 10) {
      errors.push(`${difficulty}: exactly ten source passages required`);
    }

    const levelTypes = new Set<string>();
    for (const sampleId of ids) {
      if (selectedIds.has(sampleId)) {
        errors.push(`${sampleId}: passage cannot appear in multiple levels`);
      }
      selectedIds.add(sampleId);

      if (baselineIds.has(sampleId)) {
        errors.push(`${sampleId}: baseline passage cannot enter comprehension`);
      }
      const item = pool.find((candidate) => candidate.sample.id === sampleId);
      if (!item) {
        errors.push(`${difficulty}/${sampleId}: source passage is missing`);
        continue;
      }
      if (
        !item.sample.question.type ||
        !item.sample.question.rationale?.trim() ||
        item.sample.question.answerDependency !== 'passage-required'
      ) {
        errors.push(
          `${difficulty}/${sampleId}: primary question metadata is incomplete`
        );
      }

      const expectedQuestions = REQUIRED_QUESTION_COUNT[difficulty];
      if (item.questions.length !== expectedQuestions) {
        errors.push(
          `${difficulty}/${sampleId}: exactly ${expectedQuestions} questions required`
        );
      }
      const itemTypes = new Set(item.questions.map((question) => question.type));
      if (
        difficulty !== 'easy' &&
        itemTypes.size !== expectedQuestions
      ) {
        errors.push(
          `${difficulty}/${sampleId}: question types must be distinct`
        );
      }

      for (const question of item.questions) {
        levelTypes.add(question.type);
        if (!question.id.trim() || questionIds.has(question.id)) {
          errors.push(
            `${difficulty}/${sampleId}: question ID must be present and globally unique`
          );
        }
        questionIds.add(question.id);
        if (!question.prompt.trim()) {
          errors.push(`${sampleId}/${question.id}: prompt is required`);
        }
        const normalizedChoices = question.choices.map((choice) =>
          choice.trim().toLocaleLowerCase('en')
        );
        if (
          question.choices.length !== 4 ||
          normalizedChoices.some((choice) => !choice) ||
          new Set(normalizedChoices).size !== 4
        ) {
          errors.push(
            `${sampleId}/${question.id}: exactly four unique choices required`
          );
        }
        if (
          question.correctIndex < 0 ||
          question.correctIndex >= question.choices.length
        ) {
          errors.push(`${sampleId}/${question.id}: valid answer required`);
        }
        if (
          !QUESTION_TYPES.includes(question.type) ||
          !question.rationale.trim() ||
          question.answerDependency !== 'passage-required'
        ) {
          errors.push(
            `${sampleId}/${question.id}: type, rationale, and passage dependency required`
          );
        }
      }
    }

    if (levelTypes.size !== QUESTION_TYPES.length) {
      errors.push(
        `${difficulty}: main idea, detail, and inference coverage required`
      );
    }
  }

  if (selectedIds.size !== 30) {
    errors.push('Curated Comprehension requires exactly thirty passages');
  }
  for (const [sampleId, questions] of Object.entries(
    SUPPLEMENTAL_COMPREHENSION_QUESTIONS
  )) {
    if (!selectedIds.has(sampleId)) {
      errors.push(`${sampleId}: supplemental questions have no curated passage`);
    }
    const expectedSupplemental = sampleId.startsWith('repeated-training-')
      && Number(sampleId.slice(-2)) >= 4
      ? 2
      : 1;
    if (questions.length !== expectedSupplemental) {
      errors.push(
        `${sampleId}: exactly ${expectedSupplemental} supplemental questions required`
      );
    }
  }

  return errors;
}
