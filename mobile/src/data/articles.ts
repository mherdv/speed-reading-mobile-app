export type ArticleDifficulty = 'easy' | 'medium' | 'hard';
export type ArticleCategory =
  | 'science'
  | 'nature'
  | 'history'
  | 'health'
  | 'space'
  | 'technology'
  | 'psychology';

export type ArticleQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type Article = {
  id: string;
  version: number;
  title: string;
  language: 'en';
  category: ArticleCategory;
  difficulty: ArticleDifficulty;
  wordCount: number;
  text: string;
  source: 'Original editorial content';
  license: 'Original content for this application';
  comprehensionQuestions: ArticleQuestion[];
};

type AuthoredQuestion = {
  question: string;
  answer: string;
  distractors: readonly [string, string, string];
};

type AuthoredArticle = Omit<Article, 'wordCount' | 'comprehensionQuestions'> & {
  comprehensionQuestions: readonly AuthoredQuestion[];
};

const ORIGINAL_SOURCE = 'Original editorial content' as const;
const ORIGINAL_LICENSE = 'Original content for this application' as const;

export const MIN_ARTICLES_PER_DIFFICULTY = 8;
export const EXPECTED_ARTICLES_PER_DIFFICULTY =
  MIN_ARTICLES_PER_DIFFICULTY;

/**
 * Original, evergreen English passages for the offline Power Reader library.
 * Dynamic totals, product claims, and medical promises are intentionally
 * avoided so the material remains useful without a network refresh.
 */
