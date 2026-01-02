/**
 * Articles Database for PowerReader
 * Curated collection of engaging articles from various fields:
 * - Science & Technology
 * - Nature & Environment
 * - History & Culture
 * - Health & Psychology
 * - Space & Astronomy
 */

export type Article = {
  id: string;
  title: string;
  category: 'science' | 'nature' | 'history' | 'health' | 'space' | 'technology' | 'psychology';
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  text: string;
  comprehensionQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
};

export const ARTICLES: Article[] = [
  // ============== SCIENCE & TECHNOLOGY ==============
  {
    id: 'sci-001',
    title: 'The Science of Sleep',
    category: 'science',
    difficulty: 'easy',
    wordCount: 180,
    text: `Sleep is one of the most important activities for human health. During sleep, your brain processes information from the day and forms new memories. Your body repairs tissues, builds muscle, and strengthens your immune system.

Scientists have discovered that sleep occurs in cycles, each lasting about ninety minutes. During these cycles, you experience different stages of sleep, including light sleep, deep sleep, and REM sleep. REM stands for Rapid Eye Movement, and this is when most dreaming occurs.

Adults need between seven and nine hours of sleep each night for optimal health. However, many people get less than this recommended amount. Lack of sleep can lead to problems with concentration, memory, and mood. It can also increase the risk of serious health conditions like heart disease and diabetes.

To improve your sleep quality, experts recommend maintaining a consistent sleep schedule, avoiding screens before bedtime, and creating a cool, dark sleeping environment.`,
    comprehensionQuestions: [
      {
        question: 'How long does each sleep cycle last?',
        options: ['About 60 minutes', 'About 90 minutes', 'About 120 minutes', 'About 30 minutes'],
        correctIndex: 1,
      },
      {
        question: 'What does REM stand for?',
        options: ['Rest and Energy Mode', 'Rapid Eye Movement', 'Relaxed Evening Mode', 'Recovery Energy Method'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'sci-002',
    title: 'How Vaccines Work',
    category: 'science',
    difficulty: 'medium',
    wordCount: 220,
    text: `Vaccines are one of the greatest achievements in medical history, saving millions of lives each year by preventing infectious diseases. But how exactly do they work?

Your immune system is designed to recognize and fight foreign invaders like bacteria and viruses. When a pathogen enters your body, specialized cells identify it and create antibodies specifically designed to neutralize that threat. Your body also creates memory cells that remember how to fight that pathogen in the future.

Vaccines take advantage of this natural process. They introduce a weakened or inactive form of a pathogen, or just a piece of it, into your body. This is enough to trigger your immune system to respond and create antibodies and memory cells, but not enough to make you sick.

If you later encounter the actual pathogen, your immune system already knows how to fight it. The memory cells quickly produce antibodies, neutralizing the threat before it can cause illness.

Different types of vaccines work in slightly different ways. Some contain weakened live viruses, others use killed pathogens, and newer mRNA vaccines provide instructions for your cells to make a harmless piece of the virus that triggers an immune response.

Widespread vaccination creates herd immunity, protecting even those who cannot be vaccinated due to age or health conditions.`,
    comprehensionQuestions: [
      {
        question: 'What do vaccines introduce to the body?',
        options: ['Active disease', 'Weakened or inactive pathogens', 'Only antibodies', 'White blood cells'],
        correctIndex: 1,
      },
      {
        question: 'What is herd immunity?',
        options: ['Immunity in animals', 'Protection through widespread vaccination', 'Natural immunity from birth', 'Temporary protection'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'sci-003',
    title: 'Quantum Computing Explained',
    category: 'technology',
    difficulty: 'hard',
    wordCount: 280,
    text: `Quantum computing represents a fundamental shift in how we process information. While classical computers use bits that exist as either 0 or 1, quantum computers use quantum bits, or qubits, which can exist in multiple states simultaneously through a phenomenon called superposition.

This ability to be in multiple states at once gives quantum computers their extraordinary potential power. While a classical computer with n bits can be in one of 2^n possible states, a quantum computer with n qubits can be in a superposition of all 2^n states simultaneously. This allows quantum computers to explore many possible solutions to a problem at once.

Another quantum phenomenon that quantum computers exploit is entanglement. When qubits become entangled, the state of one qubit is correlated with the state of another, regardless of the physical distance between them. This creates powerful connections that can be used for computation.

However, quantum computers face significant challenges. Qubits are extremely fragile and can be disturbed by heat, electromagnetic radiation, or even cosmic rays. This causes decoherence, where the quantum state is lost. Current quantum computers must be cooled to near absolute zero and carefully shielded to maintain their quantum states.

Despite these challenges, quantum computers have already demonstrated quantum supremacy, performing calculations that would take classical computers thousands of years. Applications include drug discovery, cryptography, optimization problems, and simulating quantum systems in physics and chemistry.

The race to build practical, error-corrected quantum computers continues, with major technology companies and governments investing billions in this transformative technology.`,
    comprehensionQuestions: [
      {
        question: 'What is superposition in quantum computing?',
        options: ['Bits being only 0 or 1', 'Qubits existing in multiple states simultaneously', 'Connecting computers together', 'A type of encryption'],
        correctIndex: 1,
      },
      {
        question: 'What is decoherence?',
        options: ['A type of quantum gate', 'Loss of quantum state due to disturbance', 'Connection between qubits', 'A cooling process'],
        correctIndex: 1,
      },
    ],
  },

  // ============== NATURE & ENVIRONMENT ==============
  {
    id: 'nat-001',
    title: 'The Amazon Rainforest',
    category: 'nature',
    difficulty: 'easy',
    wordCount: 175,
    text: `The Amazon Rainforest is the largest tropical rainforest on Earth, covering over 5.5 million square kilometers across nine South American countries. Often called the lungs of the Earth, this vast forest produces about twenty percent of the worlds oxygen.

The Amazon is home to an incredible diversity of life. Scientists estimate that one in ten known species on Earth lives in the Amazon. This includes over 40,000 plant species, 1,300 bird species, and more than 3,000 types of fish. New species are still being discovered every year.

The forest plays a crucial role in regulating the global climate. Trees absorb carbon dioxide from the atmosphere, helping to slow climate change. The Amazon also influences weather patterns far beyond South America, affecting rainfall in distant regions.

Unfortunately, the Amazon faces serious threats from deforestation, mining, and agriculture. Every minute, an area of rainforest the size of several football fields is destroyed. Protecting this vital ecosystem is essential for the health of our planet.`,
    comprehensionQuestions: [
      {
        question: 'What percentage of the worlds oxygen does the Amazon produce?',
        options: ['About 10%', 'About 20%', 'About 50%', 'About 5%'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'nat-002',
    title: 'Ocean Acidification',
    category: 'nature',
    difficulty: 'medium',
    wordCount: 230,
    text: `Ocean acidification is often called climate changes equally evil twin. As humans release more carbon dioxide into the atmosphere, about a quarter of it is absorbed by the oceans. This might sound beneficial, but it triggers a chemical reaction that makes seawater more acidic.

When carbon dioxide dissolves in seawater, it forms carbonic acid. Since the Industrial Revolution, ocean acidity has increased by about thirty percent. This change is happening faster than at any time in the past 300 million years.

The effects on marine life are profound. Many sea creatures, including corals, oysters, and certain plankton, build their shells and skeletons from calcium carbonate. In more acidic water, it becomes harder for these organisms to form and maintain their protective structures. In extremely acidic conditions, shells can actually dissolve.

Coral reefs are particularly vulnerable. These underwater ecosystems support about twenty-five percent of all marine species. As waters become more acidic, coral growth slows, and reefs become weaker and more susceptible to bleaching and disease.

The food web consequences extend beyond shell-building creatures. Fish populations that depend on coral reefs decline, affecting fishing communities worldwide. Pteropods, tiny sea snails that form the base of many marine food chains, are already showing damaged shells in some regions.

Addressing ocean acidification requires reducing carbon dioxide emissions globally, making it inseparable from the broader challenge of climate change.`,
    comprehensionQuestions: [
      {
        question: 'How much carbon dioxide do oceans absorb?',
        options: ['About half', 'About a quarter', 'About three quarters', 'Almost none'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'nat-003',
    title: 'Migration Mysteries',
    category: 'nature',
    difficulty: 'medium',
    wordCount: 245,
    text: `Every year, billions of animals undertake incredible journeys across the globe, traveling thousands of miles between breeding and feeding grounds. These migrations are among natures most spectacular phenomena, yet many aspects remain mysterious to scientists.

The Arctic Tern holds the record for the longest migration of any animal, traveling from Arctic breeding grounds to Antarctic seas and back each year, a round trip of about 44,000 miles. Over its lifetime, an Arctic Tern may travel the equivalent of three trips to the Moon.

How do animals navigate such vast distances? Research has revealed multiple navigation systems. Many birds can detect Earths magnetic field using specialized cells containing iron-rich minerals. Salmon use their keen sense of smell to return to the exact stream where they were born. Sea turtles may use a combination of magnetic navigation and wave patterns.

The timing of migrations is often triggered by changes in day length, which signals the approach of seasonal changes. However, climate change is disrupting these ancient patterns. Some species are migrating earlier or later than they used to, which can cause mismatches with food availability at their destinations.

Tracking technology has revolutionized our understanding of migration. Tiny GPS devices and satellite transmitters allow scientists to follow individual animals throughout their journeys, revealing stopover sites and previously unknown routes.

Understanding migration is crucial for conservation. Protecting not just breeding grounds but entire migration corridors is essential for the survival of these remarkable travelers.`,
    comprehensionQuestions: [
      {
        question: 'How far does an Arctic Tern travel each year?',
        options: ['About 10,000 miles', 'About 25,000 miles', 'About 44,000 miles', 'About 5,000 miles'],
        correctIndex: 2,
      },
    ],
  },

  // ============== HISTORY & CULTURE ==============
  {
    id: 'his-001',
    title: 'The Library of Alexandria',
    category: 'history',
    difficulty: 'easy',
    wordCount: 185,
    text: `The Library of Alexandria was one of the largest and most significant libraries of the ancient world. Located in Alexandria, Egypt, it was founded in the third century BCE under the Ptolemaic dynasty. The library aimed to collect all the worlds knowledge under one roof.

At its height, the library may have held between 40,000 and 400,000 scrolls, containing works on literature, science, mathematics, philosophy, and medicine. Scholars from across the Mediterranean world came to study and conduct research there.

The library employed a remarkable method of expanding its collection. Ships arriving in Alexandria were required to surrender any books they carried. These were copied by scribes, with the copies returned to the owners while the originals were kept in the library.

The fate of the library remains one of historys great mysteries. There was no single catastrophic destruction. Instead, the library likely declined gradually over several centuries due to fire, conflict, and decreasing funding.

Despite its loss, the Library of Alexandria remains a powerful symbol of the pursuit of knowledge and the importance of preserving human intellectual achievement.`,
    comprehensionQuestions: [
      {
        question: 'When was the Library of Alexandria founded?',
        options: ['First century CE', 'Third century BCE', 'Fifth century BCE', 'Second century CE'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'his-002',
    title: 'The Silk Road',
    category: 'history',
    difficulty: 'medium',
    wordCount: 240,
    text: `The Silk Road was not a single road but a vast network of trade routes connecting East Asia with the Mediterranean world. For over 1,500 years, this network facilitated the exchange of goods, ideas, and cultures between civilizations.

The routes earned their name from the lucrative Chinese silk trade, which began during the Han Dynasty around 130 BCE. Chinese silk was highly prized in Rome, where it sold for enormous prices. But silk was just one of many commodities traded. Spices, precious metals, gemstones, glassware, and textiles all traveled these routes.

Perhaps more significant than goods were the ideas that spread along the Silk Road. Buddhism traveled from India to China and beyond. Islamic culture and knowledge spread eastward. Scientific and mathematical concepts, artistic styles, and technologies like papermaking and gunpowder diffused across continents.

The journey along the Silk Road was dangerous and arduous. Merchants rarely traveled the entire route themselves. Instead, goods passed through many hands, with different groups controlling different segments. Caravanserais, roadside inns spaced about a days journey apart, provided rest and protection for travelers.

The Silk Road declined after the fifteenth century as maritime routes became faster and safer for trade. The Ottoman Empires control over key land routes also encouraged Europeans to seek alternative paths to Asia, eventually leading to the Age of Exploration.

Today, Chinas Belt and Road Initiative seeks to revive these ancient connections through modern infrastructure.`,
    comprehensionQuestions: [
      {
        question: 'When did the Chinese silk trade begin?',
        options: ['Around 500 CE', 'Around 130 BCE', 'Around 1000 CE', 'Around 300 BCE'],
        correctIndex: 1,
      },
    ],
  },

  // ============== HEALTH & PSYCHOLOGY ==============
  {
    id: 'hea-001',
    title: 'The Power of Habits',
    category: 'psychology',
    difficulty: 'easy',
    wordCount: 190,
    text: `Habits shape our daily lives more than we realize. Scientists estimate that about forty percent of our daily actions are habits, performed almost automatically without conscious thought. Understanding how habits work can help us build better ones and break harmful ones.

Every habit follows a simple pattern called the habit loop. First comes the cue, a trigger that tells your brain to start the automatic behavior. Then comes the routine, the behavior itself. Finally, there is the reward, which reinforces the habit and makes you want to repeat it.

To build a new habit, make the cue obvious and the reward satisfying. Want to exercise more? Put your workout clothes next to your bed as a visual cue. After exercising, treat yourself to something enjoyable. Over time, the behavior becomes automatic.

Breaking bad habits requires disrupting the loop. Identify the cue that triggers the unwanted behavior and either remove it or replace the routine with a healthier alternative. If stress triggers snacking, try substituting a short walk or deep breathing exercises.

Patience is essential. Research suggests it takes an average of sixty-six days for a new behavior to become automatic. Consistency matters more than perfection.`,
    comprehensionQuestions: [
      {
        question: 'What percentage of daily actions are habits?',
        options: ['About 20%', 'About 40%', 'About 60%', 'About 80%'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'hea-002',
    title: 'The Gut-Brain Connection',
    category: 'health',
    difficulty: 'medium',
    wordCount: 235,
    text: `You may have experienced butterflies in your stomach before a big presentation or felt your appetite disappear during times of stress. These sensations hint at a remarkable connection between your gut and your brain, a relationship that scientists are only beginning to fully understand.

Your gastrointestinal tract contains its own nervous system, often called the second brain. This enteric nervous system contains over 500 million neurons and can operate independently of the brain in your head. It communicates with your central nervous system through the vagus nerve, creating a bidirectional highway of information.

Your gut is also home to trillions of microorganisms collectively known as the gut microbiome. These bacteria, viruses, and fungi do far more than help digest food. They produce neurotransmitters like serotonin, with about ninety percent of your bodys serotonin made in the gut. They also influence inflammation, immune function, and may even affect mood and cognition.

Research has linked disruptions in the gut microbiome to conditions including depression, anxiety, autism, and Parkinsons disease. While we cannot yet prove these connections are causal, the correlations are compelling.

Diet significantly affects your gut microbiome. Fiber-rich foods, fermented products, and diverse plant-based foods promote a healthy microbial community. Processed foods, artificial sweeteners, and antibiotics can harm gut bacteria.

This emerging field, sometimes called psychobiotics, may eventually lead to new treatments for mental health conditions targeting the gut rather than the brain directly.`,
    comprehensionQuestions: [
      {
        question: 'What percentage of the bodys serotonin is made in the gut?',
        options: ['About 50%', 'About 70%', 'About 90%', 'About 30%'],
        correctIndex: 2,
      },
    ],
  },

  // ============== SPACE & ASTRONOMY ==============
  {
    id: 'spa-001',
    title: 'Black Holes Explained',
    category: 'space',
    difficulty: 'medium',
    wordCount: 225,
    text: `Black holes are among the most mysterious objects in the universe. These regions of space have such intense gravity that nothing, not even light, can escape once it crosses a boundary called the event horizon. Despite their name, black holes are not empty voids but rather contain enormous amounts of matter compressed into an incredibly small space.

Black holes form when massive stars die. When a star several times more massive than our Sun exhausts its nuclear fuel, it can no longer support itself against gravity. The core collapses violently, and if massive enough, forms a black hole. The resulting object might contain several solar masses squeezed into a region smaller than a city.

At the center of most galaxies, including our Milky Way, lurk supermassive black holes millions or billions of times more massive than the Sun. How these giants formed remains an active area of research.

Despite being invisible, we can detect black holes through their effects on nearby matter. Material falling toward a black hole heats up and emits X-rays. We can also observe stars orbiting invisible companions and measure gravitational waves produced when black holes merge.

In 2019, the Event Horizon Telescope captured the first direct image of a black hole, showing the shadow cast against glowing gas in the galaxy M87. This remarkable achievement confirmed predictions made by Einsteins theory of general relativity over a century ago.`,
    comprehensionQuestions: [
      {
        question: 'What is the boundary of a black hole called?',
        options: ['The core', 'The singularity', 'The event horizon', 'The corona'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'spa-002',
    title: 'The Search for Exoplanets',
    category: 'space',
    difficulty: 'medium',
    wordCount: 250,
    text: `For most of human history, we could only wonder whether planets existed beyond our solar system. Today, we know of over 5,000 confirmed exoplanets, with thousands more candidates awaiting verification. This revolution in our understanding began in 1992 with the discovery of planets orbiting a pulsar, and accelerated with the first planet found around a Sun-like star in 1995.

Detecting exoplanets is challenging because they are incredibly faint compared to their host stars, like trying to see a firefly next to a searchlight from miles away. Scientists have developed clever techniques to overcome this challenge.

The transit method watches for tiny dips in a stars brightness as a planet passes in front of it. NASAs Kepler space telescope used this method to discover over 2,600 planets before its retirement. The radial velocity method detects the slight wobble a planet induces in its star as they orbit their common center of mass.

Among the discoveries are planets unlike anything in our solar system. Hot Jupiters are gas giants orbiting extremely close to their stars. Super-Earths are rocky planets larger than Earth but smaller than Neptune. Some planets orbit in the habitable zone where liquid water could exist on the surface.

The James Webb Space Telescope is now studying exoplanet atmospheres, searching for chemical signatures that might indicate the presence of life. While we have not yet found definitive evidence of life beyond Earth, the sheer number of planets suggests we may not be alone in the universe.`,
    comprehensionQuestions: [
      {
        question: 'How many confirmed exoplanets are known?',
        options: ['About 500', 'About 1,000', 'Over 5,000', 'About 100'],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 'spa-003',
    title: 'The Multiverse Theory',
    category: 'space',
    difficulty: 'hard',
    wordCount: 275,
    text: `The multiverse theory proposes that our universe may be just one of countless universes existing simultaneously. While this sounds like science fiction, several serious scientific theories suggest some form of multiverse might actually exist.

The most straightforward version comes from quantum mechanics. According to the many-worlds interpretation proposed by physicist Hugh Everett in 1957, every time a quantum measurement is made, the universe splits into multiple branches, one for each possible outcome. In this view, all possible histories and futures exist in a vast branching tree of parallel universes.

Cosmic inflation, the theory explaining the rapid expansion of the early universe, also suggests a multiverse. Inflation might be eternal, constantly generating new bubble universes with potentially different physical laws and constants. Our observable universe would be just one bubble in an infinite foam.

String theory, which attempts to unify all fundamental forces, predicts an enormous landscape of possible universes, perhaps 10 to the power of 500 different configurations. Each configuration would represent a universe with different particle physics.

The multiverse idea has both supporters and critics among physicists. Supporters argue it elegantly explains why our universe seems fine-tuned for life, as we naturally find ourselves in one of the rare habitable universes. Critics contend that theories predicting unobservable universes are not truly scientific, as they cannot be tested or falsified.

Whether the multiverse is real remains unknown and perhaps unknowable. Yet exploring these ideas pushes the boundaries of physics and challenges our understanding of reality itself. Even if we can never prove other universes exist, considering the possibility expands our conception of what existence might mean.`,
    comprehensionQuestions: [
      {
        question: 'Who proposed the many-worlds interpretation?',
        options: ['Albert Einstein', 'Stephen Hawking', 'Hugh Everett', 'Richard Feynman'],
        correctIndex: 2,
      },
    ],
  },

  // ============== TECHNOLOGY ==============
  {
    id: 'tec-001',
    title: 'Artificial Intelligence Today',
    category: 'technology',
    difficulty: 'easy',
    wordCount: 185,
    text: `Artificial intelligence, or AI, is transforming how we live and work. From voice assistants on our phones to recommendations on streaming services, AI is already part of daily life for millions of people.

At its core, AI refers to computer systems designed to perform tasks that typically require human intelligence. These include recognizing speech, identifying images, making decisions, and understanding language. Modern AI systems learn from large amounts of data, finding patterns that help them improve at their tasks.

Machine learning is a type of AI where systems improve through experience without being explicitly programmed. Deep learning, a subset of machine learning, uses neural networks inspired by the human brain. These networks can process complex data like images and speech remarkably well.

AI has made impressive advances in recent years. AI systems can now write essays, create art, diagnose diseases from medical images, and defeat world champions at complex games. However, current AI lacks the general intelligence and common sense that humans possess.

As AI becomes more powerful, society faces important questions about privacy, employment, and how to ensure these systems are used responsibly and fairly.`,
    comprehensionQuestions: [
      {
        question: 'What is machine learning?',
        options: ['Robots that learn to walk', 'Systems that improve through experience', 'Computers that think like humans', 'Programming languages for AI'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 'tec-002',
    title: 'The Rise of Electric Vehicles',
    category: 'technology',
    difficulty: 'medium',
    wordCount: 240,
    text: `Electric vehicles are rapidly transforming the automotive industry after more than a century of internal combustion engine dominance. What was once a niche market is now mainstream, with major automakers committing billions to electrification and some countries planning to ban new gasoline car sales within the next two decades.

The shift is driven by multiple factors. Climate change concerns have pushed governments to implement emissions regulations and offer incentives for electric vehicles. Battery technology has improved dramatically, with costs falling over ninety percent since 2010 while energy density has increased. This means electric cars can now travel over 300 miles on a single charge at increasingly competitive prices.

Electric vehicles offer several advantages beyond environmental benefits. They have fewer moving parts than gasoline engines, reducing maintenance costs. Electric motors provide instant torque, delivering quick acceleration. Operating costs are lower since electricity is cheaper than gasoline per mile.

However, challenges remain. Charging infrastructure, while expanding rapidly, is still less convenient than gas stations in many areas. Charging takes longer than refueling, though fast chargers can add significant range in thirty minutes. Battery production raises concerns about mining practices and material availability for lithium, cobalt, and other critical minerals.

The electric revolution extends beyond personal cars to buses, trucks, and even aircraft. As technology continues to improve and costs decline, the transition away from fossil fuels in transportation appears increasingly inevitable, fundamentally reshaping industries from oil to automotive manufacturing.`,
    comprehensionQuestions: [
      {
        question: 'How much have battery costs fallen since 2010?',
        options: ['About 50%', 'About 70%', 'Over 90%', 'About 30%'],
        correctIndex: 2,
      },
    ],
  },

  // Additional short articles for variety
  {
    id: 'psy-001',
    title: 'The Flow State',
    category: 'psychology',
    difficulty: 'easy',
    wordCount: 165,
    text: `Have you ever been so absorbed in an activity that you lost track of time? This mental state, called flow, was identified by psychologist Mihaly Csikszentmihalyi in the 1970s. During flow, people report feeling completely focused, energized, and enjoying what they are doing.

Flow occurs when the challenge of a task perfectly matches your skill level. If a task is too easy, you feel bored. If it is too hard, you feel anxious. The sweet spot between these extremes is where flow happens.

Athletes call this being in the zone. Musicians experience it during inspired performances. Writers find it when words seem to flow effortlessly. Even everyday activities like cooking or gardening can trigger flow states.

Research shows that people who experience flow regularly report higher levels of happiness and life satisfaction. The key is finding activities that challenge you just enough to require full attention while remaining achievable.

Flow reminds us that happiness often comes not from relaxation but from being fully engaged with life.`,
    comprehensionQuestions: [
      {
        question: 'When does flow occur?',
        options: ['When tasks are very easy', 'When challenge matches skill level', 'During relaxation', 'When multitasking'],
        correctIndex: 1,
      },
    ],
  },
];

// Helper functions
export function getArticlesByCategory(category: Article['category']): Article[] {
  return ARTICLES.filter(article => article.category === category);
}

export function getArticlesByDifficulty(difficulty: Article['difficulty']): Article[] {
  return ARTICLES.filter(article => article.difficulty === difficulty);
}

export function getRandomArticle(difficulty?: Article['difficulty'], category?: Article['category']): Article {
  let filtered = ARTICLES;
  if (difficulty) {
    filtered = filtered.filter(a => a.difficulty === difficulty);
  }
  if (category) {
    filtered = filtered.filter(a => a.category === category);
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getAllCategories(): Article['category'][] {
  return ['science', 'nature', 'history', 'health', 'space', 'technology', 'psychology'];
}
