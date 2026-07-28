import type { TextSample } from '../domain/types';

const ORIGINAL_CONTENT = 'Original content for this application';
const ACCESSIBILITY_NOTES =
  'Plain-language connected text with no image-dependent information.';

export const ADDITIONAL_BASELINE_TEXT_SAMPLES: readonly TextSample[] = [
  {
    id: 'baseline-4',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'How Trees Cool a Street',
    language: 'en',
    genre: 'science',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'On a hot afternoon, two nearby streets can feel surprisingly different. '
      + 'The street with mature trees is often cooler because leaves interrupt sunlight before it reaches walls and pavement. '
      + 'Trees also release water vapor through tiny openings in their leaves. '
      + 'That process uses heat from the surrounding air, producing an effect similar to evaporation from damp skin. '
      + 'Researchers compare shaded and unshaded locations with temperature sensors placed at the same height and measured at the same time. '
      + 'The difference is not constant: tree species, soil moisture, wind, and the width of the canopy all matter. '
      + 'A narrow young tree may cast only a small patch of shade, while several connected crowns can cool a walking route. '
      + 'For this reason, planners look beyond the number of trees. '
      + 'They also consider where shade will fall during the hottest hours and whether new trees will have enough water and soil to survive.',
    question: {
      prompt: 'What is the passage mainly explaining?',
      choices: [
        'Why tree placement and condition affect street cooling',
        'Why every tree species creates identical shade',
        'How sensors make streets warmer',
        'Why planners count only young trees',
      ],
      correctIndex: 0,
    },
    questions: [
      {
        id: 'baseline-4-main',
        prompt: 'What is the passage mainly explaining?',
        choices: [
          'Why tree placement and condition affect street cooling',
          'Why every tree species creates identical shade',
          'How sensors make streets warmer',
          'Why planners count only young trees',
        ],
        correctIndex: 0,
        type: 'main-idea',
        rationale:
          'The passage explains two cooling mechanisms and why location, canopy, soil, and water affect the result.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-4-detail',
        prompt: 'How do researchers make a fair street-temperature comparison?',
        choices: [
          'They measure only after sunset',
          'They use different sensor heights',
          'They measure shaded and unshaded places at the same height and time',
          'They count leaves instead of measuring temperature',
        ],
        correctIndex: 2,
        type: 'detail-evidence',
        rationale:
          'The passage specifies sensors at the same height and measurements at the same time.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-4-purpose',
        prompt: 'Why do planners consider where shade falls during the hottest hours?',
        choices: [
          'Because all shade disappears at noon',
          'Because the practical cooling benefit depends on when and where shade is available',
          'Because wind matters only in the morning',
          'Because soil moisture can be seen from a distance',
        ],
        correctIndex: 1,
        type: 'inference-purpose',
        rationale:
          'The passage connects useful walking-route cooling to the timing and position of the canopy’s shade.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-5',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'The Repair Table',
    language: 'en',
    genre: 'narrative',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'On the first Saturday of each month, a library clears its largest table for a community repair session. '
      + 'Visitors arrive with lamps, loose chair legs, torn bags, and small appliances that no longer work. '
      + 'The volunteers do not promise that every object can be saved. '
      + 'Instead, they begin by asking the owner what changed and whether the problem appeared suddenly or gradually. '
      + 'That short history often suggests where to inspect first. '
      + 'One volunteer checks electrical items, another brings sewing tools, and a third helps people find replacement parts. '
      + 'Owners remain at the table and take part in the repair rather than leaving an object for collection later. '
      + 'Even an unsuccessful attempt can be useful because the owner learns why a repair would be unsafe or too costly. '
      + 'The event therefore reduces some waste, but its larger purpose is to share practical knowledge and make unfamiliar tools less intimidating.',
    question: {
      prompt: 'What is the repair session’s larger purpose?',
      choices: [
        'To sell new appliances',
        'To share practical knowledge while attempting repairs',
        'To guarantee every object is restored',
        'To collect objects for the library',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'baseline-5-main',
        prompt: 'What is the repair session’s larger purpose?',
        choices: [
          'To sell new appliances',
          'To share practical knowledge while attempting repairs',
          'To guarantee every object is restored',
          'To collect objects for the library',
        ],
        correctIndex: 1,
        type: 'main-idea',
        rationale:
          'The final sentence identifies knowledge-sharing and confidence with tools as the purpose beyond reducing waste.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-5-detail',
        prompt: 'What do volunteers ask before inspecting an object?',
        choices: [
          'How much the owner will pay',
          'Where it was purchased',
          'What changed and when the problem appeared',
          'Whether the library may keep it',
        ],
        correctIndex: 2,
        type: 'detail-evidence',
        rationale:
          'The passage says volunteers first ask what changed and whether the problem appeared suddenly or gradually.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-5-purpose',
        prompt: 'Why do owners remain at the repair table?',
        choices: [
          'So they can participate and learn during the attempt',
          'So volunteers can avoid using tools',
          'So the library can close early',
          'So broken objects cannot be inspected',
        ],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale:
          'Participation supports the event’s stated goal of sharing practical knowledge rather than providing a drop-off service.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-6',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Voices in the Archive',
    language: 'en',
    genre: 'history',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'A local history archive may contain more than official documents and old photographs. '
      + 'Many archives also record interviews with residents who remember how a neighborhood changed. '
      + 'Before an interview, a researcher studies maps, newspapers, and earlier records so the questions can be specific. '
      + 'During the conversation, the interviewer still leaves room for unexpected memories. '
      + 'A story about a closed cinema, for example, might reveal where teenagers gathered, which bus route they used, and how businesses shared the street. '
      + 'Memories are valuable, but they are not treated as perfect transcripts of the past. '
      + 'Dates can be confused, separate events can merge, and people may interpret the same change differently. '
      + 'Archivists therefore label the speaker, date, and recording conditions, then compare the account with other sources. '
      + 'The recording adds a personal viewpoint to the historical record while its documentation helps future listeners judge how the account should be used.',
    question: {
      prompt: 'How does the passage describe recorded memories?',
      choices: [
        'As useless unless every date is exact',
        'As personal evidence that should be documented and compared',
        'As replacements for all written records',
        'As conversations that need no preparation',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'baseline-6-main',
        prompt: 'How does the passage describe recorded memories?',
        choices: [
          'As useless unless every date is exact',
          'As personal evidence that should be documented and compared',
          'As replacements for all written records',
          'As conversations that need no preparation',
        ],
        correctIndex: 1,
        type: 'main-idea',
        rationale:
          'The passage values personal viewpoints while explaining why archives document and compare them with other sources.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-6-detail',
        prompt: 'What does a researcher do before an interview?',
        choices: [
          'Studies existing records to prepare specific questions',
          'Asks the speaker to memorize dates',
          'Removes all unexpected topics',
          'Publishes the recording immediately',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The passage lists maps, newspapers, and earlier records as preparation for specific questions.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-6-purpose',
        prompt: 'Why are the speaker and recording conditions labeled?',
        choices: [
          'To make the interview sound official',
          'To shorten the recording',
          'To help future listeners evaluate the account',
          'To prevent comparison with other sources',
        ],
        correctIndex: 2,
        type: 'inference-purpose',
        rationale:
          'The final sentence says documentation helps future listeners judge how the account should be used.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-7',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'A Meadow Underwater',
    language: 'en',
    genre: 'science',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'Seagrass is a flowering plant that grows in shallow coastal water, often forming wide underwater meadows. '
      + 'Its leaves slow moving water, while its roots hold sediment in place. '
      + 'Small fish and other animals use the meadow for food and shelter. '
      + 'When boat anchors, cloudy runoff, or repeated disturbance remove the plants, simply scattering new seeds may not restore the habitat. '
      + 'The original cause of damage must also be reduced. '
      + 'A restoration team might redirect runoff, mark a route for boats, and test small planting areas before attempting a larger project. '
      + 'The team then measures more than the number of new shoots. '
      + 'It checks whether the plants survive different seasons, whether bare sediment remains stable, and whether animals return. '
      + 'These observations take time because a patch that looks successful after one calm month may disappear during a storm. '
      + 'A durable recovery is therefore judged by the return of a functioning habitat, not by a brief increase in plant cover.',
    question: {
      prompt: 'What is required for durable seagrass recovery?',
      choices: [
        'Planting once and counting shoots immediately',
        'Reducing the cause of damage and tracking habitat function over time',
        'Moving every animal away from the meadow',
        'Waiting for storms before taking measurements',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'baseline-7-main',
        prompt: 'What is required for durable seagrass recovery?',
        choices: [
          'Planting once and counting shoots immediately',
          'Reducing the cause of damage and tracking habitat function over time',
          'Moving every animal away from the meadow',
          'Waiting for storms before taking measurements',
        ],
        correctIndex: 1,
        type: 'main-idea',
        rationale:
          'The passage emphasizes removing the damage source and judging recovery through survival, stability, and returning animals.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-7-detail',
        prompt: 'Which action may be taken before a large planting project?',
        choices: [
          'Testing small planting areas',
          'Removing all sediment',
          'Increasing cloudy runoff',
          'Counting only the first month’s shoots',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The passage explicitly mentions testing small planting areas before a larger project.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-7-purpose',
        prompt: 'Why does the team observe the meadow across different seasons?',
        choices: [
          'Because seagrass grows only during storms',
          'Because short-term plant cover may not survive changing conditions',
          'Because animals never return in a calm month',
          'Because roots cannot hold sediment',
        ],
        correctIndex: 1,
        type: 'inference-purpose',
        rationale:
          'The passage warns that a promising patch after one calm month may disappear during a storm.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-8',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Testing a Safer Crossing',
    language: 'en',
    genre: 'argument',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'Changing a busy intersection permanently can be expensive, so some cities begin with a temporary street trial. '
      + 'Paint, movable posts, and planters can shorten a pedestrian crossing or create a protected waiting area without rebuilding the road. '
      + 'The trial gives planners a chance to observe how people actually use the new layout. '
      + 'They may measure vehicle speed, crossing time, traffic delay, and whether drivers yield more often. '
      + 'They also collect comments from residents, delivery workers, bus operators, and people with disabilities. '
      + 'No single measurement decides the result. '
      + 'A design that reduces vehicle speed but blocks a bus turn still needs revision. '
      + 'Likewise, one crowded afternoon does not prove that the layout always fails. '
      + 'Planners compare conditions before and during the trial, look for patterns across several days, and adjust the materials when a problem appears. '
      + 'Temporary changes are useful because they make an idea testable while it is still relatively easy to improve.',
    question: {
      prompt: 'Why do cities use temporary street trials?',
      choices: [
        'To avoid collecting public comments',
        'To test and improve a design before permanent construction',
        'To make every intersection identical',
        'To measure only vehicle speed',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'baseline-8-main',
        prompt: 'Why do cities use temporary street trials?',
        choices: [
          'To avoid collecting public comments',
          'To test and improve a design before permanent construction',
          'To make every intersection identical',
          'To measure only vehicle speed',
        ],
        correctIndex: 1,
        type: 'main-idea',
        rationale:
          'The passage presents temporary materials as a way to observe, compare, and revise a design before rebuilding.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-8-detail',
        prompt: 'Which problem shows that a speed-reducing design may still need revision?',
        choices: [
          'It uses paint and planters',
          'It makes drivers yield',
          'It blocks a bus turn',
          'It shortens a crossing',
        ],
        correctIndex: 2,
        type: 'detail-evidence',
        rationale:
          'The passage explicitly gives a blocked bus turn as a reason to revise an otherwise useful design.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-8-purpose',
        prompt: 'Why are observations collected across several days?',
        choices: [
          'To distinguish a pattern from one unusual period',
          'To prevent any changes to the trial',
          'To use fewer kinds of evidence',
          'To guarantee that traffic never slows',
        ],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale:
          'The passage contrasts patterns across days with the weak evidence of one crowded afternoon.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-9',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'The Seed Library',
    language: 'en',
    genre: 'practical',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'A seed library allows gardeners to take small packets of seed and, when possible, return seed collected after the harvest. '
      + 'The exchange works best with plants whose seeds reliably produce offspring similar to the parent plant. '
      + 'Members label each packet with the plant name, collection year, and useful growing notes. '
      + 'Those notes may include the location, the amount of sun, or whether the plant handled a dry summer. '
      + 'Clear labels matter because two seeds that look alike can grow into plants with very different needs. '
      + 'The library also asks members to avoid collecting from diseased plants and to keep varieties separated when unwanted cross-pollination is likely. '
      + 'Not every borrower must return the same amount, since weather, pests, or inexperience can ruin a crop. '
      + 'The system depends instead on many modest contributions over time. '
      + 'Besides reducing the cost of gardening, the shared collection preserves locally successful varieties and records practical knowledge that rarely appears on a commercial seed packet.',
    question: {
      prompt: 'What does the seed library preserve besides seeds?',
      choices: [
        'Commercial advertising',
        'Local growing knowledge',
        'Only records of failed crops',
        'Tools for repairing gardens',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'baseline-9-main',
        prompt: 'What does the seed library preserve besides seeds?',
        choices: [
          'Commercial advertising',
          'Local growing knowledge',
          'Only records of failed crops',
          'Tools for repairing gardens',
        ],
        correctIndex: 1,
        type: 'main-idea',
        rationale:
          'The passage concludes that the collection records locally useful practical knowledge as well as preserving varieties.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-9-detail',
        prompt: 'Which information belongs on a seed packet?',
        choices: [
          'The plant name, collection year, and growing notes',
          'The borrower’s reading speed',
          'The price of every garden tool',
          'Only the color of the seed',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The passage directly lists the plant name, collection year, and useful growing notes.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-9-purpose',
        prompt: 'Why is every borrower not required to return the same amount of seed?',
        choices: [
          'Because labels are optional',
          'Because seeds never resemble their parent plants',
          'Because growing success can be affected by conditions and experience',
          'Because the library accepts only commercial packets',
        ],
        correctIndex: 2,
        type: 'inference-purpose',
        rationale:
          'The passage cites weather, pests, and inexperience as reasons that a borrower may be unable to return seed.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-10',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Why a Room Sounds Different',
    language: 'en',
    genre: 'science',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'An empty room often produces a sharp echo that disappears after furniture is added. '
      + 'The walls have not moved, but the way sound travels through the room has changed. '
      + 'Hard, flat surfaces reflect much of the sound that reaches them. '
      + 'When several reflections return to a listener only moments apart, speech can become difficult to understand. '
      + 'Soft and irregular materials interrupt that pattern. '
      + 'Curtains and upholstered seats absorb part of the sound, while shelves and other uneven surfaces scatter reflections in several directions. '
      + 'A recording studio uses these effects carefully, but an ordinary meeting room can improve without specialized construction. '
      + 'A rug beneath the table, fabric panels on one bare wall, or bookshelves opposite a window may reduce the strongest reflections. '
      + 'The goal is not to remove every reflection, because a completely muted room can feel unnatural. '
      + 'Instead, the room should preserve useful sound while preventing echoes from competing with the person who is speaking.',
    question: {
      prompt: 'What is the passage mainly explaining?',
      choices: [
        'How furnishings can make speech clearer by changing sound reflections',
        'Why every room should remove all reflected sound',
        'How windows make voices louder than speakers',
        'Why empty rooms always have moving walls',
      ],
      correctIndex: 0,
    },
    questions: [
      {
        id: 'baseline-10-main',
        prompt: 'What is the passage mainly explaining?',
        choices: [
          'How furnishings can make speech clearer by changing sound reflections',
          'Why every room should remove all reflected sound',
          'How windows make voices louder than speakers',
          'Why empty rooms always have moving walls',
        ],
        correctIndex: 0,
        type: 'main-idea',
        rationale:
          'The passage explains how hard, soft, and irregular surfaces affect reflections and therefore speech clarity.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-10-detail',
        prompt: 'What do hard, flat surfaces do to much of the sound that reaches them?',
        choices: [
          'They reflect it',
          'They store it permanently',
          'They turn it into light',
          'They prevent it from reaching the room',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The passage directly states that hard, flat surfaces reflect much of the sound that reaches them.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-10-purpose',
        prompt: 'Why does the author say the goal is not to remove every reflection?',
        choices: [
          'Because useful reflections can remain without overwhelming speech',
          'Because rugs increase the strongest echoes',
          'Because speech requires several competing echoes',
          'Because only empty rooms can sound natural',
        ],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale:
          'The final sentences distinguish useful room sound from reflections that compete with a speaker.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-11',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'The Temporary Bus Stop',
    language: 'en',
    genre: 'civic',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'A town planned to move a busy bus stop farther from a crowded intersection. '
      + 'The map suggested that the new location would improve traffic flow, but it did not show what the change would feel like to passengers. '
      + 'Before rebuilding the curb, the transport team marked a temporary stop with signs and tested it for one week. '
      + 'Staff recorded how long buses needed to rejoin traffic and whether waiting passengers blocked the nearby shop entrance. '
      + 'They also invited people with wheelchairs, walking aids, and strollers to try the route from the crossing. '
      + 'The buses left the temporary stop more quickly, yet several passengers found the extra slope difficult. '
      + 'Engineers therefore shifted the proposed shelter a few metres and added a level approach from the crossing. '
      + 'The short test did not predict every future problem, but it revealed a conflict the map had hidden. '
      + 'By testing a reversible version first, the town improved the design before concrete made the decision expensive to change.',
    question: {
      prompt: 'What is the central lesson of the bus-stop project?',
      choices: [
        'A temporary real-world test can reveal problems before a permanent change',
        'Traffic maps contain every experience a passenger may have',
        'Passengers should avoid testing unfinished routes',
        'Concrete changes are easier to reverse than temporary signs',
      ],
      correctIndex: 0,
    },
    questions: [
      {
        id: 'baseline-11-main',
        prompt: 'What is the central lesson of the bus-stop project?',
        choices: [
          'A temporary real-world test can reveal problems before a permanent change',
          'Traffic maps contain every experience a passenger may have',
          'Passengers should avoid testing unfinished routes',
          'Concrete changes are easier to reverse than temporary signs',
        ],
        correctIndex: 0,
        type: 'main-idea',
        rationale:
          'The passage emphasizes that a reversible trial exposed an accessibility problem before construction.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-11-detail',
        prompt: 'What difficulty appeared during the temporary test?',
        choices: [
          'The route’s extra slope was difficult for some passengers',
          'Buses could no longer rejoin traffic',
          'The crossing was removed from the street',
          'Every shop entrance became permanently blocked',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The passage says several passengers found the extra slope difficult.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-11-purpose',
        prompt: 'Why did the team invite people using wheelchairs, walking aids, and strollers?',
        choices: [
          'To test whether the proposed route worked for different access needs',
          'To measure the price of concrete',
          'To replace the bus drivers',
          'To decide which shop should close',
        ],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale:
          'Those participants could reveal access barriers that traffic-flow measurements and maps would miss.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'baseline-12',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'A Date in the Margin',
    language: 'en',
    genre: 'history',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: ORIGINAL_CONTENT,
    accessibilityNotes: ACCESSIBILITY_NOTES,
    text:
      'While cataloguing a box of school records, an archivist found a notebook with a storm date written in the margin. '
      + 'A local newspaper had long reported that the storm arrived on Tuesday, but the note named Wednesday. '
      + 'The difference seemed small until researchers noticed that the newspaper was printed only twice a week. '
      + 'Its Thursday edition described damage that had occurred “the previous evening,” which supported the notebook’s Wednesday date. '
      + 'The archivist still did not treat the margin note as final proof. '
      + 'The writer was unidentified, and the date might have been added later. '
      + 'Researchers compared it with train delays, a shopkeeper’s dated receipts, and rainfall measurements from a nearby station. '
      + 'Together, those independent records pointed to Wednesday night. '
      + 'The correction mattered because later accounts had used the mistaken Tuesday date to connect the storm with an event in another town. '
      + 'Changing one date therefore altered not only the calendar entry but also the historical explanation built around it.',
    question: {
      prompt: 'What is the passage mainly about?',
      choices: [
        'How several independent records corrected a storm date and its interpretation',
        'Why newspapers should print only twice a week',
        'How one anonymous note automatically proves a historical claim',
        'Why train delays cause severe storms',
      ],
      correctIndex: 0,
    },
    questions: [
      {
        id: 'baseline-12-main',
        prompt: 'What is the passage mainly about?',
        choices: [
          'How several independent records corrected a storm date and its interpretation',
          'Why newspapers should print only twice a week',
          'How one anonymous note automatically proves a historical claim',
          'Why train delays cause severe storms',
        ],
        correctIndex: 0,
        type: 'main-idea',
        rationale:
          'The passage follows the verification of the Wednesday date and explains why that correction changed a later historical claim.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-12-detail',
        prompt: 'Which newspaper phrase supported the Wednesday date?',
        choices: [
          'The previous evening',
          'The following month',
          'Before the train arrived',
          'Twice every Tuesday',
        ],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale:
          'The Thursday edition said the damage occurred the previous evening, pointing to Wednesday.',
        answerDependency: 'passage-required',
      },
      {
        id: 'baseline-12-purpose',
        prompt: 'Why did researchers compare the note with receipts, delays, and rainfall measurements?',
        choices: [
          'To corroborate the date with records created independently',
          'To identify the notebook writer’s handwriting',
          'To make the newspaper publish more often',
          'To prove that every local record was mistaken',
        ],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale:
          'The note could have been added later, so independent dated sources were needed to support its claim.',
        answerDependency: 'passage-required',
      },
    ],
  },
];
