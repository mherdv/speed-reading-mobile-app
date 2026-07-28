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
    expect(getByText('31 exercises')).toBeTruthy();
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

  it('leaves an auto-started Result → Play Again session immediately', async () => {
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

    fireEvent.press(getByLabelText('Play this game again'));
    await waitFor(() => {
      expect(getByTestId('structure-scan-article')).toBeTruthy();
    });
    fireEvent.press(getByLabelText('Go back'));

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
  });
});
