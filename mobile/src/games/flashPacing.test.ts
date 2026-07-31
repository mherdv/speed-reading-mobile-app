import {
  createFlashPaceState,
  displayDurationForWpm,
  MIN_FLASH_DISPLAY_MS,
  RAPID_FLASH_MAX_WPM,
  updateFlashPace,
  wpmForDisplayDuration,
} from './flashPacing';

const bounds = { minWpm: 100, maxWpm: 400, step: 25 };

describe('flash pacing', () => {
  it('converts one-word display duration to and from WPM', () => {
    expect(displayDurationForWpm(300)).toBe(200);
    expect(wpmForDisplayDuration(200)).toBe(300);
    expect(displayDurationForWpm(240, 4)).toBe(1000);
  });

  it('supports rapid one-word and proportional phrase flashes at 3,000 WPM', () => {
    expect(RAPID_FLASH_MAX_WPM).toBe(3000);
    expect(MIN_FLASH_DISPLAY_MS).toBe(20);
    expect(displayDurationForWpm(RAPID_FLASH_MAX_WPM)).toBe(20);
    expect(displayDurationForWpm(RAPID_FLASH_MAX_WPM, 5)).toBe(100);
  });

  it('increases by one step after four consecutive correct answers by default', () => {
    let state = createFlashPaceState(200);
    state = updateFlashPace(state, true, bounds);
    state = updateFlashPace(state, true, bounds);
    state = updateFlashPace(state, true, bounds);
    expect(state.wpm).toBe(200);
    state = updateFlashPace(state, true, bounds);
    expect(state.wpm).toBe(225);
    expect(state.changes).toBe(1);
  });

  it('supports an eight-answer threshold without lowering pace on misses', () => {
    const recognitionBounds = {
      ...bounds,
      correctAnswersToIncrease: 8,
      missesToDecrease: null,
    };
    let state = createFlashPaceState(200);
    for (let index = 0; index < 7; index += 1) {
      state = updateFlashPace(state, true, recognitionBounds);
    }
    expect(state.wpm).toBe(200);

    state = updateFlashPace(state, true, recognitionBounds);
    expect(state.wpm).toBe(225);

    state = updateFlashPace(state, false, recognitionBounds);
    state = updateFlashPace(state, false, recognitionBounds);
    state = updateFlashPace(state, false, recognitionBounds);
    expect(state.wpm).toBe(225);
    expect(state.missStreak).toBe(3);
  });

  it('lowers pace on each miss without losing the three-miss run', () => {
    let state = createFlashPaceState(200);
    state = updateFlashPace(state, false, {
      ...bounds,
      missesToDecrease: 1,
    });
    expect(state).toMatchObject({ wpm: 175, missStreak: 1 });
    state = updateFlashPace(state, false, {
      ...bounds,
      missesToDecrease: 1,
    });
    expect(state).toMatchObject({ wpm: 150, missStreak: 2 });
    state = updateFlashPace(state, false, {
      ...bounds,
      missesToDecrease: 1,
    });
    expect(state).toMatchObject({ wpm: 125, missStreak: 3 });
  });
});
