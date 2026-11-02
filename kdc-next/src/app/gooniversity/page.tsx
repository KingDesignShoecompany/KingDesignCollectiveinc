'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import GlassCard from '../../components/GlassCard';
import HeroBanner from '../../components/HeroBanner';
import PageKpis from '../../components/PageKpis';
import SectionHeader from '../../components/SectionHeader';
import { COURSES, COURSE_TAGS, getCourse } from '../../data/gooniversity';

const cardStyle = { textDecoration: 'none', color: 'inherit' };

export default function GooniversityPage() {
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('All');
  const query = q.trim().toLowerCase();
  const filtered = COURSES.filter((c) => {
    const matchQ = !query || c.title.toLowerCase().includes(query) || c.tagline.toLowerCase().includes(query);
    const matchTag = tag === 'All' || c.tag === tag;
    return matchQ && matchTag;
  });

  return (
    <>
      <HeroBanner kind="graduation" title="Gooniversity" subtitle="Learn with Gooner." badge="6 Courses" />
      <PageFrame title="Academy" subtitle="Curated courses across the collective">
        <PageKpis
          items={[
            { icon: '📚', value: String(COURSES.length), label: 'Courses', delta: '12 lessons' },
            { icon: '⏱️', value: '63 min', label: 'Total Runtime', delta: 'Self-paced' },
            { icon: '🏆', value: '18', label: 'Completion Badges', delta: 'Per lesson' },
            { icon: '📅', value: '6', label: 'Weekly Digests', delta: '3 lessons/wk' },
          ]}
        />

        <SectionHeader
          title="Course Catalog"
          subtitle="Start any track — deep links into Telegram Mini App"
          search={{ value: q, onChange: setQ, placeholder: 'Search courses...' }}
        />

        <div className="panel-row" style={{ marginBottom: 14 }}>
          {COURSE_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={'btn-gold' + (tag === t ? '' : '')}
              style={{
                background: tag === t ? 'var(--gold)' : 'transparent',
                color: tag === t ? '#000' : 'var(--gold)',
                border: '1px solid var(--gold)',
                padding: '8px 12px',
                borderRadius: 999,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="card-grid">
          {filtered.map((c) => (
            <Link key={c.id} href={`/gooniversity/course/?cid=${encodeURIComponent(c.id)}`} style={cardStyle}>
              <GlassCard
                corner="KDCI"
                hero={c.emoji}
                title={c.title}
                meta={`${c.estimated} · ${c.lessons.length} lessons`}
                stats={[
                  ['Tag', c.tag],
                  ['Est.', c.estimated],
                  ['Lessons', String(c.lessons.length)],
                ]}
                thumbs={['Deep-link', 'TMA preview', 'Telegram']}
                progress={66}
              />
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: 18, textAlign: 'center' }}>
            <p className="glass-card-meta" style={{ margin: 0 }}>No courses match &ldquo;{q}&rdquo; with tag &ldquo;{tag}&rdquo;.</p>
          </div>
        )}

        <div className="panel-row">
          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Launchpad</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <a className="btn-gold" href="https://t.me/HeadMasterGooner_Bot?start=gooniversity" target="_blank" rel="noreferrer">Open in Telegram</a>
              <Link className="btn-gold" href="/tma/">TMA Dashboard</Link>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">Latest Activity</h4>
            {COURSES.slice(0, 4).map((c) => (
              <div className="act-item" key={c.id}>
                <span className="act-ico">{c.emoji}</span>
                <div>
                  <div className="act-title">{c.title}</div>
                  <div className="act-detail">{c.tagline}</div>
                </div>
                <span className="act-time">{c.estimated}</span>
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: 18 }}>
            <h4 className="panel-title">In the Channel</h4>
            <div className="sp-meta">@goonerbest</div>
            <div className="sp-meta">Daily posts · Polls · Badges</div>
            <div className="sp-meta">Lesson drops every morning</div>
            <a className="btn-gold" href="https://t.me/goonerbest" target="_blank" rel="noreferrer">Open Channel</a>
          </div>
        </div>
      </PageFrame>
    </>
  );
}
