import fs from 'node:fs';
import path from 'node:path';

const GAMES_ROOT = __dirname;
const AFFECTED = [
  'EyeMovementTraining/EyeMovementTraining.tsx',
  'LetterJumble/LetterJumble.tsx',
  'EvenNumbers/EvenNumbers.tsx',
  'SchulteMix/SchulteMix.tsx',
  'MemoryRecall/MemoryRecall.tsx',
  'VisualSpanExpansion/VisualSpanExpansion.tsx',
  'TimedWordRecognition/TimedWordRecognition.tsx',
  'WordMismatchGrid/WordMismatchGrid.tsx',
  'LetterRecognition/LetterRecognition.tsx',
];

describe('reviewed timeout usage', () => {
  it.each(AFFECTED)('%s has no untracked replay/focus/feedback timeout', (file) => {
    const source = fs.readFileSync(path.join(GAMES_ROOT, file), 'utf8');
    expect(source).not.toMatch(/setTimeout\s*\(\s*start/);
    expect(source).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>\s*start/);
    expect(source).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>\s*inputRef/);
    expect(source).not.toMatch(/setTimeout\s*\(\s*\(\)\s*=>\s*setFeedback/);
  });
});
