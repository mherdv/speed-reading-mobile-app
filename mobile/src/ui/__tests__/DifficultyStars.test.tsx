import React from 'react';
import { render } from '@testing-library/react-native';

import { DifficultyStars } from '../DifficultyStars';

describe('DifficultyStars', () => {
  it.each([
    [1, 0],
    [3, 1],
    [6, 2],
    [9, 3],
    [12, 4],
    [15, 5],
  ])('maps level %s to %s filled stars', (level, stars) => {
    const { getByLabelText } = render(<DifficultyStars level={level} />);
    expect(
      getByLabelText(`${stars} of 5 difficulty stars, level ${level}`)
    ).toBeTruthy();
  });

  it('shows clamped level text when requested', () => {
    const { getByText, getByLabelText } = render(
      <DifficultyStars level={99} showLevel />
    );

    expect(getByText('Lv.15')).toBeTruthy();
    expect(getByLabelText('5 of 5 difficulty stars, level 15')).toBeTruthy();
  });
});
