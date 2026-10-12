import HeroArt from '../components/HeroArt';

// 8-panel dashboard — hero art + title + subtitle, matching the reference.
// NOTE: basePath is NOT auto-applied to href strings in static export here, so
// the full prefix is required (matches sibling pages). Using <a> to avoid Link's
// basePath auto-prefix doubling the path.
const PANELS = [
  { href: '/KingDesignCollectiveinc/travel-index/', kind: 'globe', title: 'Travel Index', sub: 'REGIONS, BUNDLES & VOYAGE MAP' },
  { href: '/KingDesignCollectiveinc/shoe-brand/', kind: 'shoe', title: 'KingDesignShoe Co.', sub: 'PREMIUM FOOTWEAR IN BLACK & GOLD' },
  { href: '/KingDesignCollectiveinc/game-design/', kind: 'controller', title: 'Aura Champions', sub: 'ELEMENTAL DECK UI IN HOLOGRAPHIC FRAMES' },
  { href: '/KingDesignCollectiveinc/kids-channel/', kind: 'cards', title: 'Kids Channel', sub: 'SEVEN MINUTE STORY SESSIONS' },
  { href: '/KingDesignCollectiveinc/innovation-hub/', kind: 'bulb', title: 'Innovation Hub', sub: 'CONCEPTS, PROTOTYPES & SIGNALS' },
  { href: '/KingDesignCollectiveinc/ewaste-recycling/', kind: 'recycle', title: 'E-Waste Recycling', sub: 'STREAMS, RECOVERY RATES & METRICS' },
  { href: '/KingDesignCollectiveinc/quantum-wearables/', kind: 'atom', title: 'Quantum Wearables', sub: 'SIGNALS, NODES & WAVEFORMS' },
  { href: '/KingDesignCollectiveinc/tech-stack/', kind: 'crown', title: 'KD Intelligence', sub: 'PREDICTIVE INSIGHTS & STRATEGIC OVERVIEW' },
];

export default function DashboardPage() {
  return (
    <>
      <div className="dash-hero">
        <h1>KINGDESIGNCOLLECTIVEINC</h1>
        <p className="tagline">Eight Pillars. One Intelligence. Infinite Impact.</p>
        <span className="made-with">Made with AI</span>
      </div>
      <div className="page-frame">
        <div className="hero-grid">
          {PANELS.map((p) => (
            <a key={p.href} href={p.href} className="hero-panel">
              <div className="hero-art"><HeroArt kind={p.kind} /></div>
              <div className="hero-title">{p.title}</div>
              <div className="hero-sub">{p.sub}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
