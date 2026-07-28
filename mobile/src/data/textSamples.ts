import type { TextSample } from '../domain/types';
import { countWords } from '../domain/wpm';
import { ADDITIONAL_BASELINE_TEXT_SAMPLES } from './additionalBaselineTextSamples';

export const TEXT_SAMPLES: TextSample[] = [
  {
    id: 'sample-1',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Warm-up: Focus & Pace',
    language: 'en',
    genre: 'practical',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: 'Original content for this application',
    accessibilityNotes: 'Plain-language connected text with no image-dependent information.',
    text:
      'Efficient reading combines attention, practice, pacing, and a clear understanding check. '
      + 'A useful starting point is to reduce distractions and choose a pace you can sustain. '
      + 'Start with short sessions. Read with a clear goal: understand the main point, then recall two supporting details. '
      + 'If you feel yourself drifting, pause, take one breath, and restart with a slightly slower pace. '
      + 'Across several sessions, compare whether your comfortable speed changes while recall stays accurate. '
      + 'A practical warm-up is to read for one minute, stop, and write down what you remember without looking back. '
      + 'If you can recall the idea and at least one example, your pace is appropriate. '
      + 'If you recall almost nothing, slow down just enough to stay engaged, then try again. '
      + 'Training is about consistency: small improvements repeated daily beat big bursts once a month.',
    question: {
      prompt: 'What should you prioritize first?',
      choices: ['Raw speed', 'Comprehension', 'Skipping lines', 'Reading aloud'],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'sample-1-main',
        prompt: 'What should you prioritize first?',
        choices: ['Raw speed', 'Comprehension', 'Skipping lines', 'Reading aloud'],
        correctIndex: 1,
        type: 'main-idea',
        rationale: 'The passage repeatedly makes useful pace depend on retained meaning.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-1-detail',
        prompt: 'What does the passage recommend when recall is almost empty?',
        choices: ['Add distractions', 'Stop practicing', 'Slow down enough to stay engaged', 'Skip the understanding check'],
        correctIndex: 2,
        type: 'detail-evidence',
        rationale: 'The passage explicitly recommends a slightly slower, engaged retry.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-1-purpose',
        prompt: 'Why does the author compare several sessions?',
        choices: ['To see whether comfortable speed changes while recall remains accurate', 'To reward one unusually fast attempt', 'To remove supporting details', 'To replace reading with memory drills'],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale: 'Several sessions show whether pace changes consistently without losing recall.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'sample-2',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Previewing: Read the Map',
    language: 'en',
    genre: 'practical',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: 'Original content for this application',
    accessibilityNotes: 'Plain-language connected text with no image-dependent information.',
    text:
      'Previewing is a fast way to build a “map” of what you are about to read. '
      + 'Before you start, spend 20–40 seconds scanning the title, headings, subheadings, and any bold terms. '
      + 'Look for repeated words and note the structure: is it a list, a problem-and-solution, or an argument with evidence? '
      + 'Then ask yourself one question you want the text to answer. '
      + 'When you read the full passage, your attention now has a specific target. '
      + 'Previewing also helps you spot what to ignore. Not every sentence is equally important. '
      + 'If you know the section is giving background, you can read it faster. '
      + 'If you know a section contains a definition or key constraint, you can slow down briefly and read precisely. '
      + 'After previewing, you should be able to say, in one sentence, what you expect the passage to be about.',
    question: {
      prompt: 'What is the main purpose of previewing?',
      choices: [
        'To memorize every detail before reading',
        'To build a structure and goal for reading',
        'To increase font size automatically',
        'To avoid reading the full passage',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'sample-2-main',
        prompt: 'What is the main purpose of previewing?',
        choices: ['To memorize every detail before reading', 'To build a structure and goal for reading', 'To increase font size automatically', 'To avoid reading the full passage'],
        correctIndex: 1,
        type: 'main-idea',
        rationale: 'The passage defines previewing as building a map and a question before full reading.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-2-detail',
        prompt: 'Which part should receive slower, more precise reading?',
        choices: ['Repeated background only', 'Every sentence equally', 'The title after finishing', 'A definition or key constraint'],
        correctIndex: 3,
        type: 'detail-evidence',
        rationale: 'The passage names definitions and key constraints as places to slow down.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-2-purpose',
        prompt: 'How does the preview question affect the full reading?',
        choices: ['It gives attention a specific target', 'It guarantees every detail is remembered', 'It removes the need to read', 'It hides the text structure'],
        correctIndex: 0,
        type: 'inference-purpose',
        rationale: 'The author says the question gives attention a target during full reading.',
        answerDependency: 'passage-required',
      },
    ],
  },
  {
    id: 'sample-3',
    version: 1,
    comparisonBand: 'general-practice-brief-v1',
    title: 'Repeated Reading: Use Familiarity',
    language: 'en',
    genre: 'argument',
    complexityBand: 'baseline-brief',
    source: 'Original editorial content',
    license: 'Original content for this application',
    accessibilityNotes: 'Plain-language connected text with no image-dependent information.',
    text:
      'Reading a short passage more than once changes the job your attention must do. '
      + 'The first pass is for building a clear mental map of the ideas. '
      + 'On the second pass, names, transitions, and sentence structures are already familiar. '
      + 'That familiarity lets you focus on smoother phrasing and connections between ideas. '
      + 'Time both passes, but do not treat a faster second pass as success by itself. '
      + 'After the passage disappears, state its main idea and answer a detail question. '
      + 'If recall remains clear, the new pace may be useful. '
      + 'If recall weakens, repeat at a more comfortable pace and look for the relationship between each sentence. '
      + 'Use short, meaningful passages so the comparison stays focused. '
      + 'The aim is fluent understanding, not racing through words you no longer remember.',
    question: {
      prompt: 'What makes a faster second pass useful?',
      choices: [
        'It uses a much longer passage',
        'The reader still recalls the meaning',
        'It removes every difficult sentence',
        'The timer is hidden',
      ],
      correctIndex: 1,
    },
    questions: [
      {
        id: 'sample-3-main',
        prompt: 'What makes a faster second pass useful?',
        choices: ['It uses a much longer passage', 'The reader still recalls the meaning', 'It removes every difficult sentence', 'The timer is hidden'],
        correctIndex: 1,
        type: 'main-idea',
        rationale: 'The passage accepts a faster reread only when recall remains clear.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-3-detail',
        prompt: 'What is the first pass meant to build?',
        choices: ['A clear mental map of the ideas', 'A list of unfamiliar fonts', 'A race against another reader', 'A set of skipped sentences'],
        correctIndex: 0,
        type: 'detail-evidence',
        rationale: 'The passage explicitly assigns the mental map to the first pass.',
        answerDependency: 'passage-required',
      },
      {
        id: 'sample-3-purpose',
        prompt: 'Why should the passage be short and meaningful?',
        choices: ['To guarantee the second pass is faster', 'To avoid checking recall', 'To keep the comparison focused', 'To make every sentence familiar in advance'],
        correctIndex: 2,
        type: 'inference-purpose',
        rationale: 'The passage says short, meaningful material keeps the comparison focused.',
        answerDependency: 'passage-required',
      },
    ],
  },
  ...ADDITIONAL_BASELINE_TEXT_SAMPLES,
  {
    id: 'sample-4',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Targeted Rereading: Return with a Question',
    text:
      'Rereading is useful when it has a clear purpose. '
      + 'When a sentence feels uncertain, first finish the paragraph and try to name what is missing. '
      + 'You may need the definition of a term, the cause of an event, or the evidence for a claim. '
      + 'Turn that gap into a specific question before moving your eyes backward. '
      + 'Then return to the smallest section likely to contain the answer. '
      + 'This is different from drifting across several earlier lines without knowing what you need. '
      + 'After the targeted reread, answer your question in your own words and continue. '
      + 'Some difficult arguments deserve several careful passes, so rereading is not a failure. '
      + 'The efficiency comes from choosing the right section and checking that it resolved the confusion. '
      + 'A precise return can save time while protecting understanding.',
    question: {
      prompt: 'What should guide a targeted reread?',
      choices: [
        'A specific question about what is missing',
        'A rule to reread every line twice',
        'The longest paragraph on the page',
        'A goal of skipping the difficult idea',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'sample-5',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Pointer Pace: Guide Your Eyes',
    text:
      'A simple pointer, such as a finger or pen, can act as a visible pace cue. '
      + 'Move the pointer smoothly under the line at a comfortable pace. '
      + 'Your eyes naturally follow motion, which reduces hesitation and encourages consistent scanning. '
      + 'Start slower than you think you need, then increase speed by small steps. '
      + 'The goal is not to force speed, but to prevent stalls and reduce unnecessary fixation. '
      + 'If you lose comprehension, slow the pointer slightly and keep reading forward. '
      + 'A pointer is especially helpful when you feel your gaze “sticking” on certain words. '
      + 'Instead of negotiating with yourself on every sentence, you outsource pacing to the pointer. '
      + 'To avoid fatigue, keep the movement light and smooth. '
      + 'In practice sessions, measure your WPM with and without a pointer and compare comprehension.',
    question: {
      prompt: 'Why can using a pointer help?',
      choices: [
        'It makes the text brighter',
        'It guides eye movement and reduces hesitation',
        'It replaces comprehension questions',
        'It removes the need to practice',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-6',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Retrieval: Close the Text',
    text:
      'It is easy to mistake recognition for memory when the passage remains visible. '
      + 'To check what you actually learned, close or hide the text after a short section. '
      + 'State the main idea without looking, then add one supporting detail. '
      + 'Next, reopen the passage and compare your answer with the author’s claim. '
      + 'Do not score yourself only on matching exact words. '
      + 'A useful response preserves the relationship between ideas in your own language. '
      + 'Immediate feedback matters because it corrects missing or distorted details before they become familiar. '
      + 'If retrieval is difficult, shorten the section or slow the next reading pass. '
      + 'If retrieval is accurate, gradually work with longer or denser material. '
      + 'This cycle keeps understanding visible while you practice reading efficiently.',
    question: {
      prompt: 'Why should the passage be hidden during retrieval?',
      choices: [
        'To make the font smaller',
        'To reveal what the reader can recall without cues',
        'To prevent feedback',
        'To avoid forming a main idea',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-7',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Main Idea: Separate Claim from Support',
    text:
      'A main idea tells what the whole paragraph is trying to establish. '
      + 'Supporting details explain, illustrate, or provide evidence for that central point. '
      + 'Readers often remember a vivid example while missing the claim the example was meant to support. '
      + 'To avoid that mistake, ask what the details have in common and why the author included them. '
      + 'Transition words can help: “for example” usually introduces support, while “therefore” may signal a conclusion. '
      + 'After reading, express the main idea as one complete sentence. '
      + 'It should be broad enough to cover the paragraph but specific enough to exclude unrelated topics. '
      + 'Then name one detail and explain how it supports your sentence. '
      + 'If the connection is weak, revise the main idea rather than collecting more isolated facts. '
      + 'This habit gives faster reading a clear target: the structure of meaning.',
    question: {
      prompt: 'How can you test whether a main idea fits?',
      choices: [
        'Check whether the supporting details connect to it',
        'Choose the most vivid example',
        'Copy the longest sentence',
        'Ignore transition words',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'sample-8',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Comprehension: One-Sentence Summary',
    text:
      'Speed without understanding is not useful. '
      + 'A strong comprehension habit is to summarize each paragraph in one sentence. '
      + 'The summary should capture the main claim and the most important support. '
      + 'If you cannot summarize, it often means you read too quickly or your attention drifted. '
      + 'In that case, reread only the key sentence (often the first or last), then try again. '
      + 'This trains you to extract meaning quickly rather than collecting random details. '
      + 'Over time, summarizing becomes automatic, and you learn to look for structure while reading. '
      + 'A good summary is short and concrete. It avoids copying phrases from the text and instead uses your own words. '
      + 'If you can summarize and also name one example, you likely understood the paragraph well. '
      + 'This habit makes speed improvements safer because comprehension stays in the loop.',
    question: {
      prompt: 'What does the one-sentence summary habit train?',
      choices: [
        'Extracting meaning quickly',
        'Avoiding reading entirely',
        'Replacing practice with guessing',
        'Increasing screen brightness',
      ],
      correctIndex: 0,
    },
  },
  {
    id: 'sample-9',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Skimming: Find the Backbone',
    text:
      'Skimming is a targeted strategy for finding the backbone of a text. '
      + 'You focus on topic sentences, transitions (however, therefore, because), and repeated keywords. '
      + 'You are looking for the author’s main point and how each paragraph contributes. '
      + 'Skimming works best when you have a specific question to answer. '
      + 'If you need full detail later, skimming still helps because it tells you where the details are located. '
      + 'In training, try skimming first, then reading normally to compare your understanding. '
      + 'Skimming is not the same as skipping. You are sampling the structure, not avoiding effort. '
      + 'After skimming, you should be able to predict what each paragraph is for: definition, example, evidence, or conclusion. '
      + 'When you later read in full, your brain has a framework to attach details to. '
      + 'This reduces rereads because you know where information belongs.',
    question: {
      prompt: 'What should you focus on while skimming?',
      choices: ['Topic sentences and transitions', 'Every adjective', 'Only footnotes', 'Random lines'],
      correctIndex: 0,
    },
  },
  {
    id: 'sample-10',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Deep Read: Slow Down Strategically',
    text:
      'Not every paragraph deserves the same speed. '
      + 'A good reader changes pace based on importance and difficulty. '
      + 'When you hit a dense section, slow down strategically: identify definitions, note the key relationship (cause, contrast, example), and reread a single sentence if needed. '
      + 'Then speed up again on simpler parts. '
      + 'This flexible pacing keeps you efficient while maintaining accuracy. '
      + 'In practice, your goal is not to read fast all the time, but to read at the fastest pace that still produces understanding. '
      + 'A useful mental model is “budget your attention.” Spend it where it creates the most value. '
      + 'For a key paragraph, slow down and extract meaning carefully. For repeated background, move faster. '
      + 'After finishing, ask: did I learn what I came for? If yes, your speed was correct. '
      + 'If not, adjust and try again with a slightly slower pace in the critical sections.',
    question: {
      prompt: 'What is “flexible pacing” in this context?',
      choices: [
        'Reading fast all the time',
        'Changing speed based on difficulty and importance',
        'Skipping difficult sections permanently',
        'Never rereading any sentence',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-11',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Vocabulary: Context Clues',
    text:
      'Encountering unfamiliar words can slow reading significantly. '
      + 'Rather than stopping to look up every word, skilled readers use context clues to infer meaning. '
      + 'Look at the sentence structure: is the unknown word a noun, verb, or adjective? '
      + 'Check for definitions in the surrounding text—authors often explain terms right after introducing them. '
      + 'Watch for signal words like "meaning," "that is," or "in other words." '
      + 'If the text provides an example, use it to narrow down the definition. '
      + 'Sometimes the overall tone helps: is the word positive, negative, or neutral in context? '
      + 'After making a guess, continue reading. If the passage starts to make sense, your guess was likely correct. '
      + 'If comprehension breaks down, mark the word and look it up later. '
      + 'Building vocabulary this way is efficient because you learn words in meaningful contexts.',
    question: {
      prompt: 'What is the best first step when you encounter an unfamiliar word?',
      choices: [
        'Skip the entire paragraph',
        'Use context clues to infer meaning',
        'Stop reading immediately',
        'Guess randomly',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-12',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Active Reading: Ask Questions',
    text:
      'Passive reading is when your eyes move but your mind wanders. '
      + 'Active reading involves constantly asking questions: What is the main point? Why does this matter? How does this connect to what I already know? '
      + 'Before starting a section, formulate a question you want answered. '
      + 'As you read, look for the answer. This keeps your attention engaged. '
      + 'When you finish a paragraph, pause briefly and check: did I get my answer? '
      + 'If not, either the answer is coming or you need to reread more carefully. '
      + 'Active reading also involves predicting. After reading a topic sentence, guess what the paragraph will explain. '
      + 'When your prediction is confirmed or corrected, learning is reinforced. '
      + 'This approach transforms reading from a passive activity into a dialogue with the text. '
      + 'The result is better retention and deeper understanding.',
    question: {
      prompt: 'What is a key characteristic of active reading?',
      choices: [
        'Reading without thinking',
        'Constantly asking questions while reading',
        'Avoiding all predictions',
        'Never pausing between paragraphs',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-13',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Note-Taking: Capture Key Ideas',
    text:
      'Taking notes while reading can significantly improve retention. '
      + 'The goal is not to copy the text but to capture key ideas in your own words. '
      + 'After each major section, write a brief summary: one to three sentences maximum. '
      + 'Include the main claim and one supporting detail or example. '
      + 'This forces you to process the information actively rather than passively. '
      + 'Keep notes simple: use bullet points, abbreviations, and diagrams if helpful. '
      + 'Review your notes after finishing the reading to reinforce memory. '
      + 'If you cannot summarize a section, that is a signal to reread it more carefully. '
      + 'Over time, note-taking becomes faster and more efficient. '
      + 'Your notes become a valuable resource for future reference and review.',
    question: {
      prompt: 'What is the main goal of note-taking while reading?',
      choices: [
        'Copy the text word for word',
        'Capture key ideas in your own words',
        'Write as much as possible',
        'Avoid thinking about the content',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-14',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Focus: Minimize Distractions',
    text:
      'Reading speed depends heavily on focus. '
      + 'External distractions like noise, notifications, and interruptions fragment attention. '
      + 'Before a reading session, silence your phone and close unnecessary browser tabs. '
      + 'Choose a quiet environment when possible. '
      + 'Internal distractions are equally problematic: wandering thoughts, anxiety, and fatigue all reduce reading efficiency. '
      + 'If your mind wanders, note what distracted you, then gently return to the text. '
      + 'Do not punish yourself—distraction is normal and can be managed with practice. '
      + 'Short, focused sessions often work better than long, unfocused ones. '
      + 'Try reading for 20 to 25 minutes, then taking a brief break. '
      + 'With consistent practice, your ability to maintain focus will improve.',
    question: {
      prompt: 'What should you do when your mind wanders while reading?',
      choices: [
        'Stop reading entirely',
        'Note the distraction and gently return to the text',
        'Punish yourself harshly',
        'Read faster to make up for lost time',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-15',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Retention: Space Your Practice',
    text:
      'Memory research shows that spacing practice over time improves retention. '
      + 'Instead of reading a long passage once and moving on, revisit key material after a day, then after a week. '
      + 'This technique, called spaced repetition, helps transfer information to long-term memory. '
      + 'When you first read something, you understand it but may not remember it later. '
      + 'Each review strengthens the memory trace and reduces forgetting. '
      + 'Spaced repetition works best when combined with active recall: try to remember the material before rereading. '
      + 'If you can recall the main points, the review reinforces them. '
      + 'If you cannot, the reread fills the gaps. '
      + 'This approach is efficient because you focus on what you are forgetting. '
      + 'Over time, well-spaced material becomes highly durable in memory.',
    question: {
      prompt: 'What is spaced repetition?',
      choices: [
        'Reading as fast as possible',
        'Revisiting material at increasing intervals',
        'Never reviewing what you read',
        'Reading multiple books at once',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-16',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Pace: Protect the Accuracy Boundary',
    text:
      'Reading pace and comprehension must be evaluated together. '
      + 'A higher words-per-minute result is not an improvement when the reader can no longer explain the passage. '
      + 'Start with a pace that produces an accurate main idea and supporting detail. '
      + 'On the next attempt, increase speed only a little. '
      + 'Use the same kind of recall check each time so the comparison remains meaningful. '
      + 'When accuracy drops, return to the last pace that preserved understanding. '
      + 'Different texts need different boundaries: a familiar story may allow a quicker pace than a new technical argument. '
      + 'Fatigue, distractions, and vocabulary also move the boundary from day to day. '
      + 'Record both pace and comprehension instead of treating one number as a complete score. '
      + 'The useful target is the fastest sustainable pace for the current purpose and material.',
    question: {
      prompt: 'When does a higher WPM count as useful improvement?',
      choices: [
        'Whenever the number is larger',
        'When comprehension remains accurate',
        'Only when the text is very easy',
        'When the recall check is removed',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-17',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Layout: Remove Unnecessary Friction',
    text:
      'A difficult reading layout can consume attention before the ideas do. '
      + 'Very small type, weak contrast, crowded lines, and constant notifications all add friction. '
      + 'Before a longer session, choose a comfortable text size and a line width that does not force your eyes to search for the next line. '
      + 'Use enough line spacing to keep neighboring rows distinct. '
      + 'Increase contrast when glare or dim light makes letters harder to identify. '
      + 'Silence interruptions and keep only the material you need on screen. '
      + 'These changes do not teach comprehension by themselves, but they make it easier to give the text steady attention. '
      + 'If a setting creates eye strain, headaches, or repeated loss of place, change it instead of forcing the session. '
      + 'A readable layout should feel quiet and predictable. '
      + 'That leaves more effort available for understanding and remembering the author’s ideas.',
    question: {
      prompt: 'What is the purpose of improving the reading layout?',
      choices: [
        'To remove every difficult idea',
        'To reduce visual and attentional friction',
        'To replace comprehension practice',
        'To make every line as long as possible',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-18',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Text Structure: Recognize Patterns',
    text:
      'Most texts follow predictable structures. '
      + 'Common patterns include: problem-solution, compare-contrast, cause-effect, and chronological order. '
      + 'Recognizing the structure helps you anticipate content and read more efficiently. '
      + 'Look for signal words: "however" suggests contrast, "therefore" indicates cause-effect, "first" and "next" suggest sequence. '
      + 'When you identify the pattern, you know what to expect next. '
      + 'This reduces surprise and allows faster processing. '
      + 'For example, if you see "problem-solution," expect the solution after the problem is described. '
      + 'Academic texts often state the structure explicitly in the introduction. '
      + 'Business documents frequently use executive summaries and bullet points. '
      + 'Understanding structure is a meta-skill that improves all reading.',
    question: {
      prompt: 'How does recognizing text structure help reading?',
      choices: [
        'It makes the text longer',
        'It helps anticipate content and read more efficiently',
        'It eliminates the need to read',
        'It replaces comprehension',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-19',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Practice: Consistency Over Intensity',
    text:
      'Like any skill, reading speed improves with consistent practice. '
      + 'Short daily sessions are more effective than occasional long sessions. '
      + 'Aim for 15 to 20 minutes of focused practice each day. '
      + 'During practice, use a variety of techniques: chunking, pointer pacing, timed reading, and comprehension checks. '
      + 'Track your progress by measuring words per minute weekly. '
      + 'Celebrate small improvements—they compound over time. '
      + 'Do not expect dramatic gains overnight. '
      + 'Reading speed typically improves by 50 to 100 words per minute over several weeks of practice. '
      + 'Consistency builds habits, and habits become automatic. '
      + 'The goal is to make efficient reading your default mode, not a special effort.',
    question: {
      prompt: 'What is more effective for improving reading speed?',
      choices: [
        'Occasional long practice sessions',
        'Consistent short daily sessions',
        'Reading only once per month',
        'Avoiding all practice',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-20',
    comparisonBand: 'general-practice-brief-v1',
    title: 'Assessment: Measure Your Progress',
    text:
      'Regular assessment helps you track improvement and identify weaknesses. '
      + 'Measure your reading speed in words per minute using timed reading exercises. '
      + 'Also assess comprehension by answering questions about what you read. '
      + 'Speed without comprehension is not real progress. '
      + 'Keep a simple log: date, text type, WPM, and comprehension score. '
      + 'Look for trends over time. Is your speed increasing? Is comprehension stable or improving? '
      + 'If comprehension drops as speed increases, slow down slightly and rebuild. '
      + 'Assessments also reveal which text types challenge you most. '
      + 'You might read fiction quickly but struggle with technical material. '
      + 'Targeted practice on weak areas accelerates overall improvement.',
    question: {
      prompt: 'Why is assessment important for speed reading?',
      choices: [
        'It replaces the need for practice',
        'It helps track improvement and identify weaknesses',
        'It eliminates comprehension requirements',
        'It makes reading unnecessary',
      ],
      correctIndex: 1,
    },
  },
];

export const BASELINE_TEXT_SAMPLES = TEXT_SAMPLES.filter(
  (sample) => sample.complexityBand === 'baseline-brief'
);

export function validateBaselineTextSamples(
  samples: readonly TextSample[] = BASELINE_TEXT_SAMPLES
): string[] {
  const errors: string[] = [];
  if (new Set(samples.map((sample) => sample.id)).size < 3) {
    errors.push('Baseline requires at least three distinct passage IDs');
  }
  for (const sample of samples) {
    const wordCount = countWords(sample.text);
    if (typeof sample.version !== 'number') {
      errors.push(`${sample.id}: baseline content version required`);
    }
    if (!sample.comparisonBand.trim()) {
      errors.push(`${sample.id}: authored comparison band required`);
    }
    if ((sample.questions?.length ?? 0) < 3) {
      errors.push(`${sample.id}: at least three dependent questions required`);
    }
    if (wordCount < 120 || wordCount > 220) {
      errors.push(
        `${sample.id}: expected 120–220 words, received ${wordCount}`
      );
    }
    if (
      new Set(sample.questions?.map((question) => question.type)).size < 3
    ) {
      errors.push(`${sample.id}: main idea, detail, and inference required`);
    }
    for (const question of sample.questions ?? []) {
      if (!question.rationale.trim()) {
        errors.push(`${sample.id}/${question.id}: rationale required`);
      }
      if (question.answerDependency !== 'passage-required') {
        errors.push(`${sample.id}/${question.id}: passage dependency required`);
      }
      if (
        question.correctIndex < 0 ||
        question.correctIndex >= question.choices.length
      ) {
        errors.push(`${sample.id}/${question.id}: invalid correct answer`);
      }
    }
  }
  return errors;
}
