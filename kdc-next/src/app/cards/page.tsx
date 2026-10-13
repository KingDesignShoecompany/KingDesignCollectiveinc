'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import { CARDS, RARITIES, ELEMENTS, RARITY_COLORS, ELEMENT_COLORS, ELEMENT_ICONS } from '../../data/cards';

export default function CardsPage() {
  const [rarity, setRarity] = useState('All');
  const [element, setElement] = useState('All Elements');
  const [q, setQ] = useState('');

  const filtered = CARDS.filter((c) => {
    const matchRarity = rarity === 'All' || c.rarity === rarity;
    const matchElement = element === 'All Elements' || c.element === element;
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase());
    return matchRarity && matchElement && matchQ;
  });

  return (
    <PageFrame title="Card Database" subtitle="100+ cards across 5 rarities" badge={`${CARDS.length} Cards`}>
      <input
        className="search-input"
        placeholder="Search by name, element, or ability..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        {RARITIES.map((r) => (
          <button key={r} className={'filter-btn' + (rarity === r ? ' active' : '')} onClick={() => setRarity(r)}>
            {r}
          </button>
        ))}
      </div>
      <div className="filter-row">
        {ELEMENTS.map((el) => (
          <button key={el} className={'filter-btn' + (element === el ? ' active' : '')} onClick={() => setElement(el)}>
            {ELEMENT_ICONS[el] ? ELEMENT_ICONS[el] + ' ' : ''}{el}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {filtered.map((c) => (
          <Link key={c.id} href={`/card-detail/?card=${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card-slot">
              <div className="card-image" style={{ background: `linear-gradient(160deg, ${ELEMENT_COLORS[c.element]}44, rgba(0,0,0,0.3))` }}>
                <span className="rarity-badge" style={{ background: RARITY_COLORS[c.rarity] }}>{c.rarity}</span>
                <span className="element-badge" style={{ background: ELEMENT_COLORS[c.element] }}>{c.element}</span>
                <span>{ELEMENT_ICONS[c.element] || '🎴'}</span>
                {c.nfc && <span className="nfc-icon" title="NFC Enabled">📱</span>}
              </div>
              <div className="card-body">
                <div className="card-name">{c.name}</div>
                <div className="card-desc">{c.desc}</div>
                <div className="card-stats">
                  <div className="stat stat-hp"><b>{c.hp}</b><span>HP</span></div>
                  <div className="stat stat-atk"><b>{c.atk}</b><span>ATK</span></div>
                  <div className="stat stat-def"><b>{c.def}</b><span>DEF</span></div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
