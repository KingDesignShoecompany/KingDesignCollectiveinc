import Link from 'next/link';
import GlassCard from '../components/GlassCard';

// Panel data — mirrors the 8-panel reference. Heroes are emoji (no image assets);
// stats/thumbs are curated sample content.
const PANELS = [
  {
    href: '/travel-index', title: 'Travel Index', hero: '🌍', corner: 'KDCI',
    meta: 'Vagary engine — regions, bundles & world map',
    stats: [['Itineraries', '12'], ['Destinations', '45'], ['Bookings', '89']],
    thumbs: ['Skyline', 'Mountains', 'Hiker'], progress: 88,
  },
  {
    href: '/shoe-brand', title: 'KingDesignShoe Co.', hero: '👟', corner: 'KDCI',
    meta: 'Premium footwear in black & gold',
    stats: [['In Stock', '1,240'], ['New', '85'], ['Sold', '3,450']],
    thumbs: ['Side', 'Box', 'On Foot'], progress: 92,
  },
  {
    href: '/game-design', title: 'Aura Champions', hero: '🎮', corner: 'KDCI',
    meta: 'Elemental deck UI in holographic frames',
    stats: [['Players', '12.5K'], ['Releases', '8'], ['Tournaments', '3']],
    thumbs: ['Character', 'Controller', 'Racing'], progress: 76,
  },
  {
    href: '/kids-channel', title: 'Kids Channel', hero: '📚', corner: 'KDCI',
    meta: 'Seven Minute Story Sessions',
    stats: [['Paths', '50+'], ['Safe', 'ON'], ['Rating', '9.7']],
    thumbs: ['Learning', 'Stories', 'Create'], progress: 84,
  },
  {
    href: '/innovation-hub', title: 'Innovation Hub', hero: '💡', corner: 'KDCI',
    meta: 'Concepts, prototypes & signals',
    stats: [['Ideas', '1,240'], ['Patents', '45'], ['R&D', '12']],
    thumbs: ['Lightbulb', 'Prototype', 'Lab'], progress: 90,
  },
  {
    href: '/ewaste-recycling', title: 'E-Waste Recycling', hero: '♻️', corner: 'KDCI',
    meta: 'Streams, recovery rates & metrics',
    stats: [['Collected', '12,540'], ['Processed', '8,875'], ['Reclaimed', '15,620']],
    thumbs: ['Collect', 'Sort', 'Output'], progress: 95,
  },
  {
    href: '/quantum-wearables', title: 'Quantum Wearables', hero: '⚛️', corner: 'KDCI',
    meta: 'Signals, nodes & waveforms',
    stats: [['Sensors', '1.2M'], ['Readings', '8,450'], ['Uptime', '99.9%']],
    thumbs: ['Sensor', 'Thermal', 'Status'], progress: 99,
  },
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
        <div className="card-grid">
          {PANELS.map((p) => (
            <Link key={p.href} href={p.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              <GlassCard
                corner={p.corner}
                hero={p.hero}
                title={p.title}
                meta={p.meta}
                stats={p.stats}
                thumbs={p.thumbs}
                progress={p.progress}
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
