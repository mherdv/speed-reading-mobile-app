import type { Difficulty } from '../gameHooks';

export type PageGlimpseQuestionKind =
  | 'missing-phrase'
  | 'detail'
  | 'main-idea';

export type PageGlimpseItem = {
  id: string;
  difficulty: Difficulty;
  title: string;
  lines: readonly string[];
  questionKind: PageGlimpseQuestionKind;
  prompt: string;
  options: readonly [string, string, string, string];
  correctIndex: number;
  explanation: string;
};

export const PAGE_GLIMPSE_ITEMS_PER_DIFFICULTY = 6;
export const PAGE_GLIMPSE_EXPECTED_ITEM_COUNT = 18;
export const PAGE_GLIMPSE_LINE_COUNTS: Record<Difficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 4,
};

const MAX_AUTHORED_LINE_LENGTH = 40;
const QUESTION_KINDS: readonly PageGlimpseQuestionKind[] = [
  'missing-phrase',
  'detail',
  'main-idea',
];

/** Original English material authored for this exercise. */
export const PAGE_GLIMPSE_ITEMS: readonly PageGlimpseItem[] = [
  {
    id: 'page-glimpse-easy-01',
    difficulty: 'easy',
    title: 'A careful robin',
    lines: ['The robin carried grass to its nest.'],
    questionKind: 'missing-phrase',
    prompt: 'Which phrase completed the glimpse?',
    options: [
      'grass to its nest',
      'seeds toward the pond',
      'twigs across the path',
      'leaves under the gate',
    ],
    correctIndex: 0,
    explanation: 'The robin carried grass to its nest.',
  },
  {
    id: 'page-glimpse-easy-02',
    difficulty: 'easy',
    title: 'Lunch preparation',
    lines: ['Lena chilled the soup before lunch.'],
    questionKind: 'detail',
    prompt: 'What did Lena chill?',
    options: ['The soup', 'The plates', 'The fruit', 'The water'],
    correctIndex: 0,
    explanation: 'The sentence says that Lena chilled the soup.',
  },
  {
    id: 'page-glimpse-easy-03',
    difficulty: 'easy',
    title: 'A useful pause',
    lines: ['A short walk helped Omar think clearly.'],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'A brief walk improved Omar’s thinking.',
      'Omar became lost during a long walk.',
      'Clear weather made the path safer.',
      'Omar hurried because he was late.',
    ],
    correctIndex: 0,
    explanation: 'The sentence connects a short walk with clearer thinking.',
  },
  {
    id: 'page-glimpse-easy-04',
    difficulty: 'easy',
    title: 'The blue kite',
    lines: ['The blue kite rose above the trees.'],
    questionKind: 'missing-phrase',
    prompt: 'Which phrase completed the glimpse?',
    options: [
      'above the trees',
      'behind the shed',
      'across the road',
      'beneath the bridge',
    ],
    correctIndex: 0,
    explanation: 'The blue kite rose above the trees.',
  },
  {
    id: 'page-glimpse-easy-05',
    difficulty: 'easy',
    title: 'Closing time',
    lines: ['Milo left the library at six.'],
    questionKind: 'detail',
    prompt: 'When did Milo leave the library?',
    options: ['At six', 'At four', 'At noon', 'At eight'],
    correctIndex: 0,
    explanation: 'The glimpse gave the departure time as six.',
  },
  {
    id: 'page-glimpse-easy-06',
    difficulty: 'easy',
    title: 'Saved rain',
    lines: ['Rain filled the barrel for the garden.'],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'Collected rain supplied the garden.',
      'The garden flooded beyond repair.',
      'A barrel was moved into a shed.',
      'The rain stopped before reaching town.',
    ],
    correctIndex: 0,
    explanation: 'The barrel captured rain that could be used in the garden.',
  },
  {
    id: 'page-glimpse-medium-01',
    difficulty: 'medium',
    title: 'Morning garden check',
    lines: ['Before sunrise, Maya checked', 'the soil and watered dry beds.'],
    questionKind: 'missing-phrase',
    prompt: 'Which phrase completed the glimpse?',
    options: [
      'watered dry beds',
      'covered damp paths',
      'trimmed tall hedges',
      'counted fresh blooms',
    ],
    correctIndex: 0,
    explanation: 'Maya checked the soil and watered the beds that were dry.',
  },
  {
    id: 'page-glimpse-medium-02',
    difficulty: 'medium',
    title: 'Trail supplies',
    lines: ['Jon packed a map and spare socks', 'before the trail opened at nine.'],
    questionKind: 'detail',
    prompt: 'Which spare item did Jon pack?',
    options: ['Socks', 'Gloves', 'Laces', 'Batteries'],
    correctIndex: 0,
    explanation: 'The first line names a map and spare socks.',
  },
  {
    id: 'page-glimpse-medium-03',
    difficulty: 'medium',
    title: 'Shared repairs',
    lines: ['Neighbors shared tools on Saturday,', 'so every fence was fixed by noon.'],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'Cooperation helped finish repairs quickly.',
      'The neighbors postponed every repair.',
      'New fences required expensive tools.',
      'Saturday weather damaged the fences.',
    ],
    correctIndex: 0,
    explanation: 'Sharing tools let the neighbors complete all the fences by noon.',
  },
  {
    id: 'page-glimpse-medium-04',
    difficulty: 'medium',
    title: 'A sealed window',
    lines: ['Cold air entered through the gap,', 'until Priya sealed the window frame.'],
    questionKind: 'missing-phrase',
    prompt: 'Which phrase completed the glimpse?',
    options: [
      'sealed the window frame',
      'opened the hallway door',
      'measured the bedroom wall',
      'cleaned the wooden floor',
    ],
    correctIndex: 0,
    explanation: 'Priya stopped the cold air by sealing the window frame.',
  },
  {
    id: 'page-glimpse-medium-05',
    difficulty: 'medium',
    title: 'Protecting old maps',
    lines: ['The museum dimmed its east gallery', 'to protect its oldest paper maps.'],
    questionKind: 'detail',
    prompt: 'Why did the museum dim the gallery?',
    options: [
      'To protect old paper maps',
      'To prepare a film screening',
      'To repair the gallery lights',
      'To guide visitors toward the exit',
    ],
    correctIndex: 0,
    explanation: 'Lower light helps protect the oldest paper maps on display.',
  },
  {
    id: 'page-glimpse-medium-06',
    difficulty: 'medium',
    title: 'Cable checks',
    lines: ['Leo tested each cable twice,', 'preventing a fault during the show.'],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'Careful checks prevented a problem.',
      'The show ended after a cable failed.',
      'Leo replaced every cable with lights.',
      'The audience tested the equipment.',
    ],
    correctIndex: 0,
    explanation: 'Testing each cable twice prevented a fault during the show.',
  },
  {
    id: 'page-glimpse-hard-01',
    difficulty: 'hard',
    title: 'Harbor delay',
    lines: [
      'Although the first forecast was mild,',
      'overnight wind strengthened quickly.',
      'The harbor master delayed departures',
      'until the outer channel grew calmer.',
    ],
    questionKind: 'missing-phrase',
    prompt: 'Which phrase described the harbor master’s response?',
    options: [
      'delayed departures',
      'advanced departures',
      'diverted arrivals',
      'extended inspections',
    ],
    correctIndex: 0,
    explanation: 'The stronger wind led the harbor master to delay departures.',
  },
  {
    id: 'page-glimpse-hard-02',
    difficulty: 'hard',
    title: 'Tagged turtles',
    lines: [
      'Researchers tagged young turtles',
      'near the quiet southern beach.',
      'Two months later, most returned',
      'to the same sheltered feeding ground.',
    ],
    questionKind: 'detail',
    prompt: 'Where were the young turtles tagged?',
    options: [
      'Near the quiet southern beach',
      'Beside the northern river inlet',
      'Across the western nesting field',
      'Beyond the open offshore reef',
    ],
    correctIndex: 0,
    explanation: 'The first two lines locate the tagging near the southern beach.',
  },
  {
    id: 'page-glimpse-hard-03',
    difficulty: 'hard',
    title: 'Clearer clinic forms',
    lines: [
      'The clinic shortened its forms',
      'after patients reported confusion.',
      'Staff kept every safety question,',
      'but grouped related items together.',
    ],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'The clinic improved clarity without removing safety checks.',
      'The clinic removed safety checks to shorten every visit.',
      'Patients asked staff to replace forms with interviews.',
      'Staff added unrelated questions to make forms more detailed.',
    ],
    correctIndex: 0,
    explanation: 'The forms became clearer while every safety question remained.',
  },
  {
    id: 'page-glimpse-hard-04',
    difficulty: 'hard',
    title: 'An alternate trail',
    lines: [
      'Because the upper trail was icy,',
      'rangers closed it before sunrise.',
      'They marked a lower forest route',
      'that remained dry and sheltered.',
    ],
    questionKind: 'missing-phrase',
    prompt: 'Which route did the rangers mark?',
    options: [
      'a lower forest route',
      'an upper ridge route',
      'a longer coastal route',
      'an open meadow route',
    ],
    correctIndex: 0,
    explanation: 'The rangers marked a lower forest route after closing the icy trail.',
  },
  {
    id: 'page-glimpse-hard-05',
    difficulty: 'hard',
    title: 'Shade at bus stops',
    lines: [
      'The council planted shade trees',
      'beside three crowded bus stops.',
      'Summer readings later showed',
      'lower pavement temperatures there.',
    ],
    questionKind: 'detail',
    prompt: 'What measurement was lower near the trees?',
    options: [
      'Pavement temperature',
      'Passenger numbers',
      'Bus arrival time',
      'Evening rainfall',
    ],
    correctIndex: 0,
    explanation: 'The later readings showed lower pavement temperatures.',
  },
  {
    id: 'page-glimpse-hard-06',
    difficulty: 'hard',
    title: 'Preserving an archive',
    lines: [
      'An archive scanned fragile letters',
      'before handling damaged the ink.',
      'Readers now use digital copies,',
      'while originals stay in dark storage.',
    ],
    questionKind: 'main-idea',
    prompt: 'What is the main idea?',
    options: [
      'Digitization preserves originals while keeping them accessible.',
      'Dark storage makes digital copies difficult to read.',
      'Readers damaged the letters after scanning was complete.',
      'The archive discarded originals to create more storage.',
    ],
    correctIndex: 0,
    explanation: 'Digital copies provide access while the fragile originals remain protected.',
  },
];

