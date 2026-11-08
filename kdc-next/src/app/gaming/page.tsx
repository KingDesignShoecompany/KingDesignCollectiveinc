'use client';

import Link from 'next/link';
import { useState } from 'react';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import SectionHeader from '../../components/SectionHeader';
import ImpactBar from '../../components/ImpactBar';
import { LEADERBOARD, DAILY_CHALLENGE, GAME_IMPACT } from '../../data/pages';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

const GAMES = [
  {
    href: '/gaming/aura-champions',
    icon: '🎮',
    badge: 'Active',
    title: 'Aura Champions',
    subtitle: 'Arcane AR card-battler',
    meta: 'Trinity convergence · NFC tap-in · 12.5K players',
    cta: 'Enter Arena',
  },
  {
    href: '/gaming/still-alive-arcade',
    icon: '🎰',
    badge: 'Now Live',
    title: 'Still Alive Arcade',
    subtitle: 'Digital entertainment floor',
    meta: 'Game 1 · Game 2 · Game 3 · Future',
    cta: 'Browse Games',
  },
];

const TOURNAMENTS = [
  { id: 'serpent-royale', name: 'Serpent Royale', tier: 'Ranked', status: 'Live', prize: '2,000 XP' },
  { id: 'fusion-fever', name: 'Fusion Fever', tier: 'Open', status: 'Open', prize: '1,500 XP' },
  { id: 'wtr-wildfire', name: 'WTR Wildfire', tier: 'Season', status: 'Season', prize: '2,500 XP' },
];

const UPCOMING = [
  { name: 'Arcade Olympian', tier: 'Season', when: 'Starts Sunday' },
  { name: 'NFC Fusion Grand Prix', tier: 'Tournament', when: 'Next month' },
  { name: 'Creator Showcase: Arena X', tier: 'Community', when: 'Seasonal' },
];

export default function GamingDivisionPage() {
  const [q, setQ] = useState('');

  return (
    <>
      <HeroBanner
        kind="controller"
        title="KDCI Gaming"
        subtitle="Arcade division of the King Design Collective"
        badge="Gaming Division"
      />

      <PageFrame title="Gaming Division" subtitle="Aura Champions, Still Alive Arcade, and the games that defined the arcade era.">
        <SectionHeader
          title="Gaming Divisions"
          subtitle="Two live experiences under the KDCI Gaming umbrella."
        />

        <div className="card-grid">
          {GAMES.map((g) => (
            <Link key={g.href} href={g.href} style={cardStyle}>
              <GlassCard corner="KDCI" hero={g.icon} title={g.title} meta={g.meta}>
                <span className="glass-card-badge" style={{ background: 'rgba(212,175,55,0.16)', color: '#d4af37' }}>
                  {g.badge}
                </span>
                <div className="glass-card-meta">{g.subtitle}</div>
                <div className="glass-card-note">{g.meta}</div>
                <div className="glass-card-actions">
                  <a className="btn-gold">{g.cta}</a>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Active Tournaments</h4>
            <div className="tourney-table">
              {TOURNAMENTS.map((t) => (
                <div className="tourney-row" key={t.id}>
                  <span className="tourney-name">{t.name}</span>
                  <span className="tourney-tier">{t.tier}</span>
                  <span className={`tourney-status ${t.status}`}>{t.status}</span>
                  <span className="tourney-prize">{t.prize}</span>
                </div>
              ))}
            </div>
            <Link href="/gaming/tournaments" style={cardStyle}>
              <a className="btn-gold">View All Tournaments</a>
            </Link>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Leaderboards</h4>
            <div className="tourney-table">
              {LEADERBOARD.slice(0, 10).map((r) => (
                <div className="tourney-row" key={r.rank}>
                  <span className="rank-cell">{r.badge || '·'}</span>
                  <span className="tourney-name">{r.name}</span>
                  <span className="tourney-score">{r.score} pts</span>
                  <span className="rank-cell">#{r.rank}</span>
                </div>
              ))}
            </div>
            <Link href="/gaming/leaderboards" style={cardStyle}>
              <a className="btn-gold">Full Leaderboards</a>
            </Link>
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
      </PageFrame>
    </>
  );
}
