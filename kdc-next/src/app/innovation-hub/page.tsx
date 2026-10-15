import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import ImpactBar from '../../components/ImpactBar';
import { TOTAL_PATENTS } from '../../data/innovation';
import { INNOVATION_PIPELINE, INNOVATION_ACTIVITY } from '../../data/pages';

export default function InnovationHubPage() {
  const topCount = INNOVATION_PIPELINE[0].count;
  return (
    <>
      <HeroBanner kind="bulb" title="Innovation Hub" subtitle="Concepts, prototypes & signals" badge={`${TOTAL_PATENTS} Patents`} />
      <PageFrame title="Lab" subtitle="Concepts, prototypes, and signals">
        <PageKpis items={[
          { icon: '💡', value: '1,248', label: 'Ideas', delta: '+32 this month' },
          { icon: '📜', value: String(TOTAL_PATENTS), label: 'Patents', delta: '7 families' },
          { icon: '🤝', value: '156', label: 'Collaborations', delta: 'Cross-subsidiary' },
          { icon: '💰', value: '$320K', label: 'Funding', delta: 'Grant pipeline' },
        ]} />

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Featured Project</h4>
            <div className="spotlight">
              <div>
                <div className="sp-art">💡</div>
              </div>
              <div>
                <div className="sp-title">AI-Powered Water Purifier</div>
                <div className="sp-meta">Prototype stage · 2 patents pending</div>
              </div>
            </div>
            <a className="btn-gold" href="/KingDesignCollectiveinc/whitepapers/">View Project</a>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Innovation Pipeline</h4>
            {INNOVATION_PIPELINE.map((i) => (
              <ImpactBar key={i.stage} label={i.stage} pct={Math.round((i.count / topCount) * 100)} value={String(i.count)} />
            ))}
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Recent Activity</h4>
            {INNOVATION_ACTIVITY.map((a) => (
              <div className="act-item" key={a.title}>
                <div>
                  <div className="act-title">📌 {a.title}</div>
                  <div className="act-detail">{a.detail}</div>
                </div>
                <div className="act-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

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
