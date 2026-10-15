import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import ProgressRing from '../../components/ProgressRing';
import { MATERIALS, BATCHES } from '../../data/ewaste';
import { EWASTE_STEPS } from '../../data/pages';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function EWasteRecyclingPage() {
  return (
    <>
      <HeroBanner kind="recycle" title="E-Waste Recycling" subtitle="Streams, recovery rates & metrics" badge="15,620 Reclaimed" />
      <PageFrame title="Operations" subtitle="Streams, recovery rates, and metrics">
        <PageKpis items={[
          { icon: '♻️', value: '2.4M', label: 'Tons Recycled', delta: '+24.8% YoY' },
          { icon: '📱', value: '12,450', label: 'Devices', delta: 'This quarter' },
          { icon: '🌫️', value: '48.2t', label: 'CO₂ Avoided', delta: 'vs landfill' },
          { icon: '🚛', value: '125t', label: 'Diverted', delta: 'From landfill' },
        ]} />

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Recycle Your Device</h4>
            <div className="step-row">
              {EWASTE_STEPS.map((s, i) => (
                <div className="step-item" key={s.name}>
                  <div className="step-num">{i + 1}</div>
                  <div className="step-name">{s.name}</div>
                  <div className="step-detail">{s.detail}</div>
                </div>
              ))}
            </div>
            <a className="btn-gold" href="/KingDesignCollectiveinc/logistics/" style={{ marginTop: 12 }}>Start Recycling</a>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Recovery Rates</h4>
            <div className="ring-row">
              {MATERIALS.map((m) => (
                <ProgressRing key={m.key} pct={Math.round(m.recovery * 100)} label={`${m.emoji} ${m.name}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Live Batches</h4>
            {BATCHES.map((b) => (
              <div className="act-item" key={b.batch}>
                <div>
                  <div className="act-title">{b.batch} · {b.material}</div>
                  <div className="act-detail">{b.kg} kg · {b.gold} gold</div>
                </div>
                <div className="act-time">{b.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-grid">
          <Link href="/materials/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="♻️" title="Materials" meta="Recovery calculator and rates"
              stats={[['Materials', '4'], ['Gold', '95%'], ['Copper', '92%']]} thumbs={['Gold', 'Copper', 'Palladium']} progress={91} />
          </Link>
          <Link href="/logistics/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🚚" title="Logistics" meta="Collection points, routes, and batches"
              stats={[['Routes', '4'], ['Stops', '41'], ['Load', '14.7t']]} thumbs={['Pickup', 'Transit', 'Dropoff']} progress={82} />
          </Link>
          <Link href="/reports/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📊" title="Reports" meta="Treasury settlement, certificates, and impact"
              stats={[['CO₂ Saved', '48t'], ['Diverted', '125t'], ['Compliance', 'PASS']]} thumbs={['Impact', 'Certs', 'Settle']} progress={87} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
