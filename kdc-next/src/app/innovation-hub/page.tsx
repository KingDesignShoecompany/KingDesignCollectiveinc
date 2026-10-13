import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import { TOTAL_PATENTS } from '../../data/innovation';

export default function InnovationHubPage() {
  return (
    <>
      <HeroBanner kind="bulb" title="Innovation Hub" subtitle="Concepts, prototypes & signals" badge={`${TOTAL_PATENTS} Patents`} />
      <PageFrame title="Lab" subtitle="Concepts, prototypes, and signals">
      <div className="card-grid">
        <Link href="/patents/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="📜" title="Patent Portfolio" meta="IP across all 7 subsidiaries"
            stats={[['Patents', String(TOTAL_PATENTS)], ['Families', '7'], ['Value', '$2.4M']]} thumbs={['Filed', 'Pending', 'Granted']} progress={88} />
        </Link>
        <Link href="/whitepapers/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="📄" title="White Papers" meta="Templates and IP disclosures"
            stats={[['Papers', '15'], ['Templates', '4'], ['Drafts', '3']]} thumbs={['Technical', 'Business', 'IP']} progress={74} />
        </Link>
        <Link href="/tech-stack/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="🧩" title="Tech Stack" meta="Local compute mesh and services"
            stats={[['Nodes', '9'], ['Ports', '7'], ['Uptime', '99%']]} thumbs={['Services', 'Security', 'Mesh']} progress={96} />
        </Link>
      </div>
      </PageFrame>
    </>
  );
}
