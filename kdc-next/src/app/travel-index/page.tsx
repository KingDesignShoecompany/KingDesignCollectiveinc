import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

export default function TravelIndexPage() {
  return (
    <PageFrame title="Travel Index" subtitle="Vagary engine — regions, bundles, and world map" badge="250 Countries">
      <div className="card-grid">
        <GlassCard corner="KDCI" hero="🗺️" title="Vagary World Map" meta="Been / Want / Unvisited — black & gold overlay"
          stats={[['Visited', '29'], ['Planning', '0'], ['Unvisited', '221']]} thumbs={['Asia', 'Europe', 'Americas']} progress={12} />
        <GlassCard corner="KDCI" hero="🌏" title="Region Bundles" meta="Curated multi-city itineraries with pricing"
          stats={[['Bundles', '18'], ['Cities', '240'], ['From', '$49']]} thumbs={['East Asia', 'MENA', 'SEA-ANZ']} progress={64} />
        <GlassCard corner="KDCI" hero="📋" title="Country Detail" meta="Metrics, flags, and actions in glass panels"
          stats={[['Guides', '250'], ['Verified', '250'], ['Updated', 'Daily']]} thumbs={['Entry', 'Climate', 'Currency']} progress={100} />
      </div>
    </PageFrame>
  );
}
