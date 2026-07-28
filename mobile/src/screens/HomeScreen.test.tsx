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
import { HomeScreen } from './HomeScreen';

describe('Home Today plan', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows an honest optional baseline plus one explained skill and supports swap/skip', async () => {
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
    expect(view.queryByTestId('today-card-skill')).toBeNull();
    expect(view.queryByTestId('today-card-comfort')).toBeNull();
    expect(view.getByTestId('personal-estimate')).toHaveTextContent(
      'Not enough readings for a personal estimate · 0 of 3 valid passages'
    );
    expect(view.getByText(`${formatReadingEstimate(TEXT_SAMPLES[0]!)} · 3 questions`)).toBeTruthy();

    fireEvent.press(view.getByTestId('today-next'));
    expect(
      within(view.getByTestId('today-card-skill')).getByText('Context Builder')
    ).toBeTruthy();
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
      expect(view.getByText('31 exercises')).toBeTruthy();
    });
    expect(view.getByTestId('open-game-RepeatedReading')).toBeTruthy();
    expect(view.getByTestId('open-game-LastWordRecall')).toBeTruthy();

    fireEvent.changeText(view.getByTestId('home-game-search'), 'last word');

    expect(view.getByText('1 matching exercise')).toBeTruthy();
    expect(view.getByTestId('open-game-LastWordRecall')).toBeTruthy();
    expect(view.queryByTestId('open-game-RepeatedReading')).toBeNull();

    fireEvent.changeText(view.getByTestId('home-game-search'), 'not a game');
    expect(view.getByText('No exercises found')).toBeTruthy();
  });
});
