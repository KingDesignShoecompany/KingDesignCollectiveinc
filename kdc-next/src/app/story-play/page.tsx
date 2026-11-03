'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { STORIES } from '../../data/stories';

const TOTAL = 420; // 7:00 in seconds

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasVideo = !!story.video && !videoFailed;
  const hasAudio = !!story.audio && !audioFailed;
  const hasRealMedia = hasVideo || hasAudio;

  // Real video drives the clock when present and loadable.
  useEffect(() => {
    if (!hasVideo) return;
    const el = videoRef.current;
    if (!el) return;
    const onTime = () => setElapsed(Math.floor(el.currentTime));
    const onErr = () => setVideoFailed(true);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('error', onErr);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('error', onErr);
      el.removeEventListener('ended', onEnd);
    };
  }, [hasVideo]);

  // Real audio drives the clock when present and loadable (and no video).
  useEffect(() => {
    if (!hasAudio || hasVideo) return;
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
  }, [hasAudio, hasVideo]);

  // Simulated playback clock — used when no real media, or as honest fallback.
  useEffect(() => {
    if (!playing || hasRealMedia) return;
    const t = setInterval(() => setElapsed((e) => Math.min(e + 1, TOTAL)), 1000);
    return () => clearInterval(t);
  }, [playing, hasRealMedia]);

  // Keep media elements in sync with play/pause.
  useEffect(() => {
    if (hasVideo) {
      const el = videoRef.current;
      if (!el) return;
      if (playing) el.play().catch(() => setVideoFailed(true));
      else el.pause();
    } else if (hasAudio) {
      const el = audioRef.current;
      if (!el) return;
      if (playing) el.play().catch(() => setAudioFailed(true));
      else el.pause();
    }
  }, [playing, hasVideo, hasAudio]);

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

        {hasVideo && (
          <video
            ref={videoRef}
            src={story.video}
            controls
            playsInline
            preload="metadata"
            style={{ width: '100%', borderRadius: 12, marginTop: 12 }}
          />
        )}
        {!hasVideo && hasAudio && (
          <audio ref={audioRef} src={story.audio} preload="none" />
        )}

        {!hasRealMedia && (
          <div className="audio-honest-note">
            <span className="audio-badge">Story Timer — audio/video coming soon</span>
            <span className="audio-note-sub">
              Works fully offline; media will be added when available.
            </span>
          </div>
        )}

        <div className="filter-row" style={{ marginBottom: 16, marginTop: 16 }}>
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
        <Link href="/KingDesignCollectiveinc/kids-channel/" className="btn-outline">← Back to Library</Link>
      </div>
    </div>
  );
}
