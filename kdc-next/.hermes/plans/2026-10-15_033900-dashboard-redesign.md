# Dashboard Redesign + Sidebar Subsidiary Names

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** (1) Sidebar nav shows full subsidiary names instead of short labels. (2) Dashboard page rebuilt into the interactive layout from the reference PNG: header with search + welcome, KPI row, module grid, analytics section (impact map / recent activity / AI insights), feature footer.

**Architecture:** Static Next export, existing components reused: `GlassCard` (stats/progress already supported), `WorldMap` (canvas dot map, already built — reuse for the impact panel), `HeroArt` (module illustrations). Sidebar change is a 8-line label map. Dashboard becomes a client component with local state (search filter over modules, tab/active states) — no backend, mock-but-plausible data from a new `src/data/dashboard.ts`. CSS additions go in `src/styles/globals.css` following existing token names (`--gold`, `--border`, `--muted`, `--gold-soft`).

**Tech Stack:** Next 15.5 static export, React 18, TypeScript, vitest (jsdom), plain CSS.

---

## Current context (verified this session)

- Sidebar: `src/components/Sidebar.tsx` — `PAGES` array with short labels (`Travel`, `Shoes`, `Games`, `Kids`, `Innovation`, `E-Waste`, `Quantum`), rendered `label.toUpperCase()`, active-state via `usePathname`. 8 items incl. Dashboard.
- Dashboard: `src/app/page.tsx` — server component; `dash-hero` (title/tagline/Made-with-AI badge) + `hero-grid` of 8 `hero-panel` `<a>` tiles (art only, no text — aria-label only). Uses raw `<a>` with full basePath prefix (Link would double-prefix in static export).
- `GlassCard` (`src/components/GlassCard.tsx`) supports: corner, hero (emoji), title, meta, stats (string[][]), thumbs, progress. Good fit for KPI/module/activity cards.
- `WorldMap.tsx` — canvas map, props `{countries, mode}`; fetches countries itself via `loadCountries`. Self-contained, can drop into the impact panel.
- Hero banner used on travel: `HeroBanner kind="globe" title subtitle badge` — pattern exists for the header.
- `src/data/travel.ts` has `ALL_COUNTRIES`; `src/data/countries.ts` has `loadCountries()`. Data modules pattern: `src/data/*.ts` with vitest tests (`travel.test.ts` etc.).
- CSS: `src/styles/globals.css` (511 lines) with `.dash-hero`, `.card-grid`, `.glass-card`, `.page-frame`, `--gold`/`--border`/`--muted` tokens; Fraunces serif for display, sans for body.
- Reference PNG (bropilot_20261015_081051.png) shows: left sidebar (Dashboard active) · header "Welcome back, Innovator" + "Track. Explore. Build. Make an impact." + search "Search across modules..." + bell/gear + "+ AI Assistant" gold button · 4 KPI cards (Global Impact 12.4M +18.4%, Innovation Score 9,250 Top 5% +12.6%, Active Projects 48 +6 new, Eco Impact 2.4M kg +24.8%) · 8 module cards w/ glowing art + tagline ("Explore the world." etc.) · bottom row: Global Impact Map (map w/ legend Low→High + "View Map"), Recent Activity list (E-Waste Milestone 2h ago, Patent Filed 5h ago, Story Published 1d ago, "View All"), AI Insights (Expand to Africa Region/Recommended, Sustainable Shoe Line/Trending, "View All Insights") · footer 4 features (Adaptive Layouts, Intelligent Insights, Unified Ecosystem, Real-time Impact).
- Live site: kingdesignshoecompany.github.io/KingDesignCollectiveinc/ (deploy CI auto-runs on push to main; CDN caches index.html minutes — browser-verify, retry if stale).

## Naming map (from user, exact strings)

| Sidebar label | Full name |
|---|---|
| Travel | Vagary Index |
| Shoes | KingDesignShoeCompany |
| Games | Aura Champions |
| Kids | Seven Minute Story Sessions |
| Innovation | King Design Collective Briheight Box |
| E-Waste | KingDesign E-Collective |
| Quantum | Quantum Mode |

Note: existing dashboard PANELS use different casing ("KingDesignShoe Co." etc.) — align module-card titles to the same names for consistency (side effect of this task, in-scope per user intent: "add the respective subsidiary names").

## Step-by-step plan

### Task 1: Sidebar subsidiary names

