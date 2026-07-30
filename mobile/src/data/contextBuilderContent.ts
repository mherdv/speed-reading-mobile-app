import type { Difficulty } from './difficultyPreferences';

export type ContextSentence = {
  id: string;
  text: string;
};

export type ContextMeaningOption = {
  id: string;
  text: string;
};

export type ContextClueOption = {
  id: string;
  text: string;
  sentenceIds: readonly string[];
  role:
    | 'definition'
    | 'background'
    | 'target-use'
    | 'contrast'
    | 'consequence'
    | 'combined-context';
};

export type ContextBuilderRound = {
  id: string;
  version: 1;
  difficulty: Difficulty;
  title: string;
  language: 'en';
  genre: 'science' | 'history' | 'practical' | 'narrative' | 'argument';
  domain: string;
  source: 'Original editorial content';
  license: 'Original content for this application';
  targetWord: string;
  targetSentenceId: string;
  targetAccessibilityLabel: string;
  definition: string;
  partOfSpeech: 'adjective' | 'verb' | 'noun' | 'adverb';
  sentences: readonly ContextSentence[];
  meaningOptions: readonly ContextMeaningOption[];
  correctMeaningOptionId: string;
  clueOptions: readonly ContextClueOption[];
  acceptedClueIds: readonly string[];
  clueType: 'definition' | 'contrast-example' | 'multi-sentence';
  morphologyNotes: string;
  frequencyBand: 'common' | 'mid-frequency' | 'less-frequent';
  complexityBand: 'explicit' | 'relational' | 'integrated';
  rationale: string;
  accessibilityNotes: string;
};

type WordSpec = {
  word: string;
  definition: string;
  partOfSpeech?: ContextBuilderRound['partOfSpeech'];
  scenario: string;
  contrast: string;
  effect: string;
  morphology: string;
  domain: string;
  genre: ContextBuilderRound['genre'];
};

const EASY_WORDS: readonly WordSpec[] = [
  { word: 'meticulous', definition: 'very careful about small details', scenario: 'Mara checked every label and date before the archive opened', contrast: 'a hurried inspection', effect: 'the catalog contained almost no errors', morphology: 'No dependable everyday prefix; connect the whole word to careful detail work.', domain: 'archives', genre: 'history' },
  { word: 'dormant', definition: 'temporarily inactive but able to become active', scenario: 'The winter buds showed no visible growth', contrast: 'dead branches that could not recover', effect: 'new leaves appeared when spring warmed the trees', morphology: 'Related to dormancy, a period of inactivity.', domain: 'plant science', genre: 'science' },
  { word: 'translucent', definition: 'letting some light through without showing a clear image', scenario: 'The studio used a pale panel between the rooms', contrast: 'a transparent window with a sharp view', effect: 'daylight entered while faces remained indistinct', morphology: 'trans- suggests through; luc relates to light.', domain: 'design', genre: 'practical' },
  { word: 'resilient', definition: 'able to recover after difficulty or change', scenario: 'The garden bent under the storm and lost several leaves', contrast: 'plants that never recovered', effect: 'most stems stood upright again within a week', morphology: 'Related to resilience, the capacity to recover.', domain: 'ecology', genre: 'science' },
  { word: 'frugal', definition: 'careful about using money or resources', scenario: 'Niko repaired old shelves and borrowed tools for the shop', contrast: 'buying every item new without checking cost', effect: 'the renovation stayed within a small budget', morphology: 'The word is best learned as a whole; it often describes economical choices.', domain: 'small business', genre: 'practical' },
  { word: 'abundant', definition: 'present in a large amount', scenario: 'After the wet spring, flowers covered the entire hillside', contrast: 'the few blooms seen during the drought', effect: 'bees found food across the meadow', morphology: 'abund- relates to plenty or overflowing quantity.', domain: 'ecology', genre: 'science' },
  { word: 'reluctant', definition: 'unwilling or hesitant to act', scenario: 'Lea paused at the microphone and asked to speak later', contrast: 'a volunteer eager to begin immediately', effect: 'she needed encouragement before presenting', morphology: 'The suffix -ant often forms an adjective describing a state or tendency.', domain: 'community meeting', genre: 'narrative' },
  { word: 'vivid', definition: 'producing a strong and clear impression', scenario: 'The memoir described the orange dust, metal bells, and sharp smell of rain', contrast: 'a vague account with no sensory detail', effect: 'readers could easily picture the market', morphology: 'Learn as a whole word associated with lively clarity.', domain: 'memoir', genre: 'narrative' },
  { word: 'portable', definition: 'easy to carry or move', scenario: 'The clinic packed the scanner into one small case', contrast: 'the fixed machine bolted to the laboratory floor', effect: 'teams could examine patients in remote villages', morphology: 'port means carry; -able means capable of.', domain: 'health equipment', genre: 'science' },
  { word: 'gradual', definition: 'happening in small stages over time', scenario: 'The path rose a little higher after each bend', contrast: 'a sudden steep climb', effect: 'walkers reached the ridge without one sharp ascent', morphology: 'Related to grade or step; -al forms an adjective.', domain: 'trail design', genre: 'practical' },
  { word: 'scarce', definition: 'available only in a small or insufficient amount', scenario: 'Only two wells still held water at the end of summer', contrast: 'the plentiful supply after winter rain', effect: 'the village limited nonessential use', morphology: 'A whole-word form commonly paired with resources or supply.', domain: 'water management', genre: 'practical' },
  { word: 'courteous', definition: 'polite and considerate toward others', scenario: 'The driver waited for passengers to sit and answered questions calmly', contrast: 'an impatient and dismissive response', effect: 'new riders felt comfortable asking for help', morphology: 'The suffix -ous forms an adjective; courteous relates to courtesy.', domain: 'public transport', genre: 'narrative' },
  { word: 'precise', definition: 'exact and clearly stated', scenario: 'The recipe listed 240 grams of flour and a twelve-minute baking time', contrast: 'instructions that said to use some flour for a while', effect: 'each test batch produced nearly the same result', morphology: 'Precision is the related noun for exactness.', domain: 'food science', genre: 'practical' },
  { word: 'stable', definition: 'unlikely to change or fail suddenly', scenario: 'The platform stayed level while heavy equipment moved across it', contrast: 'a frame that shook under a light load', effect: 'the crew could work without repeated adjustments', morphology: 'Stability is the related noun for steadiness.', domain: 'construction safety', genre: 'practical' },
  { word: 'flexible', definition: 'able to adjust when needs or conditions change', scenario: 'The schedule allowed families to choose morning or evening appointments', contrast: 'one fixed time with no exceptions', effect: 'more residents could attend the clinic', morphology: 'flex relates to bending; -ible signals capability.', domain: 'community health', genre: 'practical' },
  { word: 'cautious', definition: 'careful to avoid unnecessary risk', scenario: 'The hikers checked the forecast and turned back before the storm arrived', contrast: 'continuing onto the ridge despite lightning', effect: 'the group reached shelter safely', morphology: 'Caution is the related noun; -ous forms an adjective.', domain: 'outdoor safety', genre: 'narrative' },
  { word: 'verify', definition: 'check that something is accurate or true', partOfSpeech: 'verb', scenario: 'The editor compared every quotation with the original recording', contrast: 'publishing the transcript without checking it', effect: 'several small errors were corrected before release', morphology: 'Verification is the related noun for checking accuracy.', domain: 'journalism', genre: 'practical' },
  { word: 'retain', definition: 'keep or continue to have something', partOfSpeech: 'verb', scenario: 'The insulated bottle still held most of its heat after two hours', contrast: 'a thin cup that cooled within minutes', effect: 'the drink remained warm throughout the trip', morphology: 're- can suggest back; retain means keep possession or keep a quality.', domain: 'materials', genre: 'science' },
  { word: 'adapt', definition: 'change in response to new conditions', partOfSpeech: 'verb', scenario: 'The library moved workshops outdoors while its main room was repaired', contrast: 'canceling every service until the building reopened', effect: 'classes continued with only minor changes', morphology: 'Adaptation is the related noun for adjustment.', domain: 'library services', genre: 'practical' },
  { word: 'contrast', definition: 'a noticeable difference between two things', partOfSpeech: 'noun', scenario: 'The report placed the cool forest beside the hotter paved district', contrast: 'two neighborhoods with nearly identical temperatures', effect: 'the temperature difference became easy to see', morphology: 'Contrast can be a noun for a difference or a verb meaning to compare differences.', domain: 'urban climate', genre: 'science' },
  { word: 'priority', definition: 'something considered more important than other tasks', partOfSpeech: 'noun', scenario: 'The repair team restored the hospital’s water line before repainting offices', contrast: 'treating every maintenance request as equally urgent', effect: 'essential patient services resumed first', morphology: 'Prior means earlier or more important; prioritize is the related verb.', domain: 'facility planning', genre: 'practical' },
  { word: 'evidence', definition: 'information that supports or challenges a claim', partOfSpeech: 'noun', scenario: 'Researchers compared photographs, measurements, and dated field notes', contrast: 'accepting a rumor with no records', effect: 'the explanation could be tested against several sources', morphology: 'Evident means clear or observable; evidence is the supporting information.', domain: 'field research', genre: 'science' },
  { word: 'routine', definition: 'a regular way of doing something', partOfSpeech: 'noun', scenario: 'Every evening, Sam backed up the files and checked the next day’s schedule', contrast: 'performing the tasks only when someone remembered', effect: 'important preparations were rarely missed', morphology: 'Routine can be a noun for a regular practice or an adjective for something usual.', domain: 'work habits', genre: 'narrative' },
  { word: 'steadily', definition: 'at a consistent rate without sudden changes', partOfSpeech: 'adverb', scenario: 'The reservoir rose by nearly the same small amount each day', contrast: 'a level that jumped up and down unpredictably', effect: 'planners could estimate when storage would be full', morphology: 'The adjective steady becomes the adverb steadily by changing y to i and adding -ly.', domain: 'water monitoring', genre: 'science' },
];

