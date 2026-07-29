import React from 'react';
import { render } from '@testing-library/react-native';

import FlashReading from './FlashReading/FlashReading';
import LastWordRecall from './LastWordRecall/LastWordRecall';
import TimedPhraseRecognition from './TimedPhraseRecognition/TimedPhraseRecognition';
import TimedWordRecognition from './TimedWordRecognition/TimedWordRecognition';

describe('rapid flash pace range', () => {
  it.each([
    ['Flash Recall', <FlashReading />],
    ['Last Word', <LastWordRecall />],
    ['Phrase Flash', <TimedPhraseRecognition />],
    ['Word Flash', <TimedWordRecognition />],
  ])('%s offers a direct 3,000 WPM starting pace', (_title, game) => {
    const view = render(game);

    expect(view.getByTestId('pace-preset-3000')).toBeTruthy();
    expect(view.getByText('Quick set · up to 3,000 WPM')).toBeTruthy();

    view.unmount();
  });
});
