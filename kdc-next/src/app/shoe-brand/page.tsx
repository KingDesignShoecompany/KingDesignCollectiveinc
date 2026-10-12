import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';

const SHOES = [
  ['Apex Runner V2', '$189', 'Performance'],
  ['Cloud Walker Pro', '$210', 'Lifestyle'],
  ['Velocity Stride', '$175', 'Racing'],
  ['Summit Ascent', '$245', 'Trail'],
  ['Marathon Elite', '$220', 'Endurance'],
  ['Sprint X', '$165', 'Track'],
];

export default function ShoeBrandPage() {
  return (
    <PageFrame title="KingDesignShoe Co. Catalog" subtitle="Premium footwear in black & gold" badge="1,240 In Stock">
      <div className="card-grid">
        {SHOES.map(([name, price, cat]) => (
          <GlassCard key={name} corner="KDCI" hero="👟" title={name} meta={cat + ' · ' + price}
            stats={[['Rating', '4.8'], ['Stock', 'In'], ['Ships', '24h']]} thumbs={['Side', 'Box', 'On Foot']} progress={85} />
        ))}
      </div>
    </PageFrame>
  );
}
