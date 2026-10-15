// Per-page panel constants for the interactive subsidiary pages.
// Values are plausible-mock where no backend exists — same policy as dashboard.ts.

export type TravelTip = { title: string; detail: string };
export type LeaderRow = { rank: number; name: string; score: string; badge: string };
export type Step = { name: string; detail: string };
export type HealthStat = { name: string; value: string; pct: number };
export type ImpactItem = { label: string; pct: number };

export const TRAVEL_TIPS: TravelTip[] = [
  { title: 'Offset your flights', detail: 'Contribute 1% of fare to verified reforestation.' },
  { title: 'Travel off-season', detail: 'Cooler crowds, lower emissions, better rates.' },
  { title: 'Pack light', detail: 'Every kg counts — lighter craft, less fuel.' },
  { title: 'Stay local-owned', detail: 'Keep 80% of spend inside the community.' },
];

export const LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: 'NovaKnight', score: '12,480', badge: '🥇' },
  { rank: 2, name: 'EmberFist', score: '11,905', badge: '🥈' },
  { rank: 3, name: 'TideWalker', score: '10,732', badge: '🥉' },
  { rank: 4, name: 'You', score: '9,850', badge: '⭐' },
  { rank: 5, name: 'Solaris', score: '9,120', badge: '' },
];

export const DAILY_CHALLENGE = {
  title: 'Win 3 matches with Water element',
  detail: 'Reward: 250 XP + Rare card pack',
  xp: 250,
};

export const KID_BADGES = [
  { icon: '🌟', name: 'First Story', detail: 'Completed 1st session' },
  { icon: '📖', name: 'Bookworm', detail: '10 stories finished' },
  { icon: '🧠', name: 'Quiz Master', detail: '20 quizzes passed' },
];

export const EWASTE_STEPS: Step[] = [
  { name: 'Schedule', detail: 'Pick a date & drop-off point' },
  { name: 'Pickup', detail: 'Driver collects your device' },
  { name: 'Recycle', detail: 'Materials recovered & certified' },
];

export const HEALTH_STATS: HealthStat[] = [
  { name: 'Heart Rate', value: '72 bpm', pct: 72 },
  { name: 'Steps', value: '8,240', pct: 82 },
  { name: 'Sleep', value: '7.5 h', pct: 94 },
  { name: 'Calories', value: '486 kcal', pct: 49 },
];

export const INNOVATION_PIPELINE = [
  { stage: 'Ideation', count: 1248 },
  { stage: 'Prototype', count: 412 },
  { stage: 'Patent Filed', count: 89 },
  { stage: 'Licensed', count: 23 },
];

export const TRAVEL_IMPACT: ImpactItem[] = [
  { label: 'CO₂ Offset', pct: 62 },
  { label: 'Community Spend', pct: 78 },
  { label: 'Water Conservation', pct: 71 },
  { label: 'Energy Efficiency', pct: 55 },
];

export const SHOE_IMPACT: ImpactItem[] = [
  { label: 'CO₂ Reduction', pct: 40 },
  { label: 'Water Saved', pct: 35 },
  { label: 'Energy Saved', pct: 28 },
  { label: 'Recycled Content', pct: 82 },
];

export const GAME_IMPACT: ImpactItem[] = [
  { label: 'CO₂ Saved', pct: 61 },
  { label: 'Trees Planted', pct: 44 },
  { label: 'Community Hours', pct: 73 },
  { label: 'Cleanups Joined', pct: 38 },
];

export const INNOVATION_ACTIVITY = [
  { title: 'Patent Filed', detail: 'AI Wearable Interface', time: '5h ago' },
  { title: 'White Paper Published', detail: 'Cold Fission Thermal Model', time: '1d ago' },
  { title: 'Collaboration Started', detail: 'Quantum Mode × Innovation', time: '2d ago' },
];