**Objective:** Replace short labels with full subsidiary names.

**Files:**
- Modify: `src/components/Sidebar.tsx` (PAGES array, lines 6-15)

**Step 1:** Edit the PAGES array:

```ts
const PAGES = [
  { href: '/', label: 'Dashboard', ico: '◈' },
  { href: '/travel-index', label: 'Vagary Index', ico: '🌍' },
  { href: '/shoe-brand', label: 'KingDesignShoeCompany', ico: '👟' },
  { href: '/game-design', label: 'Aura Champions', ico: '🎮' },
  { href: '/kids-channel', label: 'Seven Minute Story Sessions', ico: '📚' },
  { href: '/innovation-hub', label: 'King Design Collective Briheight Box', ico: '💡' },
  { href: '/ewaste-recycling', label: 'KingDesign E-Collective', ico: '♻️' },
  { href: '/quantum-wearables', label: 'Quantum Mode', ico: '⚛️' },
];
```

Long labels + `.toUpperCase()` may overflow the sidebar — check `.nav-link` CSS in globals.css; if needed add:

```css
.nav-link { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 0.78rem; }
.nav-link .nav-ico { flex-shrink: 0; }
```

(adjust to match existing rule; keep labels on one line, allow wrap at narrow widths only via existing @media 860px block.)

**Step 2: Verify**

```bash
cd ~/agents/kdc-next && npx tsc --noEmit && npx next build
```

Expected: exit 0 both.

**Step 3: Commit**

```bash
cd ~/agents/kdc-next && git add src/components/Sidebar.tsx src/styles/globals.css && git commit -m "feat(nav): full subsidiary names in sidebar"
```

### Task 2: Dashboard data module

**Objective:** Single source for KPI/activity/insight data, testable.

**Files:**
- Create: `src/data/dashboard.ts`
- Test: `src/data/dashboard.test.ts`

**Step 1: Write failing test** — `src/data/dashboard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { KPIS, ACTIVITY, INSIGHTS, MODULES, searchModules } from './dashboard';

describe('dashboard data', () => {
  it('has 4 KPIs with value, label, delta', () => {
    expect(KPIS).toHaveLength(4);
    for (const k of KPIS) {
      expect(k.value).toBeTruthy();
      expect(k.label).toBeTruthy();
      expect(k.delta).toMatch(/^\+\d/);
    }
  });

  it('has activity and insights entries', () => {
    expect(ACTIVITY.length).toBeGreaterThanOrEqual(3);
    expect(INSIGHTS.length).toBeGreaterThanOrEqual(2);
    expect(INSIGHTS.every((i) => i.tag)).toBe(true);
  });

  it('has 7 subsidiary modules (dashboard itself excluded)', () => {
    expect(MODULES).toHaveLength(7);
    expect(MODULES.map((m) => m.title)).toEqual([
      'Vagary Index', 'KingDesignShoeCompany', 'Aura Champions',
      'Seven Minute Story Sessions', 'King Design Collective Briheight Box',
      'KingDesign E-Collective', 'Quantum Mode',
    ]);
  });

  it('searchModules filters by title/tagline, case-insensitive', () => {
    expect(searchModules('aura').map((m) => m.title)).toEqual(['Aura Champions']);
    expect(searchModules('shoes').length).toBe(0); // title is KingDesignShoeCompany
    expect(searchModules('SHOE').map((m) => m.title)).toContain('KingDesignShoeCompany');
    expect(searchModules('').length).toBe(7);
  });
});
```

**Step 2: Run to verify failure**

Run: `cd ~/agents/kdc-next && npx vitest run src/data/dashboard.test.ts`
Expected: FAIL — cannot resolve `./dashboard`.

**Step 3: Write implementation** — `src/data/dashboard.ts`:

