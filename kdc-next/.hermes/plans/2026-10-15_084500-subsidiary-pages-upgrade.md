# Subsidiary Pages: Unified Interactive Upgrade

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Give all 7 subsidiary pages (travel-index, shoe-brand, game-design, kids-channel, innovation-hub, ewaste-recycling, quantum-wearables) the same interactive dashboard grammar as the new homepage: KPI stat row, searchable content grid, data panels, CTA buttons, activity/insight lists — per the reference suite (Bropilot_20261015_081555.png).

**Architecture:** One shared pattern, applied per page. New reusable pieces: (1) `SectionHeader` component (title + subtitle + optional search input + action slot) matching the dashboard's .dash-controls grammar; (2) `PageKpis` component (row of 4 stat tiles, reuses .kpi-grid CSS); (3) `Sparkline` — tiny inline SVG line chart (zero deps, pure SVG polyline); (4) `DataList` — activity/leaderboard/tips list rows reusing .act-item CSS. Each page becomes: HeroBanner (existing) → PageKpis → search + content grid (searchable, client-side filter) → 2-3 data panels. Page-specific data comes from existing `src/data/*.ts` modules — no new mock data except small per-page constants (leaderboard rows, tips) which go in a new `src/data/pages.ts` with tests.

**Tech Stack:** Next 15.5 static export, React 18, TS, vitest (jsdom), plain CSS (globals.css extension), inline SVG only.

---

## Current context (verified this session)

All 7 pages are server components with identical structure: `HeroBanner` + `PageFrame` + `card-grid` of 3 GlassCards linking to sub-pages. Reference suite shows each page needing much more:
- Travel: destination grid w/ images + impact stats, impact overview bars, tips accordion
- Shoes: product spotlight + Add to Cart, impact breakdown rings, top picks row
- Games: featured game + Play Now, progress rings, leaderboard, daily challenge + Accept
- Kids: featured story + Read Now, categories, popular stories grid, badges/earnings
- Innovation: 4 stats (1,248 Ideas/89 Patents/...), featured project + View Project, pipeline bars, activity feed
- E-Waste: hero stats, recycle-your-device 3-step + Start Recycling, item counts
- Quantum: product (Quantum Band X1, $199, Pre-Order), health stats (HR/Steps/Sleep/Cal), impact

Existing data modules: `data/shoes.ts` (PRODUCTS, CATEGORIES), `data/cards.ts` (CARDS, RARITIES...), `data/stories.ts` (STORIES), `data/innovation.ts` (SUBSIDIARY_IP, TECH_NODES, SECURITY_ITEMS, TOTAL_PATENTS), `data/ewaste.ts` (MATERIALS, LOGISTICS_ROUTES, BATCHES, IMPACT, COMPLIANCE), `data/quantum.ts` (SENSORS, SAFETY, THERMAL_MODEL, WAVEFORMS), `data/travel.ts` (REGIONS, ALL_COUNTRIES), `data/countries.ts` (loadCountries). Dashboard data pattern: `data/dashboard.ts` + `dashboard.test.ts` — follow it for `data/pages.ts`.

CSS available: .dash-search, .kpi-grid, .kpi-value, .kpi-delta, .act-item/.act-title/.act-detail/.act-time, .dash-ghost-btn, .tag-pill, .card-grid, .glass-card, .hero-panel(+hp-text overlay), .filter-row/.filter-btn (country filter pattern), .page-frame/.page-header/.page-badge. Reuse these; add only what's missing (rings, bars, spotlight layout, section-header).

Client-side search pattern exists: `src/app/country/page.tsx` uses filter state (check it for the pattern — travel-index page has `search-input` usage too). GlassCard supports children for custom content.

## Proposed approach

