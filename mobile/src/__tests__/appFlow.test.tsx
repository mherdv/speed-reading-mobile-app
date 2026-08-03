import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    SafeAreaInsetsContext: React.createContext(insets),
    SafeAreaFrameContext: React.createContext(frame),
    initialWindowMetrics: { insets, frame },
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});

import App from '../../App';

describe('real app navigation flows', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the complete searchable game catalog on Home', async () => {
    const { getByTestId, getByText, queryByTestId } = render(<App />);

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
    expect(getByTestId('open-game-MainIdeaSprint')).toBeTruthy();
    expect(getByTestId('open-game-CenterLineReader')).toBeTruthy();
    expect(getByTestId('open-game-ReadingSaccades')).toBeTruthy();
    expect(getByText('33 exercises')).toBeTruthy();
    expect(queryByTestId('open-training-library')).toBeNull();
  });

  it('returns an untouched idle game without prompting', async () => {
    const { getByLabelText, getByTestId, getByText } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('open-game-MainIdeaSprint')).toBeTruthy();
    });

    fireEvent.press(getByTestId('open-game-MainIdeaSprint'));
    await waitFor(() => {
      expect(getByText('Training')).toBeTruthy();
      expect(getByTestId('difficulty-control')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Go back'));
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
  });

  it('leaves an active game immediately when Back is pressed', async () => {
    const { getByLabelText, getByTestId, getByText } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('open-game-StructureScan')).toBeTruthy();
    });

    fireEvent.press(getByTestId('open-game-StructureScan'));
    await waitFor(() => {
      expect(getByTestId('start-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('start-button'));
    expect(getByTestId('structure-scan-article')).toBeTruthy();

    fireEvent.press(getByLabelText('Go back'));

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
  });

  it.each(['EvidenceHunt', 'ContextBuilder'])(
    'leaves an active %s session immediately through the shared Back flow',
    async (gameId) => {
      const { getByLabelText, getByTestId, getByText } = render(<App />);
      await waitFor(() => {
        expect(getByTestId(`open-game-${gameId}`)).toBeTruthy();
      });
      fireEvent.press(getByTestId(`open-game-${gameId}`));
      await waitFor(() => {
        expect(getByTestId('start-button')).toBeTruthy();
      });
      fireEvent.press(getByTestId('start-button'));
      fireEvent.press(getByLabelText('Go back'));

      await waitFor(() => {
        expect(getByText('Welcome back')).toBeTruthy();
      });
    }
  );

  it('leaves an auto-started exact-replay session immediately', async () => {
    const { getByLabelText, getByTestId, getByText } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('open-game-StructureScan')).toBeTruthy();
    });
    fireEvent.press(getByTestId('open-game-StructureScan'));
    await waitFor(() => {
      expect(getByTestId('start-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('start-button'));

    for (let round = 0; round < 3; round += 1) {
      fireEvent.press(getByTestId('show-structure-choices'));
      fireEvent.press(getByTestId('structure-choice-0'));
      fireEvent.press(getByTestId('continue-structure-scan'));
    }
    await waitFor(() => {
      expect(getByText('Recent progress')).toBeTruthy();
    });

    fireEvent.press(getByTestId('repeat-same-setup'));
    await waitFor(() => {
      expect(getByTestId('structure-scan-article')).toBeTruthy();
    });
    fireEvent.press(getByLabelText('Go back'));

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
  });

  it('replays Schulte at the same selected grid variation', async () => {
    const { getByLabelText, getByTestId, getByText } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('open-game-SchulteNumbers')).toBeTruthy();
    });

    fireEvent.press(getByTestId('open-game-SchulteNumbers'));
    await waitFor(() => {
      expect(getByTestId('schulte-mode-reshuffle')).toBeTruthy();
    });
    fireEvent.press(getByTestId('schulte-mode-reshuffle'));
    fireEvent.press(getByTestId('start-button'));

    for (let number = 1; number <= 9; number += 1) {
      fireEvent.press(getByTestId(`cell-${number}`));
    }

    await waitFor(() => {
      expect(getByTestId('schulte-grid-mode')).toHaveTextContent(
        'Shuffle after each tap'
      );
    });

    fireEvent.press(getByTestId('recommended-next-action'));
    await waitFor(() => {
      expect(
        getByText('Moving grid · completed cells stay uncolored')
      ).toBeTruthy();
    });
  });

  it('continues an assigned Today plan and retains its origin on exact replay', async () => {
    const view = render(<App />);
    await waitFor(() => {
      expect(view.getByTestId('start-reading-exercise')).toBeTruthy();
    });

    const completeReading = () => {
      let measuredNow = 1_000;
      const clockSpy = jest
        .spyOn(globalThis.performance, 'now')
        .mockImplementation(() => measuredNow);
      fireEvent.press(view.getByTestId('start-reading'));
      measuredNow += 60_000;
      fireEvent.press(view.getByTestId('finish-reading'));
      clockSpy.mockRestore();
      fireEvent.press(view.getByTestId('choice-0'));
      fireEvent.press(view.getByTestId('choice-1-0'));
      fireEvent.press(view.getByTestId('choice-2-0'));
      fireEvent.press(view.getByTestId('submit-answer'));
    };

    fireEvent.press(view.getByTestId('start-reading-exercise'));
    await waitFor(() => {
      expect(view.getByTestId('start-reading')).toBeTruthy();
    });
    completeReading();
    await waitFor(() => {
      expect(view.getByLabelText('Continue today’s plan')).toBeTruthy();
    });

    fireEvent.press(view.getByTestId('repeat-same-setup'));
    await waitFor(() => {
      expect(view.getByTestId('start-reading')).toBeTruthy();
    });
    completeReading();
    await waitFor(() => {
      expect(view.getByLabelText('Continue today’s plan')).toBeTruthy();
    });

    fireEvent.press(view.getByTestId('recommended-next-action'));
    await waitFor(() => {
      expect(view.getByText('Context Builder')).toBeTruthy();
      expect(view.getByTestId('start-button')).toBeTruthy();
    });
  });
});
