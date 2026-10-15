// Dashboard content — mock-but-plausible metrics for the interactive dashboard.
// Shape mirrors the reference design: 4 KPIs, module grid, activity feed, insights.

export type Kpi = { icon: string; value: string; label: string; delta: string };
export type Module = {
  href: string;
  kind: string;          // HeroArt kind
  title: string;         // full subsidiary name
  tagline: string;
};
export type ActivityItem = { title: string; detail: string; time: string; icon: string };
export type Insight = { title: string; detail: string; tag: 'Recommended' | 'Trending' };

export const KPIS: Kpi[] = [
  { icon: '🌐', value: '12.4M', label: 'People Reached', delta: '+18.4%' },
  { icon: '📈', value: '9,250', label: 'Innovation Score', delta: '+12.6%' },
  { icon: '🧩', value: '48', label: 'Active Projects', delta: '+6 new' },
  { icon: '♻️', value: '2.4M kg', label: 'Waste Recycled', delta: '+24.8%' },
];

export const MODULES: Module[] = [
  { href: '/KingDesignCollectiveinc/travel-index/', kind: 'globe', title: 'Vagary Index', tagline: 'Explore the world.' },
  { href: '/KingDesignCollectiveinc/shoe-brand/', kind: 'shoe', title: 'KingDesignShoeCompany', tagline: 'Step into impact.' },
  { href: '/KingDesignCollectiveinc/game-design/', kind: 'controller', title: 'Aura Champions', tagline: 'Compete & earn.' },
  { href: '/KingDesignCollectiveinc/kids-channel/', kind: 'cards', title: 'Seven Minute Story Sessions', tagline: 'Stories that shape.' },
  { href: '/KingDesignCollectiveinc/innovation-hub/', kind: 'bulb', title: 'King Design Collective Briheight Box', tagline: 'Build the future.' },
  { href: '/KingDesignCollectiveinc/ewaste-recycling/', kind: 'recycle', title: 'KingDesign E-Collective', tagline: 'Recycle. Recover. Reuse.' },
  { href: '/KingDesignCollectiveinc/quantum-wearables/', kind: 'atom', title: 'Quantum Mode', tagline: 'Signals, nodes, waveforms.' },
];

export const ACTIVITY: ActivityItem[] = [
  { icon: '♻️', title: 'E-Waste Recycling Milestone', detail: '2.4K kg recycled', time: '2h ago' },
  { icon: '💡', title: 'New Innovation Patent Filed', detail: 'AI Wearable Interface', time: '5h ago' },
  { icon: '📚', title: 'Kids Story Published', detail: '"The Little Inventor"', time: '1d ago' },
];

export const INSIGHTS: Insight[] = [
  { title: 'Expand to Africa Region', detail: 'High impact opportunity', tag: 'Recommended' },
  { title: 'Sustainable Shoe Line', detail: 'Market trend rising', tag: 'Trending' },
];

export function searchModules(q: string): Module[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return MODULES;
  return MODULES.filter(
    (m) => m.title.toLowerCase().includes(needle) || m.tagline.toLowerCase().includes(needle)
  );
}
