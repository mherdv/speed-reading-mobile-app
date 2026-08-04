import React from 'react';
import {
  act,
  fireEvent,
  render,
  waitFor,
  within,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatReadingEstimate } from '../domain/readingPlan';
import { TEXT_SAMPLES } from '../data/textSamples';
import {
  getLocalDateKey,
  TODAY_PLAN_STORAGE_KEY,
} from '../data/todayPlanStore';
import { ReadingDisplayProvider } from '../ui/ReadingDisplayPreferences';
import { HomeScreen } from './HomeScreen';

describe('Home Today plan', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows an honest optional baseline plus one explained skill and supports swap/skip', async () => {
    const onStart = jest.fn();
    const onOpenGame = jest.fn();
    const view = render(
      <HomeScreen
        onStart={onStart}
        onOpenHistory={jest.fn()}
        onOpenGame={onOpenGame}
        refreshToken={0}
      />
    );
    await waitFor(() => {
      expect(view.getByTestId('today-card-reading')).toBeTruthy();
    });
    expect(view.queryByTestId('today-card-skill')).toBeNull();
    expect(view.queryByTestId('today-card-comfort')).toBeNull();
    expect(view.getByTestId('personal-estimate')).toHaveTextContent(
      'Not enough readings for a personal estimate · 0 of 3 eligible same-band passages · last 30 days · building confidence'
    );
    expect(view.getByText(`${formatReadingEstimate(TEXT_SAMPLES[0]!)} · 3 questions`)).toBeTruthy();

    fireEvent.press(view.getByTestId('today-next'));
    expect(
      within(view.getByTestId('today-card-skill')).getByText('Context Builder')
    ).toBeTruthy();
    fireEvent.press(view.getByTestId('start-today-skill'));
    expect(onOpenGame).toHaveBeenCalledWith(
      'ContextBuilder',
      expect.objectContaining({
        itemId: 'skill',
        snapshot: expect.objectContaining({
          skill: expect.objectContaining({ gameId: 'ContextBuilder' }),
        }),
      })
    );
    fireEvent.press(view.getByTestId('swap-today-skill'));
    expect(
      within(view.getByTestId('today-card-skill')).getByText('Evidence Hunt')
    ).toBeTruthy();

    fireEvent.press(view.getByTestId('today-previous'));
    fireEvent.press(view.getByTestId('skip-today-reading'));
    expect(view.queryByTestId('today-card-reading')).toBeNull();
    expect(view.getByTestId('today-card-skill')).toBeTruthy();
    fireEvent.press(view.getByTestId('skip-today-skill'));
    expect(view.getByTestId('today-empty')).toBeTruthy();
    await act(async () => {
      await Promise.resolve();
    });
    view.unmount();

    const remounted = render(
      <HomeScreen
        onStart={onStart}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );
    await waitFor(() => {
      expect(remounted.getByTestId('today-empty')).toBeTruthy();
    });
  });

  it('persists swaps and keeps the same assignments across a same-day remount', async () => {
    const first = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );
    await waitFor(() => {
      expect(first.getByTestId('today-card-reading')).toBeTruthy();
    });
    fireEvent.press(first.getByTestId('today-next'));
    fireEvent.press(first.getByTestId('swap-today-skill'));
    expect(
      within(first.getByTestId('today-card-skill')).getByText('Evidence Hunt')
    ).toBeTruthy();
    await act(async () => {
      await Promise.resolve();
    });
    first.unmount();

    const restored = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={1}
      />
    );
    await waitFor(() => {
      expect(restored.getByTestId('today-card-reading')).toBeTruthy();
    });
    fireEvent.press(restored.getByTestId('today-next'));
    expect(
      within(restored.getByTestId('today-card-skill')).getByText(
        'Evidence Hunt'
      )
    ).toBeTruthy();
  });

  it('shows a terminal completed state and does not replenish the plan that day', async () => {
    const now = new Date();
    const assignedAt = new Date(now.getTime() - 60 * 60_000);
    const resultStartedAt = new Date(now.getTime() - 30 * 60_000);
    await AsyncStorage.setItem(
      'speed-reading:today-plan:v2',
      JSON.stringify({
        schemaVersion: 2,
        localDate: getLocalDateKey(now),
        createdAtIso: assignedAt.toISOString(),
        reading: {
          sampleId: 'sample-1',
          assignedAtIso: assignedAt.toISOString(),
          swapOffset: 0,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: assignedAt.toISOString(),
          swapOffset: 0,
        },
        skipped: [],
      })
    );
    await AsyncStorage.setItem(
      'speed-reading:results:v1',
      JSON.stringify([
        {
          id: 'skill-complete',
          sampleId: 'ContextBuilder',
          sampleTitle: 'Context Builder',
          startedAtIso: resultStartedAt.toISOString(),
          finishedAtIso: new Date(
            resultStartedAt.getTime() + 60_000
          ).toISOString(),
          elapsedMs: 60_000,
          wordCount: 0,
          wpm: 0,
          score: 80,
          details: { activityType: 'context-builder' },
        },
        {
          id: 'reading-complete',
          sampleId: 'sample-1',
          sampleTitle: 'Warm-up: Focus & Pace',
          startedAtIso: resultStartedAt.toISOString(),
          finishedAtIso: new Date(
            resultStartedAt.getTime() + 120_000
          ).toISOString(),
          elapsedMs: 120_000,
          wordCount: 150,
          wpm: 75,
          comprehensionCorrect: true,
          details: {
            activityType: 'measured-reading',
            contentId: 'sample-1',
            contentVersion: 1,
            comparisonBand: 'general-practice-brief-v1',
            measurementValid: true,
            comprehensionCorrectCount: 3,
            comprehensionQuestionCount: 3,
          },
        },
      ])
    );

    const first = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );
    await waitFor(() => {
      expect(first.getByText('Today’s plan is complete')).toBeTruthy();
    });
    expect(first.queryByTestId('today-card-reading')).toBeNull();
    expect(first.queryByTestId('today-card-skill')).toBeNull();
    expect(
      first.getByText(/No new items will be added until tomorrow/)
    ).toBeTruthy();
    first.unmount();

    const restored = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={1}
      />
    );
    await waitFor(() => {
      expect(restored.getByTestId('today-complete')).toBeTruthy();
    });
    expect(restored.queryByTestId('today-card-reading')).toBeNull();
  });

  it('repairs a removed reading ID so display and completion use the same assignment', async () => {
    const now = new Date();
    const oldAssignedAt = new Date(now.getTime() - 60 * 60_000);
    await AsyncStorage.setItem(
      TODAY_PLAN_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        localDate: getLocalDateKey(now),
        createdAtIso: oldAssignedAt.toISOString(),
        reading: {
          sampleId: 'removed-reading-sample',
          assignedAtIso: oldAssignedAt.toISOString(),
          swapOffset: 3,
        },
        skill: {
          gameId: 'ContextBuilder',
          assignedAtIso: oldAssignedAt.toISOString(),
          swapOffset: 0,
        },
        skipped: [],
      })
    );
    const onStart = jest.fn();
    const view = render(
      <HomeScreen
        onStart={onStart}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );

    await waitFor(() => {
      expect(view.getByTestId('today-card-reading')).toBeTruthy();
    });
    fireEvent.press(view.getByTestId('start-reading-exercise'));
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sample-1' }),
      expect.objectContaining({
        itemId: 'reading',
        snapshot: expect.objectContaining({
          reading: expect.objectContaining({ sampleId: 'sample-1' }),
        }),
      })
    );

    const repairedSnapshot = JSON.parse(
      (await AsyncStorage.getItem(TODAY_PLAN_STORAGE_KEY))!
    );
    expect(repairedSnapshot.reading).toEqual(
      expect.objectContaining({
        sampleId: 'sample-1',
        swapOffset: 0,
      })
    );
    const completedAt = new Date(
      new Date(repairedSnapshot.reading.assignedAtIso).getTime() + 1_000
    );
    await AsyncStorage.setItem(
      'speed-reading:results:v1',
      JSON.stringify([
        {
          id: 'repaired-reading-complete',
          sampleId: 'sample-1',
          sampleTitle: TEXT_SAMPLES[0]!.title,
          startedAtIso: completedAt.toISOString(),
          finishedAtIso: new Date(completedAt.getTime() + 60_000).toISOString(),
          elapsedMs: 60_000,
          wordCount: 150,
          wpm: 150,
          comprehensionCorrect: true,
          details: {
            activityType: 'measured-reading',
            contentId: 'sample-1',
          },
        },
      ])
    );

    view.rerender(
      <HomeScreen
        onStart={onStart}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={1}
      />
    );
    await waitFor(() => {
      expect(view.getByText('Latest session')).toBeTruthy();
    });
    await waitFor(() => {
      expect(view.queryByTestId('today-card-reading')).toBeNull();
      expect(view.getByTestId('today-card-skill')).toBeTruthy();
    });
  });

  it('pins favorite games across refreshes in one favorites and recent area', async () => {
    const onOpenGame = jest.fn();
    const view = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={onOpenGame}
        refreshToken={0}
      />
    );
    await waitFor(() => {
      expect(view.getByTestId('open-game-LastWordRecall')).toBeTruthy();
    });

    fireEvent.press(view.getByTestId('favorite-game-LastWordRecall'));
    await waitFor(() => {
      expect(view.getByText('Favorites & recent')).toBeTruthy();
    });
    expect(
      view.getAllByTestId('favorite-game-LastWordRecall')[0]
    ).toHaveAccessibilityState({ selected: true });

    fireEvent.press(view.getAllByTestId('open-game-LastWordRecall')[0]);
    expect(onOpenGame).toHaveBeenCalledWith('LastWordRecall');
    expect(view.queryByText('Recently played')).toBeNull();

    view.unmount();
    const remounted = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={1}
      />
    );
    await waitFor(() => {
      expect(remounted.getByText('Favorites & recent')).toBeTruthy();
    });
  });

  it('pins recently played exercises near the top of Home', async () => {
    await AsyncStorage.setItem(
      'speed-reading:game-pins:v1',
      JSON.stringify({ favorites: [], recent: ['LastWordRecall'] })
    );
    const view = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );

    await waitFor(() => {
      expect(view.getByText('Favorites & recent')).toBeTruthy();
    });
    expect(view.getByText('RECENTLY PLAYED')).toBeTruthy();
    expect(view.getAllByTestId('open-game-LastWordRecall')).toHaveLength(2);
  });

  it('searches the complete game catalog from Home', async () => {
    const view = render(
      <HomeScreen
        onStart={jest.fn()}
        onOpenHistory={jest.fn()}
        onOpenGame={jest.fn()}
        refreshToken={0}
      />
    );

    await waitFor(() => {
      expect(view.getByText('37 exercises')).toBeTruthy();
    });
    expect(view.getByTestId('open-game-RepeatedReading')).toBeTruthy();
    expect(view.getByTestId('open-game-CenterLineReader')).toBeTruthy();
    expect(view.getByTestId('open-game-ReadingSaccades')).toBeTruthy();
    expect(view.getByTestId('open-game-LastWordRecall')).toBeTruthy();

    fireEvent.changeText(view.getByTestId('home-game-search'), 'last word');

    expect(view.getByText('1 matching exercise')).toBeTruthy();
    expect(view.getByTestId('open-game-LastWordRecall')).toBeTruthy();
    expect(view.queryByTestId('open-game-RepeatedReading')).toBeNull();

    fireEvent.changeText(view.getByTestId('home-game-search'), 'not a game');
    expect(view.getByText('No exercises found')).toBeTruthy();
  });

  it('opens and persists connected-reading display controls', async () => {
    const view = render(
      <ReadingDisplayProvider>
        <HomeScreen
          onStart={jest.fn()}
          onOpenHistory={jest.fn()}
          onOpenGame={jest.fn()}
          refreshToken={0}
        />
      </ReadingDisplayProvider>
    );

    await waitFor(() => {
      expect(view.getByTestId('toggle-reading-display')).toBeTruthy();
    });
    fireEvent.press(view.getByTestId('toggle-reading-display'));
    expect(view.getByTestId('reading-display-control')).toBeTruthy();
    fireEvent.press(view.getByLabelText('Text size: A+'));
    fireEvent.press(view.getByLabelText('Page tone: Warm'));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(
        'speed-reading:reading-display:v1'
      );
      expect(stored).toContain('"fontSize":"large"');
      expect(stored).toContain('"theme":"warm"');
    });
  });
});
