import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { THERMAL_MODEL } from '../../data/quantum';

export default function ThermalPage() {
  const entries = Object.entries(THERMAL_MODEL);
  return (
    <PageFrame title="Thermal" subtitle="Cold-fission thermal modeling" badge="Active">
      <div className="card-grid">
        {entries.map(([k, v]) => (
          <GlassCard key={k} corner="KDCI" hero="🌡️" title={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} meta={String(v)}
            stats={[['Value', String(v)], ['Unit', '—'], ['Status', '✓']]} thumbs={['Heat', 'Cool', 'Flow']} progress={85} />
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <GlassCard corner="KDCI" title="Cold-Fission Engine" meta="Thermal management core">
          <ul className="guide-list">
            <li><strong>Core temp:</strong> {THERMAL_MODEL.coreTemp}</li>
            <li><strong>Surface temp:</strong> {THERMAL_MODEL.surfaceTemp}</li>
            <li><strong>Heat flux:</strong> {THERMAL_MODEL.heatFlux}</li>
            <li><strong>Efficiency:</strong> {THERMAL_MODEL.efficiency}</li>
          </ul>
        </GlassCard>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/KingDesignCollectiveinc/quantum-wearables/" className="btn-outline">← Back to Quantum</Link>
      </div>
    </PageFrame>
  );
}
