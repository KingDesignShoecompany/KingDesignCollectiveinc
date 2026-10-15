'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import ImpactBar from '../../components/ImpactBar';
import { CARDS, RARITY_COLORS, ELEMENT_ICONS } from '../../data/cards';
import { LEADERBOARD, DAILY_CHALLENGE, GAME_IMPACT } from '../../data/pages';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function GameDesignPage() {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const filtered = query
    ? CARDS.filter((c) => c.name.toLowerCase().includes(query) || c.element.toLowerCase().includes(query))
    : CARDS;

  return (
    <>
      <HeroBanner kind="controller" title="Aura Champions" subtitle="Elemental deck UI in holographic frames" badge="12.5K Players" />
      <PageFrame title="Arena" subtitle="Elemental deck UI in holographic frames">
        <PageKpis items={[
          { icon: '🎮', value: '12.5K', label: 'Players', delta: '+340 today' },
          { icon: '🃏', value: String(CARDS.length), label: 'Cards', delta: '5 rarities' },
          { icon: '⚡', value: '7', label: 'Elements', delta: 'Full meta' },
          { icon: '🏆', value: 'Weekly', label: 'Season', delta: 'Ends Sunday' },
        ]} />

        <SectionHeader title="Card Database" subtitle="Search the arena deck" search={{ value: q, onChange: setQ, placeholder: 'Search cards...' }} />

        <div className="card-grid">
          {filtered.map((c) => (
            <a key={c.id} href="/KingDesignCollectiveinc/cards/" style={cardStyle}>
              <div className="glass-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.4rem' }}>{ELEMENT_ICONS[c.element] ?? '🎴'}</span>
                  <span className="glass-card-title" style={{ margin: 0 }}>{c.name}</span>
                  {c.nfc && <span className="kpi-delta" title="NFC-enabled card">NFC</span>}
                </div>
                <div className="glass-card-meta" style={{ color: RARITY_COLORS[c.rarity] ?? 'var(--muted)' }}>{c.rarity}</div>
                <div className="glass-card-meta" style={{ marginBottom: 0 }}>HP {c.hp} · ATK {c.atk} · DEF {c.def}</div>
              </div>
            </a>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
            <p className="glass-card-meta" style={{ margin: 0 }}>No cards match &ldquo;{q}&rdquo;.</p>
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
            <a className="btn-gold" href="/KingDesignCollectiveinc/cards/">Play Now</a>
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
            <button className="btn-gold" disabled title="Coming soon">Accept Challenge</button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <h4 className="panel-title">Impact Stats</h4>
          {GAME_IMPACT.map((i) => (
            <ImpactBar key={i.label} label={i.label} pct={i.pct} />
          ))}
        </div>

        <div className="card-grid">
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🎴" title="Card Database" meta={`${CARDS.length} cards across 5 rarities`}
              stats={[['Cards', String(CARDS.length)], ['Rarities', '5'], ['Elements', '7']]} thumbs={['Convergence', 'Legendary', 'Epic']} progress={88} />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📱" title="NFC Tap" meta="Scan physical cards to summon"
              stats={[['NFC', 'Live'], ['Trinity', '3'], ['Fusion', 'ON']]} thumbs={['Scan', 'Fuse', 'Summon']} progress={76} />
          </Link>
          <Link href="/cards/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🏆" title="Tournaments" meta="Competitive play and events"
              stats={[['Players', '12.5K'], ['Releases', '8'], ['Tournaments', '3']]} thumbs={['Ranked', 'Casual', 'Events']} progress={64} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
