import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { SENSORS, WAVEFORMS } from '../../data/quantum';

export default function SensorsPage() {
  return (
    <PageFrame title="Biometric Sensors" subtitle="Live sensor mesh and waveforms" badge="4 Sensors">
      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '0 0 14px' }}>Sensor Array</h3>
      <div className="card-grid">
        {SENSORS.map((s) => (
          <GlassCard key={s.id} corner="KDCI" hero="📡" title={`${s.name} — ${s.type}`} meta={`${s.rate} · ${s.accuracy}`}
            stats={[['Rate', s.rate.split(' ')[0]], ['Sync', s.synced ? '✓' : '✗'], ['Cal', s.lastCal.slice(5)] ]} thumbs={['Stream', 'Buffer', 'Sync']} progress={s.synced ? 95 : 50} />
        ))}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '32px 0 14px' }}>Waveforms</h3>
      <div className="card-grid">
        {WAVEFORMS.map((w) => (
          <GlassCard key={w.name} corner="KDCI" hero={w.emoji} title={w.name} meta={`${w.freq} · ${w.amplitude}`}
            stats={[['Freq', w.freq.split(' ')[0]], ['Amp', w.amplitude.split(' ')[0]], ['Live', '✓']]} thumbs={['Signal', 'Filter', 'Plot']} progress={90} />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/quantum-wearables/" className="btn-outline">← Back to Quantum</Link>
      </div>
    </PageFrame>
  );
}
