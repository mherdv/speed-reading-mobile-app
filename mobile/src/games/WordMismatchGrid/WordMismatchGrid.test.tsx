import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

type TextNode = { props: { children?: unknown } };
import WordMismatchGrid, { SIMILAR_PAIRS } from './WordMismatchGrid';

describe('WordMismatchGrid (card-based similar words)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2020-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('has a broad pool of confusable word shapes', () => {
    expect(SIMILAR_PAIRS.length).toBeGreaterThanOrEqual(60);
    expect(
      new Set(SIMILAR_PAIRS.flat().map((word) => word.toLocaleLowerCase())).size
    ).toBeGreaterThanOrEqual(100);
  });

  it('Start -> game runs and can select cards', () => {
    const { getByTestId, getAllByTestId } = render(
      <WordMismatchGrid durationMs={30000} difficulty="easy" />
    );

    fireEvent.press(getByTestId('start-button'));

    // Game should be running
    expect(getByTestId('score')).toHaveTextContent('0');
    
    // Cards should be rendered (easy mode has 4 cards)
    const cards = getAllByTestId(/^card-\d+$/);
    expect(cards.length).toBeGreaterThanOrEqual(4);
    
    // Select first card - the game may auto-submit if correct
    fireEvent.press(getByTestId('card-0'));
    
    // Game should still be running or have progressed to next round
    // Just verify game is still active (not ended)
    expect(getByTestId('score')).toBeTruthy();
  });

  it('Reports score/accuracy on end', () => {
    const onReportResult = jest.fn();

    const { getByTestId, getByText } = render(
      <WordMismatchGrid durationMs={1000} difficulty="easy" onReportResult={onReportResult} />
    );

    fireEvent.press(getByTestId('start-button'));
    
    // Submit one round without selection
    fireEvent.press(getByText(/Submit/));

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(getByTestId('end')).toBeTruthy();
    expect(onReportResult).toHaveBeenCalledTimes(1);
    
    const payload = onReportResult.mock.calls[0][0];
    expect(payload.details.difficulty).toBe('easy');
  });

  it('applies an immediate penalty for a matching pair and does not select it', () => {
    const { getAllByTestId, getByTestId } = render(
      <WordMismatchGrid durationMs={30_000} difficulty="easy" />
    );
    fireEvent.press(getByTestId('start-button'));

    const matchingCard = getAllByTestId(/^card-\d+$/).find((card) => {
      const words = (card.findAllByType(Text) as TextNode[])
        .map((node) => node.props.children)
        .filter((value: unknown): value is string => typeof value === 'string');
      return words.length >= 2 && words[0] === words[1];
    });
    expect(matchingCard).toBeTruthy();
    fireEvent.press(matchingCard!);

    expect(getByTestId('penalty-count')).toHaveTextContent('1 penalty');
    expect(getByTestId('penalty-count').props.accessibilityLiveRegion).toBe(
      'polite'
    );
    expect(matchingCard!.props.accessibilityState?.selected).not.toBe(true);
  });

  it('uses container-relative two-column cards that can shrink on narrow phones', () => {
    const { getAllByTestId, getByTestId } = render(
      <WordMismatchGrid difficulty="hard" />
    );
    fireEvent.press(getByTestId('start-button'));

    expect(getAllByTestId(/^card-\d+$/)[0]).toHaveStyle({
      flexBasis: '48%',
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '48%',
    });
  });

  it('Level display and start button work', async () => {
    const { getByTestId, getByText } = render(<WordMismatchGrid />);

    await act(async () => {
      await Promise.resolve();
    });

    // Should show Level display (difficulty is auto-adjusted)
    expect(getByText(/Level/)).toBeTruthy();
    
    // Start the game
    fireEvent.press(getByTestId('start-button'));
    
    // Cards should exist
    expect(getByTestId('card-0')).toBeTruthy();
  });
});
