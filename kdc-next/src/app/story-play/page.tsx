'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { STORIES } from '../../data/stories';

const TOTAL = 420; // 7:00 in seconds (stories are 7 min)

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function StoryPlayPage() {
  return (
    <Suspense fallback={<div className="page-frame"><p style={{ color: '#9ca3af' }}>Loading story…</p></div>}>
      <StoryPlayer />
    </Suspense>
  );
}

function StoryPlayer() {
  const params = useSearchParams();
  const sid = params.get('sid') || 'moonbear';
  const story = STORIES.find((s) => s.id === sid) || STORIES[0];

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState<'read' | 'chapters'>('read');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // audioFailed flips true if a real file errors out — we then fall back to the
  // simulated clock and re-show the honest "audio coming soon" badge.
  const [audioFailed, setAudioFailed] = useState(false);
  const hasRealAudio = !!story.audio && !audioFailed;

  // Real audio drives the clock when a file is present and loadable.
  useEffect(() => {
    if (!hasRealAudio) return;
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setElapsed(Math.floor(el.currentTime));
    const onErr = () => setAudioFailed(true);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('error', onErr);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('error', onErr);
    };
  }, [hasRealAudio]);

  // Simulated playback clock — used when no real audio (all stories currently),
  // or as the honest fallback when a file fails to load.
  useEffect(() => {
    if (!playing || hasRealAudio) return;
    const t = setInterval(() => setElapsed((e) => Math.min(e + 1, TOTAL)), 1000);
    return () => clearInterval(t);
  }, [playing, hasRealAudio]);

  // Keep the <audio> element in sync with the play/pause button.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !hasRealAudio) return;
    if (playing) el.play().catch(() => setAudioFailed(true));
    else el.pause();
  }, [playing, hasRealAudio]);

  // read-along: split text into 3 chapters, highlight active paragraph by progress
  const chapters = useMemo(() => {
    const n = story.text.length;
    const size = Math.ceil(n / 3);
    return [0, 1, 2].map((i) => ({
      index: i,
      title: `Chapter ${i + 1}`,
      paras: story.text.slice(i * size, (i + 1) * size),
      start: (i * size) / n,
      end: ((i + 1) * size) / n,
    }));
  }, [story]);

  const progress = elapsed / TOTAL;
  const activeChapter = chapters.find((c) => progress >= c.start && progress < c.end) || chapters[0];
  const activeParaIdx = Math.min(story.text.length - 1, Math.floor(progress * story.text.length));

  const seek = (p: number) => setElapsed(Math.round(p * TOTAL));

  return (
    <div className="page-frame" style={{ maxWidth: 760 }}>
      <div className="player-panel">
        <div className="player-hero">
          <div className="big-emoji">{story.emoji}</div>
          <h2>{story.title}</h2>
          <div className="pmeta">
            🎙 {story.voice} · 🎵 {story.ambient} · ⏱ {story.duration} · Ages {story.age}
          </div>
        </div>

        <div className="audio-bar">
          <button className="play-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="progress-track" onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek((e.clientX - r.left) / r.width);
          }}>
            <div className="progress-fill-live" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="time-label">{fmt(elapsed)}</span>
        </div>

        {story.audio && <audio ref={audioRef} src={story.audio} preload="none" />}

        {!hasRealAudio && (
          <div className="audio-honest-note">
            <span className="audio-badge">Story Timer — audio coming soon</span>
            <span className="audio-note-sub">
              Works fully offline; narration will be added when available.
            </span>
          </div>
        )}

        <div className="filter-row" style={{ marginBottom: 16 }}>
          <button className={'filter-btn' + (view === 'read' ? ' active' : '')} onClick={() => setView('read')}>Read Along</button>
          <button className={'filter-btn' + (view === 'chapters' ? ' active' : '')} onClick={() => setView('chapters')}>Chapters</button>
        </div>

        {view === 'read' ? (
          <div className="story-text">
            {story.text.map((p, i) => (
              <p key={i} className={'story-para' + (i === activeParaIdx ? ' active' : '')}>{p}</p>
            ))}
          </div>
        ) : (
          <div className="chapter-list">
            {chapters.map((c) => (
              <div key={c.index} className="chapter-item" onClick={() => seek(c.start + 0.001)}>
                <span>{c.title} — {c.paras[0]?.slice(0, 40)}…</span>
                <span className="ch-time">{fmt(c.start * TOTAL)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/KingDesignCollectiveinc/stories/" className="btn-outline">← Back to Library</Link>
      </div>
    </div>
  );
}
