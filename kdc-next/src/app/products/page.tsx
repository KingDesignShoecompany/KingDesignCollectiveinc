'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import { PRODUCTS, CATEGORIES } from '../../data/shoes';

export default function ProductsPage() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = cat === 'all' || p.category === cat;
    const matchQ = !q || p.name.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  const totalStock = PRODUCTS.reduce((n, p) => n + p.stock, 0);

  return (
    <PageFrame title="Catalog" subtitle="Premium footwear in black & gold" badge={`${totalStock.toLocaleString()} In Stock`}>
      <input
        className="search-input"
        placeholder="Search products..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        {CATEGORIES.map((c) => (
          <button key={c} className={'filter-btn' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {filtered.map((p) => (
          <Link key={p.id} href={`/KingDesignCollectiveinc/product-detail/?sku=${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-card">
              <div className="glass-card-corner">KDCI</div>
              <div className="glass-card-hero">👟</div>
              <div className="glass-card-title">{p.name}</div>
              <div className="glass-card-meta">{p.category} · {p.color}</div>
              <div className="stat-row">
                <div className="stat"><b>${p.price}</b><span>Price</span></div>
                <div className="stat"><b>{p.stock}</b><span>In Stock</span></div>
                <div className="stat"><b>{p.sizes.length}</b><span>Sizes</span></div>
              </div>
              <div className="thumb-row">
                <div className="thumb">Side</div>
                <div className="thumb">Detail</div>
                <div className="thumb">Box</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