export function validatePageGlimpseItems(
  items: readonly PageGlimpseItem[]
): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (items.length !== PAGE_GLIMPSE_EXPECTED_ITEM_COUNT) {
    errors.push(
      `Expected ${PAGE_GLIMPSE_EXPECTED_ITEM_COUNT} items, received ${items.length}.`
    );
  }

  for (const item of items) {
    if (!/^page-glimpse-(easy|medium|hard)-\d{2}$/u.test(item.id)) {
      errors.push(`${item.id}: id is not stable or difficulty-scoped.`);
    }
    if (seenIds.has(item.id)) errors.push(`${item.id}: duplicate id.`);
    seenIds.add(item.id);

    const expectedLines = PAGE_GLIMPSE_LINE_COUNTS[item.difficulty];
    if (item.lines.length !== expectedLines) {
      errors.push(
        `${item.id}: expected ${expectedLines} authored lines, received ${item.lines.length}.`
      );
    }
    item.lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) errors.push(`${item.id}: line ${index + 1} is empty.`);
      if (trimmed.length > MAX_AUTHORED_LINE_LENGTH) {
        errors.push(
          `${item.id}: line ${index + 1} exceeds ${MAX_AUTHORED_LINE_LENGTH} characters.`
        );
      }
      if (/\r|\n/u.test(line)) {
        errors.push(`${item.id}: line ${index + 1} contains a manual newline.`);
      }
    });

    if (item.options.length !== 4) {
      errors.push(`${item.id}: exactly four answer options are required.`);
    }
    if (new Set(item.options.map((option) => option.trim().toLowerCase())).size !== 4) {
      errors.push(`${item.id}: answer options must be unique.`);
    }
    if (
      !Number.isInteger(item.correctIndex) ||
      item.correctIndex < 0 ||
      item.correctIndex >= item.options.length
    ) {
      errors.push(`${item.id}: correctIndex is outside the answer options.`);
    }
    if (!item.prompt.trim()) errors.push(`${item.id}: prompt is empty.`);
    if (!item.explanation.trim()) errors.push(`${item.id}: explanation is empty.`);

    if (item.questionKind === 'missing-phrase') {
      const displayedText = item.lines.join(' ').toLowerCase();
      const correctAnswer = item.options[item.correctIndex]?.toLowerCase() ?? '';
      if (!correctAnswer || !displayedText.includes(correctAnswer)) {
        errors.push(`${item.id}: missing-phrase answer is absent from the glimpse.`);
      }
    }
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const difficultyItems = items.filter(
      (item) => item.difficulty === difficulty
    );
    if (difficultyItems.length !== PAGE_GLIMPSE_ITEMS_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: expected ${PAGE_GLIMPSE_ITEMS_PER_DIFFICULTY} items, received ${difficultyItems.length}.`
      );
    }
    for (const questionKind of QUESTION_KINDS) {
      const count = difficultyItems.filter(
        (item) => item.questionKind === questionKind
      ).length;
      if (count !== 2) {
        errors.push(
          `${difficulty}: expected two ${questionKind} items, received ${count}.`
        );
      }
    }
  }

  return errors;
}

export function assertValidPageGlimpseItems(
  items: readonly PageGlimpseItem[]
): void {
  const errors = validatePageGlimpseItems(items);
  if (errors.length > 0) {
    throw new Error(`Invalid Page Glimpse content:\n${errors.join('\n')}`);
  }
}

assertValidPageGlimpseItems(PAGE_GLIMPSE_ITEMS);