const AUTHORED_ARTICLES: readonly AuthoredArticle[] = [
  // Easy
  {
    id: 'sci-001',
    version: 2,
    title: 'What Sleep Does After Learning',
    language: 'en',
    category: 'science',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `Sleep is not simply a period when the brain switches off. During the night, the brain moves through several repeating stages. The length and pattern of those stages vary from person to person and also change across the night.

Experiments suggest that sleep helps stabilize some memories formed while a person was awake. A learner still needs to pay attention and practice first; sleep cannot create a clear memory of material that was never understood. It can, however, support the work that happened during the day.

Sleep also affects alertness. A tired reader may lose the thread of a paragraph, reread the same line, or react more slowly to new information. For that reason, an extra hour of late study is not automatically useful if it replaces needed rest.

The practical lesson is balanced. Focused study, a regular opportunity to sleep, and later retrieval practice serve different purposes. Treating any one of them as a complete replacement for the others oversimplifies how learning works.`,
    comprehensionQuestions: [
      {
        question: 'What is the passage’s main point?',
        answer:
          'Sleep supports learning and alertness, but it does not replace attentive study.',
        distractors: [
          'Sleep creates accurate memories even when material was not understood.',
          'Every person moves through sleep stages of exactly the same length.',
          'Late-night study is always more valuable than regular sleep.',
        ],
      },
      {
        question: 'Why may replacing sleep with another hour of study be unhelpful?',
        answer:
          'Fatigue can weaken attention and make later reading less effective.',
        distractors: [
          'Memory is formed only during the first hour of the night.',
          'Reading after dark prevents the brain from entering any sleep stage.',
          'Retrieval practice works only immediately before going to bed.',
        ],
      },
    ],
  },
  {
    id: 'nat-001',
    version: 2,
    title: 'The Amazon as a Water and Carbon System',
    language: 'en',
    category: 'nature',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The Amazon rainforest influences regions far beyond the ground covered by its trees. Roots draw water from the soil, and leaves release part of that water into the air. Winds can carry the moisture onward, where it may contribute to clouds and rain in another place.

The forest also stores a large amount of carbon in trunks, roots, soil, and other living material. Trees take in carbon dioxide as they grow. When forest is burned or allowed to decay after clearing, part of that stored carbon returns to the atmosphere.

Rainforest plants produce oxygen during photosynthesis, but plants, animals, and decomposers also use oxygen. Describing the Amazon as the source of a fixed share of the oxygen people breathe is therefore misleading. Its global importance is better explained through its biodiversity, carbon storage, and role in the water cycle.

Protecting the forest is not only about counting trees. The location of clearing, the health of soils and rivers, and whether damaged areas can recover all affect how the larger system functions.`,
    comprehensionQuestions: [
      {
        question: 'Which description best captures the passage’s main idea?',
        answer:
          'The Amazon matters through connected water, carbon, and ecological processes.',
        distractors: [
          'The Amazon is important only because it supplies a fixed share of breathable oxygen.',
          'Rain produced over the Amazon always falls in the same forest location.',
          'Counting the number of remaining trees fully measures forest health.',
        ],
      },
      {
        question: 'Why does the passage reject a fixed oxygen-share claim?',
        answer:
          'Oxygen is both produced and consumed within the living forest system.',
        distractors: [
          'Rainforest leaves absorb oxygen but never release it.',
          'Only rivers, rather than plants, take part in photosynthesis.',
          'The atmosphere contains no oxygen produced by living organisms.',
        ],
      },
    ],
  },
  {
    id: 'his-001',
    version: 2,
    title: 'What Remains of the Library of Alexandria',
    language: 'en',
    category: 'history',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The ancient Library of Alexandria became famous for an ambitious goal: gathering written knowledge from many parts of the Mediterranean world. It formed part of a larger research institution where scholars studied literature, mathematics, medicine, geography, and other subjects.

The exact size of the collection is unknown. Ancient and later accounts give very different estimates, and a rolled text was not the same unit as a modern book. Stories about ships surrendering manuscripts for copying also survive, but historians treat the details cautiously because the evidence is incomplete.

The library’s decline was probably not one simple event. Alexandria experienced fires, political conflict, changes in royal support, and shifts in scholarly institutions across several centuries. Different collections associated with the city may have been damaged or dispersed at different times.

This uncertainty is part of the historical lesson. The library remains a symbol of organized learning, yet its story also shows why historians compare sources instead of repeating the most dramatic version. A memorable legend can preserve interest in the past while still requiring careful examination.`,
    comprehensionQuestions: [
      {
        question: 'How does the passage describe the library’s decline?',
        answer:
          'It was probably a gradual and complicated process rather than one certain disaster.',
        distractors: [
          'It is fully documented as the result of one fire on a known date.',
          'It happened because scholars stopped studying every subject at once.',
          'It occurred before the library gathered any manuscripts.',
        ],
      },
      {
        question: 'Why should estimates of the collection’s size be treated cautiously?',
        answer:
          'Sources disagree, and ancient scroll counts do not map neatly to modern books.',
        distractors: [
          'The library kept only spoken performances and no written works.',
          'Every surviving source reports exactly the same total.',
          'Historians know the total but have agreed not to publish it.',
        ],
      },
    ],
  },
  {
    id: 'psy-002',
    version: 1,
    title: 'Changing a Habit by Changing Its Setting',
    language: 'en',
    category: 'psychology',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A habit is a response that becomes easier to repeat in a familiar situation. The setting may include a time, a place, an object, or a feeling. Seeing a phone beside the bed, for example, can prompt checking it before a person has made a deliberate choice.

Because settings matter, changing the environment can make a behavior easier or harder. Someone who wants to read in the morning might place a book on the breakfast table and move the phone to another room. The book becomes visible at the useful moment, while the competing cue requires extra effort to reach.

This does not mean every behavior follows one simple formula. Motivation, stress, social expectations, and access to resources also influence action. A plan that works during a quiet week may fail when the schedule changes.

Useful habit experiments are small and observable. Change one cue, decide what action should follow it, and notice what happens for several days. If the behavior does not occur, revise the setting or make the action smaller instead of treating one missed attempt as proof of failure.`,
    comprehensionQuestions: [
      {
        question: 'What strategy does the passage recommend for changing a habit?',
        answer:
          'Adjust a cue in the environment and observe whether the desired action becomes easier.',
        distractors: [
          'Depend on motivation while leaving every competing cue unchanged.',
          'Judge the entire plan after one missed attempt.',
          'Assume that every behavior follows an identical formula.',
        ],
      },
      {
        question: 'Why does the author call useful habit experiments small?',
        answer:
          'A limited change makes it easier to observe what helped and revise the plan.',
        distractors: [
          'Small actions never require a cue or a particular setting.',
          'Long-term behavior can be measured accurately after a single hour.',
          'Social expectations stop influencing any action that is easy.',
        ],
      },
    ],
  },
  {
    id: 'tec-001',
    version: 2,
    title: 'How Pattern-Finding Systems Learn',
    language: 'en',
    category: 'technology',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `Some computer systems are trained by showing them many examples rather than by writing a separate rule for every situation. A system that sorts photographs might receive examples labeled “bridge,” “tree,” or “bicycle.” During training, it adjusts internal values so its later guesses fit the examples more closely.

The system does not understand a bridge in the way a person does. It detects statistical patterns in the data it was given. If nearly every bridge photograph was taken on a sunny day, the system might accidentally use bright sky as a clue. It could then perform poorly on a bridge photographed in fog.

This is why evaluation needs material that was not used for training. Test examples can reveal whether the system learned a useful pattern or merely repeated a shortcut. Reviewers also examine whether important groups or conditions were missing from the data.

Pattern-finding systems can assist with many tasks, but fluent output is not proof of sound reasoning. Their results still need checks suited to the consequences of the decision.`,
    comprehensionQuestions: [
      {
        question: 'Why should a trained system be tested on new examples?',
        answer:
          'New examples can reveal whether it learned a useful pattern instead of a shortcut.',
        distractors: [
          'New examples guarantee that the system understands objects like a person.',
          'Testing removes the need to inspect the training data.',
          'A system can adjust its values only after all evaluation has ended.',
        ],
      },
      {
        question: 'What bridge-photograph problem illustrates a shortcut?',
        answer:
          'The system may treat sunny skies as evidence that a bridge is present.',
        distractors: [
          'The system may refuse to process any photograph containing a tree.',
          'The labels may cause every internal value to remain fixed.',
          'The camera may physically rebuild the bridge during training.',
        ],
      },
    ],
  },
  {
    id: 'psy-001',
    version: 2,
    title: 'When a Task Absorbs Attention',
    language: 'en',
    category: 'psychology',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `People sometimes become so involved in an activity that they notice little else and lose track of time. Researchers often call this experience flow. It has been reported during music, sport, writing, craft work, games, and many other activities.

Flow is more likely when a task has a clear goal and offers useful feedback. The challenge also needs to be manageable. If the task demands almost no attention, boredom can appear. If it seems far beyond current skill, worry may take over. The helpful range is not a perfect fixed point; it can shift as skill, energy, and experience change.

The experience cannot be commanded on schedule. Interruptions, unclear instructions, or concern about evaluation may prevent deep involvement even when the activity is usually enjoyable. People also differ in which tasks hold their attention.

The practical value of the idea is not that flow guarantees happiness or excellent work. It is that clear goals, feedback, and an appropriate challenge can create better conditions for sustained attention. Those conditions can be improved even when the special feeling of flow does not occur.`,
    comprehensionQuestions: [
      {
        question: 'Which conditions does the passage connect with sustained attention?',
        answer:
          'Clear goals, useful feedback, and a manageable challenge.',
        distractors: [
          'Unclear instructions, constant interruptions, and public evaluation.',
          'A task that remains far below the person’s skill.',
          'A fixed level of challenge that never changes with experience.',
        ],
      },
      {
        question: 'What qualification does the author make about flow?',
        answer:
          'Helpful conditions can be created, but the experience itself is not guaranteed.',
        distractors: [
          'Flow occurs on command whenever a task includes a score.',
          'Only professional athletes and musicians can experience flow.',
          'The feeling always proves that the resulting work is excellent.',
        ],
      },
    ],
  },
  {
    id: 'sci-004',
    version: 1,
    title: 'Why Bridges Need Room to Move',
    language: 'en',
    category: 'science',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A long bridge may look completely still, yet its materials move by small amounts. Steel and concrete expand when they warm and contract when they cool. Traffic, wind, and the bridge’s own weight also make parts bend slightly.

Engineers plan for this motion instead of trying to eliminate it. An expansion joint creates a controlled gap between sections of a bridge deck. The gap can narrow or widen as temperature changes. Bearings beneath the deck allow limited movement while continuing to support the structure.

These parts need inspection because dirt, corrosion, or damaged seals can stop them working freely. A blocked joint may transfer force into another part of the bridge. A loose or worn component can also allow more movement than the design intended.

Movement alone is therefore not evidence that a bridge is failing. The useful question is whether the motion stays within the planned range and whether the parts that guide it remain in good condition. Safe structures often depend on controlled flexibility rather than perfect rigidity.`,
    comprehensionQuestions: [
      {
        question: 'What is the main purpose of an expansion joint?',
        answer:
          'It gives bridge sections controlled room to move as conditions change.',
        distractors: [
          'It locks every bridge section into a perfectly rigid position.',
          'It prevents steel and concrete from changing temperature.',
          'It carries traffic only when bearings have been removed.',
        ],
      },
      {
        question: 'Why can a blocked joint create a problem?',
        answer:
          'Force that should be relieved by movement may be transferred elsewhere.',
        distractors: [
          'The joint will make the entire bridge colder than the air.',
          'Every bearing will immediately expand beyond the bridge deck.',
          'The bridge will stop carrying its own weight.',
        ],
      },
    ],
  },
  {
    id: 'his-003',
    version: 1,
    title: 'How Conservators Stabilize a Wet Book',
    language: 'en',
    category: 'history',
    difficulty: 'easy',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `When a book becomes wet, the first goal is not to make it look perfect. The first goal is to prevent further damage. Wet paper becomes weak, coated pages may stick together, and mold can begin to grow if moisture remains.

Conservators first record what happened and identify the materials involved. A modern glossy book may need different treatment from an older volume made with handmade paper and leather. If many books are soaked at once, some can be frozen. Freezing pauses mold growth and gives a team time to plan drying in manageable groups.

Air drying can work for a small number of damp books. Pages are supported, absorbent material is changed regularly, and air moves around the object without using strong heat. A book is not forced flat while its fibers are swollen.

Later repairs come only after the object is stable and dry. This order matters because a rushed cosmetic repair can trap moisture or tear weakened paper. Conservation begins with evidence, material knowledge, and patience rather than an attempt to erase every sign of age.`,
    comprehensionQuestions: [
      {
        question: 'What is the first priority when a book becomes wet?',
        answer:
          'Stabilize it and prevent additional damage.',
        distractors: [
          'Press it flat before checking how wet the paper is.',
          'Apply a cosmetic repair while the fibers are swollen.',
          'Use strong heat to remove every trace of moisture immediately.',
        ],
      },
      {
        question: 'Why might a large group of wet books be frozen?',
        answer:
          'Freezing slows further damage while the team organizes staged drying.',
        distractors: [
          'Freezing permanently repairs every torn or stained page.',
          'Frozen paper can be flattened without identifying its materials.',
          'Ice replaces the need to dry the books later.',
        ],
      },
    ],
  },

  // Medium
  {
    id: 'sci-002',
    version: 2,
    title: 'How Vaccination Prepares Immune Memory',
    language: 'en',
    category: 'science',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The immune system responds to distinctive molecules associated with a pathogen. After an infection, some immune cells can retain information that helps the body respond more rapidly to a later encounter. Vaccination aims to build useful immune memory without requiring the full disease.

Vaccines do not all deliver the same material. Depending on the vaccine, the immune system may encounter a weakened organism, an inactivated organism, a purified component, or instructions that allow cells to make a harmless antigen for a short time. The appropriate design depends on the pathogen and the population being protected.

Immune responses also vary. A vaccine may be especially strong at preventing severe disease while offering less complete protection against any infection. Some protection can fade, which is why additional doses are recommended for certain vaccines. Side effects and rare risks are monitored alongside benefits.

Population protection is not a single threshold that works identically for every disease. It depends on how a pathogen spreads, how well a vaccine limits infection or transmission, how long protection lasts, and how evenly coverage is distributed. Accurate explanation therefore requires naming the vaccine and outcome being discussed.`,
    comprehensionQuestions: [
      {
        question: 'Why does the passage describe several vaccine designs?',
        answer:
          'Different vaccines present immune targets in different safe forms.',
        distractors: [
          'Every vaccine contains a live version of the same organism.',
          'Vaccine design is unrelated to the pathogen being addressed.',
          'Immune memory forms only after a person develops the full disease.',
        ],
      },
      {
        question: 'Why is population protection not one universal threshold?',
        answer:
          'Transmission, vaccine effects, duration, and coverage patterns differ.',
        distractors: [
          'A threshold depends only on the color of the vaccine packaging.',
          'Protection is identical for every pathogen once any dose is given.',
          'Population effects can be calculated without considering transmission.',
        ],
      },
    ],
  },
  {
    id: 'nat-002',
    version: 2,
    title: 'Why Added Carbon Dioxide Changes Seawater',
    language: 'en',
    category: 'nature',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The ocean exchanges carbon dioxide with the atmosphere. When additional carbon dioxide dissolves in seawater, part of it reacts with water and changes the balance among several dissolved carbon compounds. One result is a decrease in pH, often called ocean acidification.

The term can be confusing because seawater remains on the alkaline side of the pH scale in most places. “Acidification” describes movement toward a lower pH, not a claim that the entire ocean has become an ordinary acid.

The chemical shift also reduces the availability of carbonate ions used by many organisms to build calcium-carbonate shells or skeletons. The effect is not identical for every species or location. Temperature, local water chemistry, food supply, and an organism’s life stage can influence the response.

Researchers study the process with long-term measurements, controlled experiments, and observations near places where naturally carbon-rich water reaches the surface. No single method answers every question. Together, they help distinguish a broad chemical trend from the varied biological effects that follow from it.`,
    comprehensionQuestions: [
      {
        question: 'What does “ocean acidification” mean in this passage?',
        answer:
          'Dissolved carbon dioxide shifts seawater toward a lower pH.',
        distractors: [
          'All seawater immediately becomes a strong ordinary acid.',
          'The ocean stops exchanging any gas with the atmosphere.',
          'Carbonate ions increase equally in every marine habitat.',
        ],
      },
      {
        question: 'Why do researchers combine several study methods?',
        answer:
          'The chemical trend and biological responses vary across conditions.',
        distractors: [
          'A single short experiment already describes every ocean location.',
          'Long-term measurements cannot record changes in water chemistry.',
          'Natural observations make controlled experiments unnecessary.',
        ],
      },
    ],
  },
  {
    id: 'nat-003',
    version: 2,
    title: 'How Animals Navigate a Migration',
    language: 'en',
    category: 'nature',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `Migration requires more than sustained movement. An animal must begin at a useful time, maintain a direction, find places to rest or feed, and adjust when weather changes. Different species solve these tasks with different combinations of information.

Some birds can use the position of the sun or stars. Experiments also show that many animals respond to Earth’s magnetic field. Smell helps salmon recognize water associated with their home river, while landmarks and learned routes matter for other travelers. A species may use one cue to set a broad direction and another to make the final approach.

Navigation is only one part of a successful migration. A route can fail if a traditional stopping place loses food or shelter. A protected breeding site is therefore not enough when the journey to it crosses damaged habitat.

Tracking tags reveal where animals pause and how routes shift, but the data require care. Tagged individuals may represent only part of a population, and a dot on a map does not by itself explain why an animal chose that path. Conservation decisions are strongest when movement records are combined with habitat and behavior observations.`,
    comprehensionQuestions: [
      {
        question: 'What does the passage emphasize about migration cues?',
        answer:
          'Animals may combine several cues for different parts of a journey.',
        distractors: [
          'Every migrating species follows stars and ignores all other information.',
          'A single magnetic cue determines every final destination exactly.',
          'Learned routes matter only after migration has ended.',
        ],
      },
      {
        question: 'Why is protecting only a breeding site sometimes insufficient?',
        answer:
          'Animals also depend on suitable habitat along the migration route.',
        distractors: [
          'Breeding sites prevent animals from beginning a journey.',
          'Tracking tags supply all food needed at stopping places.',
          'Migrating animals never rest between their two endpoints.',
        ],
      },
    ],
  },
  {
    id: 'his-002',
    version: 2,
    title: 'The Silk Roads as a Network',
    language: 'en',
    category: 'history',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The name Silk Roads refers to a changing network of routes rather than one road joining two endpoints. Caravans, ships, and local traders connected parts of East Asia, Central Asia, South Asia, the Middle East, North Africa, and Europe across different periods.

Silk was an important luxury product, but it was only one item in motion. Horses, glass, paper, metals, spices, textiles, and many ordinary goods traveled for part of the network. A merchant rarely crossed the whole distance. Goods passed through markets and middlemen, gathering new costs and meanings along the way.

Ideas and skills also moved, though not as simple packages. Religious traditions were translated into new languages and adapted to local customs. Techniques such as papermaking spread through people who practiced, taught, or reproduced them in new settings.

Political stability could make a route safer, while war, taxes, disease, or a new maritime connection could redirect trade. The network therefore had no single opening or closing date. Studying it means tracing particular goods, travelers, and institutions rather than imagining an unchanging line across a map.`,
    comprehensionQuestions: [
      {
        question: 'Why does the passage use the plural name “Silk Roads”?',
        answer:
          'Trade used many changing and connected routes rather than one fixed road.',
        distractors: [
          'Every trader followed one road but gave it a different name.',
          'Silk could travel only by sea and never by caravan.',
          'The route joined exactly two cities without intermediate markets.',
        ],
      },
      {
        question: 'How did ideas move differently from sealed goods?',
        answer:
          'People translated and adapted them in new local settings.',
        distractors: [
          'Ideas crossed the network without language or human participation.',
          'Every community adopted each tradition in an identical form.',
          'Skills moved only when a single merchant traveled the full distance.',
        ],
      },
    ],
  },
  {
    id: 'hea-002',
    version: 2,
    title: 'Signals Along the Gut–Brain Axis',
    language: 'en',
    category: 'health',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `The digestive system and the brain communicate in both directions. Nerves, hormones, immune signals, and products made by gut microbes can all take part. Stress can change digestion, while signals arising in the gut can influence appetite, discomfort, and other body responses.

The intestine has an extensive network of nerve cells that manages many local functions. It also produces much of the body’s serotonin. That fact is sometimes explained poorly: serotonin made in the gut does not simply cross into the brain. Peripheral serotonin has important roles in the body, while gut–brain communication uses several indirect pathways, including the vagus nerve and immune signaling.

Researchers have found associations between microbiome patterns and a range of health conditions. An association does not show that one microbial pattern caused a condition. Illness, medication, diet, age, and many other factors can alter the microbiome as well.

This field may eventually support useful treatments, but broad promises are premature. Strong evidence requires controlled studies that define the intervention, measure meaningful outcomes, track adverse effects, and show that results can be repeated in appropriate groups.`,
    comprehensionQuestions: [
      {
        question: 'What correction does the passage make about gut serotonin?',
        answer:
          'Serotonin made in the gut does not simply pass into the brain.',
        distractors: [
          'The digestive system contains no serotonin or nerve cells.',
          'Gut serotonin crosses directly into the brain in every person.',
          'Only serotonin, rather than nerves or immune signals, connects gut and brain.',
        ],
      },
      {
        question: 'Why does an observed microbiome association not prove causation?',
        answer:
          'Health, medicine, diet, age, and other factors may influence both observations.',
        distractors: [
          'Associations are stronger than controlled and repeatable evidence.',
          'Every person with a condition has an identical microbiome.',
          'Microbiome patterns remain unchanged by medication or illness.',
        ],
      },
    ],
  },
  {
    id: 'spa-001',
    version: 2,
    title: 'Finding a Black Hole by Its Effects',
    language: 'en',
    category: 'space',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A black hole is a region where gravity curves spacetime so strongly that, beyond a boundary called the event horizon, light cannot escape to a distant observer. The boundary is not a solid surface. It marks a point beyond which outward paths no longer lead back out.

Because a black hole emits no ordinary light from inside that boundary, astronomers study its effects. Gas falling toward a black hole can heat and glow before crossing the horizon. Stars may orbit an unseen massive object. When black holes or other compact objects merge, their motion can produce gravitational waves measured by distant instruments.

Different observations answer different questions. An orbit can estimate mass, X-rays can describe hot nearby gas, and gravitational waves can reveal a merger. An image of bright material surrounding a dark central region tests still other predictions.

No single observation is labeled “a black hole” merely because something is invisible. Astronomers compare the object’s mass, size, motion, and radiation with competing explanations. Confidence grows when independent methods describe the same compact source consistently.`,
    comprehensionQuestions: [
      {
        question: 'How can astronomers investigate a black hole?',
        answer:
          'They measure its effects on nearby matter, orbits, light, and spacetime.',
        distractors: [
          'They collect ordinary light emitted from inside the event horizon.',
          'They classify every invisible region as a black hole without comparison.',
          'They rely on one photograph and exclude all motion measurements.',
        ],
      },
      {
        question: 'Why are several observation methods useful?',
        answer:
          'Each method reveals different properties and can test competing explanations.',
        distractors: [
          'Every method measures exactly the same property in the same way.',
          'An orbit can identify hot gas but provides no information about mass.',
          'Independent evidence makes a compact object less clearly described.',
        ],
      },
    ],
  },
  {
    id: 'spa-002',
    version: 2,
    title: 'How Astronomers Detect Distant Planets',
    language: 'en',
    category: 'space',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A planet beside a distant star is difficult to see directly because the star is much brighter. Astronomers therefore often detect a planet through a repeated effect on its host star.

The transit method looks for a small dip in starlight when a planet crosses between the star and the telescope. Several regular dips can reveal the orbital period and the planet’s size relative to the star. The radial-velocity method measures tiny shifts in the star’s spectrum as the star moves toward and away from the observer. That motion helps estimate a minimum planetary mass.

Each method has selection effects. Transits require an orbit aligned from our viewpoint, and large planets close to their stars are easier to detect than small planets on long orbits. Stellar activity or another companion can also imitate part of a signal.

For this reason, a possible detection begins as a candidate. Researchers examine repeated observations, rule out alternative causes, and may combine methods. The number of known planets changes as evidence accumulates, but the reasoning used to verify a signal remains the more durable lesson.`,
    comprehensionQuestions: [
      {
        question: 'What durable lesson does the passage emphasize?',
        answer:
          'Planet candidates require repeated evidence and checks against alternative causes.',
        distractors: [
          'One small dip in starlight proves that a planet exists.',
          'The current number of known planets will never change.',
          'Direct photographs are the only valid way to detect a planet.',
        ],
      },
      {
        question: 'Why does the transit method miss many real planets?',
        answer:
          'Only suitably aligned orbits pass across their stars from our viewpoint.',
        distractors: [
          'Transiting planets stop their stars from producing any light.',
          'The method works only for objects inside our solar system.',
          'Every orbit is aligned, but telescopes ignore repeated dips.',
        ],
      },
    ],
  },
  {
    id: 'tec-002',
    version: 2,
    title: 'What Changes When a Vehicle Uses a Battery',
    language: 'en',
    category: 'technology',
    difficulty: 'medium',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `An electric vehicle stores energy in a battery and uses an electric motor to turn the wheels. Because the motor has fewer moving parts than a combustion engine, routine mechanical maintenance can be different. The vehicle still needs tires, brakes, cooling systems, software checks, and repairs.

Environmental comparisons depend on more than what comes from the tailpipe. Producing the battery and vehicle requires materials and energy. Charging emissions depend on how electricity is generated. Over a vehicle’s full use, distance driven, battery size, climate, and the alternative vehicle all affect the comparison.

Charging also changes travel planning. A driver who can charge at home may begin most days with sufficient range, while a renter without a reliable parking space may depend on public infrastructure. Fast charging can reduce waiting but places different demands on the battery and electrical network.

These tradeoffs explain why one headline cannot describe every transition. Electric motors can reduce direct fuel use and local exhaust, yet a fair assessment still includes manufacturing, electricity, access, cost, and end-of-life handling.`,
    comprehensionQuestions: [
      {
        question: 'Why can two electric vehicles have different environmental results?',
        answer:
          'Battery size, electricity source, use, climate, and alternatives can differ.',
        distractors: [
          'All vehicle emissions come only from the tailpipe.',
          'Manufacturing and charging never require materials or energy.',
          'Every driver uses the same charging network in the same way.',
        ],
      },
      {
        question: 'What access problem does the passage identify?',
        answer:
          'Some drivers lack a dependable place to charge where they park.',
        distractors: [
          'Electric motors can operate only while attached to a charger.',
          'Home charging prevents a vehicle from traveling on public roads.',
          'Public charging is available equally in every building and region.',
        ],
      },
    ],
  },

  // Hard
  {
    id: 'sci-003',
    version: 2,
    title: 'Why Quantum Algorithms Need Interference',
    language: 'en',
    category: 'technology',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A quantum bit is described by amplitudes associated with possible measurement outcomes. Before measurement, those amplitudes can form a superposition. This does not mean a user can read every possible answer at once. A measurement produces an ordinary result, and most of the information in the full quantum state is not directly accessible.

Useful quantum algorithms arrange operations so amplitudes interfere. Paths associated with helpful outcomes are amplified, while others are reduced. Designing such interference is the difficult part; superposition alone does not make every computation faster.

Quantum hardware also comes in several forms. Some systems use superconducting circuits at extremely low temperatures, while others use trapped ions, neutral atoms, or particles of light under different operating conditions. Each approach has its own controls and sources of error.

Noise can destroy the relationships an algorithm needs. Error correction aims to protect logical information by encoding it across many physical components, but that protection requires substantial resources. Quantum devices are therefore evaluated on specific tasks, error rates, and verification methods—not on a general claim that they try all solutions simultaneously or replace classical computers.`,
    comprehensionQuestions: [
      {
        question: 'Why is superposition alone insufficient for a useful speedup?',
        answer:
          'An algorithm must use interference to favor outcomes that encode useful information.',
        distractors: [
          'Measurement reveals every amplitude as a separate readable answer.',
          'Superposition prevents a device from performing any controlled operation.',
          'All classical calculations already use quantum error correction.',
        ],
      },
      {
        question: 'What hardware qualification does the passage make?',
        answer:
          'Different quantum platforms operate under different conditions and errors.',
        distractors: [
          'Every quantum device uses a superconducting circuit near absolute zero.',
          'Particles of light require the same cooling system as every trapped ion.',
          'Hardware choice has no effect on control or error behavior.',
        ],
      },
    ],
  },
  {
    id: 'spa-003',
    version: 2,
    title: 'Why Multiverse Proposals Are Difficult to Test',
    language: 'en',
    category: 'space',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `“Multiverse” is an umbrella term for several proposals in which the observable universe is not the only domain that exists. The proposals do not all describe the same mechanism. Some arise from interpretations of quantum mechanics, some from models of cosmic inflation, and some from possible solutions in theories of fundamental physics.

That variety matters when discussing evidence. A prediction made by one model cannot automatically support every idea carrying the multiverse label. Researchers must specify which assumptions lead to which observable consequences.

The central difficulty is access. Light and other signals reach us only from the observable region, and a proposed domain may have no causal contact with it. Some models could still have indirect consequences for patterns within our universe, but those consequences may also have competing explanations.

Critics argue that a proposal with no distinguishable observation falls outside empirical science. Supporters reply that a broader theory may earn support through testable predictions even if not every consequence is observed directly. The debate is therefore not settled by saying either “many universes sound strange” or “the mathematics allows them.” It turns on whether a specific model produces risky, discriminating tests.`,
    comprehensionQuestions: [
      {
        question: 'Why should multiverse proposals be discussed separately?',
        answer:
          'They arise from different mechanisms and may make different predictions.',
        distractors: [
          'Every proposal uses the same assumptions and observational test.',
          'The word multiverse refers to one experimentally confirmed object.',
          'A prediction from one model automatically validates all other models.',
        ],
      },
      {
        question: 'What standard does the passage emphasize for empirical debate?',
        answer:
          'A specific model should produce observations that distinguish it from alternatives.',
        distractors: [
          'A model is established whenever its mathematics permits many outcomes.',
          'An idea is rejected solely because its conclusion sounds unfamiliar.',
          'Indirect consequences never count as scientific evidence.',
        ],
      },
    ],
  },
  {
    id: 'sci-005',
    version: 1,
    title: 'Why Correlation Does Not Settle Cause',
    language: 'en',
    category: 'science',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `When two measurements change together, they are correlated. The pattern can be valuable, but it does not by itself identify the mechanism connecting them. Several causal structures can produce the same statistical relationship.

One possibility is direct causation: a change in A contributes to a change in B. Reverse causation is another: B may influence A. A third factor can also affect both. For example, umbrella use and wet pavement rise together because rain influences each; umbrellas do not make the pavement wet.

Researchers strengthen causal arguments by asking what else the proposed cause predicts. Random assignment can balance many competing factors in an experiment, though it is not ethical or practical for every question. Natural experiments, timing evidence, dose–response patterns, mechanism studies, and repeated results in different settings can also contribute.

None of these signals works as a magic stamp. A large correlation can be biased, while a modest effect can still matter. The quality of measurement, missing data, selection into the sample, and the plausibility of alternatives all affect interpretation. Causal reasoning is a structured comparison of explanations, not a choice between accepting every correlation and ignoring all observational evidence.`,
    comprehensionQuestions: [
      {
        question: 'What does the umbrella example demonstrate?',
        answer:
          'A third factor can create a correlation between two measurements.',
        distractors: [
          'Wet pavement causes people to manufacture umbrellas.',
          'A strong correlation always identifies a direct mechanism.',
          'Reverse causation and common causes produce identical interventions.',
        ],
      },
      {
        question: 'What is the passage’s broader position on causal evidence?',
        answer:
          'Causal claims improve by comparing explanations with multiple relevant forms of evidence.',
        distractors: [
          'Random assignment is the only evidence that can ever inform causation.',
          'Observational patterns should always be ignored regardless of design.',
          'The largest numerical correlation is automatically the correct explanation.',
        ],
      },
    ],
  },
  {
    id: 'sci-006',
    version: 1,
    title: 'A Scientific Model Is a Purposeful Simplification',
    language: 'en',
    category: 'science',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A scientific model represents selected features of a system so researchers can describe, explain, or predict something. A map, an equation, a physical replica, and a computer simulation can all be models. Their usefulness depends on purpose rather than on copying reality in every detail.

A model of a river may ignore individual ripples while representing channel shape and water flow. That simplification is helpful for one question and inadequate for another. If the goal changes from estimating flood depth to predicting fish habitat, the model may need different variables and resolution.

Researchers test a model by comparing its output with observations not used merely to tune it. They inspect where errors occur, how sensitive results are to assumptions, and whether a simpler alternative performs similarly. Agreement with one dataset does not prove that every internal assumption is literally true.

Uncertainty should travel with the result. Parameter ranges, measurement error, and alternative model structures can produce different forecasts. A responsible model report therefore states the intended use and boundary conditions. The question is not whether the model is perfectly realistic, but whether its simplifications remain appropriate for the decision being made.`,
    comprehensionQuestions: [
      {
        question: 'Why can the same river require different models?',
        answer:
          'Different questions require different variables, detail, and boundaries.',
        distractors: [
          'A useful model must reproduce every ripple for every possible purpose.',
          'Changing the purpose makes observations unnecessary.',
          'Physical replicas are models, but equations and maps are not.',
        ],
      },
      {
        question: 'What does agreement with one dataset fail to prove?',
        answer:
          'That every assumption is true and the model works for every use.',
        distractors: [
          'That the model produced any output for the dataset.',
          'That researchers can inspect where prediction errors occur.',
          'That a simpler alternative may be available for comparison.',
        ],
      },
    ],
  },
  {
    id: 'tec-003',
    version: 1,
    title: 'How Public-Key Encryption Separates Two Keys',
    language: 'en',
    category: 'technology',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `In symmetric encryption, the same secret key is used to encrypt and decrypt data. That approach can be efficient, but two parties need a safe way to share the secret. Public-key systems address a different part of the problem by using a related pair of keys.

A public key can be distributed widely. A corresponding private key must remain secret. Depending on the scheme, someone can use the public key to protect a small secret that only the private-key holder can recover. In practice, that secret often becomes a temporary symmetric key for encrypting a larger conversation.

Public-key techniques can also support digital signatures. A private key creates a signature, and the public key helps others verify that the signed data has not changed and that the signer controlled the corresponding private key. Verification still depends on knowing whose public key it is, which is why certificates and other trust systems matter.

Encryption does not solve every security problem. A compromised device can expose readable data before encryption or after decryption. Metadata may reveal who communicated and when. Secure design therefore combines cryptography with key protection, authentication, software updates, access control, and recovery planning.`,
    comprehensionQuestions: [
      {
        question: 'Why is a temporary symmetric key often used after public-key exchange?',
        answer:
          'Symmetric encryption is efficient for protecting the larger conversation.',
        distractors: [
          'The public and private keys become unrelated after one message.',
          'A symmetric key can be published without affecting confidentiality.',
          'Digital signatures make encryption of the conversation impossible.',
        ],
      },
      {
        question: 'What limitation of encryption does the passage identify?',
        answer:
          'A compromised endpoint may expose data outside the encrypted stage.',
        distractors: [
          'Encryption automatically repairs vulnerable software on a device.',
          'A certificate prevents every private key from being stolen.',
          'Encrypted communication reveals no timing or relationship metadata.',
        ],
      },
    ],
  },
  {
    id: 'nat-004',
    version: 1,
    title: 'Restoring a Wetland Means Restoring Its Water',
    language: 'en',
    category: 'nature',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A wetland restoration can fail even when thousands of appropriate plants are installed. Wetland species depend on a pattern of water depth, timing, flow, and soil saturation. If a drain continues removing water or a barrier prevents seasonal flooding, new plants may not recreate the former habitat.

Teams therefore begin by studying hydrology. They compare old maps, soil layers, water-level records, and nearby reference sites. A project might block an artificial ditch, reconnect a floodplain, or reshape a bank before planting. Each intervention can also affect neighboring land, so designers model where water is likely to move.

Success is measured across several functions. Plant cover matters, but so do water storage, sediment movement, nutrient cycling, and use by animals. A wet year can make an early result look stronger than it is; a dry year can hide recovery that becomes visible later.

Monitoring needs a comparison and enough time to separate project effects from ordinary variation. Even then, restoration rarely returns an exact historical copy. Climate, surrounding development, and available species may have changed. A defensible goal is a functioning, resilient system with stated limits, not a photograph that resembles the past for one season.`,
    comprehensionQuestions: [
      {
        question: 'Why may planting alone fail to restore a wetland?',
        answer:
          'The required water depth, timing, and flow may still be disrupted.',
        distractors: [
          'Wetland plants function independently of soil and water conditions.',
          'Every artificial drain increases seasonal flooding in the same way.',
          'Hydrology matters only after all monitoring has ended.',
        ],
      },
      {
        question: 'Why does the passage reject a one-season photograph as proof?',
        answer:
          'Short-term appearance may not show durable ecological function across variable years.',
        distractors: [
          'Plant cover is the only function that restoration can measure.',
          'A wet year permanently removes all uncertainty from a project.',
          'Historical conditions can always be recreated exactly.',
        ],
      },
    ],
  },
  {
    id: 'his-004',
    version: 1,
    title: 'Reading Disturbed Archaeological Layers',
    language: 'en',
    category: 'history',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `Archaeologists often use stratigraphy: in an undisturbed deposit, a lower layer is usually older than a layer above it. The principle is powerful, but a site is rarely a perfectly stacked record. Pits, burrowing animals, roots, erosion, rebuilding, and later digging can move material across layers.

Context therefore matters as much as the object itself. A coin can help estimate when a layer was deposited, but only if researchers understand how the coin entered that location. An old coin may remain in use for decades, and a later pit may carry it downward into earlier soil.

Excavators record color, texture, boundaries, position, and relationships before removing material. They compare artifacts with radiocarbon dates, building phases, documents, environmental remains, and evidence from nearby sites. A disagreement is not solved by automatically choosing the most precise-looking date.

Interpretation proceeds through sequences: which feature cut another, which surface sealed a deposit, and whether material was redeposited. The resulting chronology may include ranges and competing possibilities. Archaeological rigor comes from preserving these relationships and explaining uncertainty, not from assigning every object one exact year.`,
    comprehensionQuestions: [
      {
        question: 'Why can a coin give a misleading date for a soil layer?',
        answer:
          'It may have remained in use or moved through a later disturbance.',
        distractors: [
          'Coins cannot be compared with any other archaeological evidence.',
          'Every lower object must be newer than every object above it.',
          'A precise date always identifies when an object entered the soil.',
        ],
      },
      {
        question: 'What does the passage treat as central to archaeological rigor?',
        answer:
          'Recording relationships and explaining uncertainty across several kinds of evidence.',
        distractors: [
          'Assigning one exact year before a feature is excavated.',
          'Ignoring boundaries whenever artifacts have printed dates.',
          'Selecting the most precise-looking result without comparison.',
        ],
      },
    ],
  },
  {
    id: 'nat-005',
    version: 1,
    title: 'Feedback Loops Can Reinforce or Resist Change',
    language: 'en',
    category: 'nature',
    difficulty: 'hard',
    source: ORIGINAL_SOURCE,
    license: ORIGINAL_LICENSE,
    text:
      `A feedback loop occurs when a change in a system produces an effect that returns to influence the original change. Positive feedback reinforces the direction of change; negative feedback resists it. The words positive and negative describe direction, not whether an outcome is desirable.

Consider snow and sunlight. Fresh snow reflects much of the sunlight that reaches it. If warming melts snow, darker ground can absorb more energy, contributing to additional warming and melt. That is a reinforcing loop. Its strength still depends on season, clouds, surface type, and other energy flows.

A regulating loop behaves differently. If a thermostat detects that a room is warmer than the chosen setting, it turns heating off. The response opposes the original temperature rise. Delays or limits can cause the system to overshoot rather than remain perfectly stable.

Real ecological and climate systems contain many interacting loops. Identifying one feedback does not prove it dominates the final outcome. Researchers estimate each process, examine the time scale, and test whether observations match the proposed mechanism. Feedback language is most useful when it names a complete causal path rather than serving as a vague synonym for change.`,
    comprehensionQuestions: [
      {
        question: 'What do “positive” and “negative” mean for feedback loops?',
        answer:
          'They indicate whether a loop reinforces or resists a change.',
        distractors: [
          'They state whether every outcome is socially good or harmful.',
          'They rank feedback by the precision of its measurements.',
          'They show whether the system contains energy or matter.',
        ],
      },
      {
        question: 'Why is identifying one feedback loop not enough to predict an outcome?',
        answer:
          'Other processes, limits, delays, and time scales may also shape the system.',
        distractors: [
          'A feedback loop never has a causal mechanism.',
          'One reinforcing loop always overwhelms every regulating response.',
          'Observed changes cannot be compared with proposed feedbacks.',
        ],
      },
    ],
  },
];