const MEDIUM_WORDS: readonly WordSpec[] = [
  { word: 'pragmatic', definition: 'focused on what works in practice', scenario: 'The committee chose a repair that could be completed before winter', contrast: 'an elegant proposal that required years of unavailable funding', effect: 'the bridge reopened safely within the season', morphology: 'pragma relates to action or practical affairs.', domain: 'public works', genre: 'argument' },
  { word: 'sporadic', definition: 'occurring irregularly and only from time to time', scenario: 'Rain fell on three isolated afternoons during the long dry month', contrast: 'steady daily showers', effect: 'the soil never remained wet for long', morphology: 'Learn as a whole word associated with scattered occurrence.', domain: 'weather', genre: 'science' },
  { word: 'obsolete', definition: 'no longer useful because something newer replaced it', scenario: 'The factory kept a punch-card reader after all orders moved online', contrast: 'the current scanner used by every department', effect: 'technicians could no longer obtain replacement parts', morphology: 'obsolescence is the noun for becoming outdated.', domain: 'technology history', genre: 'history' },
  { word: 'tentative', definition: 'not final or fully certain', scenario: 'Researchers announced an early explanation based on a small sample', contrast: 'a confirmed conclusion supported by repeated trials', effect: 'the team asked others to test the idea before accepting it', morphology: 'Related to tentatively; the suffix -ive forms an adjective.', domain: 'research', genre: 'science' },
  { word: 'impartial', definition: 'not favoring one side over another', scenario: 'The judge had no connection to either team and used the same criteria', contrast: 'a reviewer who coached one competitor', effect: 'both groups accepted the scoring process', morphology: 'im- means not; partial can mean favoring one part or side.', domain: 'competition rules', genre: 'argument' },
  { word: 'mitigate', definition: 'reduce the severity or harmful effect of something', partOfSpeech: 'verb', scenario: 'Shade cloth was added above the seedlings during the heat wave', contrast: 'leaving every plant exposed at midday', effect: 'leaf damage was reduced but not eliminated', morphology: 'Mitigation is the related noun for reducing harm.', domain: 'horticulture', genre: 'science' },
  { word: 'concise', definition: 'brief while still expressing what is necessary', scenario: 'The revised notice kept the deadline, address, and eligibility rule in four lines', contrast: 'a long notice repeating the same background', effect: 'residents found the required action quickly', morphology: 'A whole-word adjective often used for clear, economical language.', domain: 'public communication', genre: 'practical' },
  { word: 'versatile', definition: 'able to serve several different purposes', scenario: 'The folding cart carried books, became a display, and formed a small desk', contrast: 'a fixed shelf designed for one corner', effect: 'the mobile library adapted to several rooms', morphology: 'Versatility is the noun describing this flexibility.', domain: 'library design', genre: 'practical' },
  { word: 'ambiguous', definition: 'open to more than one reasonable interpretation', scenario: 'The sign said visitors could enter after guides arrived', contrast: 'a notice naming the exact opening time', effect: 'some people waited while others walked inside', morphology: 'ambi- suggests both; ambiguity is the related noun.', domain: 'wayfinding', genre: 'argument' },
  { word: 'diligent', definition: 'showing steady and careful effort', scenario: 'Omar logged every sample and checked missing values each evening', contrast: 'an assistant who skipped records when busy', effect: 'the final dataset was complete and traceable', morphology: 'Diligence is the noun for careful, persistent work.', domain: 'field research', genre: 'science' },
  { word: 'feasible', definition: 'possible and practical to carry out', scenario: 'The route used existing paths and fit the available maintenance budget', contrast: 'a tunnel requiring technology the town could not obtain', effect: 'construction could begin with current staff and funds', morphology: '-ible signals capability; feasibility is the related noun.', domain: 'transport planning', genre: 'practical' },
  { word: 'skeptical', definition: 'not easily convinced without sufficient evidence', scenario: 'Residents asked to see measurements before accepting the company’s promise', contrast: 'immediate agreement without questions', effect: 'the proposal received a second independent review', morphology: 'Skeptic and skepticism share the root.', domain: 'civic debate', genre: 'argument' },
  { word: 'coherent', definition: 'logically connected and easy to follow', scenario: 'The report linked each recommendation to a finding presented earlier', contrast: 'a collection of unrelated claims in no clear order', effect: 'reviewers could trace how the conclusion was reached', morphology: 'co- suggests together; coherence is the related noun.', domain: 'policy writing', genre: 'argument' },
  { word: 'plausible', definition: 'reasonable enough to be considered possible', scenario: 'The proposed cause matched the timing and the available measurements', contrast: 'an explanation that contradicted every recorded observation', effect: 'the team tested it while keeping alternatives open', morphology: '-ible signals capability; plausibility is the related noun.', domain: 'scientific explanation', genre: 'science' },
  { word: 'explicit', definition: 'stated directly and leaving little to infer', scenario: 'The notice named the closing date, exact time, and affected entrances', contrast: 'a vague warning that changes were coming soon', effect: 'visitors knew precisely when the rule began', morphology: 'Explicit contrasts with implicit, which is suggested rather than directly stated.', domain: 'public communication', genre: 'practical' },
  { word: 'provisional', definition: 'temporary and subject to later revision', scenario: 'The committee approved a route only until the winter traffic study was complete', contrast: 'a permanent plan that could not be reconsidered', effect: 'new evidence could still change the decision', morphology: 'Provisionally is the related adverb; the word often marks an interim arrangement.', domain: 'transport planning', genre: 'argument' },
  { word: 'allocate', definition: 'assign resources for a particular purpose', partOfSpeech: 'verb', scenario: 'The council reserved half the grant for roof repairs and half for accessibility', contrast: 'spending funds without deciding which needs they served', effect: 'each project had a clear budget', morphology: 'Allocation is the related noun for an assigned share.', domain: 'public budgeting', genre: 'practical' },
  { word: 'synthesize', definition: 'combine separate ideas or evidence into a new whole', partOfSpeech: 'verb', scenario: 'The reviewer joined findings from interviews, surveys, and observations', contrast: 'listing each source without connecting them', effect: 'one explanation accounted for the pattern across all three sources', morphology: 'syn- suggests together; synthesis is the related noun.', domain: 'research review', genre: 'science' },
  { word: 'infer', definition: 'reach a conclusion from evidence rather than a direct statement', partOfSpeech: 'verb', scenario: 'No note named the animal, but tracks and gnawed bark appeared beside the den', contrast: 'a label directly identifying the species', effect: 'the students concluded that beavers had visited', morphology: 'Inference is the conclusion; infer is the act of drawing it.', domain: 'ecology lesson', genre: 'science' },
  { word: 'constraint', definition: 'a limit that restricts available choices', partOfSpeech: 'noun', scenario: 'The bridge height prevented delivery trucks from using the shortest route', contrast: 'a road network with no size restrictions', effect: 'planners selected a longer path for large vehicles', morphology: 'constrain is the related verb meaning to limit.', domain: 'logistics', genre: 'practical' },
  { word: 'consensus', definition: 'general agreement among members of a group', partOfSpeech: 'noun', scenario: 'After comparing three designs, nearly every resident supported the shaded plaza', contrast: 'a meeting split evenly between incompatible plans', effect: 'the council advanced the broadly supported option', morphology: 'Consensus describes shared agreement, not necessarily perfect unanimity.', domain: 'community planning', genre: 'argument' },
  { word: 'inference', definition: 'a conclusion drawn from evidence and reasoning', partOfSpeech: 'noun', scenario: 'The empty nest and broken shell suggested that the chick had recently hatched', contrast: 'a camera recording the hatching directly', effect: 'the observers recorded a likely event while noting it was not witnessed', morphology: 'infer is the related verb; inference is the conclusion produced.', domain: 'wildlife observation', genre: 'science' },
  { word: 'subsequently', definition: 'after a particular event or time', partOfSpeech: 'adverb', scenario: 'The first test revealed a leak, and the pipe was replaced the following morning', contrast: 'a repair completed before any test occurred', effect: 'the later inspection found no further water loss', morphology: 'subsequent is the adjective; -ly forms the adverb subsequently.', domain: 'maintenance', genre: 'narrative' },
  { word: 'predominantly', definition: 'mainly or for the most part', partOfSpeech: 'adverb', scenario: 'Most commuters arrived by bus, though a smaller group walked or cycled', contrast: 'travel split equally among every available mode', effect: 'the station added service where the majority of trips occurred', morphology: 'Predominant means most common or influential; -ly forms the adverb.', domain: 'transport survey', genre: 'science' },
];

