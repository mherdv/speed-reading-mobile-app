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
    await AsyncStorage.setItem(
      'speed-reading:today-plan:v2',
      JSON.stringify({ schemaVersion: 2, localDate: '2026-6-28' })
    );
    await AsyncStorage.setItem(
      'speed-reading:reading-display:v1',
      JSON.stringify({ fontScale: 1.1, lineHeightScale: 1.2 })
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
    expect(backup.entries['speed-reading:today-plan:v2']).toBeTruthy();
    expect(
      backup.entries['speed-reading:reading-display:v1']
    ).toBeTruthy();
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

  it('replaces app data so absent keys from an older backup do not linger', async () => {
    await AsyncStorage.setItem(
      'speed-reading:reading-display:v1',
      JSON.stringify({ theme: 'dark' })
    );
    await AsyncStorage.setItem('unrelated-key', JSON.stringify('keep'));

    await restoreDataBackup({
      app: BACKUP_APP_ID,
      version: BACKUP_VERSION,
      createdAtIso: '2026-07-28T10:00:00.000Z',
      entries: {
        'speed-reading:results:v1': JSON.stringify([{ id: 'restored' }]),
      },
    });

    expect(
      await AsyncStorage.getItem('speed-reading:reading-display:v1')
    ).toBeNull();
    expect(await AsyncStorage.getItem('unrelated-key')).toBe(
      JSON.stringify('keep')
    );
  });

  it('keeps current data when imported entries cannot be written', async () => {
    const currentResults = JSON.stringify([{ id: 'current' }]);
    const currentDisplay = JSON.stringify({ theme: 'dark' });
    await AsyncStorage.setItem('speed-reading:results:v1', currentResults);
    await AsyncStorage.setItem(
      'speed-reading:reading-display:v1',
      currentDisplay
    );
    const writeFailure = jest
      .spyOn(AsyncStorage, 'multiSet')
      .mockRejectedValueOnce(new Error('Storage unavailable'));

    await expect(
      restoreDataBackup({
        app: BACKUP_APP_ID,
        version: BACKUP_VERSION,
        createdAtIso: '2026-07-28T10:00:00.000Z',
        entries: {
          'speed-reading:results:v1': JSON.stringify([{ id: 'imported' }]),
        },
      })
    ).rejects.toThrow('Storage unavailable');

    expect(await AsyncStorage.getItem('speed-reading:results:v1')).toBe(
      currentResults
    );
    expect(
      await AsyncStorage.getItem('speed-reading:reading-display:v1')
    ).toBe(currentDisplay);
    writeFailure.mockRestore();
  });
});
