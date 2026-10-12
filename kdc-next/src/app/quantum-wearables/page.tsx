import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

export default function QuantumWearablesPage() {
  return (
    <PageFrame title="Quantum Wearables" subtitle="Signals, nodes, and waveforms" badge="99.99% Uptime">
      <div className="card-grid">
        <Link href="/KingDesignCollectiveinc/sensors" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="📡" title="Biometric Sensors" meta="Live sensor mesh and waveforms"
            stats={[['Sensors', '4'], ['Max Rate', '512Hz'], ['Sync', '75%']]} thumbs={['ECG', 'PPG', 'IMU']} progress={94} />
        </Link>
        <Link href="/KingDesignCollectiveinc/thermal" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="🌡️" title="Thermal" meta="Cold-fission thermal modeling"
            stats={[['Core', '37.2°'], ['Surface', '32.5°'], ['Efficiency', '99%']]} thumbs={['Heat', 'Cool', 'Flow']} progress={89} />
        </Link>
        <Link href="/KingDesignCollectiveinc/safety" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="🛡️" title="Safety" meta="Constraints and compliance"
            stats={[['Constraints', '5'], ['Status', 'PASS'], ['Margin', '✓']]} thumbs={['Test', 'Log', 'Cert']} progress={100} />
        </Link>
      </div>
    </PageFrame>
  );
}