const HARD_WORDS: readonly WordSpec[] = [
  { word: 'equivocal', definition: 'uncertain or capable of supporting different conclusions', scenario: 'One survey favored the change while another showed no difference', contrast: 'several consistent studies pointing the same way', effect: 'the panel postponed a firm recommendation', morphology: 'equi- relates to equal; equivocation involves ambiguity.', domain: 'policy evidence', genre: 'argument' },
  { word: 'nascent', definition: 'newly forming and not yet fully developed', scenario: 'A small network of workshops had only recently begun sharing tools', contrast: 'a mature national system with stable funding', effect: 'its routines were promising but still changing', morphology: 'From a root meaning to be born or begin.', domain: 'community enterprise', genre: 'history' },
  { word: 'parsimonious', definition: 'using the simplest adequate explanation or fewest resources', scenario: 'The model explained the pattern with two measured factors', contrast: 'a theory adding many unsupported causes', effect: 'researchers preferred it until new evidence required more complexity', morphology: 'Parsimony is the related noun for economy or simplicity.', domain: 'scientific reasoning', genre: 'science' },
  { word: 'anomalous', definition: 'different from what the surrounding pattern predicts', scenario: 'One sensor reported winter heat while every nearby sensor recorded frost', contrast: 'readings matching the regional trend', effect: 'technicians inspected the device before revising the climate record', morphology: 'anomaly is the noun for an unexpected deviation.', domain: 'climate data', genre: 'science' },
  { word: 'salient', definition: 'most noticeable or important in the current context', scenario: 'The report contained many tables, but only one showed the safety threshold', contrast: 'background details unrelated to the decision', effect: 'reviewers centered their discussion on that table', morphology: 'A whole-word adjective often describing what stands out.', domain: 'risk review', genre: 'argument' },
  { word: 'tenuous', definition: 'weak, slight, or not strongly supported', scenario: 'The claimed link depended on one memory recorded decades later', contrast: 'a conclusion supported by several contemporary records', effect: 'historians treated the connection cautiously', morphology: 'Related to a root meaning thin.', domain: 'historical evidence', genre: 'history' },
  { word: 'ubiquitous', definition: 'present or encountered almost everywhere', scenario: 'Small charging ports appeared in homes, buses, cafés, and offices', contrast: 'a connector used only in one laboratory', effect: 'travelers began assuming one would always be nearby', morphology: 'ubiquity is the noun meaning widespread presence.', domain: 'technology', genre: 'history' },
  { word: 'intransigent', definition: 'unwilling to change a position or compromise', scenario: 'The negotiator rejected every revision before reading its details', contrast: 'participants who adjusted their demands', effect: 'talks stopped despite several workable proposals', morphology: 'in- can mean not; the word describes resistance to agreement.', domain: 'negotiation', genre: 'narrative' },
  { word: 'nuanced', definition: 'showing subtle distinctions rather than a simple either-or view', scenario: 'The review praised the policy’s reach while identifying unequal local effects', contrast: 'a verdict calling it entirely good or entirely bad', effect: 'readers could see both the benefit and the tradeoff', morphology: 'nuance is a fine distinction; -ed forms the adjective.', domain: 'policy review', genre: 'argument' },
  { word: 'ephemeral', definition: 'lasting for only a short time', scenario: 'The desert pool appeared after rain and vanished within days', contrast: 'a spring that flows throughout the year', effect: 'insects completed rapid life stages before the water disappeared', morphology: 'Related to ephemera, things that are short-lived.', domain: 'desert ecology', genre: 'science' },
  { word: 'corroborate', definition: 'confirm a claim with additional independent evidence', partOfSpeech: 'verb', scenario: 'A second diary described the same storm from another village', contrast: 'repeating the first author’s unsupported rumor', effect: 'the date became more credible to historians', morphology: 'corroboration is independent supporting evidence.', domain: 'historical method', genre: 'history' },
  { word: 'ameliorate', definition: 'make an undesirable condition better', partOfSpeech: 'verb', scenario: 'The new shade reduced afternoon heat on the platform', contrast: 'a claim that all summer discomfort disappeared', effect: 'waiting became more comfortable although hot days remained', morphology: 'amelioration is the noun for an improvement in conditions.', domain: 'public transport', genre: 'practical' },
  { word: 'contingent', definition: 'dependent on a condition that may or may not occur', scenario: 'The field survey would proceed only if river levels fell below the safety mark', contrast: 'a survey scheduled regardless of weather or water level', effect: 'the final date remained uncertain until the condition was met', morphology: 'A contingency is a possible condition or event that affects a plan.', domain: 'field safety', genre: 'practical' },
  { word: 'idiosyncratic', definition: 'distinctive to one person or system rather than generally shared', scenario: 'One archive filed letters by paper color instead of date or author', contrast: 'the standard cataloging method used by neighboring collections', effect: 'new researchers needed special instructions for that archive alone', morphology: 'idiosyncrasy is a distinctive personal or system-specific feature.', domain: 'archives', genre: 'history' },
  { word: 'pervasive', definition: 'spreading widely throughout an area or system', scenario: 'Fine dust appeared inside homes, schools, vehicles, and sealed storage rooms', contrast: 'a stain limited to one workshop corner', effect: 'cleanup required action across the entire district', morphology: 'pervade is the related verb meaning to spread throughout.', domain: 'environmental health', genre: 'science' },
  { word: 'orthogonal', definition: 'independent of or unrelated to the issue being considered', scenario: 'The debate concerned water quality, while the building’s paint color had no bearing on the evidence', contrast: 'pipe material that directly affected contamination', effect: 'reviewers excluded the unrelated design preference from the decision', morphology: 'In geometry orthogonal means at right angles; figuratively it can mean independent.', domain: 'risk review', genre: 'argument' },
  { word: 'disambiguate', definition: 'remove uncertainty between multiple possible meanings', partOfSpeech: 'verb', scenario: 'The editor added the station name after “bank” to show that the text meant a riverbank', contrast: 'leaving the word open to either a financial or geographic reading', effect: 'readers selected the intended meaning immediately', morphology: 'dis- signals removal; ambiguity is uncertainty between meanings.', domain: 'editing', genre: 'practical' },
  { word: 'extrapolate', definition: 'estimate beyond known data by extending an observed pattern', partOfSpeech: 'verb', scenario: 'Analysts used five years of measurements to project demand into the next decade', contrast: 'reporting only the years that had already been measured', effect: 'the forecast extended beyond the observed period', morphology: 'extra- suggests beyond; extrapolation is the related noun.', domain: 'forecasting', genre: 'science' },
  { word: 'substantiate', definition: 'support a claim with sufficient evidence', partOfSpeech: 'verb', scenario: 'The historian added dated receipts and independent letters to the account', contrast: 'repeating an allegation without records', effect: 'the claim became defensible rather than merely asserted', morphology: 'Substantiation is the act of providing supporting evidence.', domain: 'historical method', genre: 'history' },
  { word: 'reconcile', definition: 'bring apparently conflicting evidence into a consistent account', partOfSpeech: 'verb', scenario: 'Researchers corrected for different time zones before comparing the two logs', contrast: 'discarding one record simply because the timestamps differed', effect: 'both observations fit the same event sequence', morphology: 'Reconciliation is the related noun for resolving a conflict or difference.', domain: 'data analysis', genre: 'science' },
  { word: 'convergence', definition: 'movement toward a shared result or position', partOfSpeech: 'noun', scenario: 'Independent models produced increasingly similar temperature estimates after revision', contrast: 'predictions spreading farther apart with each update', effect: 'confidence grew as the results approached one another', morphology: 'converge is the verb meaning to come together.', domain: 'climate modeling', genre: 'science' },
  { word: 'dichotomy', definition: 'a division into two sharply opposed categories', partOfSpeech: 'noun', scenario: 'The debate treated every proposal as either total success or complete failure', contrast: 'an analysis allowing several mixed outcomes', effect: 'important middle positions disappeared from discussion', morphology: 'dicho- relates to two; the word often names an oversimplified two-part division.', domain: 'public debate', genre: 'argument' },
  { word: 'ostensibly', definition: 'apparently or according to what is claimed, though possibly not actually', partOfSpeech: 'adverb', scenario: 'The rule was presented as a safety measure, yet internal notes focused on reducing staffing costs', contrast: 'a purpose openly matching the documented reason', effect: 'reviewers questioned whether the stated aim was the real one', morphology: 'Ostensible is the adjective for something presented as true on the surface.', domain: 'policy analysis', genre: 'argument' },
  { word: 'inadvertently', definition: 'without intention or awareness', partOfSpeech: 'adverb', scenario: 'A spreadsheet sort separated several names from their original addresses', contrast: 'deliberately changing records to produce a chosen result', effect: 'the analyst introduced an error while trying to organize the file', morphology: 'in- means not; advertent relates to attention; -ly forms the adverb.', domain: 'data management', genre: 'narrative' },
];

