import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_LOW_CONTRAST_LIVE_COLORS = [
  '#8B5CF6',
  '#F59E0B',
  '#9CA3AF',
  '#22D3EE',
  '#4CAF50',
  '#F44336',
  '#059669',
];
const SEMANTIC_TEXT_SURFACES = [
  path.join(SOURCE_ROOT, 'games/TextSearch/TextSearch.tsx'),
  path.join(SOURCE_ROOT, 'ui/ProgressChart.tsx'),
  path.join(SOURCE_ROOT, 'ui/ProgressCharts.tsx'),
];
const RAW_HEX_COLOR = /#[0-9a-f]{3,8}\b/gi;

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    if (!entry.name.endsWith('.tsx') || entry.name.includes('.test.')) return [];
    return [target];
  });
}

describe('live contrast token usage', () => {
  it.each(FORBIDDEN_LOW_CONTRAST_LIVE_COLORS)(
    'does not use the known failing raw color %s in live TSX',
    (forbidden) => {
      const offenders = sourceFiles(SOURCE_ROOT)
        .filter((file) => fs.readFileSync(file, 'utf8').includes(forbidden))
        .map((file) => path.relative(SOURCE_ROOT, file));
      expect(offenders).toEqual([]);
    }
  );

  it.each(SEMANTIC_TEXT_SURFACES)(
    '%s expresses rendered text and surfaces through semantic theme tokens',
    (file) => {
      const source = fs.readFileSync(file, 'utf8');
      expect(source.match(RAW_HEX_COLOR) ?? []).toEqual([]);
    }
  );
});
