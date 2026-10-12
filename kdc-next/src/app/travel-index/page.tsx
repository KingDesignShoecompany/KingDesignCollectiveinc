import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import { ALL_COUNTRIES } from '../../data/travel';

export default function TravelIndexPage() {
  return (
    <>
      <HeroBanner kind="globe" title="Travel Index" subtitle="Regions, bundles & voyage map" badge={`${ALL_COUNTRIES.length} Countries`} />
      <PageFrame title="Explore" subtitle="Vagary engine — regions, bundles, and world map">
      <div className="card-grid">
        <Link href="/KingDesignCollectiveinc/country" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="🌐" title="Browse Countries" meta={`All ${ALL_COUNTRIES.length} verified country guides`}
            stats={[['Visited', '29'], ['Planning', '0'], ['Unvisited', '221']]} thumbs={['Search', 'Filter', 'Buy']} progress={12} />
        </Link>
        <GlassCard corner="KDCI" hero="🌏" title="Region Bundles" meta="Curated multi-city itineraries with pricing"
          stats={[['Bundles', '18'], ['Cities', '240'], ['From', '$49']]} thumbs={['East Asia', 'MENA', 'SEA-ANZ']} progress={64} />
        <GlassCard corner="KDCI" hero="📋" title="Country Detail" meta="Metrics, flags, and actions in glass panels"
          stats={[['Guides', '250'], ['Verified', '250'], ['Updated', 'Daily']]} thumbs={['Entry', 'Climate', 'Currency']} progress={100} />
      </div>
      </PageFrame>
    </>
  );
}
