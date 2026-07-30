import type { MainIdeaPassage } from './mainIdeaPassages';

/**
 * Original connected-text scenarios that extend the Main Idea replay bank.
 * Answer positions are deliberately distributed so the complete per-level
 * pools remain balanced without relying on a visual-position shortcut.
 */
export const ADDITIONAL_MAIN_IDEA_PASSAGES: readonly MainIdeaPassage[] = [
  {
    id: 'easy-rain-garden',
    title: 'A garden that catches rain',
    text:
      'During heavy rain, water once rushed from the school roof into the street. The school planted a shallow garden beneath the downspouts instead. Its soil and deep-rooted plants now hold water long enough for much of it to soak into the ground. The garden also attracts insects and adds color, but its main job is practical: it slows runoff before the storm drain becomes crowded.',
    choices: [
      'A rain garden slows roof runoff by holding water while it soaks into the ground.',
      'Every school garden must be planted on a roof.',
      'Storm drains work best when gardens send water into them quickly.',
      'The garden was created mainly to grow food for insects.',
    ],
    correctIndex: 0,
    feedback:
      'The opening problem and the described solution both center on slowing roof runoff.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-library-holds',
    title: 'A fairer way to share popular books',
    text:
      'When a new book becomes popular, many library members may request the same copy. A reservation list records requests in order and alerts each reader when a copy is ready. The pickup window is limited so an uncollected book can move to the next person. This system cannot create more copies, but it gives readers a clear and fair way to take turns.',
    choices: [
      'Popular books should remain on display instead of being borrowed.',
      'A reservation list organizes fair access to books that many readers want.',
      'Libraries use pickup windows to remove readers from waiting lists.',
      'One copy of a book can serve every reader at the same time.',
    ],
    correctIndex: 1,
    feedback:
      'Every detail explains how the reservation process manages shared access to limited copies.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-cooling-lunch',
    title: 'Cooling food safely',
    text:
      'A large pot of soup stays hot in the middle for a long time, even after its surface feels cool. Putting the whole pot into a refrigerator can therefore leave the center warm enough for unwanted bacteria to multiply. Dividing the soup into several shallow containers lets heat escape more quickly. The smaller portions can then cool evenly and be stored safely.',
    choices: [
      'Soup is safe as soon as its surface feels cool.',
      'Refrigerators should never contain cooked food.',
      'Dividing hot food into shallow portions helps it cool quickly and evenly.',
      'Bacteria grow only near the surface of a large pot.',
    ],
    correctIndex: 2,
    feedback:
      'The passage contrasts slow cooling in a deep pot with faster, safer cooling in shallow portions.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-trail-markers',
    title: 'Markers that confirm a route',
    text:
      'A trail marker is most helpful when walkers see it before and after a turn. The first marker signals where to change direction, while the second confirms that the new path is correct. Long gaps between markers can make even a simple route feel uncertain. Clear, repeated markers reduce wrong turns without covering the landscape in unnecessary signs.',
    choices: [
      'Trail markers should appear only at the end of a walk.',
      'Every tree beside a trail needs its own sign.',
      'Long gaps make a route easier to remember.',
      'Well-placed markers guide turns and confirm that walkers remain on the route.',
    ],
    correctIndex: 3,
    feedback:
      'The passage explains the two complementary jobs of markers placed around a turn.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-seed-labels',
    title: 'Labels for next spring',
    text:
      'Beans saved from two plants may look alike even when the plants grew to different heights or ripened at different times. A gardener who stores every seed in one unmarked jar loses that useful history. Writing the variety, harvest date, and growing notes on separate packets preserves the information. Good labels turn a handful of seeds into a reliable starting point for next year.',
    choices: [
      'Seeds from different plants always look completely different.',
      'Gardeners should discard seeds after recording their harvest date.',
      'One unmarked jar is the most reliable storage method.',
      'Clear seed labels preserve information that appearance alone cannot provide.',
    ],
    correctIndex: 3,
    feedback:
      'The passage repeatedly contrasts similar-looking seeds with the history preserved by labels.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-crosswalk-light',
    title: 'More time to cross',
    text:
      'Some pedestrians need more time than a standard signal provides to cross a wide road. A button beside the crossing can request a longer walk phase without changing every cycle all day. Audible cues and a vibrating arrow also communicate when it is safe to begin. Together, these features make the crossing usable for people with different movement and vision needs.',
    choices: [
      'Wide roads should have no pedestrian signals.',
      'A longer walk phase must run during every traffic cycle.',
      'Vibrating arrows are intended to direct vehicle traffic.',
      'Adjustable timing and nonvisual cues make a crossing accessible to more people.',
    ],
    correctIndex: 3,
    feedback:
      'The timing, sound, and touch features all support broader pedestrian access.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'easy-tool-checkout',
    title: 'Checking a tool before lending it',
    text:
      'Before lending a drill, the workshop volunteer checks the cable, tests the switch, and records any existing scratches. The borrower then sees how to stop the tool and receives the correct safety equipment. These steps take a few minutes, but they catch damage early and make responsibility clear. A careful checkout protects both the next user and the shared tool.',
    choices: [
      'Borrowers should repair every tool before using it.',
      'Existing scratches make a drill impossible to lend.',
      'A careful checkout identifies problems and supports safe, responsible tool sharing.',
      'Safety checks matter only after a tool has been returned.',
    ],
    correctIndex: 2,
    feedback:
      'Each listed checkout step supports the combined goals of safety and accountable sharing.',
    difficulty: 'easy',
    inferenceDepth: 'explicit',
  },
  {
    id: 'medium-tree-inventory',
    title: 'Counting trees for a reason',
    text:
      'A city tree inventory records species, trunk size, condition, and location rather than merely counting trees. Planners can combine those details with heat maps to find blocks that lack shade, while maintenance teams can identify aging trees that need inspection. The same dataset therefore supports planting and care. Its value comes from connecting each tree to a condition and place, not from producing one impressive total.',
    choices: [
      'A tree inventory is useful only when it reports the largest possible total.',
      'Heat maps make information about tree condition unnecessary.',
      'Cities should replace old trees without inspecting them.',
      'Detailed tree records support both targeted planting and ongoing maintenance.',
    ],
    correctIndex: 3,
    feedback:
      'The two applications—planting and maintenance—depend on the inventory’s linked details.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-oral-history',
    title: 'A memory and a record',
    text:
      'An oral history captures how a person experienced an event, including details that may never appear in official files. Memory can also compress dates or blend repeated experiences. Historians therefore do not discard interviews or treat them as exact transcripts of the past. They compare them with photographs, letters, and dated records, using differences as clues about both the event and the way it was remembered.',
    choices: [
      'Oral histories add valuable perspective when interpreted alongside other evidence.',
      'Personal memories always provide exact dates without error.',
      'Official files contain every detail that matters to history.',
      'Any disagreement between an interview and a record makes both useless.',
    ],
    correctIndex: 0,
    feedback:
      'The passage combines the distinctive value of memory with the need for comparison and interpretation.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-prototype-test',
    title: 'A rough model with a clear question',
    text:
      'A cardboard model cannot prove that a final chair will support weight, but it can reveal whether the seat height and arm position feel comfortable. Building the inexpensive model first lets designers revise those dimensions before cutting costly material. The prototype succeeds when its test matches what the model can represent. A rough object can answer a precise early question without pretending to be the finished product.',
    choices: [
      'A cardboard model can certify the strength of every final chair.',
      'An inexpensive prototype is useful when it tests a question suited to its limitations.',
      'Designers should avoid changing dimensions after making a model.',
      'A prototype must look finished before anyone can learn from it.',
    ],
    correctIndex: 1,
    feedback:
      'The passage links the prototype’s value to selecting a question it is capable of answering.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-wetland-buffer',
    title: 'Space beside the stream',
    text:
      'A strip of grasses and shrubs beside a stream slows rainwater flowing from nearby fields. As the water spreads through roots and soil, some sediment settles before reaching the channel. The strip also provides habitat and shades the bank. It does not remove every pollutant, yet its several modest effects work together to protect the stream more effectively than bare soil at the water’s edge.',
    choices: [
      'Streamside plants prevent every form of water pollution.',
      'Bare soil provides the strongest protection during rain.',
      'A planted buffer combines several partial benefits that improve stream protection.',
      'Shade is the only useful effect of streamside vegetation.',
    ],
    correctIndex: 2,
    feedback:
      'The central idea synthesizes the multiple small functions of the planted strip.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-meeting-summary',
    title: 'Recording a decision, not every word',
    text:
      'Useful meeting notes do not reproduce every sentence. They record the decision, the evidence or constraint that shaped it, the person responsible for each action, and the due date. Brief notes can still be complete if they preserve those working parts. A long transcript may contain more words while making the next step harder to find. The quality of a summary depends on what it enables people to do afterward.',
    choices: [
      'Effective meeting notes preserve decisions, reasons, owners, and next steps.',
      'Every useful summary must reproduce the entire conversation.',
      'Due dates make assigned responsibility less clear.',
      'The longest record always makes action easiest.',
    ],
    correctIndex: 0,
    feedback:
      'The named elements all serve the broader purpose of enabling accurate follow-through.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-transit-transfer',
    title: 'Designing the whole trip',
    text:
      'A frequent bus route is less useful when it arrives two minutes after the connecting train departs. Riders experience the wait between services as part of the trip, even if each timetable looks efficient alone. Coordinating a few important transfers may require one vehicle to pause briefly, but it can shorten the total journey for many passengers. Service quality depends on connections as well as individual route speed.',
    choices: [
      'Every bus should wait for every train regardless of delay.',
      'Coordinated transfers can improve a whole journey even if one vehicle pauses briefly.',
      'Individual timetables are the only measure of transit quality.',
      'Passengers do not count transfer waits as travel time.',
    ],
    correctIndex: 1,
    feedback:
      'The passage joins route timing and transfer waiting into a whole-trip view of service.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'medium-repair-cafe',
    title: 'Learning while repairing',
    text:
      'At a repair café, volunteers do not simply take a broken lamp behind a counter and return it fixed. They examine it beside the owner, explain which checks are safe, and show how a replaceable part is fitted. The immediate repair prevents waste, while the shared process builds confidence for future maintenance. The event’s larger value lies in combining a useful service with practical learning.',
    choices: [
      'Owners should leave before a repair begins.',
      'Replacing an item always creates less waste than repairing it.',
      'Repair cafés matter only because their labor is free.',
      'A repair café reduces waste while sharing skills that owners can use again.',
    ],
    correctIndex: 3,
    feedback:
      'The main idea must include both the repaired object and the knowledge transferred during the process.',
    difficulty: 'medium',
    inferenceDepth: 'synthesis',
  },
  {
    id: 'hard-air-sensor-network',
    title: 'Many sensors, careful conclusions',
    text:
      'A dense network of inexpensive air sensors can reveal how pollution changes from one street to another. Individual devices, however, may drift with temperature and cannot replace reference instruments. A city paired the small sensors with periodic calibration at a certified station. The network then offered useful local patterns without claiming laboratory precision at every corner. Greater coverage improved understanding only because measurement limits remained visible and corrected.',
    choices: [
      'Low-cost sensors are useful only when each one has laboratory precision.',
      'More sensors automatically eliminate the need for calibration.',
      'A broad sensor network can reveal local patterns when calibration and uncertainty constrain its claims.',
      'Reference stations should be removed once a city maps more streets.',
    ],
    correctIndex: 2,
    feedback:
      'The conclusion accepts broader coverage while conditioning its value on calibration and honest limits.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-local-food-target',
    title: 'What a purchasing target can and cannot do',
    text:
      'A hospital set a target for buying more food from nearby farms. Shorter supply chains supported regional producers, but distance alone did not guarantee low emissions, fair labor, or nutritious menus. The purchasing team kept the target and added standards for production, wages, and seasonal planning. Local sourcing became one useful criterion within a broader policy rather than a substitute for examining how food was produced.',
    choices: [
      'Food quality can be judged entirely by the distance it travels.',
      'A local purchasing target is useful when combined with standards addressing other important outcomes.',
      'Hospitals should ignore nearby producers when planning menus.',
      'Seasonal planning makes labor and nutrition standards unnecessary.',
    ],
    correctIndex: 1,
    feedback:
      'The author preserves the local target but limits what it proves and adds complementary criteria.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-flood-wall',
    title: 'Protection that moves water',
    text:
      'A flood wall can protect a riverside district by keeping high water out of streets and buildings. Yet a wall may also push water downstream faster or create severe damage if an unplanned gap fails. Engineers therefore modeled effects beyond the protected blocks and paired the wall with overflow space and evacuation routes. The structure reduced one risk, but responsible planning required tracing where that risk might move or reappear.',
    choices: [
      'A flood wall removes flood risk from the entire river system.',
      'Downstream effects matter only after a wall has failed.',
      'Evacuation planning is unnecessary beside engineered defenses.',
      'Flood protection should be evaluated beyond the place it directly shields.',
    ],
    correctIndex: 3,
    feedback:
      'The passage qualifies local protection by requiring attention to displaced and residual risks.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-remote-clinic',
    title: 'Convenient care with a boundary',
    text:
      'Video appointments saved travel for patients discussing stable conditions or reviewing routine test results. They were less suitable when clinicians needed to examine a new physical symptom or when a patient lacked private internet access. The clinic kept remote visits while publishing clear reasons for switching to in-person care and offering a private connection room. Convenience improved access only when clinical and digital limits shaped the service.',
    choices: [
      'Remote appointments improve access when services account for clinical and digital limits.',
      'Every medical concern can be assessed completely through video.',
      'Private internet access is unrelated to remote healthcare.',
      'Clinics should replace all routine video reviews with travel.',
    ],
    correctIndex: 0,
    feedback:
      'The conclusion is conditional: remote care helps, but not for every examination or access situation.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-school-attendance',
    title: 'Reading an attendance improvement',
    text:
      'After a school introduced free breakfast, morning attendance improved. The change was encouraging, but the same term also brought a new bus route and milder weather. Staff could not assign the entire improvement to breakfast alone. They continued the program because students valued it, while comparing later attendance across routes and seasons. A promising association justified further observation, not a confident claim of a single cause.',
    choices: [
      'Breakfast certainly caused every attendance change.',
      'Milder weather proves that breakfast had no value.',
      'An encouraging association can support continued study without establishing a single cause.',
      'Schools should end programs whenever several factors change together.',
    ],
    correctIndex: 2,
    feedback:
      'The passage supports a cautious response that preserves the observation without overstating causation.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-archive-digitization',
    title: 'Access is not the same as preservation',
    text:
      'Scanning fragile newspapers lets many readers search them without repeatedly handling the originals. Digital copies, however, can inherit missing pages, poor contrast, and incorrect text recognition. File formats and storage systems also require continued maintenance. Digitization improves access and can reduce physical wear, but it does not complete preservation. The originals, scan quality, metadata, and future file migration all remain part of the archival responsibility.',
    choices: [
      'Digitization expands access but must be paired with quality control and continuing preservation.',
      'Scanning allows archives to discard every original immediately.',
      'Searchable text guarantees that no page or word is missing.',
      'Digital files remain usable forever without maintenance.',
    ],
    correctIndex: 0,
    feedback:
      'The author values digital access while explicitly rejecting the idea that scanning ends preservation work.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
  {
    id: 'hard-wildlife-corridor',
    title: 'A corridor judged by use',
    text:
      'A strip of planted land connected two isolated woodland patches on a map. Its shape looked promising, but fences, bright night lighting, and a busy road still interrupted animal movement. Ecologists tracked footprints and camera detections before calling the project successful. A visual connection was only the beginning; the corridor had to be safe and usable by the species it was meant to serve.',
    choices: [
      'A wildlife corridor succeeds whenever two green areas touch on a map.',
      'A corridor should be evaluated by whether target animals can actually move through it.',
      'Lighting and roads cannot affect movement through planted land.',
      'Camera detections make habitat design unnecessary.',
    ],
    correctIndex: 1,
    feedback:
      'The central qualification replaces appearance alone with evidence of safe, actual use.',
    difficulty: 'hard',
    inferenceDepth: 'qualification',
  },
];
