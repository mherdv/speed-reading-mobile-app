import {
  shuffleItems,
  type RandomSource,
} from './randomization';
import {
  ADDITIONAL_ADVANCED_WORDS,
  ADDITIONAL_BEGINNER_WORDS,
  ADDITIONAL_INTERMEDIATE_WORDS,
} from './languageExpansionContent';

/**
 * Original English practice vocabulary maintained for this application.
 *
 * Level rationale:
 * - easy: common, concrete words, generally 4–6 letters;
 * - medium: longer general/academic words, generally 6–9 letters;
 * - hard: long or morphologically complex words, generally 9+ letters.
 *
 * Provenance: editorially assembled for the app using broad public frequency
 * and academic-language conventions. It is not a copy of a named course,
 * competitor pack, AWL, GSL, or "4000 Essential English Words" product.
 */

export type VocabularyWord = {
  word: string;
  definition: string;
  example?: string;
  category?: string;
};

function uniqueReviewedWords(words: readonly string[]): string[] {
  const seen = new Set<string>();
  return words.filter((word) => {
    const key = word.trim().toLocaleLowerCase('en');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============== BEGINNER WORDS (4-6 letters) ==============
const BEGINNER_WORD_SOURCE: string[] = [
  // Short words used by the compact Word Search board
  'arch', 'bank', 'bird', 'boat', 'book', 'camp', 'card', 'city', 'clay', 'coat',
  'dawn', 'desk', 'door', 'dust', 'farm', 'fish', 'flag', 'food', 'fork', 'game',
  'gate', 'gift', 'hill', 'home', 'hope', 'idea', 'lake', 'lamp', 'leaf', 'line',
  'map', 'moon', 'path', 'pond', 'rain', 'road', 'rock', 'roof', 'room', 'seed',
  'ship', 'shop', 'snow', 'song', 'star', 'team', 'tent', 'tree', 'wind', 'wood',
  // Common nouns
  'apple', 'bread', 'chair', 'dream', 'earth', 'flame', 'glass', 'heart',
  'island', 'juice', 'knife', 'lemon', 'money', 'novel', 'ocean', 'paper',
  'queen', 'river', 'storm', 'train', 'uncle', 'voice', 'water', 'youth',
  'zebra', 'anger', 'basic', 'cloud', 'dance', 'event', 'faith', 'grace',
  'habit', 'image', 'judge', 'karma', 'layer', 'magic', 'nurse', 'order',
  'peace', 'quote', 'radio', 'scale', 'taste', 'unity', 'value', 'watch',
  // Action verbs
  'begin', 'carry', 'dance', 'enter', 'focus', 'guide', 'honor', 'ignore',
  'judge', 'knock', 'learn', 'march', 'noted', 'occur', 'place', 'quest',
  'raise', 'serve', 'teach', 'unite', 'visit', 'waste', 'yield', 'admit',
  'blend', 'claim', 'doubt', 'enjoy', 'float', 'grant', 'hurry', 'imply',
  // Adjectives
  'brave', 'clean', 'dense', 'eager', 'final', 'grand', 'heavy', 'inner',
  'joint', 'known', 'large', 'minor', 'novel', 'outer', 'plain', 'quick',
  'rapid', 'sharp', 'thick', 'upper', 'valid', 'whole', 'young', 'basic',
  'brief', 'chief', 'daily', 'early', 'fresh', 'great', 'human', 'ideal',
  // Broader everyday reading and visual-recognition vocabulary
  'acorn', 'badge', 'beach', 'bell', 'berry', 'bloom', 'brick', 'brook',
  'brush', 'cabin', 'camel', 'candle', 'canoe', 'cargo', 'cave', 'chalk',
  'chess', 'cliff', 'coral', 'craft', 'crane', 'creek', 'crown', 'drum',
  'eagle', 'fence', 'field', 'flower', 'forest', 'frame', 'fruit', 'globe',
  'grape', 'grass', 'horse', 'hotel', 'house', 'kitten', 'light', 'market',
  'metal', 'music', 'paint', 'peach', 'pearl', 'piano', 'plant', 'plate',
  'prize', 'shell', 'shore', 'skill', 'smile', 'soil', 'space', 'spice',
  'spoon', 'stone', 'table', 'tiger', 'tower', 'track', 'wheat', 'wheel',
  'world', 'build', 'catch', 'chase', 'choose', 'climb', 'count', 'draw',
  'drink', 'drive', 'gather', 'help', 'listen', 'move', 'read', 'reach',
  'repair', 'rest', 'sail', 'solve', 'speak', 'spend', 'stand', 'study',
  'swim', 'think', 'throw', 'touch', 'turn', 'walk', 'write', 'calm',
  'clear', 'close', 'cool', 'fair', 'gentle', 'local', 'lucky', 'modern',
  'neat', 'proud', 'ready', 'round', 'simple', 'slow', 'small', 'steady',
  'sweet', 'warm',
  ...ADDITIONAL_BEGINNER_WORDS,
];
export const BEGINNER_WORDS = uniqueReviewedWords(BEGINNER_WORD_SOURCE);

// ============== INTERMEDIATE WORDS (6-9 letters) ==============
const INTERMEDIATE_WORD_SOURCE: string[] = [
  // Academic vocabulary
  'achieve', 'benefit', 'concept', 'develop', 'evident', 'feature', 'genuine',
  'harmony', 'insight', 'justify', 'kingdom', 'logical', 'measure', 'neutral',
  'obvious', 'pattern', 'qualify', 'require', 'species', 'theorem', 'utilize',
  'variety', 'witness', 'abandon', 'abstract', 'accurate', 'advocate', 'ambition',
  'analyze', 'approach', 'argument', 'attitude', 'boundary', 'capacity', 'category',
  'challenge', 'commerce', 'community', 'complex', 'conclude', 'conduct', 'confirm',
  'conflict', 'constant', 'contrast', 'convince', 'creative', 'criteria', 'critical',
  'cultural', 'currency', 'decision', 'decrease', 'definite', 'democracy', 'describe',
  'distinct', 'document', 'domestic', 'dominant', 'dramatic', 'economic', 'efficient',
  'element', 'emphasis', 'enable', 'enhance', 'enormous', 'ensure', 'entitle',
  'equality', 'equation', 'essential', 'estimate', 'evaluate', 'eventual', 'evidence',
  'evolve', 'examine', 'example', 'exchange', 'exclude', 'execute', 'exercise',
  'expand', 'explain', 'explicit', 'explore', 'exposure', 'external', 'facility',
  'factor', 'federal', 'feedback', 'fiction', 'finance', 'flexible', 'forecast',
  'foreign', 'format', 'formula', 'fragment', 'framework', 'frequency', 'function',
  'generate', 'genuine', 'gesture', 'global', 'gradual', 'grateful', 'gravity',
  'guidance', 'heritage', 'horizon', 'humanity', 'identity', 'ideology', 'ignorance',
  'illustrate', 'immediate', 'immense', 'impact', 'imperial', 'implicit', 'improve',
  'impulse', 'incident', 'include', 'increase', 'indicate', 'indirect', 'infinite',
  'influence', 'inherit', 'initial', 'initiate', 'innovate', 'inquiry', 'instance',
  // General, academic, and informational-text vocabulary
  'ability', 'acquire', 'active', 'address', 'admire', 'advance', 'afford',
  'agency', 'archive', 'balance', 'barrier', 'behave', 'biology', 'capture',
  'caution', 'clarify', 'climate', 'combine', 'comfort', 'compare', 'compete',
  'compose', 'concern', 'conserve', 'consult', 'consume', 'context',
  'cooperate', 'courage', 'curious', 'decline', 'define', 'deliver', 'derive',
  'design', 'detect', 'device', 'differ', 'digital', 'discover', 'diverse',
  'dynamic', 'emerge', 'emotion', 'engage', 'establish', 'ethics', 'exceed',
  'exhibit', 'extend', 'failure', 'fairness', 'feasible', 'fluent', 'forbid',
  'habitat', 'imagine', 'inspire', 'instruct', 'interpret', 'interval',
  'language', 'maintain', 'migrate', 'monitor', 'motivate', 'outcome',
  'perceive', 'persist', 'predict', 'preserve', 'prevent', 'process',
  'promote', 'propose', 'recover', 'reflect', 'respond', 'restore', 'review',
  'select', 'simulate', 'strategy', 'summarize', 'support', 'survive',
  'symbol', 'transfer', 'translate', 'verify', 'version',
  ...ADDITIONAL_INTERMEDIATE_WORDS,
];
export const INTERMEDIATE_WORDS = uniqueReviewedWords(INTERMEDIATE_WORD_SOURCE);

// ============== ADVANCED WORDS (9+ letters) ==============
const ADVANCED_WORD_SOURCE: string[] = [
  // Complex academic vocabulary
  'acceleration', 'accomplishment', 'accountability', 'acknowledgment', 'acquisition',
  'administration', 'advantageous', 'advertisement', 'aesthetically', 'affirmative',
  'alternatively', 'ambiguously', 'appreciation', 'approximately', 'architectural',
  'argumentative', 'aristocratic', 'assassination', 'authenticity', 'authorization',
  'bibliography', 'biodiversity', 'breakthrough', 'bureaucratic', 'calculation',
  'catastrophic', 'certification', 'characteristic', 'chronological', 'circumstance',
  'civilization', 'classification', 'collaboration', 'commemoration', 'communication',
  'compassionate', 'compensation', 'competition', 'comprehensive', 'concentration',
  'confederation', 'configuration', 'confirmation', 'confrontation', 'congregation',
  'consciousness', 'consequently', 'considerable', 'consideration', 'consolidation',
  'constitution', 'construction', 'consultation', 'contemporary', 'contribution',
  'controversial', 'conventional', 'conversation', 'coordination', 'correspondence',
  'counterproductive', 'creativity', 'credibility', 'cryptocurrency', 'culmination',
  'customization', 'deforestation', 'deliberation', 'demonstration', 'denomination',
  'determination', 'developmental', 'differentiate', 'disappointment', 'discrimination',
  'disintegration', 'dissemination', 'distinguished', 'documentation', 'domestication',
  'effectiveness', 'electromagnetic', 'embarrassment', 'encouragement', 'enlightenment',
  'entertainment', 'entrepreneurial', 'environmental', 'establishment', 'exaggeration',
  'examination', 'exceptionally', 'experimentation', 'extraordinary', 'familiarization',
  'fundamentally', 'generalization', 'globalization', 'gratification', 'hallucination',
  'harmonization', 'heterogeneous', 'hierarchical', 'hospitalization', 'humanitarian',
  'ideologically', 'identification', 'illustration', 'implementation', 'improvisation',
  'incarceration', 'incorporation', 'independently', 'individualism', 'industrialization',
  'infrastructure', 'initialization', 'insignificant', 'instantaneous', 'institutionalized',
  'instrumentation', 'intellectually', 'interdependent', 'internationally', 'interpretation',
  'interrogation', 'investigation', 'justification', 'knowledgeable', 'liberalization',
  'manifestation', 'marginalization', 'materialistic', 'mathematician', 'mechanization',
  'memorization', 'microorganism', 'misinterpretation', 'misunderstanding', 'modernization',
  'multidimensional', 'multiplication', 'nationalistic', 'naturalization', 'nevertheless',
  'notwithstanding', 'organizational', 'outperformance', 'oversimplification', 'overwhelming',
  'paradoxically', 'parameterization', 'participation', 'perfectionism', 'personalization',
  'pharmaceutical', 'phenomenological', 'philosophical', 'photosynthesis', 'physiological',
  'popularization', 'predominantly', 'preoccupation', 'presupposition', 'privatization',
  'problematically', 'procrastination', 'professionalism', 'profitability', 'progressively',
  'pronunciation', 'proportionally', 'psychologically', 'quantification', 'questionnaire',
  'rationalization', 'realization', 'recapitalization', 'recommendation', 'reconciliation',
  'reconstruction', 'redistribution', 'rehabilitation', 'reinforcement', 'reiteration',
  'rejuvenation', 'representation', 'responsibility', 'restructuring', 'retrospectively',
  'revolutionize', 'romanticization', 'sanctification', 'sensationalism', 'sentimentality',
  'simplification', 'simultaneously', 'socialization', 'sophistication', 'specialization',
  'specification', 'standardization', 'straightforward', 'stratification', 'strengthening',
  'subconsciously', 'subordination', 'substantially', 'superficially', 'sustainability',
  'synchronization', 'systematically', 'telecommunications', 'transformation', 'transitional',
  'transportation', 'troubleshooting', 'unambiguously', 'uncharacteristic', 'unconditionally',
  'underestimation', 'understanding', 'unfortunately', 'unpredictability', 'unprecedented',
  'visualization', 'vulnerability', 'westernization', 'wholesomeness', 'worthwhile',
  // High-utility concepts found in academic and professional prose
  'accessibility', 'adaptability', 'adaptation', 'algorithmic', 'allocation',
  'ambiguity', 'analytical', 'anticipation', 'applicability', 'architecture',
  'articulation', 'assessment', 'assumption', 'atmospheric', 'autonomous',
  'capability', 'clarification', 'coherence', 'comparative', 'compatibility',
  'complexity', 'conceptual', 'conservation', 'consistency', 'constraint',
  'contextual', 'correlation', 'curriculum', 'decentralization',
  'deterioration', 'diagnostic', 'differentiation', 'digitalization',
  'ecological', 'educational', 'empirical', 'evaluation', 'explanatory',
  'feasibility', 'hypothetical', 'implication', 'inclusivity',
  'inconsistency', 'innovation', 'integration', 'interconnection',
  'interdisciplinary', 'longitudinal', 'meaningful', 'measurement',
  'metacognition', 'neurological', 'operational', 'perspective', 'precision',
  'prerequisite', 'probability', 'proportional', 'qualitative',
  'quantitative', 'readability', 'reciprocity', 'reliability', 'replication',
  'responsive', 'significant', 'strategic', 'terminology', 'theoretical',
  'transparency', 'uncertainty', 'variability', 'verification', 'vocabulary',
  'cognitive', 'comprehension', 'inference',
  ...ADDITIONAL_ADVANCED_WORDS,
];
export const ADVANCED_WORDS = uniqueReviewedWords(ADVANCED_WORD_SOURCE);

// ============== WORD PAIRS (Antonyms/Opposites) ==============
const WORD_PAIR_SOURCE: [string, string][] = [
  // Basic opposites
  ['hot', 'cold'], ['up', 'down'], ['fast', 'slow'], ['big', 'small'],
  ['day', 'night'], ['left', 'right'], ['open', 'close'], ['happy', 'sad'],
  ['light', 'dark'], ['new', 'old'], ['hard', 'soft'], ['high', 'low'],
  ['start', 'end'], ['push', 'pull'], ['win', 'lose'], ['buy', 'sell'],
  ['give', 'take'], ['come', 'go'], ['rise', 'fall'], ['love', 'hate'],
  ['rich', 'poor'], ['thick', 'thin'], ['wide', 'narrow'], ['deep', 'shallow'],
  ['strong', 'weak'], ['brave', 'coward'], ['clean', 'dirty'], ['empty', 'full'],
  ['young', 'old'], ['smart', 'dumb'], ['loud', 'quiet'], ['rough', 'smooth'],
  ['wet', 'dry'], ['safe', 'dangerous'], ['easy', 'difficult'], ['cheap', 'expensive'],
  ['early', 'late'], ['front', 'back'], ['top', 'bottom'], ['inside', 'outside'],
  // Intermediate opposites
  ['accept', 'reject'], ['admit', 'deny'], ['advance', 'retreat'], ['agree', 'disagree'],
  ['allow', 'forbid'], ['ancient', 'modern'], ['arrive', 'depart'], ['attack', 'defend'],
  ['begin', 'finish'], ['bless', 'curse'], ['borrow', 'lend'], ['build', 'destroy'],
  ['capture', 'release'], ['cause', 'effect'], ['create', 'destroy'], ['divide', 'unite'],
  ['expand', 'contract'], ['export', 'import'], ['fail', 'succeed'], ['fiction', 'reality'],
  ['forget', 'remember'], ['freedom', 'slavery'], ['friend', 'enemy'], ['gain', 'lose'],
  ['generous', 'selfish'], ['genuine', 'fake'], ['guilty', 'innocent'], ['heaven', 'hell'],
  ['honest', 'dishonest'], ['humble', 'arrogant'], ['include', 'exclude'], ['increase', 'decrease'],
  ['innocent', 'guilty'], ['interior', 'exterior'], ['junior', 'senior'], ['justice', 'injustice'],
  ['knowledge', 'ignorance'], ['legal', 'illegal'], ['lenient', 'strict'], ['liberal', 'conservative'],
  ['literal', 'figurative'], ['logical', 'illogical'], ['major', 'minor'], ['maximum', 'minimum'],
  ['native', 'foreign'], ['natural', 'artificial'], ['negative', 'positive'], ['normal', 'abnormal'],
  ['optimist', 'pessimist'], ['ordinary', 'extraordinary'], ['original', 'copy'], ['partial', 'complete'],
  ['passive', 'active'], ['permanent', 'temporary'], ['plural', 'singular'], ['polite', 'rude'],
  ['possible', 'impossible'], ['presence', 'absence'], ['private', 'public'], ['problem', 'solution'],
  ['profit', 'loss'], ['progress', 'regress'], ['question', 'answer'], ['random', 'specific'],
  ['rational', 'irrational'], ['real', 'imaginary'], ['regular', 'irregular'], ['relevant', 'irrelevant'],
  ['reveal', 'conceal'], ['reward', 'punishment'], ['rural', 'urban'], ['sacred', 'profane'],
  ['scatter', 'gather'], ['separate', 'together'], ['simple', 'complex'], ['singular', 'plural'],
  ['solid', 'liquid'], ['specific', 'general'], ['straight', 'crooked'], ['strength', 'weakness'],
  ['success', 'failure'], ['supply', 'demand'], ['surface', 'depth'], ['sweet', 'sour'],
  ['synthetic', 'natural'], ['tame', 'wild'], ['theory', 'practice'], ['transparent', 'opaque'],
  ['triumph', 'defeat'], ['true', 'false'], ['truth', 'lie'], ['typical', 'atypical'],
  ['union', 'separation'], ['unique', 'common'], ['urban', 'rural'], ['vacant', 'occupied'],
  ['valid', 'invalid'], ['vertical', 'horizontal'], ['victory', 'defeat'], ['virtue', 'vice'],
  ['visible', 'invisible'], ['voluntary', 'compulsory'], ['war', 'peace'], ['wealth', 'poverty'],
  ['wisdom', 'folly'], ['zenith', 'nadir'],
];

function uniqueUnorderedPairs(
  pairs: readonly [string, string][]
): [string, string][] {
  const seen = new Set<string>();
  return pairs.filter(([first, second]) => {
    const key = [first, second]
      .map((word) => word.toLocaleLowerCase('en'))
      .sort()
      .join('\u0000');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Legacy pair export, de-duplicated in both forward and reverse directions. */
export const WORD_PAIRS = uniqueUnorderedPairs(WORD_PAIR_SOURCE);

// ============== VOCABULARY WITH DEFINITIONS ==============
export const VOCABULARY_WITH_DEFINITIONS: VocabularyWord[] = [
  // A
  { word: 'abandon', definition: 'to give up completely', category: 'verb' },
  { word: 'abbreviate', definition: 'to shorten a word or phrase', category: 'verb' },
  { word: 'abolish', definition: 'to officially end or stop', category: 'verb' },
  { word: 'abstract', definition: 'existing in thought or as an idea', category: 'adjective' },
  { word: 'abundant', definition: 'existing in large quantities', category: 'adjective' },
  { word: 'accelerate', definition: 'to increase speed', category: 'verb' },
  { word: 'accommodate', definition: 'to provide lodging or room for', category: 'verb' },
  { word: 'accomplish', definition: 'to succeed in doing', category: 'verb' },
  { word: 'accumulate', definition: 'to gather or collect over time', category: 'verb' },
  { word: 'accurate', definition: 'correct in all details', category: 'adjective' },
  { word: 'acknowledge', definition: 'to accept or admit the truth of', category: 'verb' },
  { word: 'acquire', definition: 'to obtain or get', category: 'verb' },
  { word: 'adapt', definition: 'to adjust to new conditions', category: 'verb' },
  { word: 'adequate', definition: 'sufficient for a requirement', category: 'adjective' },
  { word: 'adjacent', definition: 'next to or adjoining', category: 'adjective' },
  { word: 'advocate', definition: 'to publicly support', category: 'verb' },
  { word: 'aesthetic', definition: 'concerned with beauty', category: 'adjective' },
  { word: 'affect', definition: 'to have an influence on', category: 'verb' },
  { word: 'aggregate', definition: 'a whole formed by combining parts', category: 'noun' },
  { word: 'allocate', definition: 'to distribute for a purpose', category: 'verb' },
  { word: 'alter', definition: 'to change in character', category: 'verb' },
  { word: 'ambiguous', definition: 'open to more than one interpretation', category: 'adjective' },
  { word: 'amend', definition: 'to make minor changes to improve', category: 'verb' },
  { word: 'analyze', definition: 'to examine in detail', category: 'verb' },
  { word: 'anticipate', definition: 'to expect or predict', category: 'verb' },
  { word: 'apparent', definition: 'clearly visible or understood', category: 'adjective' },
  { word: 'append', definition: 'to add to the end', category: 'verb' },
  { word: 'appreciate', definition: 'to recognize the value of', category: 'verb' },
  { word: 'approach', definition: 'to come near or nearer to', category: 'verb' },
  { word: 'appropriate', definition: 'suitable or proper', category: 'adjective' },
  { word: 'arbitrary', definition: 'based on random choice', category: 'adjective' },
  { word: 'ascend', definition: 'to go up or climb', category: 'verb' },
  { word: 'aspect', definition: 'a particular part or feature', category: 'noun' },
  { word: 'assemble', definition: 'to gather together', category: 'verb' },
  { word: 'assess', definition: 'to evaluate or estimate', category: 'verb' },
  { word: 'assign', definition: 'to allocate a task', category: 'verb' },
  { word: 'assume', definition: 'to suppose without proof', category: 'verb' },
  { word: 'assure', definition: 'to tell confidently', category: 'verb' },
  { word: 'attach', definition: 'to fasten or join', category: 'verb' },
  { word: 'attain', definition: 'to succeed in achieving', category: 'verb' },
  { word: 'attribute', definition: 'to regard as caused by', category: 'verb' },
  { word: 'authentic', definition: 'genuine and original', category: 'adjective' },
  { word: 'authorize', definition: 'to give official permission', category: 'verb' },
  // B
  { word: 'benefit', definition: 'an advantage or profit', category: 'noun' },
  { word: 'bias', definition: 'prejudice for or against', category: 'noun' },
  { word: 'brief', definition: 'of short duration', category: 'adjective' },
  { word: 'bulk', definition: 'the mass or size of something large', category: 'noun' },
  // C
  { word: 'capable', definition: 'having the ability to do', category: 'adjective' },
  { word: 'capacity', definition: 'the maximum amount that can be contained', category: 'noun' },
  { word: 'category', definition: 'a class or division', category: 'noun' },
  { word: 'cease', definition: 'to come or bring to an end', category: 'verb' },
  { word: 'challenge', definition: 'a call to take part in a contest', category: 'noun' },
  { word: 'chapter', definition: 'a main division of a book', category: 'noun' },
  { word: 'chart', definition: 'a sheet of information in graphs', category: 'noun' },
  { word: 'civil', definition: 'relating to citizens', category: 'adjective' },
  { word: 'clarify', definition: 'to make less confused', category: 'verb' },
  { word: 'classic', definition: 'of the highest quality', category: 'adjective' },
  { word: 'clause', definition: 'a unit of grammatical organization', category: 'noun' },
  { word: 'code', definition: 'a system of words or symbols', category: 'noun' },
  { word: 'coherent', definition: 'logical and consistent', category: 'adjective' },
  { word: 'coincide', definition: 'to occur at the same time', category: 'verb' },
  { word: 'collapse', definition: 'to fall down suddenly', category: 'verb' },
  { word: 'colleague', definition: 'a person with whom one works', category: 'noun' },
  { word: 'commence', definition: 'to begin', category: 'verb' },
  { word: 'comment', definition: 'a verbal or written remark', category: 'noun' },
  { word: 'commission', definition: 'an instruction or command', category: 'noun' },
  { word: 'commit', definition: 'to carry out or perpetrate', category: 'verb' },
  { word: 'commodity', definition: 'a raw material or product', category: 'noun' },
  { word: 'communicate', definition: 'to share or exchange information', category: 'verb' },
  { word: 'community', definition: 'a group of people living in one place', category: 'noun' },
  { word: 'compatible', definition: 'able to exist together', category: 'adjective' },
  { word: 'compensate', definition: 'to give something in recognition', category: 'verb' },
  { word: 'compile', definition: 'to produce by assembling information', category: 'verb' },
  { word: 'complement', definition: 'to add to in a way that enhances', category: 'verb' },
  { word: 'complex', definition: 'consisting of many parts', category: 'adjective' },
  { word: 'component', definition: 'a part of a larger whole', category: 'noun' },
  { word: 'compound', definition: 'made up of two or more parts', category: 'adjective' },
  { word: 'comprehensive', definition: 'complete and including all elements', category: 'adjective' },
  { word: 'comprise', definition: 'to consist of', category: 'verb' },
  { word: 'compute', definition: 'to calculate', category: 'verb' },
  { word: 'conceive', definition: 'to form an idea', category: 'verb' },
  { word: 'concentrate', definition: 'to focus attention', category: 'verb' },
  { word: 'concept', definition: 'an abstract idea', category: 'noun' },
  { word: 'conclude', definition: 'to bring to an end', category: 'verb' },
  { word: 'concurrent', definition: 'existing or happening at the same time', category: 'adjective' },
  { word: 'conduct', definition: 'to organize and carry out', category: 'verb' },
  { word: 'confer', definition: 'to grant or bestow', category: 'verb' },
  { word: 'confine', definition: 'to keep within limits', category: 'verb' },
  { word: 'confirm', definition: 'to establish the truth of', category: 'verb' },
  { word: 'conflict', definition: 'a serious disagreement', category: 'noun' },
  { word: 'conform', definition: 'to comply with rules', category: 'verb' },
  { word: 'consent', definition: 'permission for something to happen', category: 'noun' },
  { word: 'consequent', definition: 'following as a result', category: 'adjective' },
  { word: 'considerable', definition: 'notably large in size or amount', category: 'adjective' },
  { word: 'consist', definition: 'to be composed of', category: 'verb' },
  { word: 'constant', definition: 'occurring continuously', category: 'adjective' },
  { word: 'constitute', definition: 'to be a part of a whole', category: 'verb' },
  { word: 'constrain', definition: 'to severely restrict', category: 'verb' },
  { word: 'construct', definition: 'to build or erect', category: 'verb' },
  { word: 'consult', definition: 'to seek information or advice from', category: 'verb' },
  { word: 'consume', definition: 'to use up', category: 'verb' },
  { word: 'contact', definition: 'the state of touching', category: 'noun' },
  { word: 'contemporary', definition: 'living or occurring at the same time', category: 'adjective' },
  { word: 'context', definition: 'the circumstances that form the setting', category: 'noun' },
  { word: 'contract', definition: 'a written legal agreement', category: 'noun' },
  { word: 'contradict', definition: 'to deny the truth of', category: 'verb' },
  { word: 'contrary', definition: 'opposite in nature or direction', category: 'adjective' },
  { word: 'contrast', definition: 'to compare to show differences', category: 'verb' },
  { word: 'contribute', definition: 'to give in order to help', category: 'verb' },
  { word: 'controversy', definition: 'prolonged public disagreement', category: 'noun' },
  { word: 'convention', definition: 'a way of behaving that is usual', category: 'noun' },
  { word: 'convert', definition: 'to change in form or function', category: 'verb' },
  { word: 'convince', definition: 'to cause someone to believe', category: 'verb' },
  { word: 'cooperate', definition: 'to work together', category: 'verb' },
  { word: 'coordinate', definition: 'to organize together', category: 'verb' },
  { word: 'core', definition: 'the central or most important part', category: 'noun' },
  { word: 'corporate', definition: 'relating to a large company', category: 'adjective' },
  { word: 'correspond', definition: 'to have a close similarity', category: 'verb' },
  { word: 'couple', definition: 'two people or things', category: 'noun' },
  { word: 'create', definition: 'to bring into existence', category: 'verb' },
  { word: 'credit', definition: 'the ability to obtain goods before payment', category: 'noun' },
  { word: 'criteria', definition: 'principles or standards to judge by', category: 'noun' },
  { word: 'crucial', definition: 'of great importance', category: 'adjective' },
  { word: 'culture', definition: 'the ideas and customs of a society', category: 'noun' },
  { word: 'currency', definition: 'a system of money in general use', category: 'noun' },
  { word: 'cycle', definition: 'a series of events that repeat', category: 'noun' },
  // D-Z continue with essential academic vocabulary...
  { word: 'data', definition: 'facts and statistics collected', category: 'noun' },
  { word: 'debate', definition: 'a formal discussion', category: 'noun' },
  { word: 'decade', definition: 'a period of ten years', category: 'noun' },
  { word: 'decline', definition: 'to become smaller or fewer', category: 'verb' },
  { word: 'deduce', definition: 'to arrive at by reasoning', category: 'verb' },
  { word: 'define', definition: 'to state the meaning of', category: 'verb' },
  { word: 'definite', definition: 'clearly stated or decided', category: 'adjective' },
  { word: 'demonstrate', definition: 'to show clearly', category: 'verb' },
  { word: 'denote', definition: 'to be a sign of', category: 'verb' },
  { word: 'deny', definition: 'to state that something is not true', category: 'verb' },
  { word: 'depress', definition: 'to make someone feel sad', category: 'verb' },
  { word: 'derive', definition: 'to obtain from a source', category: 'verb' },
  { word: 'design', definition: 'to plan and make decisions about', category: 'verb' },
  { word: 'despite', definition: 'without being affected by', category: 'preposition' },
  { word: 'detect', definition: 'to discover or identify', category: 'verb' },
  { word: 'deviate', definition: 'to depart from an established course', category: 'verb' },
  { word: 'device', definition: 'a thing made for a particular purpose', category: 'noun' },
  { word: 'devote', definition: 'to give all of something to', category: 'verb' },
  { word: 'differentiate', definition: 'to recognize as different', category: 'verb' },
  { word: 'dimension', definition: 'a measurable extent', category: 'noun' },
  { word: 'diminish', definition: 'to make or become less', category: 'verb' },
  { word: 'discrete', definition: 'individually separate and distinct', category: 'adjective' },
  { word: 'discriminate', definition: 'to recognize a distinction', category: 'verb' },
  { word: 'displace', definition: 'to take the place of', category: 'verb' },
  { word: 'display', definition: 'to put something in a prominent place', category: 'verb' },
  { word: 'dispose', definition: 'to get rid of', category: 'verb' },
  { word: 'distinct', definition: 'recognizably different', category: 'adjective' },
  { word: 'distort', definition: 'to give a misleading account', category: 'verb' },
  { word: 'distribute', definition: 'to give shares of something', category: 'verb' },
  { word: 'diverse', definition: 'showing a great deal of variety', category: 'adjective' },
  { word: 'document', definition: 'a piece of written information', category: 'noun' },
  { word: 'domain', definition: 'an area of territory', category: 'noun' },
  { word: 'domestic', definition: 'relating to the home', category: 'adjective' },
  { word: 'dominate', definition: 'to have power over', category: 'verb' },
  { word: 'draft', definition: 'a preliminary version', category: 'noun' },
  { word: 'drama', definition: 'a play for theater or television', category: 'noun' },
  { word: 'duration', definition: 'the time during which something continues', category: 'noun' },
  { word: 'dynamic', definition: 'characterized by constant change', category: 'adjective' },
];

// Helper functions to get words by difficulty
export function getWordsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): string[] {
  switch (difficulty) {
    case 'easy': return BEGINNER_WORDS;
    case 'medium': return INTERMEDIATE_WORDS;
    case 'hard': return ADVANCED_WORDS;
  }
}

export function getRandomWords(
  count: number,
  difficulty?: 'easy' | 'medium' | 'hard',
  random: RandomSource = Math.random
): string[] {
  const pool = difficulty ? getWordsByDifficulty(difficulty) : [...BEGINNER_WORDS, ...INTERMEDIATE_WORDS, ...ADVANCED_WORDS];
  return shuffleItems(pool, random).slice(0, Math.max(0, count));
}

export function getRandomWordPairs(
  count: number,
  random: RandomSource = Math.random
): [string, string][] {
  return shuffleItems(WORD_PAIRS, random).slice(0, Math.max(0, count));
}
