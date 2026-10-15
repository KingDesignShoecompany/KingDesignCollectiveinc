import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import ProgressRing from '../../components/ProgressRing';
import { SENSORS } from '../../data/quantum';
import { HEALTH_STATS } from '../../data/pages';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function QuantumWearablesPage() {
  return (
    <>
      <HeroBanner kind="atom" title="Quantum Wearables" subtitle="Signals, nodes & waveforms" badge="99.99% Uptime" />
      <PageFrame title="Telemetry" subtitle="Signals, nodes, and waveforms">
        <PageKpis items={[
          { icon: '⚛️', value: '99.99%', label: 'Uptime', delta: '30-day' },
          { icon: '📡', value: String(SENSORS.length), label: 'Sensors', delta: 'Live mesh' },
          { icon: '🛡️', value: '5/5', label: 'Constraints', delta: 'All PASS' },
          { icon: '⚡', value: '512Hz', label: 'Max Rate', delta: 'ECG' },
        ]} />

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Flagship Device</h4>
            <div className="spotlight">
              <div className="sp-art">💍</div>
              <div>
                <div className="sp-title">Quantum Band X1</div>
                <div className="sp-meta">Cold-fission powered · 30-day battery</div>
                <div className="sp-price">$199</div>
                <button className="btn-gold" disabled title="Coming soon">Pre-Order Now</button>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Health Stats</h4>
            <div className="ring-row">
              {HEALTH_STATS.map((h) => (
                <ProgressRing key={h.name} pct={h.pct} label={h.name} />
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: '.76rem', color: 'var(--muted)' }}>
              {HEALTH_STATS.map((h) => `${h.name}: ${h.value}`).join(' · ')}
            </div>
          </div>
        </div>

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Sensor Mesh</h4>
            {SENSORS.map((s) => (
              <div className="act-item" key={s.id}>
                <div>
                  <div className="act-title">{s.name} · {s.rate}</div>
                  <div className="act-detail">{s.type} · accuracy {s.accuracy}</div>
                </div>
                <div className="act-time">{s.synced ? '🟢 synced' : '🔴 off'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-grid">
          <Link href="/sensors/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📡" title="Biometric Sensors" meta="Live sensor mesh and waveforms"
              stats={[['Sensors', '4'], ['Max Rate', '512Hz'], ['Sync', '75%']]} thumbs={['ECG', 'PPG', 'IMU']} progress={94} />
          </Link>
          <Link href="/thermal/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🌡️" title="Thermal" meta="Cold-fission thermal modeling"
              stats={[['Core', '37.2°'], ['Surface', '32.5°'], ['Efficiency', '99%']]} thumbs={['Heat', 'Cool', 'Flow']} progress={89} />
          </Link>
          <Link href="/safety/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🛡️" title="Safety" meta="Constraints and compliance"
              stats={[['Constraints', '5'], ['Status', 'PASS'], ['Margin', '✓']]} thumbs={['Test', 'Log', 'Cert']} progress={100} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