const MEANING_DISTRACTORS: Readonly<
  Record<string, readonly [string, string, string]>
> = {
  meticulous: ['careless about small errors', 'attentive only to the broad outline', 'concerned mainly with appearance'],
  dormant: ['permanently dead', 'actively growing at full speed', 'protected from cold by an outer covering'],
  translucent: ['blocking all light', 'allowing a perfectly clear view', 'reflecting light like a mirror'],
  resilient: ['easily damaged by change', 'unable to bend under pressure', 'protected from every possible difficulty'],
  frugal: ['wasteful with money or supplies', 'unwilling to share anything', 'cheap in quality rather than careful in use'],
  abundant: ['present in an insufficient amount', 'spread evenly but thinly', 'recently discovered'],
  reluctant: ['eager to act immediately', 'physically unable to act', 'unaware that action is needed'],
  vivid: ['faint and difficult to imagine', 'strictly factual without sensory detail', 'physically bright but emotionally unclear'],
  portable: ['fixed permanently in one place', 'fragile during ordinary use', 'designed to be discarded after use'],
  gradual: ['happening all at once', 'repeating without changing', 'changing in an unpredictable direction'],
  scarce: ['available in plentiful supply', 'hidden despite being abundant', 'distributed equally to everyone'],
  courteous: ['rude and dismissive toward others', 'formally dressed for an occasion', 'strictly obedient to every rule'],
  precise: ['vague and open to interpretation', 'approximately correct but not exact', 'detailed mainly for decoration'],
  stable: ['changing quickly and unpredictably', 'balanced for only a brief moment', 'protected from every outside force'],
  flexible: ['unable to change when conditions shift', 'physically soft regardless of its purpose', 'loosely planned with no useful structure'],
  cautious: ['acting without considering possible risk', 'refusing every action regardless of safety', 'moving slowly because the goal is unclear'],
  verify: ['assume something is true without checking', 'summarize the main point briefly', 'change something to fit a preference'],
  retain: ['release or lose something that was held', 'replace something with a newer version', 'hide something for a short time'],
  adapt: ['remain unchanged when conditions shift', 'abandon an activity completely', 'predict a change before it happens'],
  contrast: ['a close similarity between two things', 'the order in which events happen', 'a cause that produces a later result'],
  priority: ['an optional task with little importance', 'equal treatment of every possible task', 'the task completed most recently'],
  evidence: ['a personal preference without support', 'a claim repeated without verification', 'the final decision produced by a review'],
  routine: ['a rare exception to normal practice', 'an improvised response used only once', 'a formal rule that is never repeated'],
  steadily: ['with sudden and irregular changes', 'very rapidly on a single occasion', 'at equal locations rather than at a consistent rate'],
  pragmatic: ['guided mainly by an ideal regardless of feasibility', 'concerned only with abstract theory', 'improvised without considering consequences'],
  sporadic: ['continuous without interruption', 'occurring at predictable intervals', 'brief but happening every day'],
  obsolete: ['fully current and widely supported', 'temporarily broken but repairable', 'uncommon while still useful'],
  tentative: ['certain and final', 'careless about supporting evidence', 'kept secret from other people'],
  impartial: ['favoring one side', 'unconcerned about whether a process is fair', 'unable to reach any decision'],
  mitigate: ['make a harmful effect worse', 'remove a problem completely', 'measure the size of a problem'],
  concise: ['long and repetitive', 'too incomplete to communicate the needed facts', 'unclear because its wording is vague'],
  versatile: ['suited to only one fixed purpose', 'easy to carry between places', 'able to resist physical damage'],
  ambiguous: ['having one precise interpretation', 'known to be factually false', 'unfamiliar to most readers'],
  diligent: ['careless when work becomes repetitive', 'successful through talent without steady effort', 'working quickly rather than carefully'],
  feasible: ['impossible with available resources', 'desirable even if it cannot be done', 'already completed and operating'],
  skeptical: ['already convinced by the claim', 'unaware that a claim was made', 'hostile regardless of the evidence'],
  coherent: ['internally contradictory from one part to another', 'detailed but arranged without a clear connection', 'persuasive mainly because of its confident tone'],
  plausible: ['proven beyond any remaining doubt', 'impossible despite the available evidence', 'popular even though unrelated to the evidence'],
  explicit: ['suggested indirectly rather than stated', 'intentionally hidden from the audience', 'broadly expressed through emotion alone'],
  provisional: ['permanent and no longer open to revision', 'rejected before it can be tested', 'informal in style but still final'],
  allocate: ['remove resources from every available use', 'measure the total amount without assigning it', 'share resources without identifying a purpose'],
  synthesize: ['list separate ideas without connecting them', 'discard every source that appears to conflict', 'copy one source as the complete explanation'],
  infer: ['repeat a conclusion stated directly in the text', 'guess without using any supporting evidence', 'memorize information without drawing a conclusion'],
  constraint: ['an advantage that expands available choices', 'a goal that a project is trying to reach', 'a result produced after a decision'],
  consensus: ['a rule that requires perfect unanimity', 'one person’s private opinion', 'an unresolved split between equal groups'],
  inference: ['an event observed directly as it happened', 'a guess made without supporting information', 'the original source from which evidence comes'],
  subsequently: ['before the event being discussed', 'at exactly the same time as another event', 'again and again at regular intervals'],
  predominantly: ['in equal amounts across all categories', 'rarely or in only a few cases', 'exclusively, with no exceptions at all'],
  equivocal: ['clear enough to support one firm conclusion', 'demonstrably false', 'unrelated to the decision being considered'],
  nascent: ['fully mature and stable', 'shrinking after a long period of success', 'established but deliberately hidden'],
  parsimonious: ['needlessly elaborate', 'wasteful with resources', 'too incomplete to explain the observed pattern'],
  anomalous: ['consistent with the expected pattern', 'known to have been deliberately falsified', 'unusual but still predicted by the model'],
  salient: ['minor in the current decision', 'recently added to the report', 'controversial but not relevant'],
  tenuous: ['strongly supported by several sources', 'directly observed rather than inferred', 'unfinished but likely to become stronger'],
  ubiquitous: ['rarely encountered', 'limited to one region', 'newly invented but not yet distributed'],
  intransigent: ['willing to revise a position', 'uncertain which position to hold', 'uninformed about the available proposals'],
  nuanced: ['reduced to a simple all-or-nothing judgment', 'neutral without offering distinctions', 'lengthy because it includes extra detail'],
  ephemeral: ['lasting permanently', 'returning at regular intervals', 'easily damaged while still long-lived'],
  corroborate: ['contradict a claim with new evidence', 'repeat a claim without independent support', 'make a claim less credible'],
  ameliorate: ['make an undesirable condition worse', 'remove every trace of a problem', 'describe a condition without changing it'],
  contingent: ['guaranteed regardless of outside conditions', 'already completed before a condition is checked', 'in conflict with every possible condition'],
  idiosyncratic: ['universally standard across different systems', 'random and lacking any recognizable pattern', 'newly created for everyone to use'],
  pervasive: ['limited to one isolated location', 'briefly present before disappearing', 'easy to notice but restricted in reach'],
  orthogonal: ['directly causing the issue under review', 'the exact opposite of another position', 'partially measured but still relevant'],
  disambiguate: ['make a statement open to more interpretations', 'translate a word into another language', 'shorten a statement without clarifying it'],
  extrapolate: ['summarize only the observations already collected', 'estimate a value inside the measured range', 'reject a pattern instead of extending it'],
  substantiate: ['weaken a claim by adding contrary evidence', 'repeat a claim without independent support', 'simplify a claim so it needs no evidence'],
  reconcile: ['choose one record and ignore the other', 'emphasize disagreement without resolving it', 'collect records without comparing their differences'],
  convergence: ['movement toward increasingly different results', 'random fluctuation without a shared direction', 'a fixed separation that does not change'],
  dichotomy: ['a continuum containing many intermediate positions', 'a sequence in which one event causes another', 'two copies of the same category'],
  ostensibly: ['certainly and exactly as it appears', 'secretly without any stated explanation', 'accidentally rather than according to a claim'],
  inadvertently: ['deliberately and with full awareness', 'reluctantly while understanding the consequence', 'indirectly but still as part of an intentional plan'],
};

