'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import { ALL_COUNTRIES, REGIONS, GUIDE_PRICE } from '../../data/travel';
import { loadCountries, type Country } from '../../data/countries';

type Row = { name: string; region: string; code: string };

// Map dual-mode Country rows onto the shape the UI renders.
function toRows(rows: Country[]): Row[] {
  return rows.map((c) => ({ name: c.name, region: c.region, code: c.code }));
}

export default function CountriesPage() {
  const [region, setRegion] = useState('All Regions');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [mode, setMode] = useState<'live' | 'offline'>('offline');

  useEffect(() => {
    let cancelled = false;
    loadCountries()
      .then(({ rows: r, mode: m }) => {
        if (cancelled) return;
        const mapped = toRows(r);
        // Never-blank guard: if the loader yields nothing, keep the hardcoded list.
        setRows(mapped.length ? mapped : ALL_COUNTRIES);
        setMode(m);
      })
      .catch(() => {
        if (!cancelled) setRows(ALL_COUNTRIES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = rows ?? ALL_COUNTRIES;

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of data) counts[r.region] = (counts[r.region] || 0) + 1;
    return counts;
  }, [data]);

  const regions = useMemo(
    () => (rows ? Array.from(new Set(data.map((c) => c.region))).sort() : Object.keys(REGIONS)),
    [rows, data]
  );

  const filtered = useMemo(
    () =>
      data.filter((c) => {
        const matchRegion = region === 'All Regions' || c.region === region;
        const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase());
        return matchRegion && matchQ;
      }),
    [data, region, q]
  );

  return (
    <PageFrame
      title="Countries"
      subtitle={`${data.length} verified countries`}
      badge="Vagary Index"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span
          title={
            mode === 'live'
              ? 'Data loaded from the live Vagary API'
              : 'Live API unreachable — showing the committed offline snapshot'
          }
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 999,
            border: `1px solid ${mode === 'live' ? '#d4af37' : '#5a5a5a'}`,
            color: mode === 'live' ? '#0a0a0a' : '#b0b0b0',
            background: mode === 'live' ? '#d4af37' : 'transparent',
          }}
        >
          {mode === 'live' ? '● LIVE DATA' : '○ OFFLINE SNAPSHOT'}
        </span>
        {mode === 'offline' && (
          <span style={{ fontSize: 12, color: '#8a8a8a' }}>
            Live data unavailable — offline snapshot in use.
          </span>
        )}
      </div>

      <input
        className="search-input"
        placeholder="Search countries..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        <button
          className={'filter-btn' + (region === 'All Regions' ? ' active' : '')}
          onClick={() => setRegion('All Regions')}
        >
          All Regions ({data.length})
        </button>
        {regions.map((r) => (
          <button
            key={r}
            className={'filter-btn' + (region === r ? ' active' : '')}
            onClick={() => setRegion(r)}
          >
            {r} ({regionCounts[r] || 0})
          </button>
        ))}
      </div>

      <div className="country-grid">
        {filtered.map((c) => (
          <Link
            key={c.name + c.code}
            href={`/KingDesignCollectiveinc/country-detail/?country=${encodeURIComponent(c.name)}`}
            style={{ textDecoration: 'none' }}
          >
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
