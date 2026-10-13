'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageFrame from '../../components/PageFrame';
import { usePurchases } from '../../hooks/usePurchases';
import { CAPITALS, GUIDE_PRICE, BUNDLE_PRICE } from '../../data/travel';

const TABS = ['Overview', 'Entry', 'Climate', 'Currency', 'Attractions', 'TikTok'];
const FREE_TABS = ['Overview'];

export default function CountryDetailPage() {
  return (
    <Suspense fallback={<div className="page-frame"><p style={{ color: '#9ca3af' }}>Loading guide…</p></div>}>
      <CountryDetailInner />
    </Suspense>
  );
}

function CountryDetailInner() {
  const params = useSearchParams();
  const country = params.get('country') || 'Japan';
  const [tab, setTab] = useState('Overview');
  const { isUnlocked, buyCountry, buyBundle } = usePurchases();
  const unlocked = isUnlocked(country);
  // Prefer the snapshot's own capital (208/255 rows) over the 49-entry
  // hardcoded name→capital map, which shows '—' for most countries.
  const [snapCapital, setSnapCapital] = useState<string | null>(null);
  const capital = snapCapital || CAPITALS[country] || '—';

  useEffect(() => {
    let cancelled = false;
    fetch('/KingDesignCollectiveinc/data/countries.json')
      .then((r) => r.json())
      .then((d: { items: Array<{ name: string; capital?: string | null }> }) => {
        if (cancelled) return;
        setSnapCapital(d.items.find((i) => i.name === country)?.capital || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [country]);

  return (
    <PageFrame title={country} subtitle={`Capital: ${capital}`} badge="Vagary Guide">
      <div className="detail-header">
        <span className="flag-globe">🌐</span>
        <h2>{country}</h2>
        <span className="code-badge">GUIDE</span>
      </div>

      <div className="tab-nav">
        {TABS.map((t) => {
          const locked = !unlocked && !FREE_TABS.includes(t);
          return (
            <button
              key={t}
              className={'tab-btn' + (tab === t ? ' active' : '') + (locked ? ' locked' : '')}
              onClick={() => setTab(t)}
            >
              {t}{locked ? ' 🔒' : ''}
            </button>
          );
        })}
      </div>

      {unlocked ? (
        <div className="tab-pane">{renderTab(tab, country, capital)}</div>
      ) : tab === 'Overview' ? (
        <div className="tab-pane">{renderTab('Overview', country, capital)}</div>
      ) : (
        <div className="paywall">
          <div className="lock-ico">🔒</div>
          <h3>Unlock the full {country} guide</h3>
          <p>Get the complete verified guide — entry requirements, climate, currency, attractions, and TikTok feed.</p>
          <div className="paywall-features">
            <span>Entry Requirements</span><span>Climate Rasters</span><span>Currency</span>
            <span>Attractions</span><span>TikTok Feed</span><span>PDF Export</span>
          </div>
          <button className="btn-gold" onClick={() => buyCountry(country)}>Buy this guide — ${GUIDE_PRICE.toFixed(2)}</button>
          <button className="btn-outline" onClick={() => buyBundle()}>Unlock ALL countries — ${BUNDLE_PRICE.toFixed(2)}</button>
        </div>
      )}
    </PageFrame>
  );
}

function renderTab(tab: string, country: string, capital: string) {
  switch (tab) {
    case 'Overview':
      return (
        <ul className="guide-list">
          <li><strong>Country:</strong> {country}</li>
          <li><strong>Capital:</strong> {capital}</li>
          <li><strong>Verified:</strong> Vagary Index — 250-country dataset</li>
          <li><strong>Status:</strong> Free preview</li>
        </ul>
      );
    case 'Entry':
      return (
        <ul className="guide-list">
          <li><strong>Visa:</strong> Check current entry requirements for {country}</li>
          <li><strong>Passport:</strong> Valid 6+ months recommended</li>
          <li><strong>Capital:</strong> {capital}</li>
          <li><strong>Best time to visit:</strong> See climate tab</li>
        </ul>
      );
    case 'Climate':
      return (
        <ul className="guide-list">
          <li><strong>Profile:</strong> {country} climate profile</li>
          <li><strong>Heat rasters:</strong> BIO1/5/6 available with data service</li>
          <li><strong>Season notes:</strong> Verified seasonal guidance</li>
        </ul>
      );
    case 'Currency':
      return (
        <ul className="guide-list">
          <li><strong>Currency:</strong> Local currency of {country}</li>
          <li><strong>Budget:</strong> $50–120/day typical cost of living</li>
          <li><strong>Cards:</strong> Widely accepted in urban areas</li>
        </ul>
      );
    case 'Attractions':
      return (
        <ul className="guide-list">
          <li><strong>Landmarks:</strong> Curated top sites in {country}</li>
          <li><strong>Nature:</strong> Parks and natural wonders</li>
          <li><strong>Culture:</strong> Museums, food, experiences</li>
        </ul>
      );
    case 'TikTok':
      return (
        <ul className="guide-list">
          <li><strong>Travel tips:</strong> What creators recommend</li>
          <li><strong>Food tour:</strong> Viral local eats</li>
        </ul>
      );
    default:
      return null;
  }
}
