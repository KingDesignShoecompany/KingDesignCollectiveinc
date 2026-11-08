'use client';

import Link from 'next/link';
import { useState } from 'react';
import PageFrame from '../../../components/PageFrame';
import GlassCard from '../../../components/GlassCard';
import HeroBanner from '../../../components/HeroBanner';
import SectionHeader from '../../../components/SectionHeader';
import ImpactBar from '../../../components/ImpactBar';
import { LEADERBOARD, DAILY_CHALLENGE, GAME_IMPACT } from '../../../data/pages';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

const CARDS = [
  { id: 'aura-1', name: 'Blaze Shard', element: 'Fire', rarity: 'Epic', hp: 120, atk: 85, def: 40, nfc: true },
  { id: 'aura-2', name: 'Frostbite', element: 'Water', rarity: 'Legendary', hp: 95, atk: 110, def: 60, nfc: true },
  { id: 'aura-3', name: 'Thunder Claw', element: 'Lightning', rarity: 'Rare', hp: 80, atk: 95, def: 55, nfc: false },
  { id: 'aura-4', name: 'Mist Warden', element: 'Air', rarity: 'Epic', hp: 105, atk: 72, def: 75, nfc: true },
];

const RARITY_COLORS = { Common: '#6b7280', Uncommon: '#34d399', Rare: '#60a5fa', Epic: '#d4af37', Legendary: '#facc15' };
const ELEMENT_ICONS = { Fire: '🔥', Water: '💧', Lightning: '⚡', Air: '🌪️', Earth: '🌍' };

const ELEMENTS = ['Fire', 'Water', 'Lightning', 'Air', 'Earth'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export default function AuraChampionsPage() {
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
    <>
      <HeroBanner
        kind="controller"
        title="Aura Champions"
        subtitle="Arcane AR card-battler inside KDCI Gaming"
        badge="In Division"
      />

      <PageFrame title="Aura Champions" subtitle="Elemental deck UI in holographic frames" badge="12.5K Players">
        <SectionHeader
          title="Card Database"
          subtitle="Search the arena deck"
          search={{ value: q, onChange: setQ, placeholder: 'Search cards...' }}
        />

        <div className="filter-row">
          {RARITIES.map((r) => (
            <button
              key={r}
              className={'filter-btn' + (rarity === r ? ' active' : '')}
              onClick={() => setRarity(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {ELEMENTS.map((el) => (
            <button
              key={el}
              className={'filter-btn' + (element === el ? ' active' : '')}
              onClick={() => setElement(el)}
            >
              {ELEMENT_ICONS[el] ?? '🎴'} {el}
            </button>
          ))}
        </div>

        <div className="card-grid">
          {filtered.map((c) => (
            <a key={c.id} href={`/card-detail/?card=${c.id}`} style={cardStyle}>
              <div
                className="glass-card"
                style={{ padding: 14, borderColor: RARITY_COLORS[c.rarity] + '44' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>{ELEMENT_ICONS[c.element] ?? '🎴'}</span>
                  <span className="glass-card-title" style={{ margin: 0 }}>{c.name}</span>
                  {c.nfc && (
                    <span className="kpi-delta" title="NFC-enabled card">NFC</span>
                  )}
                </div>
                <div
                  className="glass-card-meta"
                  style={{ color: RARITY_COLORS[c.rarity] ?? 'var(--muted)' }}
                >
                  {c.rarity}
                </div>
                <div className="glass-card-meta" style={{ marginBottom: 0 }}>
                  HP {c.hp} · ATK {c.atk} · DEF {c.def}
                </div>
              </div>
            </a>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
            <p className="glass-card-meta" style={{ margin: 0 }}>
              No cards match &ldquo;{q}&rdquo;.
            </p>
          </div>
        )}

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Featured Game</h4>
            <div className="spotlight">
              <div>
                <div className="sp-art">🎮</div>
              </div>
              <div>
                <div className="sp-title">Eco Quest</div>
                <div className="sp-meta">Elemental deck battler · 12.5K players</div>
              </div>
            </div>
            <a className="btn-gold" href="/cards/">
              Play Now
            </a>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Leaderboard</h4>
            {LEADERBOARD.map((r) => (
              <div className="act-item" key={r.rank}>
                <span className="act-ico">{r.badge || '·'}</span>
                <div>
                  <div className="act-title">{r.name}</div>
                  <div className="act-detail">{r.score} pts</div>
                </div>
                <span className="act-time">#{r.rank}</span>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Daily Challenge</h4>
            <div className="sp-title">{DAILY_CHALLENGE.title}</div>
            <div className="sp-meta">{DAILY_CHALLENGE.detail}</div>
            <button className="btn-gold" disabled title="Coming soon">
              Accept Challenge
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <h4 className="panel-title">Impact Stats</h4>
          {GAME_IMPACT.map((i) => (
            <ImpactBar key={i.label} label={i.label} pct={i.pct} />
          ))}
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard
              corner="KDCI"
              hero="🎴"
              title="Card Database"
              meta={`${CARDS.length} cards across 5 rarities`}
              stats={[
                ['Cards', String(CARDS.length)],
                ['Rarities', '5'],
                ['Elements', '7'],
              ]}
              thumbs={['Convergence', 'Legendary', 'Epic']}
              progress={88}
            />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard
              corner="KDCI"
              hero="📱"
              title="NFC Tap"
              meta="Scan physical cards to summon"
              stats={[
                ['NFC', 'Live'],
                ['Trinity', '3'],
                ['Fusion', 'ON'],
              ]}
              thumbs={['Scan', 'Fuse', 'Summon']}
              progress={76}
            />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard
              corner="KDCI"
              hero="🏆"
              title="Tournaments"
              meta="Competitive play and events"
              stats={[
                ['Players', '12.5K'],
                ['Releases', '8'],
                ['Tournaments', '3'],
              ]}
              thumbs={['Ranked', 'Casual', 'Events']}
              progress={64}
            />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
