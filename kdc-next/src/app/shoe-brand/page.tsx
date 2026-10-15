'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis, { type Kpi } from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import ProgressRing from '../../components/ProgressRing';
import { PRODUCTS } from '../../data/shoes';
import { SHOE_IMPACT } from '../../data/pages';
import { useCart } from '../../hooks/useCart';

const totalStock = PRODUCTS.reduce((n, p) => n + p.stock, 0);

const KPIS: Kpi[] = [
  { icon: '👟', value: totalStock.toLocaleString(), label: 'In Stock', delta: 'Live' },
  { icon: '📦', value: String(PRODUCTS.length), label: 'Models', delta: 'New drops weekly' },
  { icon: '💰', value: '$119', label: 'From', delta: 'Free shipping' },
  { icon: '⭐', value: '9.7', label: 'Rating', delta: '2.4K reviews' },
];

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function ShoeBrandPage() {
  const [q, setQ] = useState('');
  const { add } = useCart();

  const filtered = PRODUCTS.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase())
  );

  const spotlight = PRODUCTS[0];

  return (
    <>
      <HeroBanner kind="shoe" title="KingDesignShoe Co." subtitle="Premium footwear in black & gold" badge={`${totalStock.toLocaleString()} In Stock`} />
      <PageFrame title="Catalog" subtitle="Premium footwear in black & gold">
        <PageKpis items={KPIS} />

        <SectionHeader
          title="Catalog"
          subtitle="Search premium silhouettes"
          search={{ value: q, onChange: setQ, placeholder: 'Search shoes...' }}
        />

        {filtered.length === 0 && q ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
            <div className="panel-title">No matches</div>
            <p style={{ color: '#9ca3af', marginTop: 8 }}>
              Nothing found for “{q}”. Try “running”, “trail”, or clear the search.
            </p>
            <button className="dash-ghost-btn" onClick={() => setQ('')}>Clear search</button>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map((p) => (
              <a key={p.id} href={`/KingDesignCollectiveinc/product-detail/?sku=${p.id}`} style={cardStyle}>
                <GlassCard
                  corner={p.id}
                  hero="👟"
                  title={p.name}
                  meta={p.category}
                  stats={[['Price', `$${p.price}`], ['Stock', `${p.stock} units`], ['Color', p.color]]}
                  thumbs={[p.material.split(' + ')[0], `${p.sizes.length} sizes`, 'Add to cart']}
                  progress={Math.min(100, Math.round((p.stock / 200) * 100))}
                />
              </a>
            ))}
          </div>
        )}

        <div className="panel-row">
          <div className="glass-card">
            <h4 className="panel-title">Product Spotlight</h4>
            <div className="spotlight">
              <div className="sp-art">👟</div>
              <div>
                <div className="sp-title">{spotlight.name}</div>
                <div className="sp-meta">{spotlight.material} · {spotlight.color}</div>
                <div className="sp-price">${spotlight.price}</div>
                <button
                  className="btn-gold"
                  onClick={() => add(spotlight.id, spotlight.sizes[0] ?? 9)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h4 className="panel-title">Impact Breakdown</h4>
            <div className="ring-row">
              {SHOE_IMPACT.map((i) => (
                <ProgressRing key={i.label} pct={i.pct} label={i.label} />
              ))}
            </div>
          </div>
        </div>

        <div className="card-grid">
          <Link href="/products/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="👟" title="Browse Catalog" meta={`${PRODUCTS.length} premium silhouettes`}
              stats={[['In Stock', totalStock.toLocaleString()], ['Models', String(PRODUCTS.length)], ['From', '$119']]} thumbs={['Running', 'Lifestyle', 'Trail']} progress={92} />
          </Link>
          <Link href="/product-detail/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📦" title="Product Detail" meta="Sizes, materials, and add-to-cart"
              stats={[['Sizes', '5–14'], ['Colors', '6'], ['Materials', '6']]} thumbs={['Side', 'Detail', 'Box']} progress={85} />
          </Link>
          <Link href="/cart/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🛒" title="Checkout" meta="Demo cart — add items and review"
              stats={[['Shipping', '24h'], ['Returns', '30d'], ['Warranty', '1yr']]} thumbs={['Cart', 'Address', 'Pay']} progress={78} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
