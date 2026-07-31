import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';

import {
  qualifyFlashChallengeLevel,
  waitForFlashChallengeUpdates,
} from '../data/flashChallengeProgress';
import {
  beginNonCalibratingProgressSession,
} from '../data/progressStore';
import { useFlashChallenge } from './useFlashChallenge';

function Harness({
  masteryEligible = true,
}: {
  masteryEligible?: boolean;
}) {
  const challenge = useFlashChallenge(
    'FlashReading',
    'easy',
    2,
    3,
    { masteryEligible }
  );
  return (
    <View>
      <Text testID="loaded">{String(challenge.loaded)}</Text>
      <Text testID="level">{challenge.level}</Text>
      <Text testID="resume">{challenge.resumeLevel}</Text>
      <Text testID="best">{challenge.highestLevel}</Text>
      <Text testID="resume-wpm">{challenge.resumeWpm ?? 'none'}</Text>
      <Text testID="best-wpm">{challenge.highestWpm ?? 'none'}</Text>
      <Pressable testID="begin" onPress={challenge.beginSession}>
        <Text>Begin</Text>
      </Pressable>
      <Pressable
        testID="correct"
        onPress={() => challenge.recordOutcome(true)}
      >
        <Text>Correct</Text>
      </Pressable>
      <Pressable
        testID="qualify-wpm"
        onPress={() => challenge.recordQualifiedWpm(2_775)}
      >
        <Text>Qualify WPM</Text>
      </Pressable>
      <Pressable
        testID="rollback-wpm"
        onPress={() => challenge.recordRollbackWpm(2_700)}
      >
        <Text>Rollback WPM</Text>
      </Pressable>
      <Pressable
        testID="miss"
        onPress={() => challenge.recordOutcome(false)}
      >
        <Text>Miss</Text>
      </Pressable>
    </View>
  );
}

