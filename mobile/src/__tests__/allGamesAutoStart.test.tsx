import React from 'react';
import { act, render } from '@testing-library/react-native';

// Import all registered games
import RepeatedReading from '../games/RepeatedReading/RepeatedReading';
import MainIdeaSprint from '../games/MainIdeaSprint/MainIdeaSprint';
import PageGlimpse from '../games/PageGlimpse/PageGlimpse';
import StructureScan from '../games/StructureScan/StructureScan';
import EvidenceHunt from '../games/EvidenceHunt/EvidenceHunt';
import ContextBuilder from '../games/ContextBuilder/ContextBuilder';
import PowerReader from '../games/PowerReader/PowerReader';
import CenterLineReader from '../games/CenterLineReader/CenterLineReader';
import LetterRecognition from '../games/LetterRecognition/LetterRecognition';
import TextSearch from '../games/TextSearch/TextSearch';
import EyeMovementTraining from '../games/EyeMovementTraining/EyeMovementTraining';
import ReadingSaccades from '../games/ReadingSaccades/ReadingSaccades';
import PreviewCatch from '../games/PreviewCatch/PreviewCatch';
import PeripheralLetterCatch from '../games/PeripheralLetterCatch/PeripheralLetterCatch';
import PeripheralWordCatch from '../games/PeripheralWordCatch/PeripheralWordCatch';
import VisualSpanExpansion from '../games/VisualSpanExpansion/VisualSpanExpansion';
import FlashReading from '../games/FlashReading/FlashReading';
import WordsRecall from '../games/WordsRecall/WordsRecall';
import SentenceRecall from '../games/SentenceRecall/SentenceRecall';
import WpmTest from '../games/WpmTest/WpmTest';
import ComprehensionTest from '../games/ComprehensionTest/ComprehensionTest';
import MemoryRecall from '../games/MemoryRecall/MemoryRecall';
import NumberRecognition from '../games/NumberRecognition/NumberRecognition';
import SymbolRecognition from '../games/SymbolRecognition/SymbolRecognition';
import PatternScanning from '../games/PatternScanning/PatternScanning';
import TimedPhraseRecognition from '../games/TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from '../games/TimedWordRecognition/TimedWordRecognition';
import LastWordRecall from '../games/LastWordRecall/LastWordRecall';
import WordMismatchGrid from '../games/WordMismatchGrid/WordMismatchGrid';
import WordPairs from '../games/WordPairs/WordPairs';
import LetterJumble from '../games/LetterJumble/LetterJumble';
import SchulteNumbers from '../games/SchulteNumbers/SchulteNumbers';
import SchulteLetters from '../games/SchulteLetters/SchulteLetters';
import SchulteMix from '../games/SchulteMix/SchulteMix';
import WordSearchGame from '../games/WordSearchGame/WordSearchGame';
import NumberSearch from '../games/NumberSearch/NumberSearch';
import EvenNumbers from '../games/EvenNumbers/EvenNumbers';