### Phase A — shared kit (one commit)
1. `SectionHeader` component: title/subtitle + optional search box (controlled) + children actions. CSS merges .dash-search grammar.
2. `PageKpis` component: maps `Kpi[]`-shaped data to 4 tiles using existing .kpi-grid/.kpi-value/.kpi-delta.
3. `Sparkline` component: `<Sparkline values={number[]} />` → inline SVG polyline + gold stroke, ~20 lines, no deps.
4. `ProgressRing`: SVG circle stroke-dasharray, `pct` prop.
5. `ImpactBar`: horizontal label + bar + value (gold gradient fill, width = pct).
6. `data/pages.ts` + tests: per-page constants the reference shows that don't exist yet — travel TIPS (sustainable travel tips list), games LEADERBOARD + DAILY_CHALLENGE, kids BADGES + EARNINGS, innovation PIPELINE stages (derive from SUBSIDIARY_IP where possible), ewaste STEPS (Schedule/Pickup/Recycle), quantum HEALTH_STATS + PRODUCT (Quantum Band X1 $199). Each page's KPIs also live here as `PAGE_KPIS: Record<string, Kpi[]>`.

### Phase B — per-page upgrades (one commit per page, 7 tasks)
Each page keeps its existing 3 nav GlassCards (they link sub-pages — keep) but gains, above them: KPI row, searchable main content grid, and 1-2 data panels. Pattern per page (travel example):

```
HeroBanner (existing)
<PageFrame> → inside:
  <PageKpis items={PAGE_KPIS.travel} />
  <SectionHeader title="Destinations" subtitle="..." search={{value, onChange, placeholder}} />
  filtered content grid (cards w/ emoji hero, title, meta, stats, CTA link)
  panels row: <ImpactBar>s (impact overview) + <DataList> (tips)
```

