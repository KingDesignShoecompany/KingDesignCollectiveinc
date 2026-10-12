'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageFrame from '../../components/PageFrame';
import { useCart } from '../../hooks/useCart';
import { PRODUCTS } from '../../data/shoes';

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="page-frame"><p style={{ color: '#9ca3af' }}>Loading product…</p></div>}>
      <ProductDetailInner />
    </Suspense>
  );
}

function ProductDetailInner() {
  const params = useSearchParams();
  const sku = params.get('sku') || 'KING-001';
  const product = PRODUCTS.find((p) => p.id === sku) || PRODUCTS[0];
  const [size, setSize] = useState(product.sizes[0]);
  const { add, count } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <PageFrame title={product.name} subtitle={`${product.category} · ${product.id}`} badge={`$${product.price}`}>
      <div className="detail-header">
        <span className="flag-globe">👟</span>
        <h2>{product.name}</h2>
        <span className="code-badge">{product.id}</span>
      </div>

      <ul className="guide-list">
        <li><strong>Price:</strong> ${product.price}</li>
        <li><strong>Category:</strong> {product.category}</li>
        <li><strong>Color:</strong> {product.color}</li>
        <li><strong>Material:</strong> {product.material}</li>
        <li><strong>In Stock:</strong> {product.stock} units</li>
      </ul>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '24px 0 10px' }}>Select Size</h3>
      <div className="filter-row">
        {product.sizes.map((s) => (
          <button key={s} className={'filter-btn' + (size === s ? ' active' : '')} onClick={() => setSize(s)}>
            US {s}
          </button>
        ))}
      </div>

      <button
        className="btn-gold"
        onClick={() => { add(product.id, size); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
      >
        {added ? '✓ Added to cart' : `Add to Cart — $${product.price}`}
      </button>
      {count > 0 && <span style={{ marginLeft: 14, color: '#d4af37', fontSize: '.85rem' }}>Cart: {count} item{count > 1 ? 's' : ''}</span>}
    </PageFrame>
  );
}
