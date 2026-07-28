import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  createDataBackup,
  parseDataBackup,
  restoreDataBackup,
} from '../dataBackup';

describe('app data backup', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('exports only user-facing app data and restores it', async () => {
    await AsyncStorage.setItem(
      'speed-reading:results:v1',
      JSON.stringify([{ id: 'result-1' }])
    );
    await AsyncStorage.setItem('unrelated-key', JSON.stringify('ignore'));

    const backup = await createDataBackup(
      new Date('2026-07-28T10:00:00.000Z')
    );
    expect(backup).toMatchObject({
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      createdAtIso: '2026-07-28T10:00:00.000Z',
    });
    expect(backup.entries['speed-reading:results:v1']).toBeTruthy();
    expect(backup.entries['unrelated-key']).toBeUndefined();

    await AsyncStorage.clear();
    await restoreDataBackup(backup);
    expect(await AsyncStorage.getItem('speed-reading:results:v1')).toBe(
      JSON.stringify([{ id: 'result-1' }])
    );
  });

  it('rejects unrelated, unsupported, or damaged files', () => {
    expect(() => parseDataBackup('not-json')).toThrow(
      'not a valid SpeedRead backup'
    );
    expect(() =>
      parseDataBackup(
        JSON.stringify({ app: 'another-app', version: 1, entries: {} })
      )
    ).toThrow('not supported');
    expect(() =>
      parseDataBackup(
        JSON.stringify({
          app: BACKUP_APP_ID,
          version: BACKUP_VERSION,
          entries: { 'speed-reading:results:v1': '{damaged' },
        })
      )
    ).toThrow('damaged');
  });
});
