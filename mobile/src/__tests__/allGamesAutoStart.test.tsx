import React from 'react';
import { act, render } from '@testing-library/react-native';

// Import all 22 games
import PowerReader from '../games/PowerReader/PowerReader';
import LetterRecognition from '../games/LetterRecognition/LetterRecognition';
import TextSearch from '../games/TextSearch/TextSearch';
import EyeMovementTraining from '../games/EyeMovementTraining/EyeMovementTraining';
import VisualSpanExpansion from '../games/VisualSpanExpansion/VisualSpanExpansion';
import FlashReading from '../games/FlashReading/FlashReading';
import ComprehensionTest from '../games/ComprehensionTest/ComprehensionTest';
import MemoryRecall from '../games/MemoryRecall/MemoryRecall';
import NumberRecognition from '../games/NumberRecognition/NumberRecognition';
import SymbolRecognition from '../games/SymbolRecognition/SymbolRecognition';
import PatternScanning from '../games/PatternScanning/PatternScanning';
import TimedPhraseRecognition from '../games/TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from '../games/TimedWordRecognition/TimedWordRecognition';
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
      // Should show the dot track
      expect(getByTestId('dot-track')).toBeTruthy();
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
      const { queryByTestId, getByTestId } = render(<NumberSearch autoStart={true} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      // NumberSearch uses cell-{row}-{col} pattern
      expect(getByTestId('cell-0-0')).toBeTruthy();
    });
  });

  describe('EvenNumbers', () => {
    it('auto-starts when autoStart prop is true', async () => {
      const { queryByTestId, getByTestId } = render(<EvenNumbers autoStart={true} durationMs={1000} />);
      await waitForAutoStart();
      expect(queryByTestId('start-button')).toBeNull();
      expect(getByTestId('current-number')).toBeTruthy();
    });
  });
});
