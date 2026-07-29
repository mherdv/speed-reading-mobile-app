import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve(__dirname, '..');

function listGameSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listGameSources(entryPath);
    if (!entry.name.endsWith('.tsx') || entry.name.endsWith('.test.tsx')) {
      return [];
    }
    return [entryPath];
  });
}

describe('non-selectable training text', () => {
  it.each([
    'screens/GameScreen.tsx',
    'screens/ExerciseScreen.tsx',
    'screens/ResultScreen.tsx',
  ])('%s disables browser text selection at the surface', (relativePath) => {
    const source = fs.readFileSync(
      path.join(SOURCE_ROOT, relativePath),
      'utf8'
    );
    expect(source).toContain("userSelect: 'none'");
  });

  it('does not opt game or measured-reading text back into copy selection', () => {
    const sources = [
      ...listGameSources(path.join(SOURCE_ROOT, 'games')),
      path.join(SOURCE_ROOT, 'screens/ExerciseScreen.tsx'),
    ];

    for (const sourcePath of sources) {
      const source = fs.readFileSync(sourcePath, 'utf8');
      expect(source).not.toMatch(/\bselectable(?:\s|=)/);
    }
  });
});
