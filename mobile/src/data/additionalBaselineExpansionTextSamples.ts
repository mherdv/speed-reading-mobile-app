import type { TextSample } from '../domain/types';

const ORIGINAL_CONTENT = 'Original content for this application';
const ACCESSIBILITY_NOTES =
  'Plain-language connected text with no image-dependent information.';

/**
 * Original standalone baseline passages. Each item has three questions that
 * require the passage: central idea, explicit evidence, and inference/purpose.
 */
export const ADDITIONAL_BASELINE_EXPANSION_TEXT_SAMPLES:
  readonly TextSample[] = [
    {
      id: 'baseline-13',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'Opening a Gate with the Tide',
      language: 'en',
      genre: 'science',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'A marsh beside an old harbor had been separated from the sea by a road and a narrow drainage gate. '
        + 'For years, the gate opened only when rainwater needed to leave, so very little salt water entered from the harbor. '
        + 'Plants that depended on regular tides declined, and still water remained in shallow channels during hot weather. '
        + 'Engineers could not simply remove the gate because an unrestricted high tide might flood nearby homes. '
        + 'Instead, they installed a gate that responds to water levels on both sides of the road. '
        + 'It admits a measured amount of harbor water during safe tides and closes when levels approach the local flood limit. '
        + 'Biologists now record plant cover, fish movement, and water conditions while engineers inspect the gate after storms. '
        + 'The project treats restoration as an adjustable process: tidal flow can increase gradually, but only while monitoring shows that habitat gains and flood protection remain compatible.',
      question: {
        prompt: 'What is the passage mainly explaining?',
        choices: [
          'Why the marsh restoration uses controlled tidal flow and monitoring',
          'Why every harbor road should be removed immediately',
          'How fish movement causes floods in nearby homes',
          'Why salt water must never enter a coastal marsh',
        ],
        correctIndex: 0,
      },
      questions: [
        {
          id: 'baseline-13-main',
          prompt: 'What is the passage mainly explaining?',
          choices: [
            'Why the marsh restoration uses controlled tidal flow and monitoring',
            'Why every harbor road should be removed immediately',
            'How fish movement causes floods in nearby homes',
            'Why salt water must never enter a coastal marsh',
          ],
          correctIndex: 0,
          type: 'main-idea',
          rationale:
            'The passage describes a level-responsive gate and monitoring that balance habitat restoration with flood protection.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-13-detail',
          prompt: 'Why could engineers not simply remove the old gate?',
          choices: [
            'The harbor contained no salt water',
            'Plants needed the road to grow',
            'An unrestricted high tide could flood nearby homes',
            'The gate was used to count fish',
          ],
          correctIndex: 2,
          type: 'detail-evidence',
          rationale:
            'The passage explicitly identifies possible flooding of nearby homes as the limit on unrestricted flow.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-13-purpose',
          prompt: 'Why do the teams inspect several habitat and water measures?',
          choices: [
            'To decide whether controlled flow can increase without creating unacceptable risk',
            'To prove that one plant species matters more than every other measure',
            'To replace the gate after every safe tide',
            'To keep harbor water permanently outside the marsh',
          ],
          correctIndex: 0,
          type: 'inference-purpose',
          rationale:
            'The final sentences make continued adjustment depend on evidence about both habitat gains and flood safety.',
          answerDependency: 'passage-required',
        },
      ],
    },
    {
      id: 'baseline-14',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'Learning from a Night Bus',
      language: 'en',
      genre: 'practical',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'A city tested a late-night bus on weekends after hospital staff and restaurant workers reported difficulty getting home. '
        + 'The route initially followed the daytime timetable, but empty sections made the trip slow and expensive. '
        + 'Planners reviewed where passengers boarded, which stops were used for transfers, and how often the bus arrived within five minutes of schedule. '
        + 'They also interviewed people who still could not use the service. '
        + 'The next version skipped several empty daytime stops, connected with the final trains, and served a neighborhood that shift workers had identified. '
        + 'Ridership increased, yet the city did not call the trial complete. '
        + 'Passenger counts showed who used the bus, while interviews revealed trips that the route still failed to support. '
        + 'By combining both forms of evidence, planners could improve the service without assuming that the most visible riders represented everyone who needed late transportation.',
      question: {
        prompt: 'What is the central idea of the passage?',
        choices: [
          'A night bus should copy its daytime route exactly',
          'Service improves when usage data and unmet needs guide route revisions',
          'Interviews are more useful than all passenger counts',
          'Late trains make weekend buses unnecessary',
        ],
        correctIndex: 1,
      },
      questions: [
        {
          id: 'baseline-14-main',
          prompt: 'What is the central idea of the passage?',
          choices: [
            'A night bus should copy its daytime route exactly',
            'Service improves when usage data and unmet needs guide route revisions',
            'Interviews are more useful than all passenger counts',
            'Late trains make weekend buses unnecessary',
          ],
          correctIndex: 1,
          type: 'main-idea',
          rationale:
            'The route changes come from combining recorded use with reports from people the first design missed.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-14-detail',
          prompt: 'Which change was made in the revised night route?',
          choices: [
            'It stopped running on weekends',
            'It added every daytime stop',
            'It ended before the final trains arrived',
            'It skipped empty sections and connected with final trains',
          ],
          correctIndex: 3,
          type: 'detail-evidence',
          rationale:
            'The passage directly states that the revision skipped empty stops and connected with final trains.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-14-purpose',
          prompt: 'Why did planners interview people who still could not use the bus?',
          choices: [
            'To identify needed trips that passenger counts could not record',
            'To replace the timetable with personal opinions',
            'To prove that existing riders did not need the service',
            'To count only workers who boarded near restaurants',
          ],
          correctIndex: 0,
          type: 'inference-purpose',
          rationale:
            'People excluded by the route do not appear in its ridership totals, so interviews reveal missing connections.',
          answerDependency: 'passage-required',
        },
      ],
    },
    {
      id: 'baseline-15',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'Reading an Altered Map',
      language: 'en',
      genre: 'history',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'An archive received a hand-drawn map whose paper had darkened and split along several folds. '
        + 'A bold blue line crossed the page, but no one knew whether the line belonged to the original survey or a later owner. '
        + 'Before repairing the paper, conservators photographed it under different kinds of light. '
        + 'They found that the blue material sat above old surface dirt and covered part of a faded label. '
        + 'A dated letter stored with the map described a proposed canal along the same route decades after the survey was made. '
        + 'Together, these clues suggested that the line was a later planning mark rather than part of the first map. '
        + 'The conservators stabilized the folds but did not erase the line. '
        + 'They recorded the evidence in the catalog so future readers could distinguish the map’s original information from a later layer that was also part of its history.',
      question: {
        prompt: 'What is the main point of the passage?',
        choices: [
          'Damaged maps should be redrawn on new paper',
          'Every mark on an old map was made at the same time',
          'Conservators used physical and documentary clues to interpret and preserve a later alteration',
          'The proposed canal was completed before the survey',
        ],
        correctIndex: 2,
      },
      questions: [
        {
          id: 'baseline-15-main',
          prompt: 'What is the main point of the passage?',
          choices: [
            'Damaged maps should be redrawn on new paper',
            'Every mark on an old map was made at the same time',
            'Conservators used physical and documentary clues to interpret and preserve a later alteration',
            'The proposed canal was completed before the survey',
          ],
          correctIndex: 2,
          type: 'main-idea',
          rationale:
            'The investigation combines material evidence and a dated letter, then preserves the interpreted later mark.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-15-detail',
          prompt: 'What did photography reveal about the blue material?',
          choices: [
            'It sat above dirt and covered part of an older label',
            'It appeared beneath every original mark',
            'It had been printed on a separate sheet',
            'It matched ink used to write the survey date',
          ],
          correctIndex: 0,
          type: 'detail-evidence',
          rationale:
            'The passage says the blue material lay above old surface dirt and crossed a faded label.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-15-purpose',
          prompt: 'Why did conservators keep the blue line on the map?',
          choices: [
            'They were unable to photograph it',
            'It was proven to be part of the original survey',
            'The paper could not be repaired near colored material',
            'The later addition had become historical evidence worth documenting',
          ],
          correctIndex: 3,
          type: 'inference-purpose',
          rationale:
            'The final sentence treats the later layer as part of the object’s history even though it was not original.',
          answerDependency: 'passage-required',
        },
      ],
    },
    {
      id: 'baseline-16',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'When Flowers and Bees Meet',
      language: 'en',
      genre: 'science',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'A meadow can contain many flowers and still provide little food for bees during part of the year. '
        + 'What matters is not only how many plant species grow there, but also when each one blooms. '
        + 'If most flowers open during the same three weeks, nectar may be abundant briefly and scarce before or afterward. '
        + 'Researchers record flowering dates and count visiting insects throughout the season to find these gaps. '
        + 'Land managers can then add native plants that bloom earlier or later than the dominant species. '
        + 'The goal is not to keep every plant flowering continuously, which would be impossible. '
        + 'It is to create overlapping periods of bloom so that when one source fades, another begins. '
        + 'A useful meadow plan therefore treats timing as part of diversity: a range of species helps pollinators most when their different schedules produce a steadier sequence of food.',
      question: {
        prompt: 'What is the passage mainly about?',
        choices: [
          'Why all meadow flowers should bloom continuously',
          'Why flower color matters more than nectar',
          'How insects prevent plants from blooming together',
          'How varied bloom times can provide pollinators with steadier food',
        ],
        correctIndex: 3,
      },
      questions: [
        {
          id: 'baseline-16-main',
          prompt: 'What is the passage mainly about?',
          choices: [
            'Why all meadow flowers should bloom continuously',
            'Why flower color matters more than nectar',
            'How insects prevent plants from blooming together',
            'How varied bloom times can provide pollinators with steadier food',
          ],
          correctIndex: 3,
          type: 'main-idea',
          rationale:
            'The passage explains why overlapping early, middle, and late bloom periods make plant diversity more useful.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-16-detail',
          prompt: 'What do researchers record to locate seasonal food gaps?',
          choices: [
            'Only the final height of each plant',
            'Flowering dates and insect visits across the season',
            'The number of fences around the meadow',
            'Daily soil color at one location',
          ],
          correctIndex: 1,
          type: 'detail-evidence',
          rationale:
            'The passage explicitly names flowering dates and repeated insect counts.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-16-purpose',
          prompt: 'Why might managers add plants that bloom later?',
          choices: [
            'To provide food after earlier flower sources fade',
            'To make every existing plant stop blooming',
            'To reduce the number of native plant species',
            'To concentrate all nectar into three weeks',
          ],
          correctIndex: 0,
          type: 'inference-purpose',
          rationale:
            'Later-blooming plants extend the sequence of available food beyond the dominant flowering period.',
          answerDependency: 'passage-required',
        },
      ],
    },
    {
      id: 'baseline-17',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'Baking for an Uncertain Morning',
      language: 'en',
      genre: 'narrative',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'A worker-owned bakery once prepared the same number of loaves every morning. '
        + 'On rainy weekdays, bread remained unsold, while festival Saturdays emptied the shelves before noon. '
        + 'The bakers began recording sales by product, day, weather, and nearby events. '
        + 'They did not expect the records to predict demand perfectly. '
        + 'Instead, the team used recent patterns to set a starting batch and kept a small amount of dough ready for a second bake. '
        + 'Common loaves could be added quickly if demand rose, while slower specialty breads were made in smaller numbers unless advance orders were strong. '
        + 'Waste declined, and customers were less likely to find every shelf empty. '
        + 'The improvement came from combining a forecast with flexibility: the records guided the first decision, and the reserve dough allowed the bakery to respond when the morning differed from the estimate.',
      question: {
        prompt: 'What strategy helped the bakery improve?',
        choices: [
          'Making exactly the same amount regardless of conditions',
          'Using sales patterns for a starting plan while preserving capacity to adjust',
          'Baking specialty bread only after every common loaf sold',
          'Closing whenever rain made demand uncertain',
        ],
        correctIndex: 1,
      },
      questions: [
        {
          id: 'baseline-17-main',
          prompt: 'What strategy helped the bakery improve?',
          choices: [
            'Making exactly the same amount regardless of conditions',
            'Using sales patterns for a starting plan while preserving capacity to adjust',
            'Baking specialty bread only after every common loaf sold',
            'Closing whenever rain made demand uncertain',
          ],
          correctIndex: 1,
          type: 'main-idea',
          rationale:
            'The bakery combines a data-informed first batch with reserve dough for later adjustment.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-17-detail',
          prompt: 'Which information did the bakers record?',
          choices: [
            'Only the names of customers',
            'The color of each empty shelf',
            'Sales, day, weather, and nearby events',
            'The age of every piece of equipment',
          ],
          correctIndex: 2,
          type: 'detail-evidence',
          rationale:
            'The passage lists product sales, day, weather, and events as recorded factors.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-17-purpose',
          prompt: 'What was the purpose of keeping reserve dough?',
          choices: [
            'To respond when actual demand exceeded the starting estimate',
            'To avoid making common loaves during busy periods',
            'To guarantee that forecasts were always exact',
            'To increase the number of unsold specialty breads',
          ],
          correctIndex: 0,
          type: 'inference-purpose',
          rationale:
            'Reserve dough provided the flexibility to add bread after the morning’s real demand became visible.',
          answerDependency: 'passage-required',
        },
      ],
    },
    {
      id: 'baseline-18',
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: 'A Notice People Can Use',
      language: 'en',
      genre: 'argument',
      complexityBand: 'baseline-brief',
      source: 'Original editorial content',
      license: ORIGINAL_CONTENT,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text:
        'A translated public notice can be grammatically accurate and still be difficult to use. '
        + 'A housing office learned this after residents misunderstood a letter about temporary water shutoffs. '
        + 'The translation preserved the original sentences, but the most important action and deadline were buried in a long paragraph. '
        + 'For the next notice, the office worked with community reviewers who regularly used the translated language. '
        + 'They moved the date and required action to the top, replaced an unfamiliar technical phrase with a clear explanation, and kept the service telephone number beside the instruction. '
        + 'Reviewers also checked that the tone was respectful rather than needlessly alarming. '
        + 'The revised process did more than exchange words between languages. '
        + 'It tested whether readers could find, understand, and act on the message. '
        + 'For practical communication, a faithful translation must preserve meaning while also making the intended task visible.',
      question: {
        prompt: 'What claim does the passage make about practical translation?',
        choices: [
          'It should preserve meaning and make the required action easy to find',
          'It should retain the source sentence order in every case',
          'It should remove deadlines that may alarm readers',
          'It should replace community review with technical vocabulary',
        ],
        correctIndex: 0,
      },
      questions: [
        {
          id: 'baseline-18-main',
          prompt: 'What claim does the passage make about practical translation?',
          choices: [
            'It should preserve meaning and make the required action easy to find',
            'It should retain the source sentence order in every case',
            'It should remove deadlines that may alarm readers',
            'It should replace community review with technical vocabulary',
          ],
          correctIndex: 0,
          type: 'main-idea',
          rationale:
            'The passage argues that usable translation combines faithful meaning with visible, understandable action.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-18-detail',
          prompt: 'What did community reviewers change in the later notice?',
          choices: [
            'They removed the service telephone number',
            'They placed the date and action first and clarified a technical phrase',
            'They made the tone more alarming',
            'They combined every instruction into one longer paragraph',
          ],
          correctIndex: 1,
          type: 'detail-evidence',
          rationale:
            'The passage explicitly describes moving the date/action and replacing an unfamiliar phrase.',
          answerDependency: 'passage-required',
        },
        {
          id: 'baseline-18-purpose',
          prompt: 'Why were regular users of the translated language involved?',
          choices: [
            'To decide whether readers could understand and act on the notice',
            'To shorten the water shutoff itself',
            'To prevent the office from including a deadline',
            'To ensure every original sentence stayed in its original position',
          ],
          correctIndex: 0,
          type: 'inference-purpose',
          rationale:
            'Their review tests real usability, which the first grammatically accurate translation failed to ensure.',
          answerDependency: 'passage-required',
        },
      ],
    },
  ];
