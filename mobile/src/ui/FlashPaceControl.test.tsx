import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { FlashPaceControl } from './FlashPaceControl';

describe('FlashPaceControl', () => {
  it('offers a direct 3,000 WPM setting without requiring repeated taps', () => {
    const onChange = jest.fn();
    const view = render(
      <FlashPaceControl
        wpm={320}
        minWpm={220}
        maxWpm={3000}
        onChange={onChange}
      />
    );

    expect(view.getByText('Quick set · up to 3,000 WPM')).toBeTruthy();
    fireEvent.press(view.getByTestId('pace-preset-3000'));
    expect(onChange).toHaveBeenCalledWith(3000);
  });

  it('keeps unavailable presets out of the selected range', () => {
    const view = render(
      <FlashPaceControl
        wpm={220}
        minWpm={220}
        maxWpm={1000}
        onChange={jest.fn()}
      />
    );

    expect(view.queryByTestId('pace-preset-150')).toBeNull();
    expect(view.getByTestId('pace-preset-1000')).toBeTruthy();
    expect(view.queryByTestId('pace-preset-2000')).toBeNull();
  });

  it('disables every pace input when timing is externally controlled', () => {
    const onChange = jest.fn();
    const view = render(
      <FlashPaceControl
        wpm={300}
        minWpm={80}
        maxWpm={3000}
        disabled
        onChange={onChange}
      />
    );

    fireEvent.press(view.getByTestId('pace-preset-3000'));
    fireEvent.press(view.getByTestId('pace-increase'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
