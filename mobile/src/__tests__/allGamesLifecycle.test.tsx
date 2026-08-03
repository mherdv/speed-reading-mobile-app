import React, { type ReactElement } from 'react';
import {
  act,
  fireEvent,
  render,
  type RenderAPI,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article } from '../data/articles';
import type { MainIdeaPassage } from '../data/mainIdeaPassages';
import type { StructureScanRound } from '../data/structureScanPassages';
import { getEvidenceHuntRounds } from '../data/evidenceHuntContent';
import { getContextBuilderRounds } from '../data/contextBuilderContent';
import type { TextSample } from '../domain/types';
import ComprehensionTest from '../games/ComprehensionTest/ComprehensionTest';
import EvenNumbers from '../games/EvenNumbers/EvenNumbers';
import EyeMovementTraining from '../games/EyeMovementTraining/EyeMovementTraining';
import FlashReading from '../games/FlashReading/FlashReading';
import WordsRecall from '../games/WordsRecall/WordsRecall';
import SentenceRecall from '../games/SentenceRecall/SentenceRecall';
import WpmTest from '../games/WpmTest/WpmTest';
import LetterJumble from '../games/LetterJumble/LetterJumble';
import LetterRecognition from '../games/LetterRecognition/LetterRecognition';
import MainIdeaSprint from '../games/MainIdeaSprint/MainIdeaSprint';
import MemoryRecall from '../games/MemoryRecall/MemoryRecall';
import NumberRecognition from '../games/NumberRecognition/NumberRecognition';
import NumberSearch from '../games/NumberSearch/NumberSearch';
import PatternScanning from '../games/PatternScanning/PatternScanning';
import PowerReader from '../games/PowerReader/PowerReader';
import CenterLineReader from '../games/CenterLineReader/CenterLineReader';
import RepeatedReading from '../games/RepeatedReading/RepeatedReading';
import SchulteLetters from '../games/SchulteLetters/SchulteLetters';
import SchulteMix from '../games/SchulteMix/SchulteMix';
import SchulteNumbers from '../games/SchulteNumbers/SchulteNumbers';
import ReadingSaccades from '../games/ReadingSaccades/ReadingSaccades';
import StructureScan from '../games/StructureScan/StructureScan';
import EvidenceHunt from '../games/EvidenceHunt/EvidenceHunt';
import ContextBuilder from '../games/ContextBuilder/ContextBuilder';
import SymbolRecognition from '../games/SymbolRecognition/SymbolRecognition';
import TextSearch from '../games/TextSearch/TextSearch';
import TimedPhraseRecognition from '../games/TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from '../games/TimedWordRecognition/TimedWordRecognition';
import LastWordRecall from '../games/LastWordRecall/LastWordRecall';
import VisualSpanExpansion from '../games/VisualSpanExpansion/VisualSpanExpansion';
import WordMismatchGrid from '../games/WordMismatchGrid/WordMismatchGrid';
import WordPairs from '../games/WordPairs/WordPairs';
import WordSearchGame from '../games/WordSearchGame/WordSearchGame';
import { getRecallFeedbackDurationMs } from '../games/recallFeedback';
import {
  createVisualSpanTrial,
  VISUAL_SPAN_FIXATION_CUE_MS,
} from '../games/VisualSpanExpansion/visualSpanContent';

type Report = jest.Mock<void, [Record<string, unknown>]>;

type LifecycleAdapter = {
  id: string;
  element: (report: Report) => ReactElement;
  complete: (view: RenderAPI) => void | Promise<void>;
  activeTestId: string;
  replayTestId?: string;
  endTestId: 'end' | 'end-screen';
};

const READING_SAMPLE: TextSample = {
  id: 'lifecycle-reading',
  comparisonBand: 'lifecycle-brief-v1',
  title: 'Lifecycle passage',
  text: 'One two three four five six.',
  question: {
    prompt: 'Which word came last?',
    choices: ['four', 'five', 'six'],
    correctIndex: 2,
  },
};

const MAIN_IDEA_PASSAGE: MainIdeaPassage = {
  id: 'lifecycle-main-idea',
  title: 'Useful pauses',
  text: 'A short pause can restore attention before concentration fades.',
  choices: [
    'A timely pause can support attention.',
    'Every task should stop permanently.',
  ],
  correctIndex: 0,
  feedback: 'The passage links a timely pause with restored attention.',
};

const STRUCTURE_ROUND: StructureScanRound = {
  id: 'lifecycle-structure',
  title: 'Application guide',
  goal: 'Find the application deadline.',
  sections: [
    { heading: 'Applications', body: 'Send the form by Friday.' },
    { heading: 'Overview', body: 'The program supports local projects.' },
    { heading: 'Results', body: 'Applicants hear back in June.' },
  ],
  correctHeading: 'Applications',
  evidence: 'The Applications section contains the deadline.',
};

