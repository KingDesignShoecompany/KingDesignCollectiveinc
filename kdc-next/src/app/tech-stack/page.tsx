import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { TECH_NODES, SECURITY_ITEMS } from '../../data/innovation';

export default function TechStackPage() {
  return (
    <PageFrame title="Tech Stack" subtitle="Local compute mesh and services" badge="9 Nodes">
      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '0 0 14px' }}>Service Nodes</h3>
      <div className="card-grid">
        {TECH_NODES.map((n) => (
          <GlassCard key={n.name} corner="KDCI" hero={n.emoji} title={n.name} meta={n.detail}
            stats={[['Port', n.detail.replace('Port ', '') || '—'], ['Stack', 'Live'], ['Health', '✓']]} thumbs={['Config', 'Logs', 'Metrics']} progress={92} />
        ))}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '32px 0 14px' }}>Security</h3>
      <div className="card-grid">
        {SECURITY_ITEMS.map((s) => (
          <GlassCard key={s.title} corner="KDCI" hero={s.emoji} title={s.title} meta={s.desc}
            stats={[['Level', 'High'], ['Audit', '✓'], ['Egress', 'None']]} thumbs={['Policy', 'Scan', 'Report']} progress={100} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/KingDesignCollectiveinc/innovation-hub" className="btn-outline">← Back to Innovation Hub</Link>
      </div>
    </PageFrame>
  );
}
