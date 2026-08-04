import type { Difficulty } from '../gameHooks';

export type PreviewCatchTrial = {
  id: string;
  targetWord: string;
  alternateWord: string;
  exactDistractors: readonly [string, string];
};

export type PreviewCatchPassage = {
  id: string;
  difficulty: Difficulty;
  title: string;
  text: string;
  trials: readonly PreviewCatchTrial[];
  question: {
    prompt: string;
    options: readonly [string, string, string, string];
    correctIndex: number;
  };
  source: 'Original editorial content';
  license: 'Original content for this application';
};

const attribution = {
  source: 'Original editorial content',
  license: 'Original content for this application',
} as const;

/**
 * Original connected-text material. Each passage supplies a no-replacement
 * set of preview targets plus one meaning check; no competitor content is used.
 */
export const PREVIEW_CATCH_PASSAGES: readonly PreviewCatchPassage[] = [
  {
    id: 'hill-trail-markers',
    difficulty: 'easy',
    title: 'The Morning Trail',
    text: 'Before sunrise, Maya packs water and a paper map for the hill trail. She follows blue markers beside the path, pauses near a quiet pond, and reaches the lookout while the valley is still covered in mist.',
    trials: [
      { id: 'hill-water', targetWord: 'water', alternateWord: 'juice', exactDistractors: ['wafer', 'winter'] },
      { id: 'hill-map', targetWord: 'map', alternateWord: 'bag', exactDistractors: ['cap', 'mat'] },
      { id: 'hill-markers', targetWord: 'markers', alternateWord: 'arrows', exactDistractors: ['markets', 'makers'] },
      { id: 'hill-pond', targetWord: 'pond', alternateWord: 'field', exactDistractors: ['bond', 'palm'] },
      { id: 'hill-lookout', targetWord: 'lookout', alternateWord: 'shelter', exactDistractors: ['cookout', 'lockout'] },
    ],
    question: {
      prompt: 'What helps Maya stay on the trail?',
      options: ['Blue markers', 'A loud bell', 'Street signs', 'A guide dog'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'repairing-chair',
    difficulty: 'easy',
    title: 'A Useful Repair',
    text: 'At the neighborhood workshop, Omar places a loose chair on the bench. He tightens each screw, checks every joint, and wipes the wooden seat before returning the sturdy chair to the reading room.',
    trials: [
      { id: 'chair-workshop', targetWord: 'workshop', alternateWord: 'garage', exactDistractors: ['workbook', 'worktop'] },
      { id: 'chair-bench', targetWord: 'bench', alternateWord: 'table', exactDistractors: ['beach', 'branch'] },
      { id: 'chair-screw', targetWord: 'screw', alternateWord: 'nail', exactDistractors: ['strew', 'crew'] },
      { id: 'chair-joint', targetWord: 'joint', alternateWord: 'corner', exactDistractors: ['point', 'joist'] },
      { id: 'chair-seat', targetWord: 'seat', alternateWord: 'back', exactDistractors: ['seal', 'heat'] },
    ],
    question: {
      prompt: 'Why does Omar check every joint?',
      options: ['To make the chair sturdy', 'To paint the chair', 'To measure the room', 'To sharpen his tools'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'class-garden',
    difficulty: 'easy',
    title: 'Watching Beans Grow',
    text: 'During the school garden project, the class plants beans in soft soil. Each group labels a row, measures the young stems, and records how sunlight changes their growth during the week.',
    trials: [
      { id: 'garden-garden', targetWord: 'garden', alternateWord: 'science', exactDistractors: ['warden', 'harden'] },
      { id: 'garden-beans', targetWord: 'beans', alternateWord: 'seeds', exactDistractors: ['beads', 'beams'] },
      { id: 'garden-soil', targetWord: 'soil', alternateWord: 'sand', exactDistractors: ['coil', 'sail'] },
      { id: 'garden-labels', targetWord: 'labels', alternateWord: 'paints', exactDistractors: ['tables', 'lapels'] },
      { id: 'garden-sunlight', targetWord: 'sunlight', alternateWord: 'rainfall', exactDistractors: ['sunlit', 'starlight'] },
    ],
    question: {
      prompt: 'What does the class record?',
      options: ['How sunlight changes growth', 'How many birds visit', 'The price of seeds', 'The color of the fence'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'library-archive',
    difficulty: 'medium',
    title: 'Protecting Old Newspapers',
    text: 'The town library opens a small archive for fragile newspapers. Staff photograph each page, place the brittle sheets inside clear sleeves, and attach a searchable label so visitors can locate an article without handling the original copy.',
    trials: [
      { id: 'archive-fragile', targetWord: 'fragile', alternateWord: 'fraction', exactDistractors: ['agile', 'fragility'] },
      { id: 'archive-photograph', targetWord: 'photograph', alternateWord: 'paragraph', exactDistractors: ['photographic', 'phonograph'] },
      { id: 'archive-brittle', targetWord: 'brittle', alternateWord: 'little', exactDistractors: ['battle', 'bristle'] },
      { id: 'archive-searchable', targetWord: 'searchable', alternateWord: 'serviceable', exactDistractors: ['reachable', 'researchable'] },
      { id: 'archive-handling', targetWord: 'handling', alternateWord: 'handing', exactDistractors: ['hanging', 'handwriting'] },
    ],
    question: {
      prompt: 'Why do staff photograph and sleeve the pages?',
      options: ['To reduce handling of the originals', 'To make the newspapers heavier', 'To hide the publication dates', 'To replace every article'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'storm-drain',
    difficulty: 'medium',
    title: 'After the Summer Storm',
    text: 'A sudden summer storm fills the market street with shallow water. Shopkeepers clear leaves from a blocked drain, move boxes onto higher shelves, and place bright warning cones beside the slippery entrance until the pavement dries.',
    trials: [
      { id: 'storm-sudden', targetWord: 'sudden', alternateWord: 'sullen', exactDistractors: ['hidden', 'sodden'] },
      { id: 'storm-shallow', targetWord: 'shallow', alternateWord: 'shadow', exactDistractors: ['hollow', 'yellow'] },
      { id: 'storm-blocked', targetWord: 'blocked', alternateWord: 'booked', exactDistractors: ['locked', 'blacked'] },
      { id: 'storm-warning', targetWord: 'warning', alternateWord: 'warming', exactDistractors: ['morning', 'warping'] },
      { id: 'storm-slippery', targetWord: 'slippery', alternateWord: 'slightly', exactDistractors: ['slippers', 'slivery'] },
    ],
    question: {
      prompt: 'What action helps the water leave the street?',
      options: ['Clearing leaves from the drain', 'Moving boxes to shelves', 'Closing the market', 'Painting the pavement'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'coastal-sensors',
    difficulty: 'medium',
    title: 'Reading the Tide',
    text: 'The coastal research team installs compact sensors along the harbor wall. Every device records water height and temperature, then transmits the measurements to a shared dashboard where analysts compare today’s tide with earlier seasonal patterns.',
    trials: [
      { id: 'coast-compact', targetWord: 'compact', alternateWord: 'contact', exactDistractors: ['impact', 'compacted'] },
      { id: 'coast-device', targetWord: 'device', alternateWord: 'devise', exactDistractors: ['advice', 'divide'] },
      { id: 'coast-transmits', targetWord: 'transmits', alternateWord: 'transits', exactDistractors: ['transmit', 'transforms'] },
      { id: 'coast-dashboard', targetWord: 'dashboard', alternateWord: 'keyboard', exactDistractors: ['dashboards', 'wash board'] },
      { id: 'coast-seasonal', targetWord: 'seasonal', alternateWord: 'reasonable', exactDistractors: ['personal', 'seasonably'] },
    ],
    question: {
      prompt: 'Where do analysts compare the tide measurements?',
      options: ['On a shared dashboard', 'Inside each sensor', 'On the harbor gate', 'In a paper atlas'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'manuscript-restoration',
    difficulty: 'hard',
    title: 'Reversible Repairs',
    text: 'During restoration, conservators preserve the manuscript’s original ink by keeping every page flat. They record formal repair notes, add specific supports beneath weak folds, and choose materials that can be removed without harming the historic paper.',
    trials: [
      { id: 'manuscript-preserve', targetWord: 'preserve', alternateWord: 'reserve', exactDistractors: ['persevere', 'preserved'] },
      { id: 'manuscript-original', targetWord: 'original', alternateWord: 'regional', exactDistractors: ['origin', 'originally'] },
      { id: 'manuscript-formal', targetWord: 'formal', alternateWord: 'normal', exactDistractors: ['format', 'formally'] },
      { id: 'manuscript-specific', targetWord: 'specific', alternateWord: 'pacific', exactDistractors: ['specify', 'specifics'] },
      { id: 'manuscript-harming', targetWord: 'harming', alternateWord: 'warming', exactDistractors: ['charming', 'harmful'] },
    ],
    question: {
      prompt: 'What principle guides the choice of repair materials?',
      options: ['They should be removable', 'They should darken the paper', 'They should be permanent', 'They should hide the original ink'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'wetland-colonies',
    difficulty: 'hard',
    title: 'A Quiet Wetland Survey',
    text: 'Biologists monitoring the wetland count nesting colonies from a concealed platform. They compare current observations with historical records, note subtle changes in feeding behavior, and postpone closer inspection whenever their presence might disturb the birds.',
    trials: [
      { id: 'wetland-monitoring', targetWord: 'monitoring', alternateWord: 'mentoring', exactDistractors: ['monitored', 'motioning'] },
      { id: 'wetland-concealed', targetWord: 'concealed', alternateWord: 'conceded', exactDistractors: ['cancelled', 'concealment'] },
      { id: 'wetland-current', targetWord: 'current', alternateWord: 'torrent', exactDistractors: ['currant', 'currently'] },
      { id: 'wetland-subtle', targetWord: 'subtle', alternateWord: 'settle', exactDistractors: ['subtitle', 'subtly'] },
      { id: 'wetland-disturb', targetWord: 'disturb', alternateWord: 'distribute', exactDistractors: ['disturbed', 'turbid'] },
    ],
    question: {
      prompt: 'Why might the biologists postpone closer inspection?',
      options: ['To avoid disturbing the birds', 'To wait for a larger platform', 'To rewrite the historical records', 'To attract more birds'],
      correctIndex: 0,
    },
    ...attribution,
  },
  {
    id: 'community-cooling-plan',
    difficulty: 'hard',
    title: 'Cooling a Busy Square',
    text: 'The council evaluates a practical plan for cooling the central square. Designers propose additional shade trees, reflective paving, and precisely placed fountains, while engineers estimate maintenance costs before officials adopt the final design.',
    trials: [
      { id: 'cooling-practical', targetWord: 'practical', alternateWord: 'practically', exactDistractors: ['practice', 'tactical'] },
      { id: 'cooling-central', targetWord: 'central', alternateWord: 'neutral', exactDistractors: ['centrally', 'rental'] },
      { id: 'cooling-reflective', targetWord: 'reflective', alternateWord: 'respective', exactDistractors: ['reflection', 'deflective'] },
      { id: 'cooling-precisely', targetWord: 'precisely', alternateWord: 'previously', exactDistractors: ['precision', 'concisely'] },
      { id: 'cooling-adopt', targetWord: 'adopt', alternateWord: 'adapt', exactDistractors: ['adept', 'adopted'] },
    ],
    question: {
      prompt: 'What must engineers estimate before the plan is adopted?',
      options: ['Maintenance costs', 'The age of the council', 'Library attendance', 'Bird migration routes'],
      correctIndex: 0,
    },
    ...attribution,
  },
];

export function normalizePreviewWord(value: string): string {
  return value.toLocaleLowerCase('en').replace(/[^a-z'-]/g, '');
}

export function tokenizePreviewPassage(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function findPreviewTargetIndex(
  passage: PreviewCatchPassage,
  targetWord: string
): number {
  const normalizedTarget = normalizePreviewWord(targetWord);
  return tokenizePreviewPassage(passage.text).findIndex(
    (word) => normalizePreviewWord(word) === normalizedTarget
  );
}

export function getPreviewCatchPassages(
  difficulty: Difficulty
): readonly PreviewCatchPassage[] {
  return PREVIEW_CATCH_PASSAGES.filter(
    (passage) => passage.difficulty === difficulty
  );
}

/** Runtime/test validator for the complete authored-content contract. */
export function validatePreviewCatchContent(
  passages: readonly PreviewCatchPassage[] = PREVIEW_CATCH_PASSAGES
): string[] {
  const errors: string[] = [];
  const passageIds = new Set<string>();
  const trialIds = new Set<string>();

  passages.forEach((passage) => {
    if (passageIds.has(passage.id)) errors.push(`Duplicate passage id: ${passage.id}`);
    passageIds.add(passage.id);
    if (passage.source !== 'Original editorial content') {
      errors.push(`${passage.id}: unsupported source`);
    }
    if (passage.trials.length < 5) errors.push(`${passage.id}: fewer than five trials`);

    const passageWords = tokenizePreviewPassage(passage.text).map(normalizePreviewWord);
    passage.trials.forEach((trial) => {
      if (trialIds.has(trial.id)) errors.push(`Duplicate trial id: ${trial.id}`);
      trialIds.add(trial.id);
      const target = normalizePreviewWord(trial.targetWord);
      const matchingTargets = passageWords.filter((word) => word === target);
      if (matchingTargets.length !== 1) {
        errors.push(`${trial.id}: target must occur exactly once`);
      }
      const answerPool = [
        trial.targetWord,
        trial.alternateWord,
        ...trial.exactDistractors,
      ].map(normalizePreviewWord);
      if (answerPool.some((word) => word.length === 0)) {
        errors.push(`${trial.id}: blank answer option`);
      }
      if (new Set(answerPool).size !== answerPool.length) {
        errors.push(`${trial.id}: duplicate answer option`);
      }
    });

    const { options, correctIndex } = passage.question;
    if (correctIndex < 0 || correctIndex >= options.length) {
      errors.push(`${passage.id}: invalid comprehension answer`);
    }
    if (new Set(options.map((option) => option.trim().toLocaleLowerCase('en'))).size !== options.length) {
      errors.push(`${passage.id}: duplicate comprehension option`);
    }
  });

  (['easy', 'medium', 'hard'] as const).forEach((difficulty) => {
    if (passages.filter((passage) => passage.difficulty === difficulty).length < 3) {
      errors.push(`${difficulty}: fewer than three passages`);
    }
  });
  return errors;
}