```ts
// Dashboard content — mock-but-plausible metrics for the interactive dashboard.
// Shape mirrors the reference design: 4 KPIs, module grid, activity feed, insights.

export type Kpi = { icon: string; value: string; label: string; delta: string };
export type Module = {
  href: string;
  kind: string;          // HeroArt kind
  title: string;         // full subsidiary name
  tagline: string;
};
export type ActivityItem = { title: string; detail: string; time: string; icon: string };
export type Insight = { title: string; detail: string; tag: 'Recommended' | 'Trending' };

export const KPIS: Kpi[] = [
  { icon: '🌐', value: '12.4M', label: 'People Reached', delta: '+18.4%' },
  { icon: '📈', value: '9,250', label: 'Innovation Score', delta: '+12.6%' },
  { icon: '🧩', value: '48', label: 'Active Projects', delta: '+6 new' },
  { icon: '♻️', value: '2.4M kg', label: 'Waste Recycled', delta: '+24.8%' },
];

export const MODULES: Module[] = [
  { href: '/KingDesignCollectiveinc/travel-index/', kind: 'globe', title: 'Vagary Index', tagline: 'Explore the world.' },
  { href: '/KingDesignCollectiveinc/shoe-brand/', kind: 'shoe', title: 'KingDesignShoeCompany', tagline: 'Step into impact.' },
  { href: '/KingDesignCollectiveinc/game-design/', kind: 'controller', title: 'Aura Champions', tagline: 'Compete & earn.' },
  { href: '/KingDesignCollectiveinc/kids-channel/', kind: 'cards', title: 'Seven Minute Story Sessions', tagline: 'Stories that shape.' },
  { href: '/KingDesignCollectiveinc/innovation-hub/', kind: 'bulb', title: 'King Design Collective Briheight Box', tagline: 'Build the future.' },
  { href: '/KingDesignCollectiveinc/ewaste-recycling/', kind: 'recycle', title: 'KingDesign E-Collective', tagline: 'Recycle. Recover. Reuse.' },
  { href: '/KingDesignCollectiveinc/quantum-wearables/', kind: 'atom', title: 'Quantum Mode', tagline: 'Signals, nodes, waveforms.' },
];

export const ACTIVITY: ActivityItem[] = [
  { icon: '♻️', title: 'E-Waste Recycling Milestone', detail: '2.4K kg recycled', time: '2h ago' },
  { icon: '💡', title: 'New Innovation Patent Filed', detail: 'AI Wearable Interface', time: '5h ago' },
  { icon: '📚', title: 'Kids Story Published', detail: '"The Little Inventor"', time: '1d ago' },
];

export const INSIGHTS: Insight[] = [
  { title: 'Expand to Africa Region', detail: 'High impact opportunity', tag: 'Recommended' },
  { title: 'Sustainable Shoe Line', detail: 'Market trend rising', tag: 'Trending' },
];

export function searchModules(q: string): Module[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return MODULES;
  return MODULES.filter(
    (m) => m.title.toLowerCase().includes(needle) || m.tagline.toLowerCase().includes(needle)
  );
}
```

**Step 4: Run to verify pass**

Run: `cd ~/agents/kdc-next && npx vitest run src/data/dashboard.test.ts`
Expected: PASS — 4 tests.

**Step 5: Commit**

```bash
cd ~/agents/kdc-next && git add src/data/dashboard.ts src/data/dashboard.test.ts && git commit -m "feat(dashboard): kpi/module/activity/insight data module"
```

### Task 3: Interactive dashboard page

**Objective:** Rebuild `src/app/page.tsx` per reference: header (welcome + search + AI button), KPI row, filterable module grid, analytics row (map / activity / insights), feature footer. Client component with search state.

**Files:**
- Modify: `src/app/page.tsx` (full rewrite — keep `dash-hero` block)
- Modify: `src/styles/globals.css` (new classes)

**Step 1: Page component.** Structure:

