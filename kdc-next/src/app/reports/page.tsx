import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { IMPACT, COMPLIANCE } from '../../data/ewaste';

export default function ReportsPage() {
  return (
    <PageFrame title="Reports" subtitle="Treasury settlement, certificates, and impact" badge="Audited">
      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '0 0 14px' }}>Environmental Impact</h3>
      <div className="card-grid">
        {IMPACT.map((i) => (
          <GlassCard key={i.metric} corner="KDCI" hero="🌱" title={i.metric} meta={i.detail}
            stats={[['Value', i.value], ['Period', 'YTD'], ['Trend', '↑']]} thumbs={['CO₂', 'Waste', 'Water']} progress={88} />
        ))}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '32px 0 14px' }}>Regulatory Compliance</h3>
      <div className="card-grid">
        {COMPLIANCE.map((c) => (
          <GlassCard key={c.standard} corner="KDCI" hero="✅" title={c.standard} meta={c.detail}
            stats={[['Status', c.status], ['Audit', '✓'], ['Renew', '2027']]} thumbs={['Policy', 'Scan', 'Report']} progress={100} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/ewaste-recycling/" className="btn-outline">← Back to E-Waste</Link>
      </div>
    </PageFrame>
  );
}