export function countArticleWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function placeAnswer(
  question: AuthoredQuestion,
  answerIndex: number
): ArticleQuestion {
  const options = [...question.distractors];
  options.splice(answerIndex, 0, question.answer);
  return {
    question: question.question,
    options,
    correctIndex: answerIndex,
  };
}

export const ARTICLES: Article[] = AUTHORED_ARTICLES.map(
  (article, articleIndex) => ({
    ...article,
    wordCount: countArticleWords(article.text),
    comprehensionQuestions: article.comprehensionQuestions.map(
      (question, questionIndex) =>
        placeAnswer(question, (articleIndex + questionIndex * 2) % 4)
    ),
  })
);

export function validateArticles(
  articles: readonly Article[] = ARTICLES
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();

  for (const article of articles) {
    const idKey = article.id.trim().toLocaleLowerCase('en');
    const titleKey = article.title.trim().toLocaleLowerCase('en');
    if (!idKey || ids.has(idKey)) {
      errors.push(`${article.id || 'missing-id'}: article ID must be unique`);
    }
    ids.add(idKey);
    if (!titleKey || titles.has(titleKey)) {
      errors.push(`${article.id}: article title must be present and unique`);
    }
    titles.add(titleKey);

    const actualWordCount = countArticleWords(article.text);
    if (article.wordCount !== actualWordCount) {
      errors.push(
        `${article.id}: wordCount is ${article.wordCount}, expected ${actualWordCount}`
      );
    }
    if (actualWordCount < 150 || actualWordCount > 320) {
      errors.push(
        `${article.id}: expected 150–320 words, received ${actualWordCount}`
      );
    }
    if (
      !Number.isInteger(article.version) ||
      article.version < 1 ||
      article.language !== 'en' ||
      article.source !== ORIGINAL_SOURCE ||
      article.license !== ORIGINAL_LICENSE
    ) {
      errors.push(`${article.id}: original-content metadata is incomplete`);
    }
    if (article.comprehensionQuestions.length < 2) {
      errors.push(`${article.id}: at least two comprehension questions required`);
    }

    const prompts = new Set<string>();
    for (const question of article.comprehensionQuestions) {
      const promptKey = question.question.trim().toLocaleLowerCase('en');
      if (!promptKey || prompts.has(promptKey)) {
        errors.push(`${article.id}: question prompts must be present and unique`);
      }
      prompts.add(promptKey);
      if (question.options.length !== 4) {
        errors.push(`${article.id}/${question.question}: exactly four options required`);
      }
      const optionKeys = question.options.map((option) =>
        option.trim().toLocaleLowerCase('en')
      );
      if (
        optionKeys.some((option) => !option) ||
        new Set(optionKeys).size !== optionKeys.length
      ) {
        errors.push(`${article.id}/${question.question}: options must be present and unique`);
      }
      if (
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      ) {
        errors.push(`${article.id}/${question.question}: correct index is invalid`);
      }
    }
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const levelArticles = articles.filter(
      (article) => article.difficulty === difficulty
    );
    if (levelArticles.length < MIN_ARTICLES_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: at least ${MIN_ARTICLES_PER_DIFFICULTY} articles required`
      );
    }
    if (levelArticles.length !== EXPECTED_ARTICLES_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: exactly ${EXPECTED_ARTICLES_PER_DIFFICULTY} articles required`
      );
    }
    const answerPositions = [0, 0, 0, 0];
    for (const article of levelArticles) {
      for (const question of article.comprehensionQuestions) {
        if (
          question.correctIndex >= 0 &&
          question.correctIndex < answerPositions.length
        ) {
          answerPositions[question.correctIndex] += 1;
        }
      }
    }
    if (answerPositions.some((count) => count === 0)) {
      errors.push(`${difficulty}: correct answers must cover all four positions`);
    } else if (
      Math.max(...answerPositions) - Math.min(...answerPositions) > 1
    ) {
      errors.push(`${difficulty}: correct-answer positions must be balanced`);
    }
  }

  return errors;
}

export function getArticlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter((article) => article.category === category);
}

export function getArticlesByDifficulty(
  difficulty: ArticleDifficulty
): Article[] {
  return ARTICLES.filter((article) => article.difficulty === difficulty);
}

export function getRandomArticle(
  difficulty?: ArticleDifficulty,
  category?: ArticleCategory,
  random: () => number = Math.random
): Article | undefined {
  let filtered = ARTICLES;
  if (difficulty) {
    filtered = filtered.filter((article) => article.difficulty === difficulty);
  }
  if (category) {
    filtered = filtered.filter((article) => article.category === category);
  }
  if (filtered.length === 0) return undefined;
  const randomValue = Math.min(0.999999, Math.max(0, random()));
  return filtered[Math.floor(randomValue * filtered.length)];
}

export function getAllCategories(): ArticleCategory[] {
  return [
    'science',
    'nature',
    'history',
    'health',
    'space',
    'technology',
    'psychology',
  ];
}
