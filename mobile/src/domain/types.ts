export type TextSample = {
  id: string;
  version?: number;
  /** Groups different passages with similar length and reading demands. */
  comparisonBand: string;
  title: string;
  text: string;
  language?: string;
  genre?: string;
  complexityBand?: string;
  source?: string;
  license?: string;
  accessibilityNotes?: string;
  question: {
    prompt: string;
    choices: string[];
    correctIndex: number;
    type?: 'main-idea' | 'detail-evidence' | 'inference-purpose';
    rationale?: string;
    answerDependency?: 'passage-required';
  };
  questions?: readonly {
    id: string;
    prompt: string;
    choices: readonly string[];
    correctIndex: number;
    type: 'main-idea' | 'detail-evidence' | 'inference-purpose';
    rationale: string;
    answerDependency: 'passage-required';
  }[];
};

export type EvidenceHuntResultDetails = {
  schemaVersion: 1;
  contentVersion: number;
  activityType: 'evidence-hunt';
  difficulty: 'easy' | 'medium' | 'hard';
  rounds: number;
  answerCorrect: number;
  answerAccuracy: number;
  evidenceCorrect: number;
  evidenceRequired: number;
  evidenceAccuracy: number;
  medianLocateMs: number;
  locatedRounds: number;
  wrongSelections: number;
  timed: boolean;
  itemIds: string[];
  replayOfItemIds?: string[];
  adaptiveQualificationEligible?: boolean;
};

export type ContextBuilderResultDetails = {
  schemaVersion: 1;
  contentVersion: number;
  activityType: 'context-builder';
  difficulty: 'easy' | 'medium' | 'hard';
  rounds: number;
  attempts: number;
  omittedRounds: number;
  meaningCorrect: number;
  meaningAccuracy: number;
  clueCorrect: number;
  clueAccuracy: number;
  confidenceRatings: number;
  confidentCorrect: number;
  itemIds: string[];
  replayOfItemIds?: string[];
  adaptiveQualificationEligible?: boolean;
};

export type AttemptResultDetails = Record<string, unknown> & {
  schemaVersion?: number;
  activityType?: string;
};

export type AttemptResult = {
  id: string;
  sampleId: string;
  sampleTitle: string;
  startedAtIso: string;
  finishedAtIso: string;
  elapsedMs: number;
  wordCount: number;
  wpm: number;
  /** Present only when the attempt included a measured comprehension check. */
  comprehensionCorrect?: boolean;
  score?: number;
  accuracy?: number;
  details?: AttemptResultDetails;
};
