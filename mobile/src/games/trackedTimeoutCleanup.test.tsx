import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import EyeMovementTraining from './EyeMovementTraining/EyeMovementTraining';
import LetterJumble from './LetterJumble/LetterJumble';
import EvenNumbers from './EvenNumbers/EvenNumbers';
import SchulteMix from './SchulteMix/SchulteMix';
import MemoryRecall from './MemoryRecall/MemoryRecall';
import VisualSpanExpansion from './VisualSpanExpansion/VisualSpanExpansion';
import TimedWordRecognition from './TimedWordRecognition/TimedWordRecognition';
import WordMismatchGrid from './WordMismatchGrid/WordMismatchGrid';
import LetterRecognition from './LetterRecognition/LetterRecognition';

describe('tracked game callback cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T08:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    ['Eye Reset', <EyeMovementTraining />],
    ['Letter Jumble', <LetterJumble />],
    ['Even or Odd', <EvenNumbers />],
    ['Schulte Mix', <SchulteMix />],
    ['Memory Recall', <MemoryRecall />],
    ['Visual Span', <VisualSpanExpansion />],
    ['Word Flash', <TimedWordRecognition />],
    ['Odd Word', <WordMismatchGrid />],
    ['Letter Hunt', <LetterRecognition />],
  ])(
    'does not report %s after immediate unmount with callbacks pending',
    async (_name, element) => {
      const onReportResult = jest.fn();
      const component = React.cloneElement(element, { onReportResult });
      const { getByTestId, unmount } = render(component);
      await act(async () => {
        await Promise.resolve();
      });
      fireEvent.press(getByTestId('start-button'));
      unmount();
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(onReportResult).not.toHaveBeenCalled();
    }
  );
});
