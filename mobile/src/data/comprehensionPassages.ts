export type ComprehensionQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type ComprehensionPassage = {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  challenge: 'explicit-detail' | 'idea-linking' | 'inference';
  text: string;
  questions: ComprehensionQuestion[];
};

export const COMPREHENSION_PASSAGES: Record<
  ComprehensionPassage['difficulty'],
  ComprehensionPassage
> = {
  easy: {
    id: 'seed-library',
    difficulty: 'easy',
    challenge: 'explicit-detail',
    text: 'A neighborhood seed library lets gardeners borrow packets of vegetable and flower seeds. Members take only what they plan to plant. At the end of the season, they may save seeds from healthy plants and return some to the library. Clear labels help the next gardener know the plant name and the year it was collected.',
    questions: [
      {
        question: 'What may members return at the end of the season?',
        options: ['Garden tools', 'Saved seeds', 'Empty soil bags', 'Library cards'],
        correctIndex: 1,
      },
      {
        question: 'Why are clear labels useful?',
        options: ['They identify the seeds for the next gardener', 'They make plants grow faster', 'They replace seed packets', 'They record the weather'],
        correctIndex: 0,
      },
    ],
  },
  medium: {
    id: 'cool-roofs',
    difficulty: 'medium',
    challenge: 'idea-linking',
    text: 'Dark roofs absorb much of the sunlight that reaches them and release some of that energy as heat. A reflective “cool roof” absorbs less energy, which can reduce indoor temperatures and summer air-conditioning demand. The benefit varies, however. Insulation, local climate, roof design, and winter heating needs all affect the total energy savings. Cool roofs are therefore a useful tool, but not an identical solution for every building.',
    questions: [
      {
        question: 'How can a reflective roof reduce cooling demand?',
        options: ['It absorbs less solar energy', 'It adds more winter heating', 'It removes insulation', 'It stores rainwater'],
        correctIndex: 0,
      },
      {
        question: 'What is the author’s main qualification?',
        options: ['Every roof produces the same savings', 'Roof color matters only in winter', 'Benefits depend on building and climate conditions', 'Insulation prevents all heat transfer'],
        correctIndex: 2,
      },
    ],
  },
  hard: {
    id: 'measurement-proxy',
    difficulty: 'hard',
    challenge: 'inference',
    text: 'Organizations often measure what is easy to count rather than the outcome they actually value. A support team, for example, may reward short call times even though customers value accurate solutions. Once a proxy becomes a target, workers reasonably adapt their behavior to improve the proxy, sometimes at the expense of the original goal. This does not make measurement useless. It means a metric should be treated as partial evidence, checked against the outcome it was chosen to represent, and revised when the two begin to diverge.',
    questions: [
      {
        question: 'Why can rewarding short call times reduce service quality?',
        options: ['Workers may optimize speed instead of accurate solutions', 'Customers always prefer longer calls', 'Call duration cannot be measured', 'Support teams do not need goals'],
        correctIndex: 0,
      },
      {
        question: 'Which policy best follows the author’s recommendation?',
        options: ['Use one metric permanently', 'Stop measuring all work', 'Compare call time with resolution quality and revise incentives', 'Reward only the fastest worker'],
        correctIndex: 2,
      },
    ],
  },
};
