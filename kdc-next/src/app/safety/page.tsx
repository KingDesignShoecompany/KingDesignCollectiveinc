import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { SAFETY } from '../../data/quantum';

export default function SafetyPage() {
  const allPass = SAFETY.every((s) => s.status === 'PASS');
  return (
    <PageFrame title="Safety" subtitle="Constraints and compliance" badge={allPass ? 'ALL PASS' : 'REVIEW'}>
      <div className="card-grid">
        {SAFETY.map((s) => (
          <GlassCard key={s.name} corner="KDCI" hero="🛡️" title={s.name} meta={`${s.required} ${s.unit} required`}
            stats={[['Current', s.current + ' ' + s.unit], ['Status', s.status], ['Margin', '✓']]} thumbs={['Test', 'Log', 'Cert']} progress={100} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/KingDesignCollectiveinc/quantum-wearables/" className="btn-outline">← Back to Quantum</Link>
      </div>
    </PageFrame>
  );
}
