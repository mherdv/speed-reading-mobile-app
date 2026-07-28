import type { Difficulty } from './difficultyPreferences';

export type TextSearchVariation = {
  id: string;
  target: string;
  text: string;
};

const EASY: readonly TextSearchVariation[] = [
  {
    id: 'easy-market',
    target: 'market',
    text: 'Every Saturday, the town market opens beside the library. Farmers bring fruit to the market before sunrise, while bakers arrange warm bread on long tables. By noon, musicians perform near the market gate, and neighbors pause to exchange news before carrying their baskets home.',
  },
  {
    id: 'easy-trail',
    target: 'trail',
    text: 'A narrow trail begins behind the visitor center and follows the lake. Blue signs mark each turn in the trail, so walkers can enjoy the view without losing their way. After the wooden bridge, the trail enters a quiet grove and returns beside the picnic field.',
  },
  {
    id: 'easy-garden',
    target: 'garden',
    text: 'Mira planted a small garden beside the kitchen window. She watered the garden early each morning and removed weeds after school. By midsummer, the garden held tomatoes, beans, and bright yellow flowers. Her family shared the harvest and planned a larger garden for next year.',
  },
  {
    id: 'easy-letter',
    target: 'letter',
    text: 'Jon found a letter inside an old travel book. The letter described a snowy village and a train journey across the mountains. He read the letter twice, then asked his grandmother about the name at the bottom. She smiled and placed the letter in a safe folder.',
  },
  {
    id: 'easy-bridge',
    target: 'bridge',
    text: 'The stone bridge connects the school path with the river park. Students cross the bridge in the morning while cyclists wait near the narrow entrance. After heavy rain, workers inspect the bridge carefully. Their checks keep the bridge open and safe for everyone.',
  },
  {
    id: 'easy-clock',
    target: 'clock',
    text: 'A brass clock hangs above the station doors. When the clock reaches eight, the first commuter train arrives. Travelers often check the clock before buying coffee or finding a seat. At closing time, the station manager winds the clock for another day.',
  },
  {
    id: 'easy-window',
    target: 'window',
    text: 'Morning light entered through the kitchen window and crossed the wooden floor. Lina opened the window while the bread cooled, then placed a small plant beside the window. Before leaving, she closed the window because rain clouds were gathering above the hill.',
  },
  {
    id: 'easy-basket',
    target: 'basket',
    text: 'A red basket stood near the orchard gate. Each child placed two apples in the basket before choosing a pear. When the basket became heavy, Omar carried it to the picnic table. The empty basket returned to the gate for the next group.',
  },
  {
    id: 'easy-lantern',
    target: 'lantern',
    text: 'The guide lit a lantern as the group entered the old tunnel. Warm light from the lantern revealed painted numbers on the wall. At each turn, the guide raised the lantern so everyone could see the path. Outside again, she switched off the lantern and checked the group.',
  },
];

const MEDIUM: readonly TextSearchVariation[] = [
  {
    id: 'medium-signal',
    target: 'signal',
    text: 'Researchers placed sensors along the hillside to watch for small movements after heavy rain. Each sensor sends a signal when the soil shifts beyond a safe threshold. A single signal may reflect an animal or a loose branch, so the team compares several readings before issuing an alert. When the same signal appears across nearby sensors, engineers inspect the slope and update the public notice.',
  },
  {
    id: 'medium-source',
    target: 'source',
    text: 'Before publishing the local history article, the editor asked the writer to identify every source. A diary could serve as one source for personal experience, while tax records offered a separate source for dates and property details. When two accounts disagreed, the writer described the conflict instead of hiding it. Clear notes allowed readers to inspect each source and judge the conclusion.',
  },
  {
    id: 'medium-current',
    target: 'current',
    text: 'The rowing team studied the river before leaving the dock. A strong current moved near the eastern bank, while the center remained calmer. The coach explained that the current could change after rainfall or a gate adjustment upstream. During practice, each boat crossed the current at an angle, then returned through sheltered water near the reeds.',
  },
  {
    id: 'medium-method',
    target: 'method',
    text: 'Two classrooms tested a new method for reviewing vocabulary. The first group used the method for ten minutes each day, and the second continued its usual routine. Teachers recorded the same quiz at the beginning and end of the month. Although the method group improved, the report also noted attendance differences that could affect the comparison.',
  },
  {
    id: 'medium-record',
    target: 'record',
    text: 'The museum keeps a digital record for every object in its collection. Each record includes the item’s origin, condition, and storage location. When a vase moves to an exhibition, staff update the record before opening the case. Photographs provide a visual record that helps conservators notice cracks, fading, or earlier repairs.',
  },
  {
    id: 'medium-balance',
    target: 'balance',
    text: 'Designing a neighborhood street requires balance among several needs. Wider sidewalks improve access, but delivery vehicles still need space to stop safely. Trees add shade, while underground pipes limit where roots can grow. No single layout creates a perfect balance. The final plan seeks a balance by testing several layouts, gathering resident feedback, and explaining which tradeoffs remain.',
  },
  {
    id: 'medium-sample',
    target: 'sample',
    text: 'The water study collected a sample from twelve points along the river. Each sample was sealed, labeled, and tested with the same equipment. One cloudy sample produced an unusual reading, so technicians repeated the test instead of discarding it. Comparing every sample helped the team distinguish a local spill from a problem affecting the whole river.',
  },
  {
    id: 'medium-policy',
    target: 'policy',
    text: 'The school introduced a phone policy after students and teachers described frequent interruptions. The first version of the policy required devices to remain in bags during lessons. After a month, the council reviewed exceptions for medical access and translation. Publishing the revised policy made the rule easier to understand and apply consistently.',
  },
  {
    id: 'medium-network',
    target: 'network',
    text: 'A network of small weather stations now covers the valley. Each station sends temperature and rainfall data through the network every ten minutes. If one connection fails, the network stores the reading until service returns. Combining observations across the network gives farmers a clearer warning than a single distant forecast.',
  },
];

