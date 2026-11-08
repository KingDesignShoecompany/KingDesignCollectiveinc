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

const TOURNAMENTS = [
  { id: 'serpent-royale', name: 'Serpent Royale', tier: 'Ranked', status: 'Live', prize: '2,000 XP', starts: 'Today' },
  { id: 'fusion-fever', name: 'Fusion Fever', tier: 'Open', status: 'Open', prize: '1,500 XP', starts: 'Sat' },
  { id: 'wtr-wildfire', name: 'WTR Wildfire', tier: 'Season', status: 'Season', prize: '2,500 XP', starts: 'Jan 12' },
  { id: 'kings-door', name: 'King\'s Door', tier: 'Invitational', status: 'Registering', prize: '3,000 XP', starts: 'Jan 20' },
];

export default function GamingTournamentsPage() {
  const [q, setQ] = useState('');

  return (
    <>
      <HeroBanner kind="controller" title="Tournaments" subtitle="Competitive play across the KDCI Gaming arcade." />

      <PageFrame title="Tournaments" subtitle="Ranked, open, and invitational events.">
        <SectionHeader
          title="Active Events"
          subtitle="Filter the current tournament slate."
          search={{ value: q, onChange: setQ, placeholder: 'Filter tournaments...' }}
        />

        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {TOURNAMENTS.map((t) => (
            <div key={t.id} className="glass-card" style={{ padding: 18 }}>
              <div className="glass-card-header">
                <span className="glass-card-title">{t.name}</span>
                <span className={`glass-card-badge ${t.status === 'Live' ? 'live' : t.status === 'Registering' ? 'registering' : 'upcoming'}`}>
                  {t.status}
                </span>
              </div>
              <div className="glass-card-meta" style={{ marginBottom: 8 }}>{t.tier} · starts {t.starts}</div>
              <div className="glass-card-note">
                <span className="sp-art" style={{ fontSize: '1.2rem' }}>🏆</span>
                {t.prize} · Joining require a legal deck.
              </div>
              <Link href={`/gaming/aura-champions?tournament=${t.id}`} style={cardStyle}>
                <a className="btn-gold">Enter</a>
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
