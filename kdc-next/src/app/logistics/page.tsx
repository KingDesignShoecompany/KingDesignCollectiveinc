import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { LOGISTICS_ROUTES, BATCHES } from '../../data/ewaste';

export default function LogisticsPage() {
  return (
    <PageFrame title="Logistics" subtitle="Collection points, routes, and batches" badge="4 Routes">
      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '0 0 14px' }}>Collection Points & Routes</h3>
      <div className="card-grid">
        {LOGISTICS_ROUTES.map((r) => (
          <GlassCard key={r.route} corner="KDCI" hero="🚚" title={`${r.route} · ${r.from}`} meta={`→ ${r.to}`}
            stats={[['Stops', String(r.stops)], ['Load', r.kg + ' kg'], ['Status', r.status]]} thumbs={['Pickup', 'Transit', 'Dropoff']} progress={75} />
        ))}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '32px 0 14px' }}>Batch Processing Schedule</h3>
      <div className="card-grid">
        {BATCHES.map((b) => (
          <GlassCard key={b.batch} corner="KDCI" hero="📦" title={`${b.batch} · ${b.material}`} meta={`${b.kg} kg · ${b.gold} gold`}
            stats={[['Weight', b.kg + ' kg'], ['Gold', b.gold], ['Status', b.status]]} thumbs={['Intake', 'Process', 'Output']} progress={b.status === 'Complete' ? 100 : b.status === 'Processing' ? 60 : 20} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/KingDesignCollectiveinc/ewaste-recycling/" className="btn-outline">← Back to E-Waste</Link>
      </div>
    </PageFrame>
  );
}
