import type { TextSample } from '../domain/types';

export const TEXT_SAMPLES: TextSample[] = [
  {
    id: 'sample-1',
    title: 'Warm-up: Focus & Pace',
    text:
      'Speed reading is a skill that combines attention, practice, and pacing. '
      + 'For most people, the fastest gains come from reducing distractions and learning to keep a steady rhythm. '
      + 'Start with short sessions. Read with a clear goal: understand the main point, then recall two supporting details. '
      + 'If you feel yourself drifting, pause, take one breath, and restart with a slightly slower pace. '
      + 'Over time, your “comfortable speed” increases, and you can push faster without losing accuracy. '
      + 'A practical warm-up is to read for one minute, stop, and write down what you remember without looking back. '
      + 'If you can recall the idea and at least one example, your pace is appropriate. '
      + 'If you recall almost nothing, slow down just enough to stay engaged, then try again. '
      + 'Training is about consistency: small improvements repeated daily beat big bursts once a month.',
    question: {
      prompt: 'What should you prioritize first?',
      choices: ['Raw speed', 'Comprehension', 'Skipping lines', 'Reading aloud'],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-2',
    title: 'Previewing: Read the Map',
    text:
      'Previewing is a fast way to build a “map” of what you are about to read. '
      + 'Before you start, spend 20–40 seconds scanning the title, headings, subheadings, and any bold terms. '
      + 'Look for repeated words and note the structure: is it a list, a problem-and-solution, or an argument with evidence? '
      + 'Then ask yourself one question you want the text to answer. '
      + 'When you read the full passage, your attention has a target, which reduces rereading and increases comprehension. '
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
  },
  {
    id: 'sample-3',
    title: 'Chunking: Group Words Together',
    text:
      'Many readers move their eyes word-by-word, which is slow and tiring. '
      + 'Chunking trains you to take in small groups of words in a single glance. '
      + 'Try reading in phrases, like “in the morning” or “as a result,” instead of splitting them into individual words. '
      + 'Start with short, meaningful groups, then gradually widen the chunk size. '
      + 'A helpful trick is to soften your focus slightly and keep your eyes moving forward. '
      + 'If comprehension drops, reduce chunk size and rebuild accuracy first. '
      + 'Chunking is not about guessing. It is about recognizing familiar patterns quickly. '
      + 'When you see “on the other hand,” you can process it as one unit. '
      + 'The more patterns you recognize, the fewer eye fixations you need per line, and the smoother reading becomes. '
      + 'A good checkpoint is to pause after a paragraph and explain it as if teaching a friend.',
    question: {
      prompt: 'What does “chunking” mean here?',
      choices: [
        'Reading only the first sentence',
        'Grouping words into phrases per glance',
        'Skipping paragraphs entirely',
        'Reading with your eyes closed',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-4',
    title: 'Regression Control: Fewer Back-Jumps',
    text:
      'Regressions are the small back-jumps your eyes make when attention slips or the text feels uncertain. '
      + 'A few regressions are normal, but frequent backtracking can cut your speed in half. '
      + 'To reduce regressions, keep a gentle forward momentum: commit to finishing the sentence before deciding to reread. '
      + 'When a line feels confusing, mark the key noun and verb, then continue. '
      + 'After the paragraph, do a quick recap in one sentence. '
      + 'This builds confidence and lowers the urge to immediately jump backward. '
      + 'If you truly missed a key point, do a targeted reread: return to the one sentence that contains the definition or claim. '
      + 'Avoid “wandering rereads” where you scan multiple lines hoping clarity appears. '
      + 'Targeted rereads are faster and train you to locate the important information. '
      + 'With practice, you will feel less anxious about missing details, which naturally reduces backtracking.',
    question: {
      prompt: 'What is a helpful strategy to reduce regressions?',
      choices: [
        'Reread every line twice',
        'Stop after every word',
        'Finish the sentence before deciding to reread',
        'Only read the last sentence',
      ],
      correctIndex: 2,
    },
  },
  {
    id: 'sample-5',
    title: 'Pointer Pace: Guide Your Eyes',
    text:
      'A simple pointer (your finger or a pen) can improve speed by guiding eye movement. '
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
    title: 'Metronome Rhythm: Steady Reading',
    text:
      'A metronome-like rhythm helps you maintain a consistent pace. '
      + 'Instead of speeding up and slowing down randomly, you keep a steady beat: one beat per phrase or per line. '
      + 'This reduces mental friction because your brain can anticipate the next movement. '
      + 'If the passage becomes harder, do not stop; reduce the beat slightly while keeping it regular. '
      + 'Consistency matters more than maximum speed during training. '
      + 'Once the rhythm feels easy, increase the tempo by a small amount. '
      + 'One way to practice is to set a timer for two minutes and aim for an even pace the entire time. '
      + 'At the end, write a one-sentence summary. If you can summarize accurately, your pace was sustainable. '
      + 'If you cannot, lower tempo and repeat. '
      + 'Sustainable speed is the foundation; sprinting without comprehension is just noise.',
    question: {
      prompt: 'What matters most during rhythm training?',
      choices: ['Maximum speed', 'Consistency of pace', 'Reading aloud', 'Skipping every other line'],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-7',
    title: 'Peripheral Awareness: Wider Attention',
    text:
      'Peripheral awareness is the ability to notice words near your focal point without staring at each one. '
      + 'You are not trying to read the entire line with your peripheral vision. '
      + 'Instead, you practice holding your focus in the middle while lightly noticing nearby words. '
      + 'Over time, this can help you form larger chunks and reduce fixation count. '
      + 'A practical cue: keep your head still, relax your eyes, and aim your attention slightly ahead of the current word group. '
      + 'If you feel tension around the eyes, take a break and restart gently. '
      + 'A simple drill is to place your gaze near the center of a line and try to “notice” the first and last word without moving your eyes. '
      + 'You do not need to be perfect; the point is to widen attention. '
      + 'As your awareness expands, you may find you can read with fewer stops per line. '
      + 'Always verify by checking comprehension, not by assuming it improved.',
    question: {
      prompt: 'What is the goal of peripheral awareness training?',
      choices: [
        'Reading only with peripheral vision',
        'Noticing nearby words to support larger chunks',
        'Never blinking while reading',
        'Memorizing the passage instantly',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-8',
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
  },  {
    id: 'sample-11',
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
    title: 'Eye Movement: Reduce Fixations',
    text:
      'Your eyes do not move smoothly across a line of text. '
      + 'Instead, they make small jumps called saccades and pause at points called fixations. '
      + 'Each fixation lasts about 200 to 250 milliseconds. '
      + 'Reducing the number of fixations per line increases reading speed. '
      + 'You can do this by widening your visual span and practicing chunking. '
      + 'Another technique is to start your first fixation a bit after the beginning of the line and end before the last word. '
      + 'Your peripheral vision can pick up the edges. '
      + 'Avoid fixating on every word; instead, land on meaningful clusters. '
      + 'With practice, you may reduce fixations from six or seven per line to three or four. '
      + 'Always balance speed gains with comprehension checks.',
    question: {
      prompt: 'What are fixations in the context of reading?',
      choices: [
        'Errors in understanding',
        'Pauses where the eyes rest on text',
        'Movements of the head',
        'Blinks during reading',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-17',
    title: 'Subvocalization: When to Reduce It',
    text:
      'Subvocalization is the habit of silently pronouncing words as you read. '
      + 'Almost everyone does it to some degree. '
      + 'While subvocalization can aid comprehension, especially for complex material, it also limits speed. '
      + 'You cannot speak faster than about 300 words per minute, so heavy subvocalization caps your reading rate. '
      + 'To reduce subvocalization, try humming or chewing gum while reading. '
      + 'Another method is to focus on meaning rather than the sound of words. '
      + 'When reading familiar or straightforward text, allow your eyes to move faster than your inner voice. '
      + 'For difficult material, some subvocalization may actually help understanding. '
      + 'The goal is not to eliminate it entirely but to use it strategically. '
      + 'With practice, you can modulate subvocalization based on text difficulty.',
    question: {
      prompt: 'Why does subvocalization limit reading speed?',
      choices: [
        'It makes the text harder to see',
        'You cannot speak faster than about 300 words per minute',
        'It improves comprehension too much',
        'It causes eye strain',
      ],
      correctIndex: 1,
    },
  },
  {
    id: 'sample-18',
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
  },];
