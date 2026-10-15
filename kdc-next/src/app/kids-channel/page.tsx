'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import { STORIES } from '../../data/stories';
import { KID_BADGES } from '../../data/pages';

const totalViews = STORIES.reduce((n, s) => n + parseFloat(s.views), 0).toFixed(1);

const KPIS = [
  { icon: '📚', value: String(STORIES.length), label: 'Stories', delta: '7-min sessions' },
  { icon: '👀', value: totalViews + 'K', label: 'Views', delta: 'All time' },
  { icon: '⭐', value: '9.7', label: 'Rating', delta: 'Parent approved' },
  { icon: '🛡️', value: 'ON', label: 'Safe Mode', delta: 'Always on' },
];

const popular = [...STORIES].sort((a, b) => parseFloat(b.views) - parseFloat(a.views)).slice(0, 4);

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function KidsChannelPage() {
  const [q, setQ] = useState('');

  const filtered = STORIES.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.theme.toLowerCase().includes(q.toLowerCase())
  );

  const featured = STORIES[0];

  return (
    <>
      <HeroBanner kind="cards" title="Kids Channel" subtitle="Seven Minute Story Sessions" badge="Safe Mode: ON" />
      <PageFrame title="Library" subtitle="Seven Minute Story Sessions in a unified theme">
        <PageKpis items={KPIS} />

        <SectionHeader
          title="Story Library"
          subtitle="Search bedtime sessions"
          search={{ value: q, onChange: setQ, placeholder: 'Search stories...' }}
        />

        {filtered.length === 0 && q ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 32 }}>
            <div className="panel-title">No stories found</div>
            <p style={{ color: '#9ca3af', marginTop: 8 }}>
              Nothing found for “{q}”. Try “Animals”, “Fantasy”, or clear the search.
            </p>
            <button className="dash-ghost-btn" onClick={() => setQ('')}>Clear search</button>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map((s) => (
              <a key={s.id} href={`/KingDesignCollectiveinc/story-play/?sid=${s.id}`} style={cardStyle}>
                <GlassCard
                  corner="KDCI"
                  hero={s.emoji}
                  title={s.title}
                  meta={`${s.theme} · ${s.duration} · age ${s.age}`}
                  stats={[['Theme', s.theme], ['Length', s.duration], ['Views', s.views]]}
                  thumbs={[s.voice, s.ambient, `Age ${s.age}`]}
                  progress={100}
                />
              </a>
            ))}
          </div>
        )}

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Featured Story</h4>
            <div className="spotlight">
              <div className="sp-art">{featured.emoji}</div>
              <div>
                <div className="sp-title">{featured.title}</div>
                <div className="sp-meta">
                  {featured.voice} · {featured.ambient} ambient
                </div>
                <div className="sp-meta">
                  {featured.theme} · {featured.duration} · {featured.views} views
                </div>
                <a className="btn-gold" href={`/KingDesignCollectiveinc/story-play/?sid=${featured.id}`}>
                  Read Now
                </a>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Your Impact</h4>
            {KID_BADGES.map((b) => (
              <div className="act-item" key={b.name}>
                <span className="act-ico">{b.icon}</span>
                <div>
                  <div className="act-title">{b.name}</div>
                  <div className="act-detail">{b.detail}</div>
                </div>
              </div>
            ))}
            <div className="act-detail" style={{ marginTop: 10 }}>
              Earnings 1,250 ⭐ · Quizzes 20
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 18 }}>
          <h4 className="panel-title">Popular Stories</h4>
          <div className="card-grid">
            {popular.map((s) => (
              <a key={s.id} href={`/KingDesignCollectiveinc/story-play/?sid=${s.id}`} style={cardStyle}>
                <div className="glass-card" style={{ padding: 14 }}>
                  <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
                  <div className="sp-title" style={{ marginTop: 6 }}>{s.title}</div>
                  <div className="sp-meta">{s.theme} · {s.duration}</div>
                  <div className="act-detail" style={{ marginTop: 4 }}>{s.views} views · age {s.age}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="card-grid">
          <Link href="/stories/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="📚" title="Story Library" meta={`${STORIES.length} bedtime stories with read-along`}
              stats={[['Stories', String(STORIES.length)], ['Views', totalViews + 'K'], ['Rating', '9.7']]} thumbs={['Animals', 'Fantasy', 'Adventure']} progress={100} />
          </Link>
          <Link href="/story-play/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="🎧" title="Story Player" meta="Read-along with chapters and progress"
              stats={[['Minutes', '7'], ['Voices', '4'], ['Ambient', '5']]} thumbs={['Read', 'Chapters', 'Play']} progress={84} />
          </Link>
          <Link href="/stories/" style={cardStyle}>
            <GlassCard corner="KDCI" hero="✏️" title="Create" meta="Build custom stories for kids"
              stats={[['Paths', '50+'], ['Safe', 'ON'], ['Age', '2-8']]} thumbs={['Learning', 'Stories', 'Create']} progress={60} />
          </Link>
        </div>
      </PageFrame>
    </>
  );
}
