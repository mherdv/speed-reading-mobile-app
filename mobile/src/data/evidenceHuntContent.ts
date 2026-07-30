import type { Difficulty } from './difficultyPreferences';

export type EvidenceSentence = {
  id: string;
  text: string;
};

export type EvidenceRequirement = {
  sentenceId: string;
  role: 'tested-change' | 'outcome' | 'limitation';
  purpose: 'synthesis-input';
};

export type EvidenceOption = {
  id: string;
  text: string;
};

export type EvidenceHuntRound = {
  id: string;
  version: 1;
  difficulty: Difficulty;
  title: string;
  language: 'en';
  genre: 'science' | 'history' | 'practical' | 'narrative' | 'argument';
  domain: string;
  complexityBand: 'brief-explicit' | 'extended-paraphrase' | 'dense-inference';
  comparisonBand: string;
  source: 'Original editorial content';
  license: 'Original content for this application';
  wordCount: number;
  sentences: readonly EvidenceSentence[];
  question: string;
  questionType: 'detail' | 'paraphrase' | 'inference';
  options: readonly EvidenceOption[];
  correctOptionId: string;
  evidenceSentenceIds: readonly string[];
  evidenceRequirements: readonly EvidenceRequirement[];
  rationale: string;
  answerDependency: 'passage-required';
  accessibilityNotes: string;
};

type Topic = {
  slug: string;
  title: string;
  genre: EvidenceHuntRound['genre'];
  domain: string;
  setting: string;
  intervention: string;
  interventionShort: string;
  observation: string;
  outcome: string;
  outcomeParaphrase: string;
  limitation: string;
  conclusion: string;
  contrast: string;
};

