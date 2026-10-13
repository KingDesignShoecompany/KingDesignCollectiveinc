'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import WorldMap from '../../components/WorldMap';
import { ALL_COUNTRIES } from '../../data/travel';
import { loadCountries, type Country } from '../../data/countries';
import type { Mode } from '../../lib/vagary';

function TravelContent() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [mode, setMode] = useState<Mode>('offline');
  const [count, setCount] = useState(ALL_COUNTRIES.length);

  useEffect(() => {
    let cancelled = false;
    loadCountries()
      .then(({ rows, mode: m }) => {
        if (cancelled) return;
        setCountries(rows);
        setMode(m);
        setCount(rows.length || ALL_COUNTRIES.length);
      })
      .catch(() => {
        /* snapshot already the floor; keep hardcoded count */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <HeroBanner kind="globe" title="Travel Index" subtitle="Regions, bundles & voyage map" badge={`${count} Countries`} />
      <PageFrame title="Explore" subtitle="Vagary engine — regions, bundles, and world map">
        <div className="card-grid">
          <Link href="/country/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <GlassCard corner="KDCI" hero="🌐" title="Browse Countries" meta={`All ${count} verified country guides`}
              stats={[['Visited', '29'], ['Planning', '0'], ['Unvisited', '221']]} thumbs={['Search', 'Filter', 'Buy']} progress={12} />
          </Link>
          <GlassCard corner="KDCI" hero="🌏" title="Region Bundles" meta="Curated multi-city itineraries with pricing"
            stats={[['Bundles', '18'], ['Cities', '240'], ['From', '$49']]} thumbs={['East Asia', 'MENA', 'SEA-ANZ']} progress={64} />
          <GlassCard corner="KDCI" hero="📋" title="Country Detail" meta="Metrics, flags, and actions in glass panels"
            stats={[['Guides', '250'], ['Verified', '250'], ['Updated', 'Daily']]} thumbs={['Entry', 'Climate', 'Currency']} progress={100} />
        </div>

        <WorldMap countries={countries} mode={mode} />
      </PageFrame>
    </>
  );
}

export default function TravelIndexPage() {
  return (
    <Suspense fallback={null}>
      <TravelContent />
    </Suspense>
  );
}
