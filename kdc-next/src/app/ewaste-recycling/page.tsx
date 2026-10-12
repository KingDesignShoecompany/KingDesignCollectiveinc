import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

export default function EWasteRecyclingPage() {
  return (
    <PageFrame title="E-Waste Recycling" subtitle="Streams, recovery rates, and metrics" badge="15,620 Reclaimed">
      <div className="card-grid">
        <GlassCard corner="KDCI" hero="♻️" title="Input Streams" meta="Collection channels and volume"
          stats={[['Collected', '12,540'], ['Sources', '48'], ['Daily', '320']]} thumbs={['Collect', 'Intake', 'Sort']} progress={82} />
        <GlassCard corner="KDCI" hero="⚙️" title="Recovery Rate" meta="Precious-metal reclamation efficiency"
          stats={[['Processed', '8,875'], ['Gold', '99.2%'], ['Copper', '97%']]} thumbs={['Smelt', 'Refine', 'Output']} progress={91} />
        <GlassCard corner="KDCI" hero="📊" title="Material Breakdown" meta="Recovered commodities by mass"
          stats={[['Reclaimed', '15,620'], ['Types', '12'], ['Value', '$2.1M']]} thumbs={['Gold', 'Copper', 'Palladium']} progress={87} />
      </div>
    </PageFrame>
  );
}
