'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageFrame from '../../components/PageFrame';
import { STORIES, THEMES, AGE_GROUPS } from '../../data/stories';

export default function StoriesPage() {
  const [theme, setTheme] = useState('All');
  const [age, setAge] = useState('All Ages');
  const [q, setQ] = useState('');

  const filtered = STORIES.filter((s) => {
    const matchTheme = theme === 'All' || s.theme === theme;
    const matchAge = age === 'All Ages' || s.age === age;
    const matchQ = !q || s.title.toLowerCase().includes(q.toLowerCase());
    return matchTheme && matchAge && matchQ;
  });

  return (
    <PageFrame title="Story Library" subtitle="Seven Minute Story Sessions" badge="Safe Mode: ON">
      <input
        className="search-input"
        placeholder="Search stories..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filter-row">
        {THEMES.map((t) => (
          <button key={t} className={'filter-btn' + (theme === t ? ' active' : '')} onClick={() => setTheme(t)}>{t}</button>
        ))}
      </div>
      <div className="filter-row">
        {AGE_GROUPS.map((a) => (
          <button key={a} className={'filter-btn' + (age === a ? ' active' : '')} onClick={() => setAge(a)}>{a}</button>
        ))}
      </div>

      <div className="card-grid">
        {filtered.map((s) => (
          <Link key={s.id} href={`/KingDesignCollectiveinc/story-play?sid=${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="story-card">
              <div className="story-hero">{s.emoji}</div>
              <div className="story-body">
                <div className="story-title">{s.title}</div>
                <div className="story-meta">
                  <span className="story-chip">{s.theme}</span>
                  <span className="story-chip muted">Ages {s.age}</span>
                  <span className="story-chip muted">{s.duration}</span>
                </div>
                <div className="story-stats">
                  <span>🎙 <b>{s.voice}</b></span>
                  <span>👁 <b>{s.views}</b></span>
                  <span>🎵 <b>{s.ambient}</b></span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
