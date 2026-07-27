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
];