/**
 * Easy targets use the vocabulary naturally and define it in the same
 * sentence. This keeps the direct-clue level grammatical for verbs, nouns,
 * and adverbs instead of forcing every word into an adjective frame.
 */
const EASY_TARGET_SENTENCES: Readonly<Record<string, string>> = {
  meticulous: 'Mara was meticulous—very careful about small details—while checking every label and date.',
  dormant: 'The winter buds were dormant—temporarily inactive but still able to grow again.',
  translucent: 'The panel was translucent, letting some light through without showing a clear image.',
  resilient: 'The garden was resilient, able to recover after the storm damaged its leaves.',
  frugal: 'Niko was frugal, using money and materials carefully during the renovation.',
  abundant: 'Flowers were abundant, present in a large amount across the hillside.',
  reluctant: 'Lea was reluctant, or hesitant and unwilling, to begin speaking.',
  vivid: 'The memoir was vivid, producing a strong and clear impression through sensory detail.',
  portable: 'The scanner was portable, which meant it was easy to carry between clinics.',
  gradual: 'The climb was gradual, happening in small stages rather than in one steep rise.',
  scarce: 'Water was scarce, available only in a small and insufficient amount.',
  courteous: 'The driver was courteous, treating passengers politely and considerately.',
  precise: 'The recipe was precise, giving exact and clearly stated measurements.',
  stable: 'The platform was stable, unlikely to shift or fail suddenly under the equipment.',
  flexible: 'The schedule was flexible, able to adjust when families’ needs changed.',
  cautious: 'The hikers were cautious, taking care to avoid unnecessary risk.',
  verify: 'The editor used the recording to verify each quotation—to check that it was accurate.',
  retain: 'The bottle could retain heat, meaning to keep it instead of losing it quickly.',
  adapt: 'The library had to adapt, or change its services in response to the repairs.',
  contrast: 'The report revealed a contrast, a noticeable difference between the two districts.',
  priority: 'Restoring the water line was the team’s priority, the task considered more important than the others.',
  evidence: 'The photographs, measurements, and field notes were evidence—information that could support or challenge the claim.',
  routine: 'Sam’s nightly backup became a routine, a regular way of doing the same important tasks.',
  steadily: 'The reservoir rose steadily, at a consistent rate without sudden changes.',
};

