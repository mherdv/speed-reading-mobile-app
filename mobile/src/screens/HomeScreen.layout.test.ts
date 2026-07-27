import {
  getHomeGameIconColumns,
  HOME_GAME_ICON_COLUMNS,
} from './HomeScreen';

describe('HomeScreen compact game grid', () => {
  it('uses three icon-first exercises per row', () => {
    expect(HOME_GAME_ICON_COLUMNS).toBe(3);
    expect(getHomeGameIconColumns()).toBe(3);
  });
});
