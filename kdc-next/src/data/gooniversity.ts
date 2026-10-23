// Gooniversity -- static course catalog for the Gooniversity channel.
// Mirrors the pattern from src/data/stories.ts and src/data/pages.ts.
// Each course covers a subsidiary domain of the King Design Collective holding company.

export type Lesson = {
  id: string;
  title: string;
  body: string;
  duration: string;
};

export type Course = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  emoji: string;
  estimated: string;
  lessons: Lesson[];
};

export const COURSES: Course[] = [
  {
    id: 'aura-champions',
    title: 'Aura Champions Mastery',
    tagline: 'Master the Convergence',
    description:
      'An AR card-battler training program covering the Trinity activation system, match strategy, and tournament-grade deck construction.',
    tag: 'champions',
    emoji: '✨',
    estimated: '12 min',
    lessons: [
      {
        id: 'aura-champions-1',
        title: 'Trinity Activation Fundamentals',
        body: 'Learn how the Trinity tri-band convergence system unlocks advanced monster forms. Understand aura resonance, sync windows, and why timing your trinity burst is critical in mid-match resets.',
        duration: '4 min',
      },
      {
        id: 'aura-champions-2',
        title: 'Meta Deck Construction',
        body: 'Explore current meta archetypes -- Fire Swarm, Water Control, and Earth Stalwart. Craft a balanced bench with proper element coverage and synergy triggers.',
        duration: '4 min',
      },
      {
        id: 'aura-champions-3',
        title: 'Tournament Mindset',
        body: 'Psychological pressure, card counting, and judge verification protocols. Win under the glare of the arena with these proven tactics.',
        duration: '4 min',
      },
    ],
  },
  {
    id: 'e-waste',
    title: 'Circular Reclamation',
    tagline: 'Turn Trash into Treasure',
    description:
      'Industrial e-waste logistics: rare-earth recovery, certified recycling pathways, and how to reclaim value from discarded devices at scale.',
    tag: 'ewaste',
    emoji: '♻️',
    estimated: '9 min',
    lessons: [
      {
        id: 'e-waste-1',
        title: 'Device Lifecycle Assessment',
        body: 'Map each component to its material recovery value. Identify rare-earth magnets, lithium cells, and gold-bearing traces before they leave your custody.',
        duration: '3 min',
      },
      {
        id: 'e-waste-2',
        title: 'Recycling Pathways',
        body: 'From drop-off scheduling to certified smelting -- learn the three-stage recovery pipeline that keeps 82% of materials in circulation.',
        duration: '3 min',
      },
      {
        id: 'e-waste-3',
        title: 'Impact Accounting',
        body: 'Quantify your environmental ROI: CO₂ prevented, water saved, and community reinvestment generated per kilogram recycled.',
        duration: '3 min',
      },
    ],
  },
  {
    id: 'travel-vagary',
    title: 'Vagary Index Navigator',
    tagline: 'Travel with Purpose',
    description:
      'Master the Vagary Index framework for sustainable, community-led travel. Offset emissions, track impact, and earn your place on the leaderboard.',
    tag: 'travel',
    emoji: '🌍',
    estimated: '10 min',
    lessons: [
      {
        id: 'travel-vagary-1',
        title: 'Reading the Vagary Index',
        body: 'Decode your trip score. The four pillars -- Offset Potential, Community Spend, Water Conservation, and Energy Efficiency -- tell the full story of your footprint.',
        duration: '3 min',
      },
      {
        id: 'travel-vagary-2',
        title: 'Carbon Offset Strategies',
        body: 'Learn when and how to offset. A 1% fare contribution to verified reforestation can neutralize an entire flight when timed correctly.',
        duration: '3 min',
      },
      {
        id: 'travel-vagary-3',
        title: 'Community Impact Travel',
        body: 'Stay local-owned to keep 80% of your spend inside the community. Discover how off-season travel reduces both crowds and emissions.',
        duration: '4 min',
      },
    ],
  },
  {
    id: 'quantum-wearables',
    title: 'Quantum Wearables Lab',
    tagline: 'Feel the Future',
    description:
      'An introduction to cold fission thermal modeling and biometric sensor integration in next-generation wearable devices.',
    tag: 'quantum',
    emoji: '⚛️',
    estimated: '11 min',
    lessons: [
      {
        id: 'quantum-wearables-1',
        title: 'Thermal Modeling Basics',
        body: 'Understand how cold fission micro-cells distribute heat across biometric sensor arrays. Learn why thermal equilibrium matters for continuous monitoring accuracy.',
        duration: '4 min',
      },
      {
        id: 'quantum-wearables-2',
        title: 'Sensor Fusion',
        body: "Combine heart rate, skin conductance, and ambient light data into meaningful health insights. The wearable doesn't just record - it interprets.",
        duration: '3 min',
      },
      {
        id: 'quantum-wearables-3',
        title: 'Power Management',
        body: 'Cold fission cells promise weeks of runtime. Discover the regulation systems that keep voltage stable from first activation to final depletion.',
        duration: '4 min',
      },
    ],
  },
  {
    id: 'kids-channel',
    title: 'Story Sessions Playground',
    tagline: 'Learning Through Wonder',
    description:
      'Interactive bedtime stories, read-along sessions, and child-safe learning games for ages 2-8. Every story ends with a gentle lesson.',
    tag: 'kids',
    emoji: '📚',
    estimated: '8 min',
    lessons: [
      {
        id: 'kids-channel-1',
        title: 'The Art of the Read-Along',
        body: 'Explore how synchronized narration, ambient soundscapes, and page-turn timing create immersion. Learn voice selection for different age brackets.',
        duration: '3 min',
      },
      {
        id: 'kids-channel-2',
        title: 'Age-Appropriate Design',
        body: 'Design interfaces for tiny hands. From 2-year-old tap targets to 8-year-old quiz interactions -- simplicity is the hardest part.',
        duration: '2 min',
      },
      {
        id: 'kids-channel-3',
        title: 'Badge & Reward Systems',
        body: 'Motivate without pressure. The badge system -- First Story, Bookworm, Quiz Master -- celebrates milestones while keeping play joyful.',
        duration: '3 min',
      },
    ],
  },
  {
    id: 'finance-treasury',
    title: 'Crypto Treasury Operations',
    tagline: 'Asset-Backed Settlement',
    description:
      'Learn how crypto-treasury tokens enable asset-backed utility settlement, ATM network liquidity, and transparent reserve management.',
    tag: 'finance',
    emoji: '💰',
    estimated: '13 min',
    lessons: [
      {
        id: 'finance-treasury-1',
        title: 'Token Architecture',
        body: 'Design utility settlement tokens backed by real assets. Understand the ERC-4626 vault standard and how redemption windows maintain peg stability.',
        duration: '4 min',
      },
      {
        id: 'finance-treasury-2',
        title: 'ATM Network Liquidity',
        body: 'A global ATM network requires careful collateral allocation. Learn how to provision liquidity pools across regions while minimizing impermanent loss.',
        duration: '4 min',
      },
      {
        id: 'finance-treasury-3',
        title: 'Reserve Transparency',
        body: 'Audit-grade reserve reporting builds trust. Every token must be provably backed -- chain-analysis tools make double-entry immutable on-chain.',
        duration: '5 min',
      },
    ],
  },
];

export const COURSE_TAGS: string[] = ['All', ...Array.from(new Set(COURSES.map((c) => c.tag)))];

export function getCourse(id: string): Course | null {
  return COURSES.find((c) => c.id === id) ?? null;
}
