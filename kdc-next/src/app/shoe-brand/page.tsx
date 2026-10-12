import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import { PRODUCTS } from '../../data/shoes';

const totalStock = PRODUCTS.reduce((n, p) => n + p.stock, 0);

export default function ShoeBrandPage() {
  return (
    <PageFrame title="KingDesignShoe Co. Catalog" subtitle="Premium footwear in black & gold" badge={`${totalStock.toLocaleString()} In Stock`}>
      <div className="card-grid">
        <Link href="/KingDesignCollectiveinc/products" style={{ textDecoration: 'none', color: 'inherit' }}>
          <GlassCard corner="KDCI" hero="👟" title="Browse Catalog" meta={`${PRODUCTS.length} premium silhouettes`}
            stats={[['In Stock', totalStock.toLocaleString()], ['Models', String(PRODUCTS.length)], ['From', '$119']]} thumbs={['Running', 'Lifestyle', 'Trail']} progress={92} />
        </Link>
        <GlassCard corner="KDCI" hero="📦" title="Product Detail" meta="Sizes, materials, and add-to-cart"
          stats={[['Sizes', '5–14'], ['Colors', '6'], ['Materials', '6']]} thumbs={['Side', 'Detail', 'Box']} progress={85} />
        <GlassCard corner="KDCI" hero="🛒" title="Checkout" meta="Demo cart — add items and review"
          stats={[['Shipping', '24h'], ['Returns', '30d'], ['Warranty', '1yr']]} thumbs={['Cart', 'Address', 'Pay']} progress={78} />
      </div>
    </PageFrame>
  );
}
