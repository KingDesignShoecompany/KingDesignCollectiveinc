'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Country, Mode, VisitState } from '../lib/vagary';
import { loadVisited, saveVisitedLocal } from '../data/countries';
import { ringPoints, continentLabelPoints, type LandFeature } from '../lib/geo';
import './WorldMap.css';

// Brand palette
const GOLD = '#d4af37';
const RED = '#e63946';
const GOLD_DIM = '#6b5a1e';

type Point = { x: number; y: number };

export default function WorldMap({
  countries,
  mode,
}: {
  countries: Country[];
  mode: Mode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visits, setVisits] = useState<VisitState>({});
  const [selected, setSelected] = useState<Country | null>(null);
  const pointsRef = useRef<Map<string, Point>>(new Map());
  const selectedRef = useRef<string | null>(null);

  // Continent landmass outlines + labels (non-fatal on failure: dots still draw).
  const [land, setLand] = useState<LandFeature[]>([]);
  useEffect(() => {
    let cancelled = false;
    // Match the snapshot loader's basePath pattern (see src/data/countries.ts).
    fetch('/KingDesignCollectiveinc/data/world-land.geojson')
      .then((r) => r.json())
      .then((g: any) => {
        if (cancelled) return;
        const feats: LandFeature[] = (g.features ?? [])
          .filter((f: any) => f?.geometry?.type === 'Polygon')
          .map((f: any) => ({
            name: String(f.properties?.name ?? ''),
            ring: f.geometry.coordinates[0] as [number, number][],
          }))
          .filter((f: LandFeature) => f.name && f.ring.length >= 3);
        setLand(feats);
      })
      .catch(() => {
        /* non-fatal: dots still render without land overlay */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link support: ?map=1 or #map opens the map. Read via useSearchParams
  // (this component is wrapped in Suspense by the page).
  const params = useSearchParams();
  const wantsOpen = params?.get('map') === '1';
  const [open, setOpen] = useState(wantsOpen);

  const plotted = countries.filter((c) => c.lat !== null && c.lon !== null);
  const stateOf = (code: string): 'visited' | 'want' | 'unvisited' =>
    visits[code] || 'unvisited';

  // Load visit state once (live API → localStorage fallback).
  useEffect(() => {
    let cancelled = false;
    loadVisited().then((v) => {
      if (!cancelled) setVisits(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep-link: when opened via ?map=1/#map, scroll the map into view.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [open]);

  // Redraw whenever data, size, selection, or visit state changes.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      const W = wrap.clientWidth;
      const H = Math.max(280, Math.min(420, Math.round(W * 0.5)));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // equirectangular projection
      const proj = (c: Country): Point => ({
        x: ((c.lon as number) + 180) / 360 * W,
        y: (90 - (c.lat as number)) / 180 * H,
      });

      // faint graticule
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = (lon + 180) / 360 * W;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = (90 - lat) / 180 * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // land masses
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.06)';
      for (const f of land) {
        const pts = ringPoints(f.ring, W, H);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // continent labels
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(212, 175, 55, 0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const l of continentLabelPoints(land, W, H)) {
        ctx.fillText(l.name.toUpperCase(), l.x, l.y);
      }

      const pts = new Map<string, Point>();
      plotted.forEach((c) => {
        const p = proj(c);
        pts.set(c.code, p);
        const s = stateOf(c.code);
        const isSel = selectedRef.current === c.code;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSel ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = s === 'visited' ? GOLD : s === 'want' ? RED : 'rgba(212,175,55,0.55)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = isSel ? '#ffffff' : 'rgba(0,0,0,0.5)';
        ctx.stroke();
      });
      pointsRef.current = pts;
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    draw();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plotted, selected, visits, land]);

  const findDot = (ev: React.MouseEvent<HTMLCanvasElement>): Country | null => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    let best: Country | null = null;
    let bd = 12;
    for (const c of plotted) {
      const p = pointsRef.current.get(c.code);
      if (!p) continue;
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    return best;
  };

  const setState = (code: string, st: 'visited' | 'want' | null) => {
    setVisits((prev) => {
      const next = { ...prev };
      if (st === null) delete next[code];
      else next[code] = st;
      saveVisitedLocal(next);
      return next;
    });
  };

  const visitedCount = plotted.filter((c) => stateOf(c.code) === 'visited').length;
  const wantCount = plotted.filter((c) => stateOf(c.code) === 'want').length;
  const unvisitedCount = plotted.length - visitedCount - wantCount;

  return (
    <div className="worldmap" ref={wrapRef} id="worldmap">
      <div className="worldmap-head">
        <div className="worldmap-title">
          🗺️ World Map
          <span className="worldmap-sub">Equirectangular dot map · visit-state coloured</span>
        </div>
        <button className="worldmap-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide map' : 'Show map'}
        </button>
      </div>

      {mode === 'offline' && (
        <div className="worldmap-banner">
          Live data unavailable — showing offline map snapshot. The map still draws from committed
          coordinates.
        </div>
      )}

      {open && (
        <>
          <div className="worldmap-legend">
            <span>
              <i className="dot" style={{ background: GOLD }} /> BEEN THERE
            </span>
            <span>
              <i className="dot" style={{ background: RED }} /> WANT TO VISIT
            </span>
            <span>
              <i className="dot" style={{ background: GOLD_DIM }} /> UNVISITED
            </span>
          </div>

          <div className="worldmap-body">
            <canvas
              ref={canvasRef}
              className="worldmap-canvas"
              onMouseMove={(e) => {
                const c = findDot(e);
                e.currentTarget.style.cursor = c ? 'pointer' : 'crosshair';
              }}
              onClick={(e) => {
                const c = findDot(e);
                setSelected(c);
                selectedRef.current = c ? c.code : null;
              }}
            />
            <aside className="worldmap-panel">
              {selected ? (
                <>
                  <div className="wm-name">{selected.name}</div>
                  <div className="wm-region">{selected.region}</div>
                  <div className="wm-meta">
                    {selected.capital && <>Capital: {selected.capital} · </>}
                    {selected.lat?.toFixed(2)}, {selected.lon?.toFixed(2)}
                  </div>
                  <div className="wm-btns">
                    <button
                      className={stateOf(selected.code) === 'visited' ? 'wm-btn active' : 'wm-btn'}
                      onClick={() =>
                        setState(
                          selected.code,
                          stateOf(selected.code) === 'visited' ? null : 'visited'
                        )
                      }
                    >
                      ✓ Been there
                    </button>
                    <button
                      className={stateOf(selected.code) === 'want' ? 'wm-btn active' : 'wm-btn'}
                      onClick={() =>
                        setState(selected.code, stateOf(selected.code) === 'want' ? null : 'want')
                      }
                    >
                      ☆ Want to visit
                    </button>
                  </div>
                </>
              ) : (
                <div className="wm-empty">Click a dot to inspect a country and mark your travel
                  state. Saved locally to your browser.</div>
              )}
            </aside>
          </div>

          <div className="worldmap-stats">
            <span>
              <b>{visitedCount}</b> visited
            </span>
            <span className="wm-sep">·</span>
            <span>
              <b>{wantCount}</b> want
            </span>
            <span className="wm-sep">·</span>
            <span>
              <b>{unvisitedCount}</b> unvisited
            </span>
            <span className="wm-sep">·</span>
            <span className="wm-muted">
              {plotted.length} of {countries.length} countries plotted
            </span>
          </div>
        </>
      )}
    </div>
  );
}
