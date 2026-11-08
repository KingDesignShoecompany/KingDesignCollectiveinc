# Draw Continents on the Vagary Index World Map

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Render continent landmass outlines (plus labels) on the travel-index World Map instead of only dots on an empty canvas.

**Architecture:** The map is a canvas-based equirectangular dot plot (`src/components/WorldMap.tsx`). It draws a faint graticule and one dot per country with coordinates, but no land geometry exists anywhere in the app: no GeoJSON/TopoJSON file in `public/data/`, no d3/topojson dependency in `package.json`, and the backend dataset (`vagary_index/api/data/*.json`) has no `continent` or geometry field — only lat/lon/capital/region. The fix keeps zero new dependencies: commit one coarse simplified world-land GeoJSON (~20 KB), convert lon/lat → canvas pixels with the *same* projection already in the file, and stroke each polygon before the dots are drawn. Continent labels are placed at the bbox center of each feature's largest ring.

**Tech Stack:** Next 15.5 static export (GitHub Pages), React 18, canvas 2D, TypeScript, vitest (jsdom).

---

## Current context (verified this session)

- `src/components/WorldMap.tsx` — canvas draw loop, lines 70-120: graticule + dots only. Projection is `x=(lon+180)/360*W`, `y=(90-lat)/180*H`.
- `src/data/countries.ts` — normalizes rows to `{code,name,region,lat,lon,capital}`; no geometry. Snapshot fetch uses `/KingDesignCollectiveinc/data/countries.json` (basePath-prefixed).
- `public/data/` contains only `countries.json` and `visited.json`. No `.geojson` anywhere in the repo (verified via find).
- `package.json` deps: next, react, react-dom only. No d3/topojson.
- Backend `vagary_index/api/data/AUS.json` keys: `country_code, country_name, region, capitalCity, latitude, longitude, entry_requirements, ...` — no continent/geometry. Region values are WorldBank buckets (e.g. "East Asia & Pacific"), normalized in `src/data/travel.ts` via `normalizeRegion`.
- Data: 255 countries, 211 with coordinates. The 44 without coords can't plot regardless — out of scope here, but the stats line ("211 of 255 plotted") already discloses this.
- Tests: `vitest run` (jsdom env, configured in `vitest.config.ts`). Existing region tests in `src/data/travel.regions.test.ts` — pattern to follow.
- Build/deploy: `next build` → static export committed by CI (`.github/workflows/deploy-kdc-app.yml`). User memory: CDN caches index.html for minutes; verify via browser, not just exit code.

## Design decisions

1. **No new npm deps.** Parsing GeoJSON ourselves and walking coordinate arrays is ~40 lines and avoids bloating the Pages bundle and lockfile churn. d3-geo + topojson would add ~100 KB gzip for one stroked overlay.
2. **Coarse geometry is fine.** The map canvas is 280-420px tall; fine-grained coastlines are invisible at that scale. A hand-simplified world-land polygon set (~15-25 polygons covering continents + major islands, ~15-40 points each) draws recognizably and costs ~20-30 KB.
3. **Separate concern from regions.** `normalizeRegion` in `src/data/travel.ts` stays untouched — it feeds the *filter buckets and Region Bundles pages*, not the map. Continent labels on the map come from the new geometry file.
4. **Static data, not API.** Geometry is presentation-only and identical for all users → commit as static JSON (works offline, like countries.json snapshot). Not an API endpoint.

## Proposed approach