```
'use client';
- imports: useState; Link not needed (keep raw <a> for basePath); HeroArt, GlassCard, WorldMap; data from ../data/dashboard; loadCountries for the map panel.
- state: query (search input value).
- header: "Welcome back, Innovator." (Fraunces, gold) + sub "Track. Explore. Build. Make an impact." + centered search input (placeholder "Search across modules...") + bell 🔔 / gear ⚙️ icon buttons + gold button "+ AI Assistant" (href to /tech-stack/ or no-op button — use <a> to /KingDesignCollectiveinc/tech-stack/).
- KPI row: 4 GlassCards (hero=icon, title=label, meta=value big via stats [['', value]] — better: custom markup inside GlassCard children: <div className="kpi-value">, delta pill green +18.4%).
- Module grid: filtered via searchModules(query); each a hero-panel <a> (keep existing art-tile CSS) with overlaid title + tagline (currently art-only with aria-label — add visible text per reference). Empty state: "No modules match." when query non-empty and 0 results.
- Analytics row (3-col grid, collapse to 1 col < 860px):
  - Global Impact Map: GlassCard title="Global Impact Map" + <WorldMap countries={...} mode="offline" /> loaded via loadCountries in useEffect + legend (Low→High gradient bar) + "View Map" button → /travel-index/?map=1. NOTE: WorldMap has its own toggle (Show map) — pass through; fine.
  - Recent Activity: GlassCard title + list of ACTIVITY (icon, title, detail, time muted) + "View All" ghost button (no-op or link /reports/ if exists — else button).
  - AI Insights: GlassCard title + INSIGHTS with tag pills (Recommended=gold, Trending=green) + "View All Insights" button → /tech-stack/.
- Feature footer: 4 items (Adaptive Layouts "UI adapts to your behavior.", Intelligent Insights "AI-driven recommendations.", Unified Ecosystem "All modules, one experience.", Real-time Impact "Live data, real change.").
- Keep the existing .dash-hero h1 KINGDESIGNCOLLECTIVEINC + tagline above the new header? Reference shows welcome header INSTEAD of the big hero. Replace dash-hero content with the welcome header (keep .dash-hero class for spacing, swap inner content).
```

**Step 2: CSS** — append to `src/styles/globals.css` (follow existing token usage):

```css
/* ---- Interactive dashboard v2 ---- */
.dash-header { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 10px 4px 20px; }
.dash-header .dash-welcome { font-family: Fraunces, Georgia, serif; font-size: 1.5rem; color: #f2e9c9; margin: 0; }
.dash-header .dash-sub { font-size: .72rem; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin: 4px 0 0; }
.dash-search { flex: 1; min-width: 220px; display: flex; }
.dash-search input { width: 100%; background: rgba(255,255,255,.04); border: 1px solid var(--border); border-radius: 999px;
  padding: 10px 18px; color: #eee; font-size: .82rem; outline: none; }
.dash-search input:focus { border-color: rgba(212,175,55,.45); }
.dash-actions { display: flex; align-items: center; gap: 10px; }
.dash-icon-btn { width: 38px; height: 38px; border-radius: 999px; border: 1px solid var(--border); background: rgba(255,255,255,.03);
  color: #d6d6d6; cursor: pointer; font-size: 1rem; }
.dash-ai-btn { background: linear-gradient(90deg, var(--gold), var(--gold-bright)); color: #050505; font-weight: 700;
  border: none; border-radius: 999px; padding: 10px 18px; font-size: .8rem; cursor: pointer; text-decoration: none; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 22px; }
.kpi-value { font-family: Fraunces, Georgia, serif; font-size: 1.6rem; color: #f5d67b; }
.kpi-delta { display: inline-block; margin-top: 6px; font-size: .72rem; font-weight: 700; color: #4ade80;
  background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.3); padding: 2px 10px; border-radius: 999px; }
.analytics-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 14px; margin: 22px 0; }
@media (max-width: 860px) { .analytics-grid { grid-template-columns: 1fr; } }
.act-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.05); }
.act-item:last-child { border-bottom: none; }
.act-ico { flex-shrink: 0; }
.act-title { font-size: .84rem; color: #eee; font-weight: 600; }
.act-detail { font-size: .74rem; color: var(--muted); margin-top: 2px; }
.act-time { margin-left: auto; font-size: .68rem; color: var(--muted); flex-shrink: 0; }
.tag-pill { font-size: .64rem; font-weight: 800; letter-spacing: .06em; padding: 2px 8px; border-radius: 999px; }
.tag-pill.recommended { color: #fde68a; background: var(--gold-soft); border: 1px solid rgba(212,175,55,.4); }
.tag-pill.trending { color: #4ade80; background: rgba(74,222,128,.1); border: 1px solid rgba(74,222,128,.3); }
.dash-ghost-btn { display: inline-block; margin-top: 10px; font-size: .74rem; color: var(--gold); border: 1px solid rgba(212,175,55,.4);
  background: none; border-radius: 999px; padding: 6px 14px; cursor: pointer; text-decoration: none; }
.impact-legend { display: flex; align-items: center; gap: 8px; font-size: .66rem; color: var(--muted); margin-top: 8px; }
.impact-legend .lg-bar { flex: 1; height: 6px; border-radius: 999px; background: linear-gradient(90deg, #3a2f10, var(--gold), #fff3c4); }
.feature-footer { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; padding: 22px 0 8px; }
.feature-footer .ff-item { text-align: center; }
.feature-footer .ff-ico { font-size: 1.3rem; }
.feature-footer .ff-title { font-size: .78rem; font-weight: 700; color: #f2e9c9; margin-top: 6px; }
.feature-footer .ff-sub { font-size: .68rem; color: var(--muted); margin-top: 3px; }
.module-empty { text-align: center; color: var(--muted); padding: 40px 0; font-size: .85rem; }
```