/**
 * Medium targets are genuine, definition-free uses. The neighboring contrast
 * and consequence provide two independently defensible routes to meaning.
 */
const MEDIUM_TARGET_SENTENCES: Readonly<Record<string, string>> = {
  pragmatic: 'The committee described its chosen repair as pragmatic.',
  sporadic: 'The report characterized the month’s rainfall as sporadic.',
  obsolete: 'Engineers marked the punch-card reader as obsolete.',
  tentative: 'The researchers treated their small-sample explanation as tentative.',
  impartial: 'Both teams described the judge as impartial.',
  mitigate: 'The team hoped the shade cloth would mitigate the problem.',
  concise: 'Editors approved the concise version of the notice.',
  versatile: 'The library selected the versatile cart.',
  ambiguous: 'Reviewers marked the instruction as ambiguous.',
  diligent: 'Omar remained diligent throughout the field study.',
  feasible: 'The planners judged the route feasible.',
  skeptical: 'Residents remained skeptical during the presentation.',
  coherent: 'Reviewers described the final report as coherent.',
  plausible: 'The team considered the explanation plausible.',
  explicit: 'The editor asked whether the notice was explicit enough.',
  provisional: 'The committee approved the route as provisional.',
  allocate: 'The council voted to allocate the grant that evening.',
  synthesize: 'The reviewer had one afternoon to synthesize the material.',
  infer: 'The students were asked to infer the answer.',
  constraint: 'The bridge height became the central constraint in the route discussion.',
  consensus: 'The chair recorded a consensus before closing the meeting.',
  inference: 'The observers labeled the conclusion an inference.',
  subsequently: 'The pipe was subsequently replaced.',
  predominantly: 'The survey described the station’s riders as predominantly local.',
};

const HARD_TARGET_SENTENCES: Readonly<Record<string, string>> = {
  equivocal: 'After reviewing both surveys, the panel classified the evidence as equivocal.',
  nascent: 'The workshop network was still nascent when the grant review began.',
  parsimonious: 'The reviewers selected the parsimonious model for the next analysis.',
  anomalous: 'Technicians marked the winter-heat reading as anomalous.',
  salient: 'During the decision meeting, the safety table became the most salient section.',
  tenuous: 'Historians classified the proposed connection as tenuous.',
  ubiquitous: 'Within a decade, the charging port had become ubiquitous.',
  intransigent: 'The lead negotiator remained intransigent through the final session.',
  nuanced: 'The committee described its final assessment as nuanced.',
  ephemeral: 'Ecologists classified the rain-fed pool as ephemeral.',
  corroborate: 'The historian asked whether the second diary could corroborate the reported date.',
  ameliorate: 'Planners hoped the new shade would ameliorate conditions on the platform.',
  contingent: 'The field survey remained contingent when the provisional date was announced.',
  idiosyncratic: 'Researchers recorded the archive’s filing system as idiosyncratic.',
  pervasive: 'The district review classified the dust problem as pervasive.',
  orthogonal: 'Reviewers judged the paint-color proposal orthogonal to the water-quality analysis.',
  disambiguate: 'The editor added a station name to disambiguate the disputed word.',
  extrapolate: 'Analysts were asked to extrapolate cautiously in the final forecast.',
  substantiate: 'The historian needed to substantiate the claim before publication.',
  reconcile: 'Researchers met to reconcile the two logs.',
  convergence: 'The final report noted a convergence in the revised estimates.',
  dichotomy: 'The moderator challenged the proposed dichotomy during the debate.',
  ostensibly: 'The rule was ostensibly introduced for safety.',
  inadvertently: 'The analyst inadvertently altered the address column during the sort.',
};

function placeMeaning(
  spec: WordSpec,
  answerIndex: number,
  id: string
): ContextMeaningOption[] {
  const values = [...(MEANING_DISTRACTORS[spec.word] ?? [])];
  values.splice(answerIndex, 0, spec.definition);
  return values.map((text, index) => ({ id: `${id}-m${index + 1}`, text }));
}

function clueOption(
  text: string,
  sentenceIds: readonly string[],
  role: ContextClueOption['role']
): Omit<ContextClueOption, 'id'> {
  return { text, sentenceIds, role };
}

function placeClue(
  answer: Omit<ContextClueOption, 'id'>,
  distractors: readonly Omit<ContextClueOption, 'id'>[],
  answerIndex: number,
  id: string
): { options: ContextClueOption[]; correctId: string } {
  const values = [...distractors];
  values.splice(answerIndex, 0, answer);
  const options = values.map((option, index) => ({
    id: `${id}-c${index + 1}`,
    ...option,
  }));
  return { options, correctId: options[answerIndex]!.id };
}

function requireTargetSentence(
  sentences: Readonly<Record<string, string>>,
  spec: WordSpec,
  difficulty: Difficulty
): string {
  const sentence = sentences[spec.word];
  if (!sentence) {
    throw new Error(
      `Missing ${difficulty} target-use sentence for “${spec.word}”`
    );
  }
  return sentence;
}

