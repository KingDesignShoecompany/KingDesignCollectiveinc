import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

import HeroBanner from '../../components/HeroBanner';

export default function EWasteRecyclingPage() {
  return (
    <>
      <HeroBanner kind="recycle" title="E-Waste Recycling" subtitle="Streams, recovery rates & metrics" badge="15,620 Reclaimed" />
      <PageFrame title="Operations" subtitle="Streams, recovery rates, and metrics">
      <div className="card-grid">
        <Link href="/KingDesignCollectiveinc/materials" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="♻️" title="Materials" meta="Recovery calculator and rates"
            stats={[['Materials', '4'], ['Gold', '95%'], ['Copper', '92%']]} thumbs={['Gold', 'Copper', 'Palladium']} progress={91} />
        </Link>
        <Link href="/KingDesignCollectiveinc/logistics" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="🚚" title="Logistics" meta="Collection points, routes, and batches"
            stats={[['Routes', '4'], ['Stops', '41'], ['Load', '14.7t']]} thumbs={['Pickup', 'Transit', 'Dropoff']} progress={82} />
        </Link>
        <Link href="/KingDesignCollectiveinc/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="📊" title="Reports" meta="Treasury settlement, certificates, and impact"
            stats={[['CO₂ Saved', '48t'], ['Diverted', '125t'], ['Compliance', 'PASS']]} thumbs={['Impact', 'Certs', 'Settle']} progress={87} />
        </Link>
      </div>
      </PageFrame>
    </>
  );
}
