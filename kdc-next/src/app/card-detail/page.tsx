'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageFrame from '../../components/PageFrame';
import { CARDS, RARITY_COLORS, ELEMENT_COLORS, ELEMENT_ICONS } from '../../data/cards';

export default function CardDetailPage() {
  return (
    <Suspense fallback={<div className="page-frame"><p style={{ color: '#9ca3af' }}>Loading card…</p></div>}>
      <CardDetailInner />
    </Suspense>
  );
}

function CardDetailInner() {
  const params = useSearchParams();
  const id = params.get('card') || 'trinity50';
  const card = CARDS.find((c) => c.id === id) || CARDS[0];
  const [scanned, setScanned] = useState(false);

  return (
    <PageFrame title={card.name} subtitle={`${card.rarity} · ${card.element}`} badge={`#${card.id}`}>
      <div className="detail-header">
        <span className="flag-globe">{ELEMENT_ICONS[card.element] || '🎴'}</span>
        <h2>{card.name}</h2>
        <span className="code-badge" style={{ background: RARITY_COLORS[card.rarity] }}>{card.rarity}</span>
      </div>

      <div className="card-image" style={{ height: 180, borderRadius: 14, marginBottom: 20, background: `linear-gradient(160deg, ${ELEMENT_COLORS[card.element]}44, rgba(0,0,0,0.3))` }}>
        <span className="element-badge" style={{ background: ELEMENT_COLORS[card.element] }}>{card.element}</span>
        <span style={{ fontSize: '4rem' }}>{ELEMENT_ICONS[card.element] || '🎴'}</span>
        {card.nfc && <span className="nfc-icon" title="NFC Enabled">📱</span>}
      </div>

      <ul className="guide-list">
        <li><strong>Effect:</strong> {card.desc}</li>
        <li><strong>Rarity:</strong> {card.rarity}</li>
        <li><strong>Element:</strong> {card.element}</li>
        <li><strong>NFC Enabled:</strong> {card.nfc ? 'Yes — tap to scan' : 'No'}</li>
      </ul>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '24px 0 10px' }}>Abilities</h3>
      <div className="ability-list">
        {card.abilities.map((a) => (
          <span className="ability" key={a}>{a}</span>
        ))}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', color: '#f2e9c9', margin: '24px 0 10px' }}>Stats</h3>
      <div className="card-stats" style={{ maxWidth: 320 }}>
        <div className="stat stat-hp"><b>{card.hp}</b><span>HP</span></div>
        <div className="stat stat-atk"><b>{card.atk}</b><span>ATK</span></div>
        <div className="stat stat-def"><b>{card.def}</b><span>DEF</span></div>
      </div>

      {card.nfc && (
        <button className="btn-gold" style={{ marginTop: 24 }} onClick={() => setScanned(true)}>
          {scanned ? '✓ NFC Scanned' : '📱 Simulate NFC Scan'}
        </button>
      )}
    </PageFrame>
  );
}
