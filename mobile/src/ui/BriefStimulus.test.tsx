import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import {
  BRIEF_STIMULUS_MARKER_COLOR,
  BriefStimulus,
  estimateBriefStimulusLineCount,
  fitBriefStimulusFontSize,
  getBriefStimulusMaskFraction,
} from './BriefStimulus';

describe('BriefStimulus', () => {
  it('keeps the stimulus on one line and enables native font fitting', () => {
    const view = render(
      <BriefStimulus
        value="a deliberately long single-line phrase"
        difficulty="easy"
        testID="stimulus"
        maxFontSize={36}
        minFontSize={8}
      />
    );
    const stimulus = view.getByTestId('stimulus');

    expect(stimulus.props.numberOfLines).toBe(1);
    expect(stimulus.props.adjustsFontSizeToFit).toBe(true);
    expect(stimulus.props.minimumFontScale).toBeCloseTo(8 / 36);
    expect(view.queryByTestId('stimulus-mask')).toBeNull();
  });

  it('adds progressively deeper lower masks by difficulty', () => {
    expect(getBriefStimulusMaskFraction('easy')).toBe(0);
    expect(getBriefStimulusMaskFraction('medium')).toBe(0.18);
    expect(getBriefStimulusMaskFraction('hard')).toBe(0.38);

    const medium = render(
      <BriefStimulus
        value="focus"
        difficulty="medium"
        testID="medium-stimulus"
      />
    );
    const hard = render(
      <BriefStimulus
        value="focus"
        difficulty="hard"
        testID="hard-stimulus"
      />
    );

    expect(
      StyleSheet.flatten(medium.getByTestId('medium-stimulus-mask').props.style)
    ).toMatchObject({
      backgroundColor: BRIEF_STIMULUS_MARKER_COLOR,
      height: '18%',
      opacity: 1,
    });
    expect(
      StyleSheet.flatten(hard.getByTestId('hard-stimulus-mask').props.style)
    ).toMatchObject({
      backgroundColor: BRIEF_STIMULUS_MARKER_COLOR,
      height: '38%',
      opacity: 1,
    });
  });

  it('accepts a gradual opaque marker override from the flash ladder', () => {
    const view = render(
      <BriefStimulus
        value="focus"
        difficulty="hard"
        testID="ladder-stimulus"
        maskFraction={0.1}
      />
    );

    expect(
      StyleSheet.flatten(
        view.getByTestId('ladder-stimulus-mask').props.style
      )
    ).toMatchObject({
      backgroundColor: BRIEF_STIMULUS_MARKER_COLOR,
      height: '10%',
      opacity: 1,
    });
  });

  it('allows phrases to wrap while keeping single words in strict one-line mode', () => {
    const view = render(
      <>
        <BriefStimulus
          value="singleword"
          difficulty="hard"
          testID="single-word"
        />
        <BriefStimulus
          value="a longer phrase that can break across readable lines"
          difficulty="hard"
          testID="wrapped-phrase"
          allowWrap
          maxLines={3}
        />
      </>
    );

    expect(view.getByTestId('single-word')).toHaveProp('numberOfLines', 1);
    expect(view.getByTestId('single-word')).toHaveProp(
      'adjustsFontSizeToFit',
      true
    );
    expect(view.getByTestId('wrapped-phrase')).toHaveProp('numberOfLines', 3);
    expect(view.getByTestId('wrapped-phrase')).toHaveProp(
      'adjustsFontSizeToFit',
      false
    );
    expect(
      estimateBriefStimulusLineCount(
        'a longer phrase that can break across readable lines',
        180,
        22,
        3
      )
    ).toBeGreaterThan(1);
  });

  it('reduces longer text before paint while respecting the minimum size', () => {
    const shortSize = fitBriefStimulusFontSize('focus', 320, 44, 8);
    const longSize = fitBriefStimulusFontSize(
      'the independent reviewer checks the complete record carefully',
      320,
      44,
      8
    );

    expect(shortSize).toBe(44);
    expect(longSize).toBeLessThan(shortSize);
    expect(longSize).toBeGreaterThanOrEqual(8);
    expect(
      fitBriefStimulusFontSize('extremely long '.repeat(20), 120, 44, 8)
    ).toBe(8);
  });
});