Also add module-grid text overlay (module cards need visible title + tagline):

```css
.hero-panel { position: relative; overflow: hidden; }
.hero-panel .hp-text { position: absolute; inset: auto 0 0 0; padding: 12px; text-align: center;
  background: linear-gradient(transparent, rgba(5,5,5,.85)); }
.hero-panel .hp-title { font-family: Fraunces, Georgia, serif; font-size: .85rem; color: #f5d67b; }
.hero-panel .hp-tag { font-size: .66rem; color: var(--muted); margin-top: 2px; }
```

(Verify `.hero-panel` existing rules in globals.css first; merge, don't duplicate `position`.)

**Step 3: Verify**

```bash
cd ~/agents/kdc-next && npx tsc --noEmit && npx vitest run && npx next build
```

Then browser (ground truth): serve the static output — `cd out && npx serve -l 4100` (plain serve, NOT `serve -s`, since SPA fallback fakes 200s), browser-navigate `http://localhost:4100/` (basePath is baked into asset paths; serve from out/ root — check how prior verification did it: if out/ has a `KingDesignCollectiveinc/` subdir, serve out/KingDesignCollectiveinc or use the subpath). Screenshot: header w/ search, 4 KPIs, module grid with visible names, analytics row, footer. Test search: type "aura" → only Aura Champions card.

**Step 4: Commit**

```bash
cd ~/agents/kdc-next && git add src/app/page.tsx src/styles/globals.css && git commit -m "feat(dashboard): interactive layout — kpis, searchable modules, analytics row"
```

### Task 4: Push + live verification

**Objective:** Ship and confirm on live site.

**Files:** none.

**Step 1:** `cd ~/agents && git push origin main`

**Step 2:** CI (deploy-kdc-app) runs automatically — poll `gh run list --limit 2` until completed/success (~1-2 min).

**Step 3:** browser-navigate `https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/` (NOTE: kingdesignshoecompany.github.io — the collectivINC host 404s). Screenshot + interact: sidebar shows full subsidiary names; dashboard renders all sections; search filters. CDN caches index.html for minutes — retry if stale, that's expected, not a failure.

## Files changed (summary)

| File | Change |
|---|---|
| `src/components/Sidebar.tsx` | Full subsidiary names + possible CSS tweak |
| `src/styles/globals.css` | Dashboard v2 classes + nav-link flex tweak |
| `src/data/dashboard.ts` | New — KPIS/MODULES/ACTIVITY/INSIGHTS + searchModules |
| `src/data/dashboard.test.ts` | New — 4 tests |
| `src/app/page.tsx` | Rewrite — interactive dashboard |

## Tests / validation

- `npx vitest run src/data/dashboard.test.ts` → 4 pass
- `npx tsc --noEmit` → clean
- `npx vitest run` (full) → green
- `npx next build` → success
- Browser (served out/): layout matches reference; search filters modules; WorldMap panel renders dots
- Live site post-deploy: browser screenshot + search interaction; allow CDN cache minutes

## Risks / tradeoffs / open questions

- **WorldMap in dashboard**: it fetches countries and has its own Show/Hide toggle — dropped in as-is; if the reference's static "View Map" button is preferred, wrap in a collapsed panel instead. Decide at Task 3 based on visual fit; default = embed as-is (mode offline snapshot).
- **KPI numbers are mock** (12.4M etc. from the reference). Not wired to real metrics — fine for now; flag if user wants real data (would need backend endpoints; out of scope).
- **"+ AI Assistant" button target**: reference implies a chat/assistant UX. Pointing it at /tech-stack/ is a placeholder — if user wants an actual assistant, that's a separate feature.
- **Search scope**: filters module cards only (per reference). Could extend to countries later via ALL_COUNTRIES — YAGNI for now.
- **Static export basePath**: keep raw `<a>` with full `/KingDesignCollectiveinc/...` prefix like the current page.tsx (Link double-prefixes in static export — existing comment documents this).
