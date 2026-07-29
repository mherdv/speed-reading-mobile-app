import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GameScreen } from './GameScreen';
import * as resultsStore from '../data/resultsStore';

describe('GameScreen difficulty control', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('keeps Schulte grids manual and persists the selected size', async () => {
    const { getByTestId, queryByTestId } = render(
      <GameScreen
        gameId="SchulteNumbers"
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('difficulty-control')).toBeTruthy();
    });

    expect(queryByTestId('difficulty-choice-adaptive')).toBeNull();
    expect(getByTestId('difficulty-choice-easy')).toHaveAccessibilityState({
      checked: true,
    });

    fireEvent.press(getByTestId('difficulty-choice-hard'));

    await waitFor(() => {
      expect(getByTestId('difficulty-choice-hard')).toHaveAccessibilityState({
        checked: true,
      });
    });

    await expect(
      AsyncStorage.getItem('speed-reading:difficulty-preferences:v1')
    ).resolves.toContain(
      '"SchulteNumbers":{"mode":"manual","difficulty":"hard"}'
    );
  });

  it('offers both adaptive and manual modes for reading games', async () => {
    const { getByTestId, getByText } = render(
      <GameScreen
        gameId="RepeatedReading"
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('difficulty-choice-adaptive')).toBeTruthy();
    });
    expect(getByTestId('difficulty-choice-adaptive')).toHaveAccessibilityState({
      checked: true,
    });
    expect(getByText('Adaptive target: Easy')).toBeTruthy();

    fireEvent.press(getByTestId('difficulty-choice-medium'));
    expect(getByTestId('difficulty-choice-medium')).toHaveAccessibilityState({
      checked: true,
    });
    expect(getByText('Manual setting: Medium')).toBeTruthy();
  });

  it('auto-starts a Schulte replay with its previous grid mode', async () => {
    const { getByText } = render(
      <GameScreen
        gameId="SchulteNumbers"
        autoStart
        schulteGridMode="reshuffle"
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(
        getByText('Moving grid · completed cells stay uncolored')
      ).toBeTruthy();
    });
  });

  it.each([
    ['RepeatedReading', 'game-idle-scroll'],
    ['MemoryRecall', 'simple-idle-scroll'],
  ])('keeps the %s description and Start button scrollable', async (gameId, scrollTestId) => {
    const { getByTestId } = render(
      <GameScreen
        gameId={gameId}
        onBack={jest.fn()}
        onFinish={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByTestId('difficulty-control')).toBeTruthy();
    });
    expect(getByTestId(scrollTestId)).toBeTruthy();
    expect(getByTestId('start-button')).toBeTruthy();
    expect(getByTestId('game-screen-header')).toHaveStyle({
      zIndex: 20,
      elevation: 20,
      minHeight: 64,
    });
  });

  it.each([
    ['pending', () => new Promise<void>(() => undefined)],
    ['rejected', () => Promise.reject(new Error('storage unavailable'))],
  ])(
    'shows the result without waiting for a %s result save',
    async (_case, makeSavePromise) => {
      jest.useFakeTimers();
      jest
        .spyOn(resultsStore, 'saveResult')
        .mockImplementation(makeSavePromise);
      const onFinish = jest.fn();
      const { getByTestId } = render(
        <GameScreen
          gameId="NumberSearch"
          difficulty="hard"
          onBack={jest.fn()}
          onFinish={onFinish}
        />
      );

      await waitFor(() => {
        expect(getByTestId('difficulty-control')).toBeTruthy();
      });
      fireEvent.press(getByTestId('start-button'));
      act(() => {
        jest.advanceTimersByTime(650);
      });
      act(() => {
        jest.advanceTimersByTime(25_100);
      });

      expect(onFinish).toHaveBeenCalledTimes(1);
    }
  );
});
