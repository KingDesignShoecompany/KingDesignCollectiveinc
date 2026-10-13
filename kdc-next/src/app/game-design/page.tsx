import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import { CARDS } from '../../data/cards';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function GameDesignPage() {
  return (
    <>
      <HeroBanner kind="controller" title="Aura Champions" subtitle="Elemental deck UI in holographic frames" badge="12.5K Players" />
      <PageFrame title="Arena" subtitle="Elemental deck UI in holographic frames">
        <div className="card-grid">
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🎴" title="Card Database" meta={`${CARDS.length} cards across 5 rarities`}
              stats={[['Cards', String(CARDS.length)], ['Rarities', '5'], ['Elements', '7']]} thumbs={['Convergence', 'Legendary', 'Epic']} progress={88} />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📱" title="NFC Tap" meta="Scan physical cards to summon"
              stats={[['NFC', 'Live'], ['Trinity', '3'], ['Fusion', 'ON']]} thumbs={['Scan', 'Fuse', 'Summon']} progress={76} />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🏆" title="Tournaments" meta="Competitive play and events"
              stats={[['Players', '12.5K'], ['Releases', '8'], ['Tournaments', '3']]} thumbs={['Ranked', 'Casual', 'Events']} progress={64} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
