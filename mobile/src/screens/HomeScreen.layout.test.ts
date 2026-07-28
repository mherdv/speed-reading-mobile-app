import {
  getHomeGameIconColumns,
  HOME_GAME_ICON_COLUMNS,
  HOME_GAME_ICON_COLUMNS_WIDE,
  HOME_GAME_TILE_MIN_WIDTH,
} from './HomeScreen';

describe('HomeScreen responsive game grid', () => {
  it('uses three icon-first exercises when four minimum-width tiles do not fit', () => {
    expect(HOME_GAME_ICON_COLUMNS).toBe(3);
    expect(getHomeGameIconColumns(HOME_GAME_TILE_MIN_WIDTH * 4 - 1)).toBe(3);
  });

  it('uses four icon-first exercises when each tile can keep its minimum width', () => {
    expect(HOME_GAME_ICON_COLUMNS_WIDE).toBe(4);
    expect(getHomeGameIconColumns(HOME_GAME_TILE_MIN_WIDTH * 4)).toBe(4);
  });
});
