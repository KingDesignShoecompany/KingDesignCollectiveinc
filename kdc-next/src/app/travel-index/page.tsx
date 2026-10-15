'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import WorldMap from '../../components/WorldMap';
import PageKpis, { type Kpi } from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import ImpactBar from '../../components/ImpactBar';
import { ALL_COUNTRIES } from '../../data/travel';
import { TRAVEL_TIPS, TRAVEL_IMPACT } from '../../data/pages';
import { loadCountries, type Country } from '../../data/countries';
import type { Mode } from '../../lib/vagary';

const KPIS: Kpi[] = [
  { icon: '🌍', value: '255', label: 'Countries', delta: '+211 plotted' },
  { icon: '📍', value: '211', label: 'Plotted', delta: '82% coverage' },
  { icon: '💰', value: '$9.99', label: 'Guide From', delta: 'One-time' },
  { icon: '✅', value: '29', label: 'Visited', delta: '11% of world' },
];

function TravelContent() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [mode, setMode] = useState<Mode>('offline');
  const [count, setCount] = useState(ALL_COUNTRIES.length);
  const [q, setQ] = useState('');

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

  const ql = q.trim().toLowerCase();
  const filtered = ql
    ? ALL_COUNTRIES.filter(
        (c) => c.name.toLowerCase().includes(ql) || c.region.toLowerCase().includes(ql)
      )
    : ALL_COUNTRIES;

  return (
    <>
      <HeroBanner kind="globe" title="Travel Index" subtitle="Regions, bundles & voyage map" badge={`${count} Countries`} />
      <PageFrame title="Explore" subtitle="Vagary engine — regions, bundles, and world map">
        <PageKpis items={KPIS} />
        <SectionHeader title="Destinations" subtitle="Search 255 verified country guides" search={{ value: q, onChange: setQ, placeholder: 'Search countries...' }} />
        {q && filtered.length === 0 ? (
          <div className="module-empty">No countries match &quot;{q}&quot;.</div>
        ) : (
          <div className="country-grid">
            {filtered.map((c) => (
              <a
                key={c.name}
                className="country-card"
                href={`/KingDesignCollectiveinc/country-detail/?country=${encodeURIComponent(c.name)}`}
              >
                <span className="cflag">🌐</span>
                <div className="cname">{c.name}</div>
                <div className="cregion">{c.region}</div>
                <span className="ccode">{c.code}</span>
              </a>
            ))}
          </div>
        )}
        <div className="panel-row">
          <div className="glass-card">
            <h4 className="panel-title">Impact Overview</h4>
            {TRAVEL_IMPACT.map((i) => (
              <ImpactBar key={i.label} label={i.label} pct={i.pct} />
            ))}
          </div>
          <div className="glass-card">
            <h4 className="panel-title">Sustainable Travel Tips</h4>
            {TRAVEL_TIPS.map((t) => (
              <div className="act-item" key={t.title}>
                <div>
                  <div className="act-title">🌿 {t.title}</div>
                  <div className="act-detail">{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-grid">
          <Link href="/country/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <GlassCard corner="KDCI" hero="🌐" title="Browse Countries" meta={`All ${count} verified country guides`}
              stats={[['Visited', '29'], ['Planning', '0'], ['Unvisited', '221']]} thumbs={['Search', 'Filter', 'Buy']} progress={12} />
          </Link>
          <Link href="/bundles/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <GlassCard corner="KDCI" hero="🌏" title="Region Bundles" meta="Curated multi-city itineraries with pricing"
              stats={[['Bundles', '18'], ['Cities', '240'], ['From', '$49']]} thumbs={['East Asia', 'MENA', 'SEA-ANZ']} progress={64} />
          </Link>
          <Link href="/country/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <GlassCard corner="KDCI" hero="📋" title="Country Detail" meta="Metrics, flags, and actions in glass panels"
              stats={[['Guides', '250'], ['Verified', '250'], ['Updated', 'Daily']]} thumbs={['Entry', 'Climate', 'Currency']} progress={100} />
          </Link>
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
