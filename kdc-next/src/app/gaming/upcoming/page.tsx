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

const GAMES = [
  { href: '/gaming/aura-champions', icon: '🎮', badge: 'Active', title: 'Aura Champions', subtitle: 'Arcane AR card-battler', meta: 'Trinity convergence · NFC tap-in · 12.5K players', cta: 'Enter Arena' },
  { href: '/gaming/still-alive-arcade', icon: '🎰', badge: 'Now Live', title: 'Still Alive Arcade', subtitle: 'Digital entertainment floor', meta: 'Game 1 · Game 2 · Game 3 · Future', cta: 'Browse Games' },
];

const UPGRADING = [
  { name: 'Arcade Olympian', tier: 'Season', when: 'Starts Sunday', status: 'Upcoming' },
  { name: 'NFC Fusion Grand Prix', tier: 'Tournament', when: 'Next month', status: 'Upcoming' },
  { name: 'Creator Showcase: Arena X', tier: 'Community', when: 'Seasonal', status: 'Upcoming' },
  { name: 'Elemental Rift', tier: 'MMO', when: 'Q1 2027', status: 'Planned' },
];

export default function GamingUpcomingPage() {
  const [q, setQ] = useState('');

  return (
    <>
      <HeroBanner kind="controller" title="Upcoming Releases" subtitle="More games arriving to the KDCI Gaming arcade." />

      <PageFrame title="Upcoming Releases" subtitle="Games in active development across the arcade.">
        <SectionHeader
          title="Active Development"
          subtitle="Plausible mock status — update as real milestones land."
          search={{ value: q, onChange: setQ, placeholder: 'Filter releases...' }}
        />

        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {UPGRADING.map((g) => (
            <div key={g.name} className="glass-card" style={{ padding: 18 }}>
              <div className="glass-card-header">
                <span className="glass-card-title">{g.name}</span>
                <span className={`glass-card-badge ${g.status === 'Upcoming' ? 'upcoming' : 'planned'}`}>{g.status}</span>
              </div>
              <div className="glass-card-meta" style={{ marginBottom: 8 }}>{g.tier} · {g.when}</div>
              <div className="glass-card-note">
                <span className="sp-art" style={{ fontSize: '1.6rem' }}>🎬</span>
                Roadmap: core engine, card meta, broadcast, and tournament integration.
              </div>
              <Link href="/gaming" style={cardStyle}>
                <a className="btn-gold">Back to Division</a>
              </Link>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <h4 className="panel-title">Impact Stats</h4>
          {GAME_IMPACT.map((i) => (
            <ImpactBar key={i.label} label={i.label} pct={i.pct} />
          ))}
        </div>
      </PageFrame>
    </>
  );
}
