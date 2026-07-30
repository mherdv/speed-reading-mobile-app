import { ADDITIONAL_MAIN_IDEA_PASSAGES } from './additionalMainIdeaPassages';

export type MainIdeaPassage = {
  id: string;
  title: string;
  text: string;
  choices: string[];
  correctIndex: number;
  feedback: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  inferenceDepth?: 'explicit' | 'synthesis' | 'qualification';
};

export const MAIN_IDEA_PASSAGES: MainIdeaPassage[] = [
  {
    id: 'urban-trees',
    title: 'A cooler city block',
    text:
      'City trees do more than decorate streets. Their leaves shade pavement and buildings, while water released from leaves cools the surrounding air. Neighborhoods with a mature tree canopy can therefore stay noticeably cooler during heat waves. Trees also slow rainwater and provide habitat, but these benefits depend on long-term care. A planting campaign has limited value if young trees are placed in poor soil and then left without water during their first summers.',
    choices: [
      'Young city trees grow best beside busy roads.',
      'Urban trees cool neighborhoods, but lasting benefits require maintenance.',
      'Rainwater is the main cause of dangerous city heat.',
      'Cities should replace pavement with forest habitat.',
    ],
    correctIndex: 1,
    feedback:
      'The passage connects the cooling benefit with its main condition: cities must care for trees after planting.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'sleep-memory',
    title: 'Why sleep follows study',
    text:
      'Learning does not end when a study session stops. During sleep, the brain reactivates patterns associated with recent experiences and helps stabilize them as memories. This does not mean sleep can replace attention or practice. Instead, sleep protects and reorganizes material that was encoded while awake. Cutting sleep to gain one more hour of late-night review may therefore weaken the very memories the extra study was meant to strengthen.',
    choices: [
      'Sleep strengthens recently learned material but cannot replace focused study.',
      'People learn new facts while they are completely asleep.',
      'Late-night studying is always more effective than morning practice.',
      'Memory formation ends as soon as a study session stops.',
    ],
    correctIndex: 0,
    feedback:
      'The central claim combines both parts: sleep supports consolidation, but useful learning still has to happen while awake.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'deliberate-practice',
    title: 'Practice with a target',
    text:
      'Simply repeating an activity can make it feel familiar without fixing weak points. Deliberate practice is different: a learner chooses a specific skill just beyond current ability, receives information about errors, and tries again with an adjustment. This process is less comfortable than repeating what already works, yet it makes each attempt informative. Improvement comes from a cycle of focused effort, feedback, and correction rather than from time spent alone.',
    choices: [
      'Comfort is the best signal that practice is working.',
      'Experts improve mainly by spending more time on easy tasks.',
      'Targeted practice uses feedback and correction to address a specific weakness.',
      'Repeating the same action automatically removes every error.',
    ],
    correctIndex: 2,
    feedback:
      'The repeated structure of the paragraph—target, feedback, adjustment—defines its main idea.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'coral-restoration',
    title: 'Restoring a reef',
    text:
      'Coral nurseries can grow fragments that are later attached to damaged reefs. The method can restore small areas and preserve important genetic varieties, but it cannot shield reefs from every threat. If ocean temperatures continue to rise or polluted water reaches the site, transplanted coral may bleach or die like the original colony. Restoration is most useful when it is paired with work that reduces the larger causes of reef decline.',
    choices: [
      'Coral nurseries can replace every reef lost to warming.',
      'Transplanted coral is unaffected by pollution.',
      'Genetic variety is the only measure of a healthy reef.',
      'Coral restoration helps locally but must accompany action on wider threats.',
    ],
    correctIndex: 3,
    feedback:
      'The author acknowledges the value of restoration, then limits the claim by emphasizing broader environmental threats.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'library-access',
    title: 'The library as infrastructure',
    text:
      'A public library lends books, but its role is broader than its shelves. People use library internet access to complete forms, apply for work, and attend online appointments. Quiet rooms support students who lack study space at home, and staff help visitors judge whether information is reliable. These services make the library a form of shared civic infrastructure: a place where access to knowledge also provides access to practical opportunities.',
    choices: [
      'Libraries matter only when their book collections are large.',
      'Public libraries provide shared access to information and practical opportunities.',
      'Online appointments should always take place in quiet rooms.',
      'Library staff should complete job applications for visitors.',
    ],
    correctIndex: 1,
    feedback:
      'The examples all support the final generalization: libraries connect knowledge access with participation in everyday life.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'prediction-weather',
    title: 'A useful forecast',
    text:
      'A weather forecast is not a promise; it is an estimate built from observations and models. A forty percent chance of rain does not mean the forecast failed when a particular street stays dry. It describes uncertainty across an area and period of time. Forecasts become more useful when people match decisions to risk—for example, carrying a light umbrella for a moderate chance of rain, but changing outdoor plans when dangerous storms are likely.',
    choices: [
      'A forecast should be judged as a risk estimate used to guide decisions.',
      'Rain probability refers only to one exact street.',
      'Weather models can remove all uncertainty from a forecast.',
      'Outdoor plans should be cancelled whenever rain is possible.',
    ],
    correctIndex: 0,
    feedback:
      'The passage explains uncertainty so readers can use forecasts for proportionate decisions, not treat them as guarantees.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'bus-arrival-display',
    title: 'When the display goes blank',
    text:
      'Live arrival screens make waiting for a bus easier because riders can decide whether to stay, walk, or choose another route. Yet the screens depend on vehicle signals and a working network. When data is missing, showing an old arrival time as if it were current creates more confusion than showing no estimate. A useful system therefore pairs live information with a clear “data unavailable” message and a posted schedule as a backup.',
    choices: [
      'Arrival screens should hide every service delay.',
      'Posted schedules are always more accurate than live data.',
      'Useful arrival displays provide live estimates and communicate clearly when those estimates are unavailable.',
      'Riders should never choose a different route.',
    ],
    correctIndex: 2,
    feedback:
      'The paragraph supports live information while stressing honest failure states and a backup.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'community-tool-library',
    title: 'Borrowing more than books',
    text:
      'A neighborhood tool library lets residents borrow drills, ladders, and garden equipment that they may need only a few times each year. Members save storage space and avoid buying rarely used items. The library also schedules basic repair classes, which help people use the tools safely and keep them working longer. Shared equipment succeeds, however, only when borrowers return it on time and report damage promptly.',
    choices: [
      'A tool library reduces unnecessary purchases but depends on responsible sharing.',
      'Every household should own a separate set of tools.',
      'Repair classes make return dates unnecessary.',
      'Garden equipment should never be borrowed.',
    ],
    correctIndex: 0,
    feedback:
      'The benefits of shared equipment and the condition of responsible borrowing form the complete main idea.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'quiet-study-breaks',
    title: 'A pause that protects focus',
    text:
      'Long study sessions often feel productive because they take a great deal of time. Attention, however, usually fades before the session ends. A brief planned break can interrupt mindless rereading and give a learner a chance to check what was actually remembered. The break works best when it has a clear end; an open-ended visit to social media can replace the study session instead of refreshing it.',
    choices: [
      'Studying longer always produces stronger memory.',
      'Planned, limited breaks can restore attention, while unbounded distractions can derail study.',
      'Social media is the only effective way to rest.',
      'Learners should stop checking what they remember.',
    ],
    correctIndex: 1,
    feedback:
      'The author recommends bounded breaks and contrasts them with distractions that have no stopping point.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'retrieval-before-review',
    title: 'Try to remember first',
    text:
      'When learners reread notes immediately, every line looks familiar, and that familiarity can be mistaken for mastery. Trying to recall the material before reopening the notes produces a more useful signal. Missing ideas reveal exactly what needs another look, while successfully retrieved ideas become easier to access later. Review still matters, but it becomes more efficient when retrieval determines where attention should go.',
    choices: [
      'Familiar-looking notes prove that material is mastered.',
      'Review should be removed from every study routine.',
      'Recall attempts make learning harder without offering information.',
      'Attempting retrieval before review reveals gaps and directs later study.',
    ],
    correctIndex: 3,
    feedback:
      'Every example supports using recall as a diagnostic step before targeted review.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'bike-lane-pilot',
    title: 'Testing a street change',
    text:
      'The city installed a temporary protected bike lane using paint and movable barriers rather than rebuilding the street immediately. During the three-month pilot, staff measured travel times, bicycle use, delivery access, and collisions. The temporary materials were not the final design; they made revision inexpensive. By testing several outcomes before committing permanent funds, the city could keep useful features and change those that caused avoidable problems.',
    choices: [
      'Temporary street pilots allow evidence and revision to guide permanent investment.',
      'Paint and movable barriers should remain forever.',
      'Only bicycle counts matter when a street changes.',
      'A city should avoid measuring unexpected effects.',
    ],
    correctIndex: 0,
    feedback:
      'The purpose of temporary materials and multiple measurements is to support an informed, revisable decision.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'museum-object-labels',
    title: 'A label that opens a question',
    text:
      'Traditional museum labels often list an object’s date, material, and maker. A revised label can retain those facts while also explaining how the object was used, who collected it, and which parts of its history remain disputed. This added context does not tell visitors what to think. Instead, it gives them enough evidence to ask better questions and recognize that a confident display may still contain uncertainty.',
    choices: [
      'Museum labels should remove dates and materials.',
      'Visitors should accept every display without questions.',
      'Contextual labels combine core facts with evidence and uncertainty that support deeper interpretation.',
      'Disputed histories cannot be shown in museums.',
    ],
    correctIndex: 2,
    feedback:
      'The passage argues for labels that preserve facts while enabling informed interpretation rather than prescribing it.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'average-wait-time',
    title: 'What the average conceals',
    text:
      'A clinic reported that its average waiting time fell from thirty minutes to twenty. The improvement was real, but the average alone obscured an important pattern: most appointments began within ten minutes, while a smaller group still waited more than an hour. Adding the median and the range made the report less tidy but more useful. A summary measure can support a decision only when readers also know whether the distribution contains consequential extremes.',
    choices: [
      'A lower average proves that every patient waited less.',
      'Averages are useless and should never be reported.',
      'Clinics should report only their longest wait.',
      'An average can show change but may need distribution details to reveal important unequal experiences.',
    ],
    correctIndex: 3,
    feedback:
      'The claim is qualified: the average is informative, but not sufficient when extreme waits affect a subgroup.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'automated-draft-review',
    title: 'Assistance without delegation',
    text:
      'A newsroom used an automated system to create first drafts of routine weather summaries. Editors remained responsible for checking every number, correcting emphasis, and deciding whether unusual conditions required original reporting. The tool reduced repetitive typing, but its speed created a new risk: fluent wording could make an incorrect detail seem trustworthy. The experiment saved time only when verification remained a required stage rather than an optional response to obvious errors.',
    choices: [
      'Fluent automated writing no longer requires verification.',
      'Automation can reduce routine work, but accountable review must remain part of the process.',
      'Weather summaries should contain no numerical details.',
      'Editors should review only writing that sounds unusual.',
    ],
    correctIndex: 1,
    feedback:
      'The passage accepts a productivity benefit while making it conditional on systematic human verification.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'tourism-conservation',
    title: 'Visitors and a fragile reserve',
    text:
      'Entrance fees from a coastal reserve funded habitat restoration and local guides, giving nearby communities a direct benefit from conservation. As visitor numbers grew, however, boats disturbed nesting areas and footpaths widened into sensitive vegetation. Closing the reserve entirely would remove both pressure and income, while unrestricted access would damage the resource attracting visitors. Managers instead limited daily entries, shifted routes seasonally, and published monitoring results so the limits could change with conditions.',
    choices: [
      'The reserve must choose permanently between tourism and conservation.',
      'More visitors always provide greater conservation benefits.',
      'Adaptive limits can preserve tourism benefits while responding to measured ecological harm.',
      'Monitoring is unnecessary once entry fees are collected.',
    ],
    correctIndex: 2,
    feedback:
      'The response balances competing effects through monitored, revisable limits rather than an absolute rule.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  ...ADDITIONAL_MAIN_IDEA_PASSAGES,
];

export const MAIN_IDEA_PASSAGES_PER_DIFFICULTY = 12;

const EXPECTED_DEPTH = {
  easy: 'explicit',
  medium: 'synthesis',
  hard: 'qualification',
} as const;

export function validateMainIdeaPassages(
  passages: readonly MainIdeaPassage[] = MAIN_IDEA_PASSAGES
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const passage of passages) {
    if (!passage.id.trim()) {
      errors.push('Main Idea passage ID is required');
    } else if (ids.has(passage.id)) {
      errors.push(`Duplicate Main Idea passage ID: ${passage.id}`);
    }
    ids.add(passage.id);

    if (!passage.title.trim() || !passage.text.trim() || !passage.feedback.trim()) {
      errors.push(`${passage.id}: title, text, and feedback are required`);
    }
    if (passage.choices.length !== 4) {
      errors.push(`${passage.id}: exactly four choices required`);
    }
    if (
      new Set(
        passage.choices.map((choice) => choice.trim().toLocaleLowerCase('en'))
      ).size !== passage.choices.length ||
      passage.choices.some((choice) => !choice.trim())
    ) {
      errors.push(`${passage.id}: answer choices must be non-empty and unique`);
    }
    if (
      passage.correctIndex < 0 ||
      passage.correctIndex >= passage.choices.length
    ) {
      errors.push(`${passage.id}: correct answer is missing`);
    }
    if (
      !passage.difficulty ||
      passage.inferenceDepth !== EXPECTED_DEPTH[passage.difficulty]
    ) {
      errors.push(`${passage.id}: difficulty and inference depth do not match`);
    }
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const levelPassages = passages.filter(
      (passage) => passage.difficulty === difficulty
    );
    if (levelPassages.length !== MAIN_IDEA_PASSAGES_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: exactly ${MAIN_IDEA_PASSAGES_PER_DIFFICULTY} Main Idea passages required`
      );
    }
    const positions = [0, 0, 0, 0];
    for (const passage of levelPassages) {
      if (passage.correctIndex >= 0 && passage.correctIndex < 4) {
        positions[passage.correctIndex] += 1;
      }
    }
    if (Math.max(...positions) - Math.min(...positions) > 1) {
      errors.push(`${difficulty}: correct-answer positions must be balanced`);
    }
  }

  return errors;
}
