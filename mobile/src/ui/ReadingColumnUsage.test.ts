import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = path.resolve(__dirname, '..');
const DIRECT_READING_FLOWS = [
  'screens/ExerciseScreen.tsx',
  'games/EvidenceHunt/EvidenceHunt.tsx',
  'games/ContextBuilder/ContextBuilder.tsx',
  'games/RepeatedReading/RepeatedReading.tsx',
  'games/ComprehensionTest/ComprehensionTest.tsx',
  'games/MainIdeaSprint/MainIdeaSprint.tsx',
  'games/StructureScan/StructureScan.tsx',
  'games/TextSearch/TextSearch.tsx',
];

describe('shared direct-reading measure', () => {
  it.each(DIRECT_READING_FLOWS)(
    '%s wraps active connected text in ReadingColumn without a local 700px duplicate',
    (file) => {
      const source = fs.readFileSync(path.join(SOURCE_ROOT, file), 'utf8');
      expect(source).toContain('<ReadingColumn');
      expect(source).not.toMatch(/maxWidth:\s*700/);
    }
  );
});