const GUIDED_READING_ARTICLE: Article = {
  id: 'lifecycle-guided-reading',
  version: 1,
  title: 'Guided reading lifecycle',
  language: 'en',
  category: 'psychology',
  difficulty: 'easy',
  wordCount: 4,
  text: 'One two three four.',
  source: 'Original editorial content',
  license: 'Original content for this application',
  comprehensionQuestions: [
    {
      question: 'Which word came first?',
      options: ['One', 'Four'],
      correctIndex: 0,
    },
  ],
};

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

const LIFECYCLE_ADAPTERS: LifecycleAdapter[] = [
  {
    id: 'RepeatedReading',
    element: (report) => (
      <RepeatedReading sample={READING_SAMPLE} onReportResult={report} />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('finish-round'));
      fireEvent.press(view.getByTestId('start-next-round'));
      fireEvent.press(view.getByTestId('finish-round'));
      fireEvent.press(view.getByTestId('repeated-choice-2'));
      fireEvent.press(view.getByTestId('submit-repeated-answer'));
    },
    activeTestId: 'repeated-passage',
    endTestId: 'end',
  },
  {
    id: 'WpmTest',
    element: (report) => (
      <WpmTest sample={READING_SAMPLE} difficulty="easy" onReportResult={report} />
    ),
    complete: (view) => {
      advance(4_000);
      fireEvent.press(view.getByTestId('finish-wpm-reading'));
      fireEvent.press(view.getByTestId('wpm-question-0-option-2'));
      fireEvent.press(view.getByTestId('submit-wpm-questions'));
    },
    activeTestId: 'wpm-reading',
    endTestId: 'end',
  },
  {
    id: 'MainIdeaSprint',
    element: (report) => (
      <MainIdeaSprint
        passages={[MAIN_IDEA_PASSAGE]}
        roundCount={1}
        retrievalBufferMs={0}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('hide-passage'));
      fireEvent.press(view.getByTestId('show-main-idea-choices'));
      fireEvent.press(view.getByTestId('main-idea-choice-0'));
      fireEvent.press(view.getByTestId('check-main-idea'));
      fireEvent.press(view.getByTestId('continue-main-idea'));
    },
    activeTestId: 'main-idea-passage',
    endTestId: 'end',
  },
  {
    id: 'StructureScan',
    element: (report) => (
      <StructureScan
        rounds={[STRUCTURE_ROUND]}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('show-structure-choices'));
      fireEvent.press(view.getByTestId('structure-choice-0'));
      fireEvent.press(view.getByTestId('continue-structure-scan'));
    },
    activeTestId: 'structure-scan-article',
    endTestId: 'end',
  },
  {
    id: 'PowerReader',
    element: (report) => (
      <PowerReader
        text="One two"
        chunkSize={2}
        intervalMs={100}
        onReportResult={report}
      />
    ),
    complete: () => advance(250),
    activeTestId: 'chunk-display',
    endTestId: 'end-screen',
  },
  {
    id: 'CenterLineReader',
    element: (report) => (
      <CenterLineReader
        article={GUIDED_READING_ARTICLE}
        intervalMs={1_000}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('finish-focus-early'));
    },
    activeTestId: 'focus-lane-active',
    endTestId: 'end',
  },
  {
    id: 'EvidenceHunt',
    element: (report) => (
      <EvidenceHunt
        rounds={getEvidenceHuntRounds('easy').slice(0, 2)}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      const round = getEvidenceHuntRounds('easy')[0]!;
      fireEvent.press(
        view.getByTestId(
          `evidence-sentence-${round.evidenceSentenceIds[0]}`
        )
      );
      fireEvent.press(view.getByTestId('evidence-option-0'));
      fireEvent.press(view.getByTestId('submit-evidence-round'));
      fireEvent.press(view.getByTestId('continue-evidence'));
    },
    activeTestId: 'evidence-active',
    endTestId: 'end',
  },
  {
    id: 'ContextBuilder',
    element: (report) => (
      <ContextBuilder
        rounds={getContextBuilderRounds('easy').slice(0, 2)}
        roundCount={1}
        random={() => 0.999}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('context-meaning-0'));
      fireEvent.press(view.getByTestId('context-clue-0'));
      fireEvent.press(view.getByTestId('submit-context-round'));
      fireEvent.press(view.getByTestId('continue-context'));
    },
    activeTestId: 'context-active',
    endTestId: 'end',
  },
  {
    id: 'LetterRecognition',
    element: (report) => (
      <LetterRecognition durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'cell-0',
    endTestId: 'end',
  },
  {
    id: 'TextSearch',
    element: (report) => (
      <TextSearch
        paragraph="fish fish"
        targetWord="fish"
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('word-0'));
      fireEvent.press(view.getByTestId('word-1'));
    },
    activeTestId: 'paragraph-display',
    endTestId: 'end-screen',
  },
  {
    id: 'EyeMovementTraining',
    element: (report) => (
      <EyeMovementTraining
        blinkGoal={1}
        breakSeconds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('record-blink'));
      fireEvent.press(view.getByTestId('begin-look-away'));
      advance(1_000);
      fireEvent.press(view.getByTestId('comfort-comfortable'));
    },
    activeTestId: 'blink-stage',
    endTestId: 'end-screen',
  },
  {
    id: 'ReadingSaccades',
    element: (report) => (
      <ReadingSaccades
        article={GUIDED_READING_ARTICLE}
        tickMs={1_000}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('finish-early'));
      fireEvent.press(view.getByTestId('question-option-0'));
      fireEvent.press(view.getByTestId('continue-saccades-feedback'));
    },
    activeTestId: 'saccades-active',
    endTestId: 'end',
  },
  {
    id: 'VisualSpanExpansion',
    element: (report) => (
      <VisualSpanExpansion
        itemCount={3}
        displayMs={10}
        totalRounds={1}
        random={() => 0.25}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      const trial = createVisualSpanTrial('easy', 3, () => 0.25);
      const correctIndex = trial.options.indexOf(trial.correctWord);
      advance(VISUAL_SPAN_FIXATION_CUE_MS + 20);
      fireEvent.press(view.getByTestId(`span-option-${correctIndex}`));
      advance(getRecallFeedbackDurationMs(trial.correctWord, true));
    },
    activeTestId: 'span-fixation-cue',
    replayTestId: 'span-fixation-cue',
    endTestId: 'end',
  },
  {
    id: 'FlashReading',
    element: (report) => (
      <FlashReading
        words={['focus']}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(20);
      fireEvent.changeText(view.getByTestId('recall-input'), 'wrong');
      fireEvent.press(view.getByTestId('submit-btn'));
      advance(getRecallFeedbackDurationMs('focus', false) + 10);
    },
    activeTestId: 'flash-word',
    replayTestId: 'recall-input',
    endTestId: 'end',
  },
  {
    id: 'WordsRecall',
    element: (report) => (
      <WordsRecall
        prompts={['quiet focus']}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(20);
      fireEvent.changeText(view.getByTestId('recall-input'), 'quiet focus');
      fireEvent.press(view.getByTestId('submit-recall'));
      advance(600);
    },
    activeTestId: 'recall-display',
    replayTestId: 'recall-entry',
    endTestId: 'end',
  },
  {
    id: 'SentenceRecall',
    element: (report) => (
      <SentenceRecall
        prompts={['Readers remember useful ideas.']}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(20);
      fireEvent.changeText(
        view.getByTestId('recall-input'),
        'Readers remember useful ideas.'
      );
      fireEvent.press(view.getByTestId('submit-recall'));
      advance(600);
    },
    activeTestId: 'recall-display',
    replayTestId: 'recall-entry',
    endTestId: 'end',
  },
  {
    id: 'ComprehensionTest',
    element: (report) => (
      <ComprehensionTest
        passage="A short lifecycle passage."
        questions={[
          { question: 'What kind of passage?', options: ['Short'], correctIndex: 0 },
        ]}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      fireEvent.press(view.getByTestId('done-reading'));
      fireEvent.press(view.getByTestId('option-0'));
      advance(1_000);
    },
    activeTestId: 'passage',
    endTestId: 'end',
  },
  {
    id: 'MemoryRecall',
    element: (report) => (
      <MemoryRecall
        startingLength={1}
        displayMs={10}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      for (let failure = 0; failure < 3; failure += 1) {
        const shown = Number(
          String(view.getByTestId('sequence').props.children)
        );
        advance(20);
        fireEvent.press(view.getByTestId(`digit-${(shown + 1) % 10}`));
        advance(getRecallFeedbackDurationMs(String(shown), false));
      }
    },
    activeTestId: 'sequence-display',
    replayTestId: 'digit-keypad',
    endTestId: 'end',
  },
  {
    id: 'NumberRecognition',
    element: (report) => (
      <NumberRecognition durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'current-number',
    endTestId: 'end',
  },
  {
    id: 'SymbolRecognition',
    element: (report) => (
      <SymbolRecognition durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'symbol',
    endTestId: 'end',
  },
  {
    id: 'PatternScanning',
    element: (report) => (
      <PatternScanning
        grid={[['★', '●']]}
        targetPattern="★"
        durationMs={100}
        onReportResult={report}
      />
    ),
    complete: () => advance(200),
    activeTestId: 'grid',
    endTestId: 'end-screen',
  },
  {
    id: 'TimedPhraseRecognition',
    element: (report) => (
      <TimedPhraseRecognition
        phrases={['A', 'B', 'C', 'D']}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(20);
      fireEvent.press(view.getByTestId('option-0'));
      advance(5_300);
    },
    activeTestId: 'phrase-flash',
    replayTestId: 'options-container',
    endTestId: 'end',
  },
  {
    id: 'TimedWordRecognition',
    element: (report) => (
      <TimedWordRecognition
        words={['one', 'two', 'three', 'four']}
        displayMs={10}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(20);
      fireEvent.press(view.getByTestId('option-0'));
      advance(5_300);
    },
    activeTestId: 'word-flash',
    replayTestId: 'options-container',
    endTestId: 'end',
  },
  {
    id: 'LastWordRecall',
    element: (report) => (
      <LastWordRecall
        words={['one', 'two', 'three', 'four']}
        wordDisplayMs={10}
        sequenceLength={4}
        totalRounds={1}
        onReportResult={report}
      />
    ),
    complete: (view) => {
      advance(50);
      fireEvent.press(view.getByTestId('last-word-option-0'));
      advance(5_300);
    },
    activeTestId: 'word-stream',
    endTestId: 'end',
  },
  {
    id: 'WordMismatchGrid',
    element: (report) => (
      <WordMismatchGrid durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'card-0',
    endTestId: 'end',
  },
  {
    id: 'WordPairs',
    element: (report) => (
      <WordPairs durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'option-0',
    endTestId: 'end',
  },
  {
    id: 'LetterJumble',
    element: (report) => (
      <LetterJumble durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'answer-input',
    endTestId: 'end',
  },
  {
    id: 'SchulteNumbers',
    element: (report) => (
      <SchulteNumbers gridSize={2} onReportResult={report} />
    ),
    complete: (view) => {
      for (let value = 1; value <= 4; value += 1) {
        fireEvent.press(view.getByTestId(`cell-${value}`));
      }
    },
    activeTestId: 'schulte-numbers-grid',
    endTestId: 'end',
  },
  {
    id: 'SchulteLetters',
    element: (report) => (
      <SchulteLetters gridSize={2} onReportResult={report} />
    ),
    complete: (view) => {
      for (const letter of ['A', 'B', 'C', 'D']) {
        fireEvent.press(view.getByTestId(`cell-${letter}`));
      }
    },
    activeTestId: 'schulte-letters-grid',
    endTestId: 'end',
  },
  {
    id: 'SchulteMix',
    element: (report) => (
      <SchulteMix gridSize={2} onReportResult={report} />
    ),
    complete: (view) => {
      for (const id of [
        'cell-number-1',
        'cell-letter-A',
        'cell-number-2',
        'cell-letter-B',
      ]) {
        fireEvent.press(view.getByTestId(id));
      }
    },
    activeTestId: 'schulte-mix-grid',
    endTestId: 'end',
  },
  {
    id: 'WordSearchGame',
    element: (report) => (
      <WordSearchGame durationMs={100} onReportResult={report} />
    ),
    complete: () => advance(200),
    activeTestId: 'word-search-grid',
    endTestId: 'end',
  },
  {
    id: 'NumberSearch',
    element: (report) => (
      <NumberSearch
        durationMs={100}
        previewMs={10}
        gridSize={2}
        onReportResult={report}
      />
    ),
    complete: () => {
      advance(20);
      advance(200);
    },
    activeTestId: 'target-preview',
    replayTestId: 'number-search-grid',
    endTestId: 'end',
  },
  {
    id: 'EvenNumbers',
    element: (report) => (
      <EvenNumbers
        grid={[1, 2, 3, 4]}
        gridSize={2}
        durationMs={100}
        onReportResult={report}
      />
    ),
    complete: () => advance(200),
    activeTestId: 'even-numbers-grid',
    endTestId: 'end',
  },
];

describe('all registered games lifecycle release gate', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(LIFECYCLE_ADAPTERS)(
    '$id completes once, replays cleanly, and does not report after unmount',
    async (adapter) => {
      const report: Report = jest.fn();
      const view = render(adapter.element(report));
      await settle();

      fireEvent.press(view.getByTestId('start-button'));
      expect(view.getByTestId(adapter.activeTestId)).toBeTruthy();

      await adapter.complete(view);
      await settle();

      expect(view.getByTestId(adapter.endTestId)).toBeTruthy();
      expect(report).toHaveBeenCalledTimes(1);

      act(() => {
        jest.runOnlyPendingTimers();
      });
      await settle();
      expect(report).toHaveBeenCalledTimes(1);

      fireEvent.press(view.getByTestId('play-again'));
      advance(60);
      await settle();

      expect(view.queryByTestId(adapter.endTestId)).toBeNull();
      expect(
        view.getByTestId(adapter.replayTestId ?? adapter.activeTestId)
      ).toBeTruthy();
      expect(report).toHaveBeenCalledTimes(1);

      view.unmount();
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(report).toHaveBeenCalledTimes(1);
    }
  );
});