1. Author `public/data/world-land.geojson` — FeatureCollection of coarse land polygons in lon/lat.
2. New `src/lib/geo.ts` — pure functions: `projectPoint(lon,lat,W,H)` (matching WorldMap's existing formula), `ringPoints(ring,W,H)`, `continentLabelPoints(feats,W,H)`.
3. Modify `src/components/WorldMap.tsx` — load the geojson (fetch, non-fatal on failure, basePath-prefixed like the snapshot loader), stroke polygons in a dim gold/grey under the dots in the draw loop; continent labels via `continentLabelPoints`.
4. Tests: `src/lib/geo.test.ts` — projection math + ring/label helpers (pure, jsdom-free).
5. Verify locally via browser (ground truth per user preference), then push for CI deploy.

## Step-by-step plan

### Task 1: Author the world-land GeoJSON

**Objective:** Commit a coarse land polygon set the map can stroke.

**Files:**
- Create: `public/data/world-land.geojson`

**Step 1:** Author the file. `type: "FeatureCollection"`, one `Feature` per landmass, each `Feature.properties.name` = continent name (`"Africa"`, `"Eurasia"`, `"North America"`, `"South America"`, `"Australia"`, `"Antarctica"`, plus island features: `"Greenland"`, `"Madagascar"`, `"Japan"`, `"New Zealand"`, `"British Isles"`, `"Indonesia"`). Geometry `Polygon`, coordinates `[[lon, lat], ...]`, ring closed (first point repeated at end).

Requirements per polygon (coarse but recognizable, ~15-40 points):
- Africa: include the Horn and the Gulf of Guinea notch; Mediterranean coast straight-ish.
- Eurasia: one polygon is acceptable (Europe+Asia), must include Iberia, Italy boot, Scandinavia, Arabian peninsula, India triangle, SE Asia peninsula down to Malaysia.
- North America: include Alaska, Canada, USA, Mexico to Tehuantepec; Central America may connect to South America (Panama isthmus as a thin bridge).
- South America: the classic triangle with the Brazilian bulge.
- Australia: recognizable blob; Tasmania optional.
- Antarctica: keep as a thin 2-3 point band along the bottom edge (-90..-70 lat), or skip if it renders as a solid bar.
- Islands: small 4-8 point blobs at correct lon/lat.

**Step 2: Verify shape**

```bash
cd ~/agents/kdc-next && python -c "
import json
g = json.load(open('public/data/world-land.geojson'))
assert g['type'] == 'FeatureCollection'
feats = g['features']
names = [f['properties']['name'] for f in feats]
assert set(names) >= {'Africa','Eurasia','North America','South America','Australia'}
total_pts = sum(len(p[0]) for f in feats for p in f['geometry']['coordinates'])
print('features:', len(feats), 'points:', total_pts)
for f in feats:
    lons = [p[0] for p in f['geometry']['coordinates'][0]]
    lats = [p[1] for p in f['geometry']['coordinates'][0]]
    assert -180 <= min(lons) and max(lons) <= 180, f['properties']['name']
    assert -90 <= min(lats) and max(lats) <= 90, f['properties']['name']
    assert len(f['geometry']['coordinates'][0]) >= 4, f['properties']['name']
    assert lons[0]==lons[-1] and lats[0]==lats[-1], f['properties']['name']+' ring not closed'
print('OK')
"
```

Expected: prints feature/point counts, all asserts pass (e.g. "features: 14 points: 310").

**Step 3: Commit**

```bash
cd ~/agents/kdc-next && git add public/data/world-land.geojson && git commit -m "feat(travel): coarse world-land geojson for map overlay"
```

### Task 2: Pure projection helpers

**Objective:** Extract reusable, testable geometry math.

**Files:**
- Create: `src/lib/geo.ts`
- Test: `src/lib/geo.test.ts`

**Step 1: Write failing test** — `src/lib/geo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { projectPoint, ringPoints, continentLabelPoints, type LandFeature } from './geo';

describe('projectPoint', () => {
  it('maps 0,0 to canvas center', () => {
    const p = projectPoint(0, 0, 800, 400);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(200);
  });
  it('maps corners correctly (equirectangular)', () => {
    expect(projectPoint(-180, 90, 800, 400)).toEqual({ x: 0, y: 0 });
    expect(projectPoint(180, -90, 800, 400)).toEqual({ x: 800, y: 400 });
  });
});

describe('ringPoints', () => {
  const ring: [number, number][] = [
    [-10, 10], [10, 10], [10, -10], [-10, -10], [-10, 10],
  ];
  it('projects every ring vertex', () => {
    const pts = ringPoints(ring, 800, 400);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ x: (170 / 360) * 800, y: (80 / 180) * 400 });
  });
});

describe('continentLabelPoints', () => {
  const feats: LandFeature[] = [
    { name: 'Africa', ring: [[10, 35], [40, 35], [40, 0], [10, 0], [10, 35]] },
    { name: 'Australia', ring: [[110, -10], [155, -10], [155, -40], [110, -40], [110, -10]] },
  ];
  it('labels the largest feature per name once, centroid at ring bbox center', () => {
    const labels = continentLabelPoints(feats, 800, 400);
    expect(labels.map((l) => l.name).sort()).toEqual(['Africa', 'Australia']);
    const af = labels.find((l) => l.name === 'Africa')!;
    expect(af.x).toBeCloseTo(((25 + 180) / 360) * 800);
    expect(af.y).toBeCloseTo(((90 - 17.5) / 180) * 400);
  });
});
```

**Step 2: Run to verify failure**

Run: `cd ~/agents/kdc-next && npx vitest run src/lib/geo.test.ts`
Expected: FAIL — cannot resolve `./geo`.

**Step 3: Write implementation** — `src/lib/geo.ts`:

```ts
export type Point = { x: number; y: number };
export type Ring = [number, number][];
export type LandFeature = { name: string; ring: Ring };

/** Equirectangular projection matching WorldMap.tsx exactly. */
export function projectPoint(lon: number, lat: number, W: number, H: number): Point {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

export function ringPoints(ring: Ring, W: number, H: number): Point[] {
  return ring.map(([lon, lat]) => projectPoint(lon, lat, W, H));
}

/** One label per continent name, at the bbox center of its largest ring. */
export function continentLabelPoints(feats: LandFeature[], W: number, H: number) {
  const best = new Map<string, LandFeature>();
  for (const f of feats) {
    const prev = best.get(f.name);
    if (!prev || f.ring.length > prev.ring.length) best.set(f.name, f);
  }
  return [...best.values()].map((f) => {
    const lons = f.ring.map((p) => p[0]);
    const lats = f.ring.map((p) => p[1]);
    const lon = (Math.min(...lons) + Math.max(...lons)) / 2;
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    return { name: f.name, ...projectPoint(lon, lat, W, H) };
  });
}
```

**Step 4: Run to verify pass**

Run: `cd ~/agents/kdc-next && npx vitest run src/lib/geo.test.ts`
Expected: PASS — 3 tests.

**Step 5: Commit**

```bash
cd ~/agents/kdc-next && git add src/lib/geo.ts src/lib/geo.test.ts && git commit -m "feat(travel): pure projection helpers for map overlay"
```

### Task 3: Stroke land polygons under the dots

**Objective:** Load the geojson and draw it before the country dots, with continent labels.

**Files:**
- Modify: `src/components/WorldMap.tsx` (draw loop ~lines 61-137; add loader state + render)

**Step 1: Add loader + state.** After the existing state declarations (~line 28), add:

```ts
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
```

Note: confirm the basePath by reading `next.config.js` first — if it differs from `/KingDesignCollectiveinc`, follow the file, not the plan.

**Step 2: Imports.** Add at top of file:

```ts
import { ringPoints, continentLabelPoints, type LandFeature } from '../lib/geo';
```

**Step 3: Draw in the draw loop.** Inside `draw()`, after the graticule block and BEFORE the country-dots loop (~line 103):

```ts
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
```

**Step 4: Dependency array.** Change line 137 to `}, [open, plotted, selected, visits, land]);`

**Step 5: Verify in browser (ground truth).**

```bash
cd ~/agents/kdc-next && npx next build && npx next start -p 3999 &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3999/KingDesignCollectiveinc/data/world-land.geojson
```

Expected: 200. Then browser-navigate to `http://localhost:3999/KingDesignCollectiveinc/travel-index/?map=1` and `browser_vision`: continents visible as filled gold-outline shapes behind dots, labels legible, dots still clickable. Kill the test server after: `kill %1`.

**Step 6: Commit**

```bash
cd ~/agents/kdc-next && git add src/components/WorldMap.tsx && git commit -m "feat(travel): draw continent landmasses + labels on world map"
```

### Task 4: Full test suite + deploy verification

**Objective:** No regressions; ships to the live site.

**Files:** none (verification only)

**Step 1: Run full suite**

```bash
cd ~/agents/kdc-next && npx vitest run
```

Expected: all pass (existing travel.regions / countries / vagary tests + new geo tests).

**Step 2: Push** (CI builds and force-orphan-deploys `out/` to gh-pages on push to main — per `.github/workflows/deploy-kdc-app.yml`)

```bash
cd ~/agents/kdc-next && git push origin main
```

**Step 3: Verify live** — browser-navigate to `https://kingdesigncollectiveinc.github.io/KingDesignCollectiveinc/travel-index/?map=1`. Per user memory: CDN caches index.html for minutes — if the old map shows, wait/retry, don't treat as failure. The geojson asset itself hashes in the URL and won't be stale.

## Files changed (summary)

| File | Change |
|---|---|
| `public/data/world-land.geojson` | New — coarse continent/island polygons |
| `src/lib/geo.ts` | New — projection + ring/label helpers (pure) |
| `src/lib/geo.test.ts` | New — 3 unit tests |
| `src/components/WorldMap.tsx` | Load geojson, stroke + label in draw loop |

## Tests / validation

- `npx vitest run src/lib/geo.test.ts` → 3 pass
- `npx vitest run` → full suite green
- GeoJSON shape script (Task 1 Step 2) → asserts pass
- Browser check on `/travel-index?map=1` — visual ground truth: landmasses + labels behind dots
- Live site check after CI deploy (allow CDN cache minutes)

## Risks / tradeoffs / open questions

- **Polygon authoring quality** is the main risk — hand-simplified shapes can look wrong (Africa/Eurasia especially). Mitigation: verify visually in browser before commit; iterate on the geojson if shapes are off. Task 3 Step 5 is the gate.
- **Antarctica strip** at the equirect bottom edge may look like a solid bar; keep it to a thin 2-3 point band or skip it. Judgment call at authoring time.
- **44 countries without coordinates** still won't plot. Out of scope (separate data-enrichment task) — stats line already discloses.
- **BasePath**: Task 3 must match the existing fetch pattern from `src/data/countries.ts` (`/KingDesignCollectiveinc/data/...`). If `next.config.js` differs, follow the file, not the plan.
- **No new deps** chosen deliberately; if the polygons ever need true cartographic quality (projection changes, zoom), revisit with d3-geo + Natural Earth TopoJSON.