const HARD: readonly TextSearchVariation[] = [
  {
    id: 'hard-evidence',
    target: 'evidence',
    text: 'A persuasive explanation distinguishes direct evidence from a plausible assumption. In the wetland study, repeated water measurements provided evidence of seasonal change, while a single photograph offered only a limited snapshot. The researchers also treated missing observations as uncertainty rather than evidence that nothing occurred. By describing how each claim depended on the available evidence, the report allowed later teams to test the interpretation instead of merely accepting its conclusion.',
  },
  {
    id: 'hard-context',
    target: 'context',
    text: 'An isolated quotation can appear decisive until its context becomes visible. The sentence before it may define a narrow condition, and the following paragraph may identify an exception. Historical context can also change how a term should be understood, especially when its ordinary meaning has shifted. Careful readers therefore preserve enough context to represent the author’s position accurately before they criticize or apply it.',
  },
  {
    id: 'hard-constraint',
    target: 'constraint',
    text: 'Every engineering proposal operates under at least one constraint, even when the initial sketch appears unrestricted. Cost may become the dominant constraint in one project, while weight, repair access, or energy use governs another. Treating a constraint as invisible does not remove it; the neglected limit usually returns during testing. Strong designs state each constraint early, compare alternatives transparently, and record the reason for the final compromise.',
  },
  {
    id: 'hard-inference',
    target: 'inference',
    text: 'The distinction between observation and inference matters whenever evidence is incomplete. A dark cloud is an observation, whereas a prediction of rain is an inference based on prior patterns. The inference may be reasonable without being certain, and new measurements can strengthen or weaken it. Reports become more trustworthy when they label each inference, identify its assumptions, and explain which future observation could disprove it.',
  },
  {
    id: 'hard-transition',
    target: 'transition',
    text: 'A clear transition does more than connect two paragraphs mechanically. It tells the reader whether the next section will add evidence, challenge an assumption, or narrow the original claim. Without that transition, individually sound sentences may feel unrelated. Editors often revise the transition only after the argument’s structure is stable, because the best wording depends on the precise relationship between the surrounding ideas.',
  },
  {
    id: 'hard-uncertainty',
    target: 'uncertainty',
    text: 'Responsible forecasts communicate uncertainty instead of burying it beneath a single number. A range can represent measurement uncertainty, while several scenarios can show how unknown future choices affect the outcome. Readers should not interpret uncertainty as ignorance or failure; it describes the limits of current evidence. When analysts explain the source and scale of uncertainty, decision makers can plan for risk without pretending that every possibility is equally likely.',
  },
  {
    id: 'hard-correlation',
    target: 'correlation',
    text: 'A correlation can reveal that two measurements change together without establishing why they do so. In the transit data, a correlation between rain and delays might reflect slower traffic, crowded boarding, or a third factor. The correlation remains useful as a pattern worth investigating, but treating it as a complete explanation invites error. Strong analysis tests alternative mechanisms before translating the correlation into policy.',
  },
  {
    id: 'hard-assumption',
    target: 'assumption',
    text: 'Every model begins with at least one simplifying assumption. An assumption about stable demand may be reasonable during ordinary weeks but fail during a festival or emergency. Analysts should state each assumption so readers can see where the estimate is likely to hold. When evidence challenges an assumption, revising the model is more responsible than protecting its original result.',
  },
  {
    id: 'hard-mechanism',
    target: 'mechanism',
    text: 'Observing an outcome does not automatically reveal the mechanism that produced it. A tutoring program may raise scores, yet the mechanism could involve extra practice, stronger motivation, or more frequent feedback. Identifying the mechanism matters because another school may copy the visible schedule without reproducing the active ingredient. Researchers test each proposed mechanism before recommending a broad expansion.',
  },
];

export const TEXT_SEARCH_VARIATIONS: Record<
  Difficulty,
  readonly TextSearchVariation[]
> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
};

function normalizedWord(word: string): string {
  return word.toLocaleLowerCase('en').replace(/[^a-z]/g, '');
}

export function countTextSearchTargets(item: TextSearchVariation): number {
  return item.text
    .split(/\s+/)
    .filter((word) => normalizedWord(word) === item.target).length;
}

export function validateTextSearchContent(): string[] {
  const errors: string[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const items = TEXT_SEARCH_VARIATIONS[difficulty];
    if (items.length < 9) errors.push(`${difficulty}: at least nine passages required`);
    if (new Set(items.map((item) => item.id)).size !== items.length) {
      errors.push(`${difficulty}: duplicate passage ID`);
    }
    for (const item of items) {
      if (countTextSearchTargets(item) < 3) {
        errors.push(`${item.id}: target must appear at least three times`);
      }
      if (item.text.split(/\s+/).length < 35) {
        errors.push(`${item.id}: passage is too short`);
      }
    }
  }
  return errors;
}