Per page specifics (from reference):
- **travel-index**: KPIs (255 Countries, 211 Plotted, $9.99 From, 29 Visited). Search over ALL_COUNTRIES (name+region) → result cards linking /country/?c=CODE (check the country route's query param pattern in country/page.tsx first — if it reads ?c= or similar, use it; else link /country-detail/ or plain /country/). Panels: Impact Overview (ImpactBar: CO₂ 62%, Community 78%, Water 71%, Energy 55%) + Sustainable Travel Tips (DataList from TIPS).
- **shoe-brand**: KPIs (Stock, Models, From $119, Rating 9.7). Search over PRODUCTS (name/category). Cards link existing /product-detail/ route (check param). Panels: Product Spotlight (KD EcoRunner, $129, star rating, Add to Cart button → /cart/ or existing products route; use existing product's data, no-op button if no cart action exists — check useCart) + Top Picks (4 products w/ price) + Impact Breakdown (ProgressRings: CO₂ −40%, Water −35%, Energy −28%, Recycled 82%).
- **game-design**: KPIs (12.5K Players, Cards, 7 Elements, 5 Rarities). Search CARDS. Panels: Featured Game (Eco Quest + Play Now → /cards/), Leaderboard (LEADERBOARD), Daily Challenge (DAILY_CHALLENGE + Accept Challenge button), Impact stats mini-row.
- **kids-channel**: KPIs (Stories, Views, Rating, Safe ON). Search STORIES. Panels: Featured Story (STORIES[0] + Read Now → /story-play/?id=... check param), Categories (row of emoji chips), Popular Stories grid (top 4), Your Impact (Badges/Earnings/Quizzes).
- **innovation-hub**: KPIs (1,248 Ideas, 89 Patents, 156 Collabs, $320K Funding — mock per reference). Panels: Featured Project (AI-Powered Water Purifier + View Project → /whitepapers/), Pipeline (ImpactBar over SUBSIDIARY_IP patents), Activity feed (reuse pattern, innovation-specific items in pages.ts).
- **ewaste-recycling**: KPIs (2.4M Tons, 12,450 Devices, 48.2t CO₂, 125t Diverted). Panels: Recycle Your Device (3 STEPS numbered + Start Recycling → /logistics/), Materials recovery rings (MATERIALS → ProgressRing per recovery %), Batches list (BATCHES DataList).
- **quantum-wearables**: KPIs (Uptime 99.99%, 4 Sensors, 5 Constraints PASS, 512Hz Max). Panels: Quantum Band X1 product card ($199, Pre-Order → no-op or /sensors/), Health Stats (HEALTH_STATS w/ ProgressRing or Sparkline), Waveforms (WAVEFORMS list).

Links: check each target route's param pattern first (`/country/`, `/product-detail/`, `/cards/`, `/story-play/`, `/cart/` pages) — grep for `useSearchParams`/`params.get` in those pages and match. Where no deep-link param exists, link the section page (e.g. /country/). Buttons without a real backend action (Add to Cart, Accept Challenge, Pre-Order): if useCart exists (used in Sidebar), wire Add to Cart to it; otherwise render as disabled-looking gold button with `title="Coming soon"` — DO NOT fake toasts or fake state changes. Honest no-op is fine.

### Phase C — integration
Full suite + push; live verify 2-3 representative pages in browser.

## Step-by-step plan

### Task 1: Shared UI kit components

**Objective:** Reusable SectionHeader, PageKpis, Sparkline, ProgressRing, ImpactBar.

**Files:**
- Create: `src/components/SectionHeader.tsx`
- Create: `src/components/PageKpis.tsx`
- Create: `src/components/Sparkline.tsx`
- Create: `src/components/ProgressRing.tsx`
- Create: `src/components/ImpactBar.tsx`
- Test: `src/components/charts.test.ts` (Sparkline/ProgressRing/ImpactBar pure logic)
- Modify: `src/styles/globals.css` (add only missing classes)

**Step 1: TDD the pure bits** — `src/components/charts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sparkPoints, ringDash, type SparkInput } from './charts';

describe('sparkPoints', () => {
  it('maps values to svg coords, normalized to box', () => {
    const pts = sparkPoints([0, 5, 10], 100, 40);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ x: 0, y: 40 });
    expect(pts[1]).toEqual({ x: 50, y: 20 });
    expect(pts[2]).toEqual({ x: 100, y: 0 });
  });
  it('flat series sits at bottom', () => {
    const pts = sparkPoints([3, 3, 3], 60, 30);
    expect(pts.every((p) => p.y === 30)).toBe(true);
  });
});

describe('ringDash', () => {
  it('converts pct to stroke-dasharray for r=20 circle', () => {
    const { dash, gap } = ringDash(50);
    const circ = 2 * Math.PI * 20;
    expect(dash).toBeCloseTo(circ * 0.5);
    expect(gap).toBeCloseTo(circ);
  });
  it('clamps pct to 0-100', () => {
    expect(ringDash(150).dash).toBeCloseTo(ringDash(100).dash);
    expect(ringDash(-20).dash).toBe(0);
  });
});
```

**Step 2: RED** — `cd ~/agents/kdc-next && npx vitest run src/components/charts.test.ts` → FAIL (no ./charts).

**Step 3: Implement** `src/components/charts.ts` (pure helpers):

```ts
export function sparkPoints(values: number[], W: number, H: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => ({
    x: (i / Math.max(1, values.length - 1)) * W,
    y: H - ((v - min) / span) * H,
  }));
}

export function ringDash(pct: number) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return { dash: (clamped / 100) * circ, gap: circ };
}
```

**Step 4: GREEN** — re-run tests, 2 describe blocks pass.

**Step 5: Thin wrappers** (no tests needed — presentational):

```tsx
// Sparkline.tsx
export default function Sparkline({ values, width = 80, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const pts = sparkPoints(values, width, height);
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden><path d={d} fill="none" stroke="var(--gold)" strokeWidth={1.5} /></svg>;
}

// ProgressRing.tsx
export default function ProgressRing({ pct, label, size = 64 }: { pct: number; label?: string; size?: number }) {
  const { dash, gap } = ringDash(pct);
  return (
    <div className="ring-wrap" style={{ width: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--gold)" strokeWidth="4"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
      </svg>
      <div className="ring-center">{Math.round(pct)}%</div>
      {label && <div className="ring-label">{label}</div>}
    </div>
  );
}

// ImpactBar.tsx
export default function ImpactBar({ label, pct, value }: { label: string; pct: number; value?: string }) {
  return (
    <div className="impact-bar">
      <div className="ib-head"><span>{label}</span><b>{value ?? pct + '%'}</b></div>
      <div className="ib-track"><div className="ib-fill" style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} /></div>
    </div>
  );
}

// SectionHeader.tsx
export default function SectionHeader({ title, subtitle, search, children }: {
  title: string; subtitle?: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h3 className="sh-title">{title}</h3>
        {subtitle && <p className="sh-sub">{subtitle}</p>}
      </div>
      {search && (
        <div className="dash-search" style={{ maxWidth: 320 }}>
          <input value={search.value} onChange={(e) => search.onChange(e.target.value)} placeholder={search.placeholder ?? 'Search...'} aria-label={search.placeholder ?? 'Search'} />
        </div>
      )}
      {children}
    </div>
  );
}

// PageKpis.tsx
import { KPIS as DASH_KPIS } from '../data/dashboard'; // type only pattern below
export type Kpi = { icon: string; value: string; label: string; delta: string };
export default function PageKpis({ items }: { items: Kpi[] }) {
  return (
    <div className="kpi-grid">
      {items.map((k) => (
        <div className="glass-card kpi-card" key={k.label}>
          <div className="kpi-ico">{k.icon}</div>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <span className="kpi-delta">{k.delta}</span>
        </div>
      ))}
    </div>
  );
}
```

Wait — KPI layout in reference: icon+label on top, big value, delta. Adjust CSS below accordingly (kpi-ico + kpi-label row on top). Keep it simple.

**Step 6: CSS additions** — append to globals.css:

```css
/* ---- Unified subsidiary page kit ---- */
.section-header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 14px; margin: 26px 0 14px; }
.sh-title { font-family: Fraunces, Georgia, serif; font-size: 1.05rem; color: #f2e9c9; margin: 0; }
.sh-sub { font-size: .72rem; color: var(--muted); margin: 4px 0 0; letter-spacing: .04em; }
.kpi-card { padding: 14px 16px; }
.kpi-card .kpi-ico { font-size: 1.1rem; }
.kpi-card .kpi-label { font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-top: 6px; }
.kpi-value { font-family: Fraunces, Georgia, serif; font-size: 1.5rem; color: #f5d67b; margin-top: 4px; }
.ring-wrap { display: flex; flex-direction: column; align-items: center; position: relative; }
.ring-wrap svg { display: block; }
.ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: .68rem; font-weight: 700; color: #f5d67b; margin-top: -8px; }
.ring-label { font-size: .64rem; color: var(--muted); margin-top: 2px; text-align: center; }
.ring-row { display: flex; flex-wrap: wrap; gap: 18px; justify-content: space-around; padding: 8px 0; }
.impact-bar { margin: 10px 0; }
.ib-head { display: flex; justify-content: space-between; font-size: .76rem; color: #d6d6d6; margin-bottom: 5px; }
.ib-head b { color: #f5d67b; }
.ib-track { height: 7px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; }
.ib-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold), var(--gold-bright)); }
.panel-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin: 18px 0; }
.spotlight { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; }
.spotlight .sp-art { font-size: 3.4rem; }
.spotlight .sp-title { font-family: Fraunces, Georgia, serif; font-size: 1.15rem; color: #f5d67b; }
.spotlight .sp-meta { font-size: .76rem; color: var(--muted); margin-top: 4px; }
.spotlight .sp-price { font-size: 1.2rem; color: #f2e9c9; font-weight: 700; margin-top: 8px; }
.step-row { display: flex; gap: 12px; flex-wrap: wrap; }
.step-item { flex: 1; min-width: 120px; text-align: center; padding: 12px 8px; border: 1px solid var(--border); border-radius: 12px; }
.step-num { width: 26px; height: 26px; border-radius: 999px; background: linear-gradient(90deg, var(--gold), var(--gold-bright)); color: #050505; font-weight: 800; font-size: .78rem; display: inline-flex; align-items: center; justify-content: center; }
.step-name { font-size: .8rem; font-weight: 700; color: #eee; margin-top: 8px; }
.step-detail { font-size: .68rem; color: var(--muted); margin-top: 3px; }
```

**Step 7: Verify + commit**

```bash
cd ~/agents/kdc-next && npx tsc --noEmit && npx vitest run
```

```bash
git add src/components/charts.ts src/components/charts.test.ts src/components/Sparkline.tsx src/components/ProgressRing.tsx src/components/ImpactBar.tsx src/components/SectionHeader.tsx src/components/PageKpis.tsx src/styles/globals.css
git commit -m "feat(ui): shared subsidiary-page kit — kpis, rings, bars, section header"
```

### Task 2: `src/data/pages.ts` + tests

**Objective:** Per-page constants for the new panels.

**Files:**
- Create: `src/data/pages.ts`
- Test: `src/data/pages.test.ts`

**Content** (shape follows reference; values are plausible-mock where no real data exists — same policy as dashboard.ts):

```ts
import type { Product } from './shoes';

export type TravelTip = { title: string; detail: string };
export type LeaderRow = { rank: number; name: string; score: string; badge: string };
export type Step = { name: string; detail: string };
export type HealthStat = { name: string; value: string; pct: number };

export const TRAVEL_TIPS: TravelTip[] = [
  { title: 'Offset your flights', detail: 'Contribute 1% of fare to verified reforestation.' },
  { title: 'Travel off-season', detail: 'Cooler crowds, lower emissions, better rates.' },
  { title: 'Pack light', detail: 'Every kg counts — lighter craft, less fuel.' },
  { title: 'Stay local-owned', detail: 'Keep 80% of spend inside the community.' },
];

export const LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: 'NovaKnight', score: '12,480', badge: '🥇' },
  { rank: 2, name: 'EmberFist', score: '11,905', badge: '🥈' },
  { rank: 3, name: 'TideWalker', score: '10,732', badge: '🥉' },
  { rank: 4, name: 'You', score: '9,850', badge: '⭐' },
  { rank: 5, name: 'Solaris', score: '9,120', badge: '' },
];

export const DAILY_CHALLENGE = {
  title: 'Win 3 matches with Water element',
  detail: 'Reward: 250 XP + Rare card pack',
  xp: 250,
};

export const KID_BADGES = [
  { icon: '🌟', name: 'First Story', detail: 'Completed 1st session' },
  { icon: '📖', name: 'Bookworm', detail: '10 stories finished' },
  { icon: '🧠', name: 'Quiz Master', detail: '20 quizzes passed' },
];

export const EWASTE_STEPS: Step[] = [
  { name: 'Schedule', detail: 'Pick a date & drop-off point' },
  { name: 'Pickup', detail: 'Driver collects your device' },
  { name: 'Recycle', detail: 'Materials recovered & certified' },
];

export const HEALTH_STATS: HealthStat[] = [
  { name: 'Heart Rate', value: '72 bpm', pct: 72 },
  { name: 'Steps', value: '8,240', pct: 82 },
  { name: 'Sleep', value: '7.5 h', pct: 94 },
  { name: 'Calories', value: '486 kcal', pct: 49 },
];

export const INNOVATION_PIPELINE = [
  { stage: 'Ideation', count: 1248 },
  { stage: 'Prototype', count: 412 },
  { stage: 'Patent Filed', count: 89 },
  { stage: 'Licensed', count: 23 },
];

export const TRAVEL_IMPACT = [
  { label: 'CO₂ Offset', pct: 62 },
  { label: 'Community Spend', pct: 78 },
  { label: 'Water Conservation', pct: 71 },
  { label: 'Energy Efficiency', pct: 55 },
];

export const SHOE_IMPACT = [
  { label: 'CO₂ Reduction', pct: 40 },
  { label: 'Water Saved', pct: 35 },
  { label: 'Energy Saved', pct: 28 },
  { label: 'Recycled Content', pct: 82 },
];

export const FEATURED_SHOE: Product | null = null; // resolved at page level from PRODUCTS
```

Tests (`pages.test.ts`): TRAVEL_TIPS ≥ 4, LEADERBOARD 5 rows with ranks 1-5, DAILY_CHALLENGE has title+detail+xp>0, EWASTE_STEPS 3 named steps, HEALTH_STATS 4 with pct 0-100, INNOVATION_PIPELINE descending counts, all impact arrays pct within 0-100.

TDD: RED (module missing) → GREEN. Commit:
```bash
git add src/data/pages.ts src/data/pages.test.ts && git commit -m "feat(data): per-page panel constants (tips, leaderboard, steps, impact)"
```

### Task 3: Travel page upgrade

**Files:** Modify `src/app/travel-index/page.tsx` (client component already), maybe globals.css.

**Steps:**
1. Add PageKpis row: 255 Countries (+211 plotted), 211 Plotted, $9.99 From, 29 Visited.
2. SectionHeader "Destinations" + search (filter ALL_COUNTRIES by name/region, case-insensitive) → grid of country cards (reuse .country-card CSS: globe emoji, name, region, code pill, price $9.99, link to country route — CHECK /country/page.tsx param first).
3. Panel row: Impact Overview (TRAVEL_IMPACT ImpactBars) + Sustainable Travel Tips (TRAVEL_TIPS as act-item list).
4. Keep existing 3 nav cards + WorldMap below.
5. Verify: tsc + vitest + build; browser check local serve (out/KingDesignCollectiveinc served as in previous session: `cd out/KingDesignCollectiveinc && npx serve -l 4100`... actually serve out/ root then /KingDesignCollectiveinc/ path — follow what worked: serve out/KingDesignCollectiveinc directory directly on :4100, navigate to http://localhost:4100/). Type in search → filters.
6. Commit: `git commit -m "feat(travel): kpis, destination search, impact + tips panels"`

### Task 4: Shoes page upgrade

**Files:** Modify `src/app/shoe-brand/page.tsx` (becomes client — search state).

**Steps:**
1. PageKpis: Stock total, Models count, From $119, Rating 9.7.
2. Search PRODUCTS (name/category) → product cards (hero 👟, name, category, price, stock stat, link /product-detail/ — check param pattern).
3. Spotlight panel: pick PRODUCTS[0] (or a 'flagship' if data has one) — art, name, price, rating stars (★★★★☆ text), Add to Cart button (wire to useCart hook if it has addItem; Sidebar uses useCart().count — check src/hooks/useCart.ts API; if it exposes add, wire it; else render title="Coming soon").
4. Top Picks row: 4 products compact cards w/ price.
5. Impact Breakdown: SHOE_IMPACT as 4 ProgressRings.
6. Verify + browser + commit `feat(shoes): kpis, product search, spotlight + impact rings`.

### Task 5: Games page upgrade

**Files:** Modify `src/app/game-design/page.tsx` (client).

**Steps:**
1. PageKpis: 12.5K Players, Cards count, 7 Elements, 5 Rarities.
2. Search CARDS (name/element) → card tiles (rarity color border via RARITY_COLORS, element icon via ELEMENT_ICONS, link /cards/).
3. Panels: Featured Game (Eco Quest 🎮 + Play Now → /cards/) · Leaderboard (LEADERBOARD act-items w/ medal emoji + rank) · Daily Challenge (title + detail + Accept Challenge button — honest no-op, title="Coming soon") · Impact mini row (CO₂ Saved 1.2t, Trees Planted 340 — put in pages.ts as GAME_IMPACT).
4. Verify + browser + commit.

### Task 6: Kids page upgrade

**Files:** Modify `src/app/kids-channel/page.tsx` (client).

**Steps:**
1. PageKpis: Stories count, totalViews K, Rating 9.7, Safe ON.
2. Search STORIES (title/category) → story cards (hero 📖, title, duration, views, link /story-play/ — check param).
3. Panels: Featured Story (STORIES[0] + Read Now) · Categories (chips from story categories — derive via Set from STORIES, .filter-btn chips static display) · Popular Stories (top 4 compact) · Your Impact (KID_BADGES + Earnings 1,250 ⭐ + Quizzes 20).
4. Verify + browser + commit.

### Task 7: Innovation page upgrade

**Files:** Modify `src/app/innovation-hub/page.tsx` (client).

**Steps:**
1. PageKpis: 1,248 Ideas, 89 Patents, 156 Collabs, $320K Funding.
2. Panels: Featured Project (AI-Powered Water Purifier 💡 + View Project → /whitepapers/) · Innovation Pipeline (INNOVATION_PIPELINE ImpactBars) · Activity feed (3 items — add INNOVATION_ACTIVITY to pages.ts: patent filed, whitepaper published, collaboration started).
3. Keep existing IP + tech-stack + security nav cards below.
4. Verify + browser + commit.

### Task 8: E-Waste + Quantum page upgrades

**Files:** Modify `src/app/ewaste-recycling/page.tsx` + `src/app/quantum-wearables/page.tsx` (client).

**E-Waste steps:** KPIs (2.4M Tons, 12,450 Devices, 48.2t CO₂, 125t Diverted) · Recycle Your Device (EWASTE_STEPS step-row + Start Recycling → /logistics/) · Materials recovery (MATERIALS → ProgressRing per recovery% with material emoji + name) · Batches (BATCHES DataList: batch, material, kg, status). Keep nav cards.

**Quantum steps:** KPIs (99.99% Uptime, 4 Sensors, 5 Constraints, 512Hz Max) · Product (Quantum Band X1 💍 $199 + Pre-Order no-op gold button) · Health Stats (HEALTH_STATS: name, value, ProgressRing pct) · Sensor mesh (SENSORS DataList: name, rate, synced dot). Keep nav cards.

Verify each + browser + one commit each.

### Task 9: Integration + push + live verify

**Files:** none.

**Steps:**
1. `cd ~/agents/kdc-next && npx vitest run && npx tsc --noEmit && npx next build`
2. `cd ~/agents && git push origin main` — CI deploys automatically; poll `gh run list --limit 2`.
3. Live browser check: kingdesignshoecompany.github.io/KingDesignCollectiveinc/ — dashboard + travel + shoes + games (screenshot each). CDN caches index.html minutes — retry if stale, expected.

## Files changed (summary)

| File | Change |
|---|---|
| src/components/charts.ts + charts.test.ts | New — sparkPoints/ringDash pure helpers + tests |
| src/components/{Sparkline,ProgressRing,ImpactBar,SectionHeader,PageKpis}.tsx | New — kit |
| src/data/pages.ts + pages.test.ts | New — per-page panel constants |
| src/styles/globals.css | Kit classes |
| src/app/{travel-index,shoe-brand,game-design,kids-channel,innovation-hub,ewaste-recycling,quantum-wearables}/page.tsx | KPI row + search + panels |

## Tests / validation

- charts.test.ts + pages.test.ts green; full `npx vitest run` green each task
- tsc clean, next build ok
- Local browser check per page (served out/): search filters, panels render, buttons present
- Live site: spot-check dashboard + 2-3 pages post-deploy

## Risks / tradeoffs / open questions

- **Route params**: country/product/story deep-link params must be checked per page (grep useSearchParams in those routes). If absent, link to section page — don't invent routes.
- **Cart wiring**: if useCart lacks an add API, Add to Cart is an honest no-op button (title="Coming soon") — no fake state.
- **Mock data**: KPIs/leaderboard/tips are plausible-mock (same policy as dashboard.ts, already shipped). Real metrics need backend — out of scope.
- **Pages become client components** (search state) — travel-index already is; others convert. Static export unaffected.
- **Scope size**: 9 tasks; tasks 3-8 are one page each, can run in parallel only if they touch disjoint files — they all edit globals.css potentially and all are separate page.tsx files (disjoint). globals.css is Task 1 only; page tasks shouldn't need CSS beyond Task 1's classes (add classes in Task 1 proactively, include anything the page tasks need).
- **Reference fidelity vs effort**: full image assets/destination photos not included — emoji heroes (existing HeroArt pattern) stand in. Pixel-perfect product imagery would need real assets; user's prior preference: wire real images when available, else consistent emoji art.