describe('All Games - AutoStart Functionality', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper to wait for async operations and auto-start delay
  const waitForAutoStart = async () => {
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    await act(async () => {
      await Promise.resolve();
    });
  };

  describe('RepeatedReading', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <RepeatedReading autoStart={true} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('repeated-passage')).toBeTruthy();
    });
  });

  describe('WpmTest', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<WpmTest autoStart />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('wpm-reading')).toBeTruthy();
    });
  });

  describe('MainIdeaSprint', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <MainIdeaSprint autoStart={true} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('main-idea-passage')).toBeTruthy();
    });
  });

  describe('PageGlimpse', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <PageGlimpse autoStart exposureMs={1_000} roundCount={1} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('page-glimpse-stage')).toBeTruthy();
    });
  });

  describe('StructureScan', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <StructureScan autoStart={true} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('structure-scan-article')).toBeTruthy();
    });
  });

  describe('EvidenceHunt', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <EvidenceHunt autoStart />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('evidence-active')).toBeTruthy();
    });
  });

  describe('ContextBuilder', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <ContextBuilder autoStart />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('context-active')).toBeTruthy();
    });
  });

  describe('PowerReader', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<PowerReader autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });

    it('shows start button when autoStart is false', async () => {
      const { getByTestId } = render(<PowerReader autoStart={false} />);
      await act(async () => {
        await Promise.resolve();
      });
      expect(getByTestId('start-button')).toBeTruthy();
    });
  });

  describe('CenterLineReader', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <CenterLineReader autoStart intervalMs={1_000} random={() => 0} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('focus-lane-active')).toBeTruthy();
    });
  });

  describe('LetterRecognition', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<LetterRecognition autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('cell-0')).toBeTruthy();
    });
  });

  describe('TextSearch', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<TextSearch autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('EyeMovementTraining', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<EyeMovementTraining autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('blink-stage')).toBeTruthy();
    });
  });

  describe('ReadingSaccades', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <ReadingSaccades autoStart tickMs={1_000} random={() => 0} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('saccades-active')).toBeTruthy();
    });
  });

  describe('PreviewCatch', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <PreviewCatch
          autoStart
          exposureMs={1_000}
          totalRounds={1}
          random={() => 0.999}
        />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('preview-catch-active')).toBeTruthy();
    });
  });

  describe('PeripheralLetterCatch', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <PeripheralLetterCatch
          autoStart
          displayMs={1_000}
          fixationMs={1_000}
          totalRounds={1}
        />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('peripheral-letter-fixation')).toBeTruthy();
    });
  });

  describe('PeripheralWordCatch', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <PeripheralWordCatch
          autoStart
          displayMs={1_000}
          fixationMs={1_000}
          totalRounds={1}
        />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('peripheral-word-fixation')).toBeTruthy();
    });
  });

  describe('VisualSpanExpansion', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<VisualSpanExpansion autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('FlashReading', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<FlashReading autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('WordsRecall', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <WordsRecall autoStart prompts={['quiet focus']} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('recall-display')).toBeTruthy();
    });
  });

  describe('SentenceRecall', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <SentenceRecall autoStart prompts={['Readers remember useful ideas.']} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('recall-display')).toBeTruthy();
    });
  });

  describe('ComprehensionTest', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<ComprehensionTest autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('MemoryRecall', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<MemoryRecall autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('NumberRecognition', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<NumberRecognition autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('SymbolRecognition', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<SymbolRecognition autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('PatternScanning', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<PatternScanning autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('TimedPhraseRecognition', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<TimedPhraseRecognition autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('TimedWordRecognition', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<TimedWordRecognition autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('LastWordRecall', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <LastWordRecall autoStart={true} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('word-stream')).toBeTruthy();
    });
  });

  describe('WordMismatchGrid', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<WordMismatchGrid autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('card-0')).toBeTruthy();
    });
  });

  describe('WordPairs', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<WordPairs autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('LetterJumble', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<LetterJumble autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('SchulteNumbers', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByText } = render(<SchulteNumbers autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      // SchulteNumbers displays stats during running phase
      expect(getByText('Next')).toBeTruthy();
      expect(getByText('Progress')).toBeTruthy();
    });
  });

  describe('SchulteLetters', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByText } = render(<SchulteLetters autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      // SchulteLetters displays stats during running phase
      expect(getByText('Next')).toBeTruthy();
      expect(getByText('Progress')).toBeTruthy();
    });
  });

  describe('SchulteMix', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByText } = render(<SchulteMix autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      // SchulteMix displays the current target indicator (e.g., "1", "Next (#)")
      expect(getByText('Next (#)')).toBeTruthy();
    });
  });

  describe('WordSearchGame', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId } = render(<WordSearchGame autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
    });
  });

  describe('NumberSearch', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(
        <NumberSearch autoStart={true} previewMs={10} />
      );
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('cell-0-0')).toBeTruthy();
    });
  });

  describe('EvenNumbers', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<EvenNumbers autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('even-numbers-grid')).toBeTruthy();
    });
  });
});
