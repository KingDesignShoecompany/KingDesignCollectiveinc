import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

export default function InnovationHubPage() {
  return (
    <PageFrame title="Innovation Hub" subtitle="Concepts, prototypes, and signals" badge="45 Patents">
      <div className="card-grid">
        <GlassCard corner="KDCI" hero="💡" title="Concept Lab" meta="AI-powered idea generation"
          stats={[['Ideas', '1,240'], ['Patents', '45'], ['R&D', '12']]} thumbs={['Lightbulb', 'Prototype', 'Lab']} progress={88} />
        <GlassCard corner="KDCI" hero="🧪" title="Prototype Gallery" meta="Working builds and demos"
          stats={[['Active', '12'], ['Shipped', '34'], ['Success', '98%']]} thumbs={['Hardware', 'Software', 'Hybrid']} progress={74} />
        <GlassCard corner="KDCI" hero="📡" title="Signal Board" meta="Cross-subsidiary intelligence feed"
          stats={[['Signals', '52K'], ['24/7', 'ON'], ['Latency', '12ms']]} thumbs={['Realtime', 'Trends', 'Alerts']} progress={96} />
      </div>
    </PageFrame>
  );
}
