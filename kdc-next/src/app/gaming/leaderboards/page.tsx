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

const LEADERS = [
  { rank: 1, name: 'NovaKnight', score: '12,480', badge: '🥇', division: 'Aura Champions' },
  { rank: 2, name: 'EmberFist', score: '11,905', badge: '🥈', division: 'Aura Champions' },
  { rank: 3, name: 'TideWalker', score: '10,732', badge: '🥉', division: 'Aura Champions' },
  { rank: 4, name: 'You', score: '9,850', badge: '⭐', division: 'Mixed' },
  { rank: 5, name: 'Solaris', score: '9,120', badge: '', division: 'Mixed' },
];

export default function GamingLeaderboardsPage() {
  const [q, setQ] = useState('');

  return (
    <>
      <HeroBanner kind="controller" title="Leaderboards" subtitle="Top players across all KDCI Gaming divisions." />

      <PageFrame title="Leaderboards" subtitle="The standings across Aura Champions and Still Alive Arcade.">
        <SectionHeader
          title="Global Standings"
          subtitle="Ranked players across the entire arcade."
          search={{ value: q, onChange: setQ, placeholder: 'Filter players...' }}
        />

        <div className="card-grid">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Aura Champions</h4>
            <div className="tourney-table">
              {LEADERS.filter((l) => l.division === 'Aura Champions').map((r) => (
                <div className="tourney-row" key={r.rank}>
                  <span className="rank-cell">{r.badge || '·'}</span>
                  <span className="tourney-name">{r.name}</span>
                  <span className="tourney-score">{r.score} pts</span>
                  <span className="rank-cell">#{r.rank}</span>
                </div>
              ))}
            </div>
            <Link href="/gaming/aura-champions" style={cardStyle}>
              <a className="btn-gold">View All</a>
            </Link>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Still Alive Arcade</h4>
            <div className="tourney-table">
              {LEADERS.filter((l) => l.division === 'Mixed').map((r) => (
                <div className="tourney-row" key={r.rank}>
                  <span className="rank-cell">{r.badge || '·'}</span>
                  <span className="tourney-name">{r.name}</span>
                  <span className="tourney-score">{r.score} pts</span>
                  <span className="rank-cell">#{r.rank}</span>
                </div>
              ))}
            </div>
            <Link href="/gaming/still-alive-arcade" style={cardStyle}>
              <a className="btn-gold">View All</a>
            </Link>
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
