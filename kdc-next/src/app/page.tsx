'use client';

// Interactive dashboard — welcome header + search + KPI row + searchable module
// grid + analytics row (map / activity / insights) + feature footer.
// NOTE: basePath is NOT auto-applied to href strings in static export here, so
// the full prefix is required (matches sibling pages). Using raw <a> to avoid
// Link's basePath auto-prefix doubling the path.

import { Suspense, useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import HeroArt from '../components/HeroArt';
import WorldMap from '../components/WorldMap';
import { KPIS, MODULES, ACTIVITY, INSIGHTS, searchModules } from '../data/dashboard';
import { loadCountries } from '../data/countries';
import type { Country, Mode } from '../lib/vagary';
import { fetchDashboard, type OSDashboardSummary } from '../lib/os-api';

const FEATURES = [
  { ico: '⚡', title: 'Adaptive Layouts', sub: 'UI adapts to your behavior.' },
  { ico: '🧠', title: 'Intelligent Insights', sub: 'AI-driven recommendations.' },
  { ico: '🌐', title: 'Unified Ecosystem', sub: 'All modules, one experience.' },
  { ico: '📡', title: 'Real-time Impact', sub: 'Live data, real change.' },
];

function DashboardContent() {
  const [query, setQuery] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [mode, setMode] = useState<Mode>('offline');
  const [osData, setOsData] = useState<OSDashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCountries()
      .then(({ rows, mode: m }) => {
        if (cancelled) return;
        setCountries(rows);
        setMode(m);
      })
      .catch(() => {
        /* keep empty; map panel shows loading line */
      });

    // Fetch live OS data
    fetchDashboard()
      .then((data) => {
        if (cancelled) return;
        if (data) setOsData(data);
      })
      .catch(() => {
        /* keep empty; fallback to static KPIS */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const results = searchModules(query);

  return (
    <>
      <div className="dash-hero">
        <div className="dash-header">
          <div>
            <h1 className="dash-welcome">Welcome back, Innovator.</h1>
            <p className="dash-sub">Track. Explore. Build. Make an impact.</p>
          </div>
        </div>
        <div className="dash-controls">
          <div className="dash-search">
            <input
              type="text"
              placeholder="Search across modules..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search modules"
            />
          </div>
          <div className="dash-actions">
            <button className="dash-icon-btn" type="button" aria-label="Notifications">🔔</button>
            <button className="dash-icon-btn" type="button" aria-label="Settings">⚙️</button>
            <a className="dash-ai-btn" href="/KingDesignCollectiveinc/tech-stack/">+ AI Assistant</a>
          </div>
        </div>
      </div>

      <div className="page-frame">
        {osData && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold opacity-70">Live OS Status</h2>
              <span className="text-xs opacity-50">{new Date(osData.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{osData.organizations.active}</div>
                <div className="text-xs opacity-60">Orgs Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{osData.agents.total}</div>
                <div className="text-xs opacity-60">Agents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{osData.tasks.in_progress}</div>
                <div className="text-xs opacity-60">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{osData.projects.active}</div>
                <div className="text-xs opacity-60">Projects</div>
              </div>
            </div>
          </div>
        )}

        <div className="kpi-grid">
          {KPIS.map((k) => (
            <GlassCard key={k.label} title={k.label} hero={k.icon}>
              <div className="kpi-value">{k.value}</div>
              <span className="kpi-delta">{k.delta}</span>
            </GlassCard>
          ))}
        </div>

        <div className="hero-grid">
          {results.map((m) => (
            <a key={m.href} href={m.href} className="hero-panel" aria-label={`${m.title} — ${m.tagline}`}>
              <div className="hero-art"><HeroArt kind={m.kind} /></div>
              <div className="hp-text">
                <div className="hp-title">{m.title}</div>
                <div className="hp-tag">{m.tagline}</div>
              </div>
            </a>
          ))}
          {results.length === 0 && query.trim() !== '' && (
            <div className="module-empty">No modules match &ldquo;{query}&rdquo;.</div>
          )}
        </div>

        <div className="analytics-grid">
          <GlassCard title="Global Impact Map" meta="Activity density across 211 plotted countries">
            {countries.length > 0 ? (
              <WorldMap countries={countries} mode={mode} />
            ) : (
              <p className="act-detail">Loading map&hellip;</p>
            )}
            <div className="impact-legend">
              <span>Low</span>
              <span className="lg-bar" />
              <span>High</span>
            </div>
            <a className="dash-ghost-btn" href="/KingDesignCollectiveinc/travel-index/?map=1">View Map</a>
          </GlassCard>

          <GlassCard title="Recent Activity">
            {ACTIVITY.map((a) => (
              <div className="act-item" key={a.title}>
                <span className="act-ico">{a.icon}</span>
                <div>
                  <div className="act-title">{a.title}</div>
                  <div className="act-detail">{a.detail}</div>
                </div>
                <span className="act-time">{a.time}</span>
              </div>
            ))}
            <a className="dash-ghost-btn" href="/KingDesignCollectiveinc/reports/">View All</a>
          </GlassCard>

          <GlassCard title="AI Insights">
            {INSIGHTS.map((i) => (
              <div className="act-item" key={i.title}>
                <span className="act-ico">✨</span>
                <div>
                  <div className="act-title">{i.title}</div>
                  <div className="act-detail">{i.detail}</div>
                </div>
                <span className={`tag-pill ${i.tag.toLowerCase()}`}>{i.tag}</span>
              </div>
            ))}
            <a className="dash-ghost-btn" href="/KingDesignCollectiveinc/tech-stack/">View All Insights</a>
          </GlassCard>
        </div>

        <div className="feature-footer">
          {FEATURES.map((f) => (
            <div className="ff-item" key={f.title}>
              <div className="ff-ico">{f.ico}</div>
              <div className="ff-title">{f.title}</div>
              <div className="ff-sub">{f.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  // WorldMap reads useSearchParams — wrap in Suspense for static export.
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