function buildContextSentenceFrame(
  spec: WordSpec,
  difficulty: Difficulty,
  index: number
): readonly [string, string, string, string] {
  const family = index % 4;

  if (difficulty === 'easy') {
    const situations = [
      `One example is as follows: ${spec.scenario}.`,
      `Consider this situation: ${spec.scenario}.`,
      `A practical example follows: ${spec.scenario}.`,
      `One report notes the following: ${spec.scenario}.`,
    ] as const;
    const contrasts = [
      `This differs from ${spec.contrast}.`,
      `The contrasting case is ${spec.contrast}.`,
      `The opposite kind of case involves ${spec.contrast}.`,
      `This should not be confused with ${spec.contrast}.`,
    ] as const;
    const effects = [
      `As a result, ${spec.effect}.`,
      `The outcome was that ${spec.effect}.`,
      `This mattered because ${spec.effect}.`,
      `The later result made the meaning clear: ${spec.effect}.`,
    ] as const;
    return [
      situations[family]!,
      requireTargetSentence(EASY_TARGET_SENTENCES, spec, difficulty),
      contrasts[family]!,
      effects[family]!,
    ];
  }

  if (difficulty === 'medium') {
    const situations = [
      `The first case is as follows: ${spec.scenario}.`,
      `The account begins with this situation: ${spec.scenario}.`,
      `A field note records the following: ${spec.scenario}.`,
      `One example in the report is this: ${spec.scenario}.`,
    ] as const;
    const contrasts = [
      `Unlike ${spec.contrast}, the chosen response fit the situation described.`,
      `The account contrasts it with ${spec.contrast}.`,
      `A different result would be expected from ${spec.contrast}.`,
      `The comparison case—${spec.contrast}—points toward another meaning.`,
    ] as const;
    const effects = [
      `The consequence was clear: ${spec.effect}.`,
      `What followed was equally informative: ${spec.effect}.`,
      `The later outcome helped narrow the meaning because ${spec.effect}.`,
      `The effect supplied the final clue: ${spec.effect}.`,
    ] as const;
    return [
      situations[family]!,
      requireTargetSentence(MEDIUM_TARGET_SENTENCES, spec, difficulty),
      contrasts[family]!,
      effects[family]!,
    ];
  }

  const contrasts = [
    `A contrasting case involved ${spec.contrast}, and it produced a very different pattern.`,
    `For comparison, the account considers ${spec.contrast}.`,
    `The report first presents an opposing case: ${spec.contrast}.`,
    `Against the main example, the author sets ${spec.contrast}.`,
  ] as const;
  const consequences = [
    `The later result—${spec.effect}—narrows which sense of the word can fit.`,
    `The effect rules out the most obvious alternative meaning: ${spec.effect}.`,
    `A later observation adds a second clue: ${spec.effect}.`,
    `The outcome supplies another constraint on meaning: ${spec.effect}.`,
  ] as const;
  const integrations = [
    `The interpretation depends on combining the contrast with the consequence, not on the target word’s sound alone.`,
    `Neither clue is decisive alone; together they identify the intended sense.`,
    `The meaning becomes defensible only when both pieces of context are kept in view.`,
    `Reading the comparison and outcome together removes the remaining ambiguity.`,
  ] as const;
  return [
    contrasts[family]!,
    requireTargetSentence(HARD_TARGET_SENTENCES, spec, difficulty),
    consequences[family]!,
    integrations[family]!,
  ];
}

function buildRound(
  spec: WordSpec,
  difficulty: Difficulty,
  index: number
): ContextBuilderRound {
  const id = `context-${difficulty}-${spec.word}`;
  const sentenceTexts = buildContextSentenceFrame(spec, difficulty, index);
  const sentences = sentenceTexts.map((text, sentenceIndex) => ({
    id: `${id}-s${sentenceIndex + 1}`,
    text,
  }));
  const answerIndex = index % 4;
  const meaningOptions = placeMeaning(spec, answerIndex, id);
  const correctMeaningOptionId =
    meaningOptions[answerIndex]?.id ?? `${id}-m1`;
  const clueAnswerIndex = (index + 1) % 4;
  const correctClue =
    difficulty === 'easy'
      ? clueOption(
          `Sentence 2 directly defines the word: “${sentences[1]!.text}”`,
          [sentences[1]!.id],
          'definition'
        )
      : difficulty === 'medium'
        ? index % 2 === 0
          ? clueOption(
              `Sentence 3 supplies the contrast: “${sentences[2]!.text}”`,
              [sentences[2]!.id],
              'contrast'
            )
          : clueOption(
              `Sentence 4 supplies the consequence: “${sentences[3]!.text}”`,
              [sentences[3]!.id],
              'consequence'
            )
        : clueOption(
            index % 2 === 0
              ? `Sentence 1’s contrast must be combined with sentence 3’s consequence.`
              : `Sentence 3’s consequence makes sense only when read against the contrast in sentence 1.`,
            [sentences[0]!.id, sentences[2]!.id],
            'combined-context'
          );
  const clueDistractors =
    difficulty === 'easy'
      ? [
          clueOption(`Sentence 1 gives the situation: “${sentences[0]!.text}”`, [sentences[0]!.id], 'background'),
          clueOption(`Sentence 3 gives an opposite case: “${sentences[2]!.text}”`, [sentences[2]!.id], 'contrast'),
          clueOption(`Sentence 4 gives a later effect: “${sentences[3]!.text}”`, [sentences[3]!.id], 'consequence'),
        ]
      : difficulty === 'medium'
        ? [
            clueOption(`Sentence 1 gives the situation but not the relation: “${sentences[0]!.text}”`, [sentences[0]!.id], 'background'),
            clueOption(`Sentence 2 marks where the word is used: “${sentences[1]!.text}”`, [sentences[1]!.id], 'target-use'),
            clueOption(
              index % 2 === 0
                ? `Sentence 4 gives a consequence without the comparison: “${sentences[3]!.text}”`
                : `Sentence 3 gives a comparison without the consequence: “${sentences[2]!.text}”`,
              [index % 2 === 0 ? sentences[3]!.id : sentences[2]!.id],
              index % 2 === 0 ? 'consequence' : 'contrast'
            ),
          ]
        : [
            clueOption(`Sentence 1 alone gives only the contrasting case: “${sentences[0]!.text}”`, [sentences[0]!.id], 'contrast'),
            clueOption(`Sentence 2 shows the target in use but does not supply both inputs: “${sentences[1]!.text}”`, [sentences[1]!.id], 'target-use'),
            clueOption(`Sentence 3 alone gives only the later consequence: “${sentences[2]!.text}”`, [sentences[2]!.id], 'consequence'),
          ];
  const { options: clueOptions, correctId: correctClueId } = placeClue(
    correctClue,
    clueDistractors,
    clueAnswerIndex,
    id
  );
  const acceptedClueIds =
    difficulty === 'medium'
      ? clueOptions
          .filter(
            (option) =>
              option.role === 'contrast' || option.role === 'consequence'
          )
          .map((option) => option.id)
      : [correctClueId];

  return {
    id,
    version: 1,
    difficulty,
    title: `Build “${spec.word}” from context`,
    language: 'en',
    genre: spec.genre,
    domain: spec.domain,
    source: 'Original editorial content',
    license: 'Original content for this application',
    targetWord: spec.word,
    targetSentenceId: `${id}-s2`,
    targetAccessibilityLabel: `${spec.word}, target vocabulary word`,
    definition: spec.definition,
    partOfSpeech: spec.partOfSpeech ?? 'adjective',
    sentences,
    meaningOptions,
    correctMeaningOptionId,
    clueOptions,
    acceptedClueIds,
    clueType:
      difficulty === 'easy'
        ? 'definition'
        : difficulty === 'medium'
          ? 'contrast-example'
          : 'multi-sentence',
    morphologyNotes: spec.morphology,
    frequencyBand:
      difficulty === 'easy'
        ? 'common'
        : difficulty === 'medium'
          ? 'mid-frequency'
          : 'less-frequent',
    complexityBand:
      difficulty === 'easy'
        ? 'explicit'
        : difficulty === 'medium'
          ? 'relational'
          : 'integrated',
    rationale:
      difficulty === 'easy'
        ? 'The paragraph gives a direct definition after the target.'
        : difficulty === 'medium'
          ? 'Either the contrast or the consequence independently supports the keyed meaning.'
          : 'The word’s meaning follows only when the contrasting case and later consequence are integrated.',
    accessibilityNotes:
      'The target is announced as a target word in text; all meaning and clue choices are full-size buttons.',
  };
}

