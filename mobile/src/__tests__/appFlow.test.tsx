import React from 'react';
import { Alert } from 'react-native';
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
  let alertAction: 'keep' | 'leave';

  beforeEach(async () => {
    await AsyncStorage.clear();
    alertAction = 'leave';
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const action = buttons?.find((button) =>
        alertAction === 'leave'
          ? button.text === 'Leave'
          : button.text === 'Keep training'
      );
      action?.onPress?.();
    });
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
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('keeps an active game usable after Back → Keep training and completes it', async () => {
    alertAction = 'keep';
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
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(getByTestId('structure-scan-article')).toBeTruthy();

    for (let round = 0; round < 3; round += 1) {
      fireEvent.press(getByTestId('show-structure-choices'));
      fireEvent.press(getByTestId('structure-choice-0'));
      fireEvent.press(getByTestId('continue-structure-scan'));
    }

    await waitFor(() => {
      expect(getByText('Recent progress')).toBeTruthy();
    });
  });

  it('leaves an active game after Back → Leave', async () => {
    const { getByLabelText, getByTestId, getByText } = render(<App />);
    await waitFor(() => {
      expect(getByTestId('open-game-StructureScan')).toBeTruthy();
    });
    fireEvent.press(getByTestId('open-game-StructureScan'));
    await waitFor(() => {
      expect(getByTestId('start-button')).toBeTruthy();
    });
    fireEvent.press(getByTestId('start-button'));

    fireEvent.press(getByLabelText('Go back'));

    await waitFor(() => {
      expect(getByText('Welcome back')).toBeTruthy();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it.each(['EvidenceHunt', 'ContextBuilder'])(
    'guards and discards an active %s session through the shared Back flow',
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
      expect(Alert.alert).toHaveBeenCalledTimes(1);
    }
  );

  it('guards an auto-started Result → Play Again session after Back → Keep training', async () => {
    alertAction = 'keep';
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

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(getByTestId('structure-scan-article')).toBeTruthy();
  });

  it('leaves an auto-started Result → Play Again session after Back → Leave', async () => {
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
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });
});
