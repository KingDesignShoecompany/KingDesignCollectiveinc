import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { SUBSIDIARY_IP, TOTAL_PATENTS } from '../../data/innovation';

export default function PatentsPage() {
  return (
    <PageFrame title="Patent Portfolio" subtitle="IP across all subsidiaries" badge={`${TOTAL_PATENTS} Patents`}>
      <div className="card-grid">
        {SUBSIDIARY_IP.map((s) => (
          <GlassCard key={s.file} corner="KDCI" hero="📜" title={s.name} meta={`${s.file} · ${s.status}`}
            stats={[['Patents', String(s.patents)], ['Valuation', s.value], ['Status', 'Active']]} thumbs={['Filed', 'Pending', 'Granted']} progress={Math.min(100, s.patents * 6)} />
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/KingDesignCollectiveinc/innovation-hub/" className="btn-outline">← Back to Innovation Hub</Link>
      </div>
    </PageFrame>
  );
}
