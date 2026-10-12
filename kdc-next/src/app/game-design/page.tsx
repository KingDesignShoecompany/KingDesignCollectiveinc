import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

const CARDS = [
  ['Apex Dragon', '🔥 Fire', '500'],
  ['Tide Serpent', '💧 Water', '450'],
  ['Stone Golem', '🌍 Earth', '480'],
  ['Zephyr Sprite', '💨 Air', '420'],
];

export default function GameDesignPage() {
  return (
    <PageFrame title="Aura Champions" subtitle="Elemental deck UI in holographic frames" badge="12.5K Players">
      <div className="card-grid">
        {CARDS.map(([name, el, hp]) => (
          <GlassCard key={name} corner="KDCI" hero="🎮" title={name} meta={el + ' · HP ' + hp}
            stats={[['ATK', '99'], ['DEF', '88'], ['SPD', '77']]} thumbs={['Character', 'Controller', 'Racing']} progress={78} />
        ))}
      </div>
    </PageFrame>
  );
}
