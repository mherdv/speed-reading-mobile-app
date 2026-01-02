export type TextSample = {
  id: string;
  title: string;
  text: string;
  question: {
    prompt: string;
    choices: string[];
    correctIndex: number;
  };
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
  comprehensionCorrect: boolean;
  score?: number;
  accuracy?: number;
  details?: Record<string, any>;
};