export const CONTEXT_BUILDER_ROUNDS: readonly ContextBuilderRound[] = [
  ...EASY_WORDS.map((spec, index) => buildRound(spec, 'easy', index)),
  ...MEDIUM_WORDS.map((spec, index) => buildRound(spec, 'medium', index)),
  ...HARD_WORDS.map((spec, index) => buildRound(spec, 'hard', index)),
];

export const CONTEXT_BUILDER_ROUNDS_PER_DIFFICULTY = 24;

export function getContextBuilderRounds(difficulty: Difficulty): ContextBuilderRound[] {
  return CONTEXT_BUILDER_ROUNDS.filter((round) => round.difficulty === difficulty);
}

export function validateContextBuilderContent(
  rounds: readonly ContextBuilderRound[] = CONTEXT_BUILDER_ROUNDS
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const round of rounds) {
    if (ids.has(round.id)) errors.push(`Duplicate round id: ${round.id}`);
    ids.add(round.id);
    const sentenceIds = new Set(round.sentences.map((sentence) => sentence.id));
    const targetSentence = round.sentences.find(
      (sentence) => sentence.id === round.targetSentenceId
    );
    if (!targetSentence) {
      errors.push(`${round.id}: target sentence is missing`);
    } else if (
      !targetSentence.text
        .toLocaleLowerCase()
        .includes(round.targetWord.toLocaleLowerCase())
    ) {
      errors.push(`${round.id}: target sentence must contain the target word`);
    }
    if (round.meaningOptions.length !== 4) {
      errors.push(`${round.id}: exactly four meaning options required`);
    }
    if (
      new Set(round.meaningOptions.map((option) => option.id)).size !==
        round.meaningOptions.length ||
      new Set(
        round.meaningOptions.map((option) => option.text.toLocaleLowerCase())
      ).size !== round.meaningOptions.length
    ) {
      errors.push(`${round.id}: meaning option IDs and text must be unique`);
    }
    if (!round.meaningOptions.some((option) => option.id === round.correctMeaningOptionId)) {
      errors.push(`${round.id}: correct meaning is missing`);
    }
    const clueIds = new Set(round.clueOptions.map((option) => option.id));
    if (
      clueIds.size !== round.clueOptions.length ||
      new Set(
        round.clueOptions.map((option) => option.text.toLocaleLowerCase())
      ).size !== round.clueOptions.length
    ) {
      errors.push(`${round.id}: clue option IDs and text must be unique`);
    }
    if (
      round.clueOptions.some(
        (option) =>
          option.sentenceIds.length === 0 ||
          option.sentenceIds.some((sentenceId) => !sentenceIds.has(sentenceId))
      )
    ) {
      errors.push(`${round.id}: every clue must reference a passage sentence`);
    }
    if (
      round.acceptedClueIds.length === 0 ||
      round.acceptedClueIds.some((id) => !clueIds.has(id))
    ) {
      errors.push(`${round.id}: accepted clue key is invalid`);
    }
    const acceptedClues = round.clueOptions.filter((option) =>
      round.acceptedClueIds.includes(option.id)
    );
    const expectedAcceptedClueCount =
      round.difficulty === 'medium' ? 2 : 1;
    if (
      round.acceptedClueIds.length !== expectedAcceptedClueCount ||
      acceptedClues.length !== expectedAcceptedClueCount
    ) {
      errors.push(
        `${round.id}: expected ${expectedAcceptedClueCount} defensible clue key(s)`
      );
    }
    const acceptedRoles = new Set(
      acceptedClues.map((option) => option.role)
    );
    if (
      (round.difficulty === 'easy' &&
        (acceptedClues.some((option) => option.role !== 'definition') ||
          acceptedRoles.size !== 1)) ||
      (round.difficulty === 'medium' &&
        (acceptedRoles.size !== 2 ||
          !acceptedRoles.has('contrast') ||
          !acceptedRoles.has('consequence'))) ||
      (round.difficulty === 'hard' &&
        acceptedClues.some(
          (option) =>
            option.role !== 'combined-context' ||
            option.sentenceIds.length < 2
        ))
    ) {
      errors.push(`${round.id}: accepted clue role does not match difficulty`);
    }
    if (!round.morphologyNotes.trim()) errors.push(`${round.id}: morphology notes are required`);
    if (!round.rationale.trim()) errors.push(`${round.id}: rationale is required`);
    if (!round.targetAccessibilityLabel.includes('target')) {
      errors.push(`${round.id}: target needs a non-color accessibility label`);
    }
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const levelRounds = rounds.filter((round) => round.difficulty === difficulty);
    if (levelRounds.length !== CONTEXT_BUILDER_ROUNDS_PER_DIFFICULTY) {
      errors.push(
        `${difficulty}: exactly ${CONTEXT_BUILDER_ROUNDS_PER_DIFFICULTY} reviewed rounds required`
      );
    }
    const positions = [0, 0, 0, 0];
    levelRounds.forEach((round) => {
      const index = round.meaningOptions.findIndex(
        (option) => option.id === round.correctMeaningOptionId
      );
      if (index >= 0) positions[index] += 1;
    });
    if (positions.some((count) => count === 0)) {
      errors.push(`${difficulty}: correct meanings must rotate across positions`);
    }
    const openingFamilies = new Set(
      levelRounds.map((round) =>
        round.sentences[0]!.text.split(/\s+/u).slice(0, 2).join(' ')
      )
    );
    if (openingFamilies.size < 4) {
      errors.push(`${difficulty}: at least four sentence-frame families required`);
    }
    const cluePositions = [0, 0, 0, 0];
    levelRounds.forEach((round) => {
      round.clueOptions.forEach((option, index) => {
        if (round.acceptedClueIds.includes(option.id)) {
          cluePositions[index] += 1;
        }
      });
    });
    if (cluePositions.some((count) => count === 0)) {
      errors.push(`${difficulty}: accepted clues must rotate across positions`);
    }
  }

  return errors;
}
