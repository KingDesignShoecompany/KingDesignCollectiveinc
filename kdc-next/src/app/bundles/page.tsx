'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import HeroBanner from '../../components/HeroBanner';
import { BUNDLE_PRICE } from '../../data/travel';
import { loadCountries, type Country } from '../../data/countries';

// A bundle = one canonical region. Derived from the live snapshot so it always
// matches the country list's taxonomy — no hardcoded region table to drift.
type Bundle = { region: string; count: number; sample: string[] };

const SAMPLE = 5;

export default function BundlesPage() {
  const [rows, setRows] = useState<Country[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadCountries()
      .then(({ rows: r }) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const bundles = useMemo<Bundle[]>(() => {
    const byRegion = new Map<string, Country[]>();
    for (const c of rows) {
      if (c.region === 'Unclassified') continue;
      const arr = byRegion.get(c.region) ?? [];
      arr.push(c);
      byRegion.set(c.region, arr);
    }
    return [...byRegion.entries()]
      .map(([region, cs]) => ({
        region,
        count: cs.length,
        sample: cs.slice(0, SAMPLE).map((c) => c.name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  return (
    <>
      <HeroBanner kind="globe" title="Region Bundles" subtitle="Curated multi-region itineraries with pricing" badge={`${bundles.length} Bundles`} />
      <PageFrame title="Bundles" subtitle="One bundle per verified region — unlock every guide in it">
        {bundles.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Loading bundles…</p>
        ) : (
          <div className="bundle-grid">
            {bundles.map((b) => (
              <div key={b.region} className="bundle-card">
                <div className="bundle-region">{b.region}</div>
                <div className="bundle-count">{b.count} country guides</div>
                <div className="bundle-sample">{b.sample.join(' · ')}{b.count > SAMPLE ? ' …' : ''}</div>
                <div className="bundle-actions">
                  <span className="bundle-price">${BUNDLE_PRICE.toFixed(2)}</span>
                  <Link href="/country/" className="btn-outline">Browse region</Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/travel-index/" className="btn-outline">← Back to Travel Index</Link>
        </div>
      </PageFrame>
    </>
  );
}