const TOPICS: readonly Topic[] = [
  {
    slug: 'library-hours',
    title: 'A Library Tests Later Saturdays',
    genre: 'practical',
    domain: 'community services',
    setting: 'a neighborhood library that had few weekend visitors',
    intervention: 'kept the building open two hours later on Saturdays and scheduled a quiet study period',
    interventionShort: 'later Saturday hours with quiet study time',
    observation: 'students arrived after sports and part-time shifts instead of rushing before closing',
    outcome: 'Saturday visits rose while weekday traffic stayed nearly unchanged',
    outcomeParaphrase: 'weekend access improved without drawing attendance away from weekdays',
    limitation: 'the trial covered only eight weekends and did not measure examination results',
    conclusion: 'the later hours improved access for people whose schedules had blocked earlier visits',
    contrast: 'buying more decorative signs',
  },
  {
    slug: 'wetland-path',
    title: 'A Raised Path Through the Wetland',
    genre: 'science',
    domain: 'urban ecology',
    setting: 'a city wetland where walkers had created muddy shortcuts',
    intervention: 'installed a narrow raised boardwalk and closed the informal tracks with native reeds',
    interventionShort: 'a raised boardwalk and restored reeds',
    observation: 'visitors stayed on the marked route while water continued moving beneath the boards',
    outcome: 'trampled ground recovered and nesting birds returned to the sheltered edge',
    outcomeParaphrase: 'redirecting walkers was followed by signs of habitat recovery',
    limitation: 'the survey covered one breeding season and cannot establish a long-term population trend',
    conclusion: 'guiding foot traffic can protect habitat without removing public access',
    contrast: 'paving the entire wetland',
  },
  {
    slug: 'museum-labels',
    title: 'Testing Shorter Museum Labels',
    genre: 'history',
    domain: 'public history',
    setting: 'a local museum exhibit about factory workers in the 1920s',
    intervention: 'replaced long technical labels with layered captions and optional detail panels',
    interventionShort: 'layered captions with optional details',
    observation: 'visitors read the short captions first and opened longer accounts when an object interested them',
    outcome: 'more visitors could accurately explain how working conditions changed across the decade',
    outcomeParaphrase: 'the revised labels helped visitors retain the exhibit’s historical change',
    limitation: 'the evaluation compared visitor recall, not the total amount of text each person read',
    conclusion: 'a clear information hierarchy helped visitors choose depth without losing the exhibit’s main story',
    contrast: 'removing dates from every display',
  },
  {
    slug: 'cool-roofs',
    title: 'Cool Roofs on Two Apartment Blocks',
    genre: 'science',
    domain: 'building science',
    setting: 'two similar apartment blocks exposed to strong summer sun',
    intervention: 'coated one roof with a reflective light surface while leaving the comparison roof unchanged',
    interventionShort: 'a reflective roof coating',
    observation: 'sensors recorded roof and top-floor temperatures at the same times each afternoon',
    outcome: 'the treated building’s upper rooms stayed cooler during the hottest hours',
    outcomeParaphrase: 'the reflective surface reduced peak heat most clearly near the roof',
    limitation: 'lower floors showed a smaller difference and energy use depended on residents’ habits',
    conclusion: 'reflective roofs can reduce peak heat most directly for rooms close to the roof',
    contrast: 'painting interior hallways darker',
  },
  {
    slug: 'market-crates',
    title: 'Reusable Crates at the Produce Market',
    genre: 'practical',
    domain: 'food distribution',
    setting: 'a produce market where single-use boxes often collapsed in damp weather',
    intervention: 'introduced returnable plastic crates with a deposit shared by vendors and delivery drivers',
    interventionShort: 'returnable crates with a deposit',
    observation: 'drivers returned empty crates on their next delivery because the deposit made returns visible',
    outcome: 'damaged produce and discarded packaging both declined during the pilot',
    outcomeParaphrase: 'the return system cut both product loss and packaging waste',
    limitation: 'washing the crates required additional water and a reliable collection point',
    conclusion: 'the return system worked because reuse was paired with a practical recovery process',
    contrast: 'using thinner disposable boxes',
  },
  {
    slug: 'bus-signals',
    title: 'Giving Late Buses a Green Light',
    genre: 'practical',
    domain: 'transport planning',
    setting: 'a busy bus route that regularly lost time at five major intersections',
    intervention: 'allowed buses running behind schedule to request a slightly earlier green signal',
    interventionShort: 'conditional signal priority for late buses',
    observation: 'the system changed signals only when a bus was late and cross traffic remained within safety limits',
    outcome: 'the worst delays became less common without noticeably slowing other vehicles',
    outcomeParaphrase: 'conditional priority improved reliability with little disruption to other traffic',
    limitation: 'the test occurred outside the winter season when traffic patterns can differ',
    conclusion: 'targeted priority improved reliability without giving every bus automatic preference',
    contrast: 'closing every intersection to cars',
  },
  {
    slug: 'seed-bank',
    title: 'A Community Seed Bank',
    genre: 'history',
    domain: 'agricultural heritage',
    setting: 'a farming valley where several locally adapted bean varieties were becoming rare',
    intervention: 'created a seed library that lent small packets and asked growers to return seed after harvest',
    interventionShort: 'a lend-and-return seed library',
    observation: 'older farmers contributed growing notes while new gardeners tested the beans in different soils',
    outcome: 'three rare varieties were planted in more locations and their cultivation knowledge was recorded',
    outcomeParaphrase: 'the program spread vulnerable seeds and preserved practical growing knowledge',
    limitation: 'poor harvests meant some borrowers could not return the same quantity every year',
    conclusion: 'sharing both seed and practical knowledge reduced the risk of losing local varieties',
    contrast: 'storing photographs without planting seed',
  },
  {
    slug: 'quiet-lunch',
    title: 'A Quieter School Lunch Period',
    genre: 'argument',
    domain: 'learning environments',
    setting: 'a school cafeteria where noise regularly made conversation difficult',
    intervention: 'added sound-absorbing ceiling panels and staggered the arrival of two year groups',
    interventionShort: 'sound panels and staggered arrivals',
    observation: 'staff used the same behavior rules before and after the physical changes',
    outcome: 'average sound levels fell and students reported that they could talk without shouting',
    outcomeParaphrase: 'the combined room and schedule changes made lunchtime conversation easier',
    limitation: 'the survey measured comfort but did not test academic concentration after lunch',
    conclusion: 'changing the room and schedule reduced noise without relying on stricter discipline',
    contrast: 'banning all conversation',
  },
  {
    slug: 'river-gauge',
    title: 'Reading a River Before a Flood',
    genre: 'science',
    domain: 'water monitoring',
    setting: 'a rural river basin where downstream villages received flood warnings too late',
    intervention: 'installed upstream water gauges that sent readings to a shared local alert system',
    interventionShort: 'upstream gauges linked to local alerts',
    observation: 'volunteers checked unusual readings against rainfall before sending a public warning',
    outcome: 'villages received more preparation time during two fast-rising storms',
    outcomeParaphrase: 'upstream monitoring gave downstream communities earlier warning in the observed storms',
    limitation: 'the gauges cannot predict floods caused by blocked drains inside individual towns',
    conclusion: 'upstream measurements are useful when paired with local verification and a clear warning process',
    contrast: 'waiting for water to reach the village bridge',
  },
  {
    slug: 'night-market',
    title: 'Lighting the Night Market',
    genre: 'narrative',
    domain: 'public-space design',
    setting: 'an evening market whose darkest walkway was avoided by shoppers',
    intervention: 'hung shielded lights over the path and moved two active food stalls beside it',
    interventionShort: 'shielded lighting and active stalls',
    observation: 'the fixtures directed light downward while nearby vendors kept the route visibly occupied',
    outcome: 'more shoppers used the walkway and vendors at its far end received more visits',
    outcomeParaphrase: 'the previously avoided route attracted more foot traffic and customers',
    limitation: 'organizers did not separate the effect of lighting from the effect of moving the stalls',
    conclusion: 'visibility and regular activity together made the neglected route feel usable',
    contrast: 'closing the market before sunset',
  },
  {
    slug: 'repair-cafe',
    title: 'What a Repair Café Actually Saved',
    genre: 'argument',
    domain: 'waste reduction',
    setting: 'a monthly repair café that invited residents to bring broken household devices',
    intervention: 'paired volunteer repairers with owners and documented whether each item returned to use',
    interventionShort: 'owner-assisted repairs with outcome records',
    observation: 'owners watched the diagnosis and learned simple maintenance instead of leaving items anonymously',
    outcome: 'many lamps and small appliances returned to use, while unsafe items were recycled',
    outcomeParaphrase: 'the café extended the life of repairable devices and diverted unsafe ones appropriately',
    limitation: 'the count did not include the emissions from replacement parts or volunteer travel',
    conclusion: 'the café extended product life and shared repair knowledge, though its total environmental effect remains uncertain',
    contrast: 'claiming every broken item was repaired',
  },
  {
    slug: 'shade-trees',
    title: 'Choosing Where Shade Trees Go',
    genre: 'science',
    domain: 'urban climate',
    setting: 'a town planting trees to reduce heat along walking routes',
    intervention: 'used afternoon temperature maps and pedestrian counts to choose the first planting sites',
    interventionShort: 'heat maps combined with walking data',
    observation: 'the selected blocks were both unusually hot and heavily used by people walking to transit',
    outcome: 'the first plantings concentrated shade where many pedestrians experienced peak heat',
    outcomeParaphrase: 'the method prioritized future shade for heavily used, unusually hot routes',
    limitation: 'young trees provide limited shade and need years of care before the full benefit appears',
    conclusion: 'combining heat exposure with actual route use produced a more targeted planting plan',
    contrast: 'spacing trees evenly without checking need',
  },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function placeAnswer(
  answer: string,
  distractors: readonly string[],
  answerIndex: number,
  prefix: string
): EvidenceOption[] {
  const values = [...distractors.slice(0, 3)];
  values.splice(answerIndex, 0, answer);
  return values.map((text, index) => ({ id: `${prefix}-o${index + 1}`, text }));
}

function buildSentences(topic: Topic, difficulty: Difficulty, id: string): EvidenceSentence[] {
  const shared = [
    `The report follows ${topic.setting}, where staff first documented the practical problem before proposing any change.`,
    `Organizers collected observations on the same days each week so ordinary shifts in weather or attendance would be less likely to distort the comparison.`,
    `The team ${topic.intervention}.`,
    `During the trial, ${topic.observation}.`,
    `Records showed that ${topic.outcome}.`,
    `The report also notes that ${topic.limitation}.`,
    `Interviews were used to explain the numbers, but personal comments were not treated as a substitute for the recorded observations.`,
    `No participant was promised that one short project would solve every related problem in the community.`,
    `Readers can therefore separate the documented local outcome from broader claims that the project did not test or measure.`,
  ];
  const medium = [
    `Before the change, the team recorded a comparison period and kept the main measurement method consistent.`,
    `The authors therefore describe the result as a useful local test rather than a universal rule for every place.`,
  ];
  const hard = [
    `The strongest interpretation depends on considering the observed improvement together with the stated boundary of the trial.`,
    `A broader claim would require longer follow-up, another setting, or a measure that the local trial did not include.`,
  ];
  const texts =
    difficulty === 'easy'
      ? shared
      : difficulty === 'medium'
        ? [...shared, ...medium]
        : [...shared, ...medium, ...hard];
  return texts.map((text, index) => ({ id: `${id}-s${index + 1}`, text }));
}

function buildRound(topic: Topic, difficulty: Difficulty, index: number): EvidenceHuntRound {
  const id = `evidence-${difficulty}-${topic.slug}`;
  const sentences = buildSentences(topic, difficulty, id);
  const answerIndex = index % 4;
  const answer =
    difficulty === 'easy'
      ? topic.interventionShort
      : difficulty === 'medium'
        ? topic.outcomeParaphrase
        : topic.conclusion;
  const distractors =
    difficulty === 'easy'
      ? [topic.contrast, 'ending the project before collecting observations', 'changing several unrelated services at once']
      : difficulty === 'medium'
        ? [topic.limitation, `the team chose ${topic.contrast}`, 'the comparison period was removed from the report']
        : [
            `the project proves that ${topic.interventionShort} will work identically everywhere`,
            topic.limitation,
            `the report recommends ${topic.contrast} as the only reasonable response`,
          ];
  const options = placeAnswer(answer, distractors, answerIndex, id);
  const correctOptionId = options[answerIndex]?.id ?? `${id}-o1`;
  const evidenceSentenceIds =
    difficulty === 'hard'
      ? [`${id}-s5`, `${id}-s6`]
      : difficulty === 'medium'
        ? [`${id}-s5`]
        : [`${id}-s3`];
  const evidenceRequirements: EvidenceRequirement[] =
    difficulty === 'hard'
      ? [
          {
            sentenceId: `${id}-s5`,
            role: 'outcome',
            purpose: 'synthesis-input',
          },
          {
            sentenceId: `${id}-s6`,
            role: 'limitation',
            purpose: 'synthesis-input',
          },
        ]
      : [
          {
            sentenceId: evidenceSentenceIds[0]!,
            role: difficulty === 'easy' ? 'tested-change' : 'outcome',
            purpose: 'synthesis-input',
          },
        ];

  return {
    id,
    version: 1,
    difficulty,
    title: topic.title,
    language: 'en',
    genre: topic.genre,
    domain: topic.domain,
    complexityBand:
      difficulty === 'easy'
        ? 'brief-explicit'
        : difficulty === 'medium'
          ? 'extended-paraphrase'
          : 'dense-inference',
    comparisonBand: `evidence-${difficulty}-v1`,
    source: 'Original editorial content',
    license: 'Original content for this application',
    wordCount: countWords(sentences.map((sentence) => sentence.text).join(' ')),
    sentences,
    question:
      difficulty === 'easy'
        ? `Which change did the team test in “${topic.title}”?`
        : difficulty === 'medium'
          ? `Which result best describes what changed during this local trial?`
          : 'Which cautious conclusion is best supported when the outcome and limitation are considered together?',
    questionType:
      difficulty === 'easy'
        ? 'detail'
        : difficulty === 'medium'
          ? 'paraphrase'
          : 'inference',
    options,
    correctOptionId,
    evidenceSentenceIds,
    evidenceRequirements,
    rationale:
      difficulty === 'hard'
        ? `The recorded outcome and the trial limitation must be integrated to support this bounded inference: ${topic.conclusion}.`
        : `The selected evidence supports the ${difficulty === 'easy' ? 'tested change' : 'paraphrased result'}.`,
    answerDependency: 'passage-required',
    accessibilityNotes:
      'Sentences are presented in reading order as large selectable controls; selection is announced in text and state.',
  };
}

export const EVIDENCE_HUNT_ROUNDS: readonly EvidenceHuntRound[] = (
  ['easy', 'medium', 'hard'] as const
).flatMap((difficulty) =>
  TOPICS.map((topic, index) => buildRound(topic, difficulty, index))
);

export const EVIDENCE_HUNT_ROUNDS_PER_DIFFICULTY = 12;

export function getEvidenceHuntRounds(difficulty: Difficulty): EvidenceHuntRound[] {
  return EVIDENCE_HUNT_ROUNDS.filter((round) => round.difficulty === difficulty);
}

export function validateEvidenceHuntContent(
  rounds: readonly EvidenceHuntRound[] = EVIDENCE_HUNT_ROUNDS
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const expectedEvidencePrefix: Record<EvidenceRequirement['role'], string> = {
    'tested-change': 'The team ',
    outcome: 'Records showed that ',
    limitation: 'The report also notes that ',
  };

  for (const round of rounds) {
    if (ids.has(round.id)) errors.push(`Duplicate round id: ${round.id}`);
    ids.add(round.id);
    const actualWordCount = countWords(
      round.sentences.map((sentence) => sentence.text).join(' ')
    );
    if (round.wordCount !== actualWordCount) {
      errors.push(`${round.id}: wordCount is ${round.wordCount}, expected ${actualWordCount}`);
    }
    if (actualWordCount < 160 || actualWordCount > 350) {
      errors.push(`${round.id}: passage must contain 160–350 words; found ${actualWordCount}`);
    }
    if (round.options.length !== 4) errors.push(`${round.id}: exactly four options required`);
    if (!round.options.some((option) => option.id === round.correctOptionId)) {
      errors.push(`${round.id}: correct option is missing`);
    }
    const sentenceIds = new Set(round.sentences.map((sentence) => sentence.id));
    if (sentenceIds.size !== round.sentences.length) {
      errors.push(`${round.id}: sentence IDs must be unique`);
    }
    if (round.evidenceSentenceIds.some((id) => !sentenceIds.has(id))) {
      errors.push(`${round.id}: evidence key references a missing sentence`);
    }
    if (
      round.evidenceRequirements.length !== round.evidenceSentenceIds.length ||
      round.evidenceRequirements.some(
        (requirement) =>
          !round.evidenceSentenceIds.includes(requirement.sentenceId) ||
          !sentenceIds.has(requirement.sentenceId) ||
          requirement.purpose !== 'synthesis-input'
      )
    ) {
      errors.push(`${round.id}: evidence requirements must describe every keyed sentence`);
    }
    for (const requirement of round.evidenceRequirements) {
      const sentence = round.sentences.find(
        (candidate) => candidate.id === requirement.sentenceId
      );
      if (
        sentence &&
        !sentence.text.startsWith(expectedEvidencePrefix[requirement.role])
      ) {
        errors.push(
          `${round.id}: ${requirement.role} evidence points to the wrong semantic sentence`
        );
      }
    }
    const requiredEvidence = round.difficulty === 'hard' ? 2 : 1;
    if (round.evidenceSentenceIds.length !== requiredEvidence) {
      errors.push(`${round.id}: ${requiredEvidence} evidence sentence(s) required`);
    }
    const correctAnswer =
      round.options.find((option) => option.id === round.correctOptionId)?.text ??
      '';
    const passage = round.sentences.map((sentence) => sentence.text).join(' ');
    if (
      round.difficulty !== 'easy' &&
      passage.toLocaleLowerCase().includes(correctAnswer.toLocaleLowerCase())
    ) {
      errors.push(`${round.id}: correct answer must paraphrase or synthesize the passage`);
    }
    if (round.difficulty === 'hard') {
      const roles = new Set(
        round.evidenceRequirements.map((requirement) => requirement.role)
      );
      if (!roles.has('outcome') || !roles.has('limitation') || roles.size !== 2) {
        errors.push(`${round.id}: hard evidence must combine distinct outcome and limitation roles`);
      }
      const keyedText = round.sentences
        .filter((sentence) => round.evidenceSentenceIds.includes(sentence.id))
        .map((sentence) => sentence.text)
        .join(' ');
      if (keyedText.toLocaleLowerCase().includes(correctAnswer.toLocaleLowerCase())) {
        errors.push(`${round.id}: hard evidence must not state the inferred answer verbatim`);
      }
    }
    if (!round.rationale.trim()) errors.push(`${round.id}: rationale is required`);
    if (round.answerDependency !== 'passage-required') {
      errors.push(`${round.id}: question must require the passage`);
    }
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const levelRounds = rounds.filter((round) => round.difficulty === difficulty);
    if (levelRounds.length !== EVIDENCE_HUNT_ROUNDS_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: exactly ${EVIDENCE_HUNT_ROUNDS_PER_DIFFICULTY} reviewed rounds required`
      );
    }
    const answerPositions = [0, 0, 0, 0];
    levelRounds.forEach((round) => {
      const position = round.options.findIndex(
        (option) => option.id === round.correctOptionId
      );
      if (position >= 0) answerPositions[position] += 1;
    });
    if (answerPositions.some((count) => count === 0)) {
      errors.push(`${difficulty}: correct answers must rotate across positions`);
    }
  }

  return errors;
}