describe('useFlashChallenge', () => {
  beforeEach(async () => {
    await waitForFlashChallengeUpdates();
    await AsyncStorage.clear();
  });

  it('resumes saved mastery, qualifies a higher level, and loads it next mount', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 6);
    const first = render(<Harness />);
    await waitFor(() => {
      expect(first.getByTestId('loaded').props.children).toBe('true');
      expect(first.getByTestId('level').props.children).toBe(6);
    });

    fireEvent.press(first.getByTestId('begin'));
    fireEvent.press(first.getByTestId('correct'));
    fireEvent.press(first.getByTestId('correct'));
    expect(first.getByTestId('level').props.children).toBe(7);
    await waitFor(() => {
      expect(first.getByTestId('resume').props.children).toBe(7);
      expect(first.getByTestId('best').props.children).toBe(7);
    });
    first.unmount();

    const second = render(<Harness />);
    await waitFor(() => {
      expect(second.getByTestId('level').props.children).toBe(7);
    });
  });

  it('lowers live demand on each miss but only rolls the saved start back once', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 7);
    const first = render(<Harness />);
    await waitFor(() => {
      expect(first.getByTestId('level').props.children).toBe(7);
    });

    fireEvent.press(first.getByTestId('miss'));
    fireEvent.press(first.getByTestId('miss'));
    fireEvent.press(first.getByTestId('miss'));
    expect(first.getByTestId('level').props.children).toBe(4);
    await waitFor(() => {
      expect(first.getByTestId('resume').props.children).toBe(6);
      expect(first.getByTestId('best').props.children).toBe(7);
    });
    fireEvent.press(first.getByTestId('miss'));
    fireEvent.press(first.getByTestId('miss'));
    await Promise.resolve();
    expect(first.getByTestId('resume').props.children).toBe(6);
  });

  it('does not lower a saved checkpoint while recovering below it', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 10);
    const view = render(<Harness />);
    await waitFor(() => {
      expect(view.getByTestId('level').props.children).toBe(10);
    });

    fireEvent.press(view.getByTestId('begin'));
    fireEvent.press(view.getByTestId('miss'));
    fireEvent.press(view.getByTestId('miss'));
    fireEvent.press(view.getByTestId('correct'));
    fireEvent.press(view.getByTestId('correct'));

    expect(view.getByTestId('level').props.children).toBe(9);
    expect(view.getByTestId('resume').props.children).toBe(10);
  });

  it('persists sustained WPM beyond the level ladder and restores it', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 15);
    const first = render(<Harness />);
    await waitFor(() => {
      expect(first.getByTestId('loaded').props.children).toBe('true');
      expect(first.getByTestId('level').props.children).toBe(15);
    });
    fireEvent.press(first.getByTestId('qualify-wpm'));
    await waitFor(() => {
      expect(first.getByTestId('resume-wpm').props.children).toBe(2_775);
      expect(first.getByTestId('best-wpm').props.children).toBe(2_775);
    });
    fireEvent.press(first.getByTestId('rollback-wpm'));
    await waitFor(() => {
      expect(first.getByTestId('resume-wpm').props.children).toBe(2_700);
      expect(first.getByTestId('best-wpm').props.children).toBe(2_775);
    });
    first.unmount();

    const second = render(<Harness />);
    await waitFor(() => {
      expect(second.getByTestId('resume-wpm').props.children).toBe(2_700);
      expect(second.getByTestId('best-wpm').props.children).toBe(2_775);
    });
  });

  it('keeps exact replay changes live-only', async () => {
    await qualifyFlashChallengeLevel('FlashReading', 'easy', 5);
    const endReplay = beginNonCalibratingProgressSession('FlashReading');
    const view = render(<Harness />);
    await waitFor(() => {
      expect(view.getByTestId('level').props.children).toBe(5);
    });

    fireEvent.press(view.getByTestId('correct'));
    fireEvent.press(view.getByTestId('correct'));
    expect(view.getByTestId('level').props.children).toBe(6);
    await Promise.resolve();
    expect(view.getByTestId('resume').props.children).toBe(5);

    endReplay();
  });

  it('keeps authored or fixed sessions live-only', async () => {
    const view = render(<Harness masteryEligible={false} />);
    await waitFor(() => {
      expect(view.getByTestId('loaded').props.children).toBe('true');
    });

    fireEvent.press(view.getByTestId('correct'));
    fireEvent.press(view.getByTestId('correct'));
    expect(view.getByTestId('level').props.children).toBe(2);
    expect(view.getByTestId('resume').props.children).toBe(1);
  });

  it('merges a delayed saved checkpoint into a session started while loading', async () => {
    let resolveLoad:
      | ((value: string | null) => void)
      | undefined;
    const getItem = jest.mocked(AsyncStorage.getItem);
    getItem.mockImplementationOnce(
        () =>
          new Promise<string | null>((resolve) => {
            resolveLoad = resolve;
          })
      );
    const view = render(<Harness />);
    expect(view.getByTestId('loaded').props.children).toBe('false');
    fireEvent.press(view.getByTestId('begin'));
    expect(view.getByTestId('level').props.children).toBe(1);

    await act(async () => {
      resolveLoad?.(
        JSON.stringify({
          FlashReading: {
            easy: { resumeLevel: 10, highestLevel: 10 },
          },
        })
      );
      await Promise.resolve();
    });

    expect(view.getByTestId('loaded').props.children).toBe('true');
    expect(view.getByTestId('level').props.children).toBe(10);
    expect(view.getByTestId('resume').props.children).toBe(10);
  });

  it('keeps a session playable but blocks mastery writes after a failed initial read', async () => {
    const getItem = jest.mocked(AsyncStorage.getItem);
    getItem.mockRejectedValueOnce(new Error('temporary read failure'));
    const setItem = jest.mocked(AsyncStorage.setItem);
    setItem.mockClear();
    const view = render(<Harness />);

    await waitFor(() => {
      expect(view.getByTestId('loaded').props.children).toBe('true');
    });
    fireEvent.press(view.getByTestId('begin'));
    fireEvent.press(view.getByTestId('correct'));
    fireEvent.press(view.getByTestId('correct'));
    fireEvent.press(view.getByTestId('miss'));
    fireEvent.press(view.getByTestId('miss'));
    fireEvent.press(view.getByTestId('miss'));
    await act(async () => {
      await Promise.resolve();
    });

    expect(setItem).not.toHaveBeenCalled();
  });
});
