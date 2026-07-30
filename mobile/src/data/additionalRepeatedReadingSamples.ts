import type { TextSample } from '../domain/types';

type AuthoredRepeatedReadingSample = {
  id: string;
  title: string;
  genre: string;
  text: string;
  prompt: string;
  answer: string;
  distractors: readonly [string, string, string];
  questionType: NonNullable<TextSample['question']['type']>;
  rationale: string;
};

const ORIGINAL_SOURCE = 'Original editorial content';
const ORIGINAL_LICENSE = 'Original content for this application';
const ACCESSIBILITY_NOTES =
  'Connected English text with no image-dependent information.';

const AUTHORED_REPEATED_READING_SAMPLES: readonly AuthoredRepeatedReadingSample[] =
  [
    {
      id: 'repeated-training-01',
      title: 'The Blue Thread',
      genre: 'narrative',
      text:
        'Mara borrowed a field guide from the neighborhood library before walking to the river. '
        + 'The book had no built-in marker, so the librarian tied a short blue thread around its cover and asked Mara to place the thread beside any bird she actually saw. '
        + 'At the river, Mara first heard a sharp call from the reeds. She nearly marked the page for a kingfisher, but the description said that bird usually called while flying over open water. '
        + 'Mara waited. A small brown bird climbed a reed and repeated the sound. She compared its pale eyebrow with two drawings and marked the page for a sedge warbler instead. '
        + 'When she returned the guide, the librarian did not ask how many pages she had marked. She asked which clue had changed Mara’s first guess. '
        + 'Mara pointed to the note about where the call was made. The blue thread had recorded a sighting, but the location clue had made the identification reliable.',
      prompt: 'Which clue caused Mara to reject her first identification?',
      answer: 'The bird called from a reed rather than over open water',
      distractors: [
        'The field guide had no marker sewn into its cover',
        'The librarian asked how many pages Mara had marked',
        'The bird appeared after Mara had already left the river',
      ],
      questionType: 'detail-evidence',
      rationale:
        'The passage says the calling location conflicted with the kingfisher description and redirected Mara’s identification.',
    },
    {
      id: 'repeated-training-02',
      title: 'A Market List in Chalk',
      genre: 'practical',
      text:
        'Every morning, Tomas wrote the bakery’s delivery list on a small chalkboard. '
        + 'He used to arrange the orders by the time each customer had called. That system seemed fair, but it made the delivery route cross the neighborhood several times. '
        + 'One rainy Tuesday, a driver suggested grouping addresses by street while keeping urgent orders marked with a star. '
        + 'Tomas tried the new arrangement the next day. The driver completed the north streets before turning south, and the starred order still arrived before its promised time. '
        + 'At closing, Tomas compared the two days. The bakery had delivered the same number of boxes, but the van had traveled a shorter distance and returned earlier. '
        + 'He kept the street groups and added a separate corner of the board for orders that had a fixed deadline. '
        + 'The useful change was not writing faster. It was arranging the same information so that the route and the exceptions were both visible.',
      prompt: 'Why did Tomas keep a separate corner for fixed-deadline orders?',
      answer: 'It preserved urgent exceptions while the main list stayed grouped by street',
      distractors: [
        'It allowed the bakery to stop recording delivery addresses',
        'It restored the original rule of sorting every order by call time',
        'It ensured the van would visit the south streets before the north streets',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The revised board groups the route geographically but still needs to display orders whose deadlines override that order.',
    },
    {
      id: 'repeated-training-03',
      title: 'A Gap in the Rail',
      genre: 'science',
      text:
        'A metal handrail beside a footbridge is made from several long sections rather than one continuous piece. '
        + 'Between neighboring sections, the builder leaves narrow gaps. On a cool morning, the gaps are easy to see. After hours of sunlight, they become slightly smaller. '
        + 'The change occurs because the atoms in warmed metal vibrate more vigorously, increasing the average spacing within the material. The rail expands even though no new metal has been added. '
        + 'When the temperature falls, the sections contract again. '
        + 'If the builder removed every gap, expanding sections could press against one another. The pressure might bend the rail or strain the points where it is attached to the bridge. '
        + 'The gaps are therefore not signs of careless measurement. They are planned space for predictable movement. '
        + 'Engineers use the expected temperature range and the material’s expansion rate to decide how much space is needed.',
      prompt: 'What problem are the rail gaps designed to prevent?',
      answer: 'Expanding sections pressing together and straining the structure',
      distractors: [
        'Cooling sections gaining new metal and becoming heavier',
        'Sunlight changing the metal into a different material',
        'Pedestrians mistaking a continuous rail for the bridge edge',
      ],
      questionType: 'detail-evidence',
      rationale:
        'The passage identifies pressure, bending, and strain as consequences of leaving no room for thermal expansion.',
    },
    {
      id: 'repeated-training-04',
      title: 'The Map with Two Dates',
      genre: 'history',
      text:
        'A museum volunteer found a folded town map inside a donated travel diary. '
        + 'The map’s cover carried the date 1912, but a railway station drawn near the river did not open until 1916. '
        + 'At first, the volunteer assumed the printed date was wrong. An archivist suggested a different explanation and examined the paper under angled light. '
        + 'The railway branch had been added in darker ink, and its line crossed a crease that was already worn. '
        + 'A note in the diary later described revisiting the town in 1918. Together, the clues suggested that the traveler bought the map in 1912 and updated it by hand during the later journey. '
        + 'The museum catalog now records both dates: the publication date of the printed map and the likely date of the handwritten addition. '
        + 'Keeping both dates preserves the object’s history more accurately than forcing the entire map into a single year.',
      prompt: 'What best explains why the map shows a station opened after 1912?',
      answer: 'The traveler probably added the railway branch during a later visit',
      distractors: [
        'The station had secretly operated before the map was printed',
        'The archivist erased the original route while cataloging the diary',
        'The museum replaced the old map with a completely new one',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The darker ink, worn crease, and 1918 diary entry jointly support a later handwritten update.',
    },
    {
      id: 'repeated-training-05',
      title: 'After Rain Reached the Marsh',
      genre: 'science',
      text:
        'A restored marsh looked healthy in early summer, yet its shallow pools dried sooner than planners expected. '
        + 'The team first considered planting more reeds. Before doing so, it traced the path of rainwater from nearby streets. '
        + 'Most runoff entered a concrete drain that carried water past the marsh and directly to the river. '
        + 'The team replaced one section of curb with a broad, stone-lined opening. During later storms, part of the runoff spread across a planted channel before reaching the marsh. '
        + 'Sediment settled in the channel, and water arrived more slowly. The marsh pools remained wet longer, although their depth still changed with the season. '
        + 'The result showed why plant counts alone can be a weak measure of restoration. '
        + 'The reeds depended on a water system that extended beyond the project boundary. By changing the route and speed of runoff, the team improved the conditions that allowed the existing plants to persist.',
      prompt: 'Why did redirecting runoff help more than immediately adding reeds?',
      answer: 'It restored a slower water supply that the marsh plants depended on',
      distractors: [
        'It prevented seasonal changes in every marsh pool',
        'It removed all sediment before water entered the planted channel',
        'It replaced the marsh ecosystem with a concrete drainage system',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The passage links the marsh’s early drying to bypassed runoff and shows that restoring hydrology supported existing vegetation.',
    },
    {
      id: 'repeated-training-06',
      title: 'The Sensor’s Checksum',
      genre: 'technology',
      text:
        'A weather sensor on a remote hillside sends a short message every ten minutes. '
        + 'Each message contains a temperature reading, a battery level, and a checksum calculated from the other characters. '
        + 'At the receiving station, software performs the same calculation. If its result differs from the checksum in the message, the station marks that reading as damaged instead of placing it directly in the daily record. '
        + 'A checksum does not explain which character changed, and two different errors can occasionally produce the same result. It is therefore not proof that a message is perfect. '
        + 'It is still useful because many common transmission errors are detected cheaply and immediately. '
        + 'When several messages fail in a row, the station requests a fresh transmission and alerts a technician to inspect the radio link. '
        + 'The system separates two jobs: detecting that data may be unreliable and deciding what should happen next.',
      prompt: 'What is the checksum’s specific role in the sensor system?',
      answer: 'It flags many altered messages before they enter the daily record',
      distractors: [
        'It identifies the exact damaged character in every failed message',
        'It repairs the hillside radio without requesting another transmission',
        'It predicts the next temperature from the sensor’s battery level',
      ],
      questionType: 'detail-evidence',
      rationale:
        'The receiver compares checksums to detect likely transmission damage before accepting a reading.',
    },
    {
      id: 'repeated-training-07',
      title: 'The Shelf Behind the Desk',
      genre: 'practical',
      text:
        'A small library kept requested books on a shelf behind the front desk. '
        + 'Originally, staff arranged the books by the date each request arrived. That made it easy to see which requests were oldest, but slow to find a particular title while a line of visitors waited. '
        + 'The library changed the shelf order to the last four digits of each borrower’s card number. '
        + 'To keep old requests from being forgotten, the checkout system highlighted any item that had waited five days and printed a short review list each morning. '
        + 'After the change, staff located books more quickly, while the review list preserved the time information that the shelf no longer displayed. '
        + 'The new process worked because it did not ask one arrangement to solve two different problems. '
        + 'The physical shelf supported fast retrieval; the daily list supported follow-up. Choosing a useful system meant deciding which task belonged in each place.',
      prompt: 'Why did the library retain a daily review list after reorganizing the shelf?',
      answer: 'The list tracked waiting time that the new shelf order no longer showed',
      distractors: [
        'The list converted card numbers back into book publication dates',
        'The list allowed staff to stop locating requested books for visitors',
        'The list arranged every shelf by the date each book was written',
      ],
      questionType: 'inference-purpose',
      rationale:
        'Card-number order improves retrieval, so a separate list is needed to preserve visibility of aging requests.',
    },
    {
      id: 'repeated-training-08',
      title: 'Mapping the Quiet Hour',
      genre: 'science',
      text:
        'Residents near a busy square disagreed about when traffic noise was most disruptive. '
        + 'Instead of relying only on memory, a community group placed sound meters at four fixed locations. '
        + 'The meters recorded sound levels every minute, but the group also kept a written log. Volunteers noted deliveries, buses, road repairs, rain, and public events. '
        + 'The measurements showed a regular morning peak near the loading area. They also showed one unusually loud afternoon beside the park. '
        + 'Without the log, the afternoon value might have been treated as normal traffic. The notes revealed that workers had been cutting stone during a repair. '
        + 'The group used the repeated morning pattern when discussing delivery schedules and treated the repair day as a temporary exception. '
        + 'Numbers made comparisons possible, while observations supplied the context needed to interpret them. Neither record was as useful alone as the two were together.',
      prompt: 'How did the written log change the interpretation of the loud afternoon?',
      answer: 'It showed that temporary stone cutting caused the unusual reading',
      distractors: [
        'It proved that the sound meters had been placed in the wrong square',
        'It showed that morning deliveries had stopped throughout the week',
        'It converted the afternoon measurement into a regular traffic pattern',
      ],
      questionType: 'detail-evidence',
      rationale:
        'The volunteers’ note identified road work as the exceptional source, preventing a temporary event from being generalized.',
    },
    {
      id: 'repeated-training-09',
      title: 'Reading a Lake’s Layers',
      genre: 'science',
      text:
        'Year after year, particles settle onto the bottom of a quiet lake. '
        + 'Pollen, mineral grains, charcoal, and the remains of small organisms may become buried as new sediment arrives. '
        + 'Researchers can extract a narrow core that preserves this sequence, with younger material generally above older material. '
        + 'The layers are not a direct recording of past temperature or rainfall. They are proxy evidence whose meaning must be established. '
        + 'For example, an increase in one pollen type may reflect a climatic shift, but it could also follow land clearing or a change in how wind carried pollen into the lake. '
        + 'Researchers therefore compare several indicators, date selected layers, and study the modern lake and surrounding vegetation. '
        + 'Agreement among independent clues can strengthen an interpretation; disagreement can reveal that a simple explanation is inadequate. '
        + 'The core is valuable not because it speaks for itself, but because it preserves evidence that can be tested against competing accounts of environmental change.',
      prompt: 'Why do researchers compare several indicators from a lake core?',
      answer: 'A single proxy can have multiple causes, so independent clues test the interpretation',
      distractors: [
        'Every sediment layer contains a complete written weather report',
        'The youngest material always appears beneath the oldest material',
        'Modern vegetation has no relationship to pollen found in the lake',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The passage explains that pollen and other proxies are ambiguous unless multiple dated clues and modern observations support the same account.',
    },
    {
      id: 'repeated-training-10',
      title: 'A Forecast That Knows Its Limits',
      genre: 'argument',
      text:
        'Two forecasting systems can make the same number of correct predictions and still differ in quality. '
        + 'Suppose both systems examine one hundred events and identify seventy outcomes correctly. The first expresses equal confidence in every prediction. The second assigns higher confidence only when the available evidence is stronger. '
        + 'To evaluate those confidence statements, analysts group predictions with similar stated probabilities. '
        + 'Among events labeled with a seventy-percent chance, the predicted outcome should occur about seventy percent of the time across a sufficiently large set. '
        + 'This property is called calibration. It does not guarantee that any one event will follow the forecast, nor does it replace accuracy. '
        + 'Instead, calibration asks whether confidence is honest over repeated cases. '
        + 'A well-calibrated system helps a decision maker distinguish a tentative signal from a strong one. That distinction can matter even when the systems’ overall hit rates are identical.',
      prompt: 'What additional quality does calibration measure beyond overall accuracy?',
      answer: 'Whether stated confidence matches outcomes across repeated comparable cases',
      distractors: [
        'Whether every individual event follows its most likely prediction',
        'Whether all predictions are reported with the same confidence level',
        'Whether the system avoids making any tentative predictions at all',
      ],
      questionType: 'main-idea',
      rationale:
        'The passage contrasts hit rate with the agreement between probability statements and long-run frequencies.',
    },
    {
      id: 'repeated-training-11',
      title: 'A Corridor Is More Than a Line',
      genre: 'science',
      text:
        'On a regional map, a wildlife corridor may look like a simple band connecting two protected areas. '
        + 'For an animal moving through the landscape, however, the corridor is a sequence of local decisions. '
        + 'A narrow strip of trees may provide cover for one species but remain unusable to another if it crosses a bright road or lacks water during the dry season. '
        + 'Corridor planners therefore examine width, vegetation, crossings, seasonal resources, and disturbance rather than measuring connection by distance alone. '
        + 'They may install a vegetated bridge over a highway, restore shelter near a stream, or protect several small stepping-stone habitats. '
        + 'Monitoring then asks whether animals actually use the route and whether that movement supports breeding between populations. '
        + 'A corridor that appears continuous from above can still contain an ecological barrier. Conversely, separate habitat patches can sometimes function as a route when their spacing and resources suit the species being protected.',
      prompt: 'Why can a visually continuous corridor still fail?',
      answer: 'A local barrier or missing resource can make part of the route unusable',
      distractors: [
        'Animals can move only through habitats drawn as separate patches',
        'Protected areas always prevent breeding between neighboring populations',
        'Corridor width is the only feature that influences animal movement',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The passage distinguishes map continuity from the species-specific resources and crossings required along the route.',
    },
    {
      id: 'repeated-training-12',
      title: 'Layers Are Not Simple Clocks',
      genre: 'history',
      text:
        'Archaeologists often use the order of soil layers to reconstruct a site’s history. '
        + 'When a layer is deposited without later disturbance, material beneath it is generally older than material above it. '
        + 'Real sites, however, are rarely perfect stacks. A storage pit dug through an old floor may contain objects dropped centuries after the floor was built. '
        + 'Tree roots, burrowing animals, floods, and later construction can also move material between layers. '
        + 'For that reason, an artifact’s depth is evidence, not a date by itself. '
        + 'Excavators record the shape and boundaries of each context, note where it cuts another feature, and compare associated finds. '
        + 'Laboratory dating may then test part of the proposed sequence. '
        + 'The strongest chronology combines spatial relationships, material evidence, and independent dates. Treating every deeper object as automatically older would erase the very disturbances that help explain how the site changed.',
      prompt: 'Why is an artifact’s depth insufficient to establish its date?',
      answer: 'Later digging and natural processes can move material between contexts',
      distractors: [
        'Soil layers are always deposited in reverse chronological order',
        'Laboratory dates measure only the depth of an excavation trench',
        'Archaeologists do not record where one feature cuts another',
      ],
      questionType: 'main-idea',
      rationale:
        'The passage lists several disturbances and argues that chronology requires contextual relationships plus independent evidence.',
    },
    {
      id: 'repeated-training-13',
      title: 'The Queue with Two Doors',
      genre: 'systems',
      text:
        'A service center tested two ways of organizing arrivals. '
        + 'Under the first design, everyone joined one line and went to the next available clerk. Under the second, visitors chose a separate line for each clerk. '
        + 'Separate lines looked shorter, but a complicated case could trap one group while another clerk became free. '
        + 'The single line distributed that delay across all visitors and usually reduced differences in waiting time. '
        + 'Yet it created a new problem: people with a thirty-second document pickup waited behind cases that required a long interview. '
        + 'The center kept one main line but added an express desk for a small set of clearly defined transactions. '
        + 'Staff reviewed the express categories each month because adding too many exceptions would recreate several competing queues. '
        + 'The final design was not universally fastest for every person. It balanced predictable waiting, efficient use of clerks, and a limited shortcut for tasks whose service time was reliably brief.',
      prompt: 'Why did the center limit the number of express categories?',
      answer: 'Too many exceptions would recreate the problems of several competing lines',
      distractors: [
        'The main line could function only when every transaction took thirty seconds',
        'A single complicated case always made every clerk become unavailable',
        'Visitors were unable to identify any clearly defined transaction',
      ],
      questionType: 'inference-purpose',
      rationale:
        'The passage explicitly connects excessive exceptions with a return to multiple competing queues.',
    },
  ];

function placeCorrectAnswer(
  answer: string,
  distractors: readonly [string, string, string],
  targetIndex: number
): { choices: string[]; correctIndex: number } {
  const choices = [...distractors];
  choices.splice(targetIndex, 0, answer);
  return { choices, correctIndex: targetIndex };
}

export const ADDITIONAL_REPEATED_READING_SAMPLES: readonly TextSample[] =
  AUTHORED_REPEATED_READING_SAMPLES.map((sample, sampleIndex) => {
    const { choices, correctIndex } = placeCorrectAnswer(
      sample.answer,
      sample.distractors,
      sampleIndex % 4
    );
    return {
      id: sample.id,
      version: 1,
      comparisonBand: 'general-practice-brief-v1',
      title: sample.title,
      language: 'en',
      genre: sample.genre,
      complexityBand: 'repeated-reading-training-v1',
      source: ORIGINAL_SOURCE,
      license: ORIGINAL_LICENSE,
      accessibilityNotes: ACCESSIBILITY_NOTES,
      text: sample.text,
      question: {
        prompt: sample.prompt,
        choices,
        correctIndex,
        type: sample.questionType,
        rationale: sample.rationale,
        answerDependency: 'passage-required',
      },
    };
  });
