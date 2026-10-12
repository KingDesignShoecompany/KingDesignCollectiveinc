'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import { ALL_COUNTRIES, REGIONS, GUIDE_PRICE } from '../../data/travel';

export default function CountriesPage() {
  const [region, setRegion] = useState('All Regions');
  const [q, setQ] = useState('');

  const regionCounts = Object.fromEntries(
    Object.entries(REGIONS).map(([r, cs]) => [r, cs.length])
  );

  const filtered = ALL_COUNTRIES.filter((c) => {
    const matchRegion = region === 'All Regions' || c.region === region;
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase());
    return matchRegion && matchQ;
  });

  return (
    <PageFrame title="Countries" subtitle={`${ALL_COUNTRIES.length} verified countries`} badge="Vagary Index">
      <input
        className="search-input"
        placeholder="Search countries..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        <button className={'filter-btn' + (region === 'All Regions' ? ' active' : '')} onClick={() => setRegion('All Regions')}>
          All Regions ({ALL_COUNTRIES.length})
        </button>
        {Object.keys(REGIONS).map((r) => (
          <button key={r} className={'filter-btn' + (region === r ? ' active' : '')} onClick={() => setRegion(r)}>
            {r} ({regionCounts[r]})
          </button>
        ))}
      </div>

      <div className="country-grid">
        {filtered.map((c) => (
          <Link key={c.name + c.code} href={`/KingDesignCollectiveinc/country-detail?country=${encodeURIComponent(c.name)}`} style={{ textDecoration: 'none' }}>
            <div className="country-card">
              <div className="globe-ico">🌐</div>
              <div className="cname">{c.name}</div>
              <div className="cregion">{c.region}</div>
              <span className="ccode">{c.code}</span>
              <span className="cprice">${GUIDE_PRICE.toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
