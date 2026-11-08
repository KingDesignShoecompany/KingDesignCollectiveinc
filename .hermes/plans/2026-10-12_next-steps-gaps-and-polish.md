# Next Steps — KingDesignCollectiveINC React Platform

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Close the gaps left by the migration: restore the Vagary world map + live API data, make the story player work with real audio, add a test safety net, and remove the now-dead legacy code.

**Architecture:** The React app (`kdc-next/`) is the single source of truth. The Vagary API (Docker, `localhost:8080` / `3105`, currently healthy, 257 countries) is consumed via a typed client module with env-configurable base + graceful offline fallback. The world map becomes a React component rendering on a canvas from API lat/lon data.

**Tech Stack:** Next.js 15 (static export), React 18, TypeScript, plain CSS design tokens, Vagary API (stdlib ThreadingHTTPServer), Vitest for tests.

---

## Current state (verified read-only this turn)

**Done:** 24 routes (dashboard + 7 subsidiaries + all sub-pages), real AI hero images on dashboard + all 7 subsidiary banners, black-and-gold theme, diamond cursor, auto-deploy to gh-pages on push to `main` (`02d6aa4`).

**Verified gaps:**

| # | Gap | Evidence |
|---|---|---|
| G1 | **Vagary world map missing** — the travel landing links to a map that doesn't exist in the React app | Only textual mention in `src/app/travel-index/page.tsx`; no map component. Old logic is 449 lines in dead `KingDesignCollectiveinc/_vagary_map.py` (81 canvas/lat-lon/visited refs). |
| G2 | **No Vagary API integration** — travel uses hardcoded arrays, ignores 257 live countries | `grep fetch\(|localhost:8080|VITE_` → zero hits in `src/`. API is healthy: `/health` → `{"status":"ok"}`, `/countries` → 257 items with `code/name/region`. |
| G3 | **Story player has no audio** — simulated clock only | Zero `.mp3` in the project; `src/app/story-play/page.tsx` uses a 1s interval. |
| G4 | **No tests** — every change verified by ad-hoc scripts | No `vitest`/`jest` in `package.json`, no `*.test.*` files. |
| G5 | **Dead legacy code** — 10 injector scripts + `corporate_runtime/` static webapps are now unused | 10 `_*.py` in `KingDesignCollectiveinc/`; all 7 subsidiary webapps already ported to React. |

**Constraints:**
- GitHub Pages is **static** — the Vagary API can't be fetched from the public site (browser blocks public→localhost cross-origin). So: API integration must have a **visible offline fallback** (hardcoded data) that upgrades to live data when served same-origin or with the API public. This was already true for the old injected map.
- `vagary-api` Docker container is healthy on 8080/3105 — do not disturb the other aura services (3100-3104, 5432).
- Pushes to `main` need the gh-token URL (git's stored credential lacks `workflow` scope).
- Every edit turn requires an ad-hoc `hermes-verify-*.py` (Temp, run + remove) — no canonical suite yet (G4 fixes this).
- Image generation is unavailable (402, no FAL key) — heroes must stay as the existing PNGs/SVG.

---

## Recommended order (value × risk)

G2 (API client) → G1 (world map, depends on G2) → G4 (tests, protects everything after) → G3 (audio, needs user-supplied files) → G5 (cleanup, lowest value, do last).

G3 is **blocked on user input**: audio files must be supplied (4 of 8 stories have none, and none are bundled). Plan it, but flag as blocked.

G5 is optional/deferred — deleting dead code has real risk of removing something still referenced. Recommend archiving (move to a `_legacy/` folder or a git tag) rather than `rm -rf`.

---

# PHASE A — Vagary API client (G2)

## Task A1: Typed API client with env base + offline fallback

**Objective:** Create a typed fetch wrapper for the Vagary API that degrades gracefully when unreachable (the Pages case).

**Files:**
- Create: `kdc-next/src/lib/vagary.ts`
- Create: `kdc-next/.env.local` (gitignored) + `.env.example`

**Steps:**
1. Create `src/lib/vagary.ts`:

```ts
// Vagary API client. Base is env-configurable so the same build works locally
// (API reachable) and on GitHub Pages (API unreachable -> callers fall back).
export const API_BASE = process.env.NEXT_PUBLIC_VAGARY_API || 'http://localhost:8080';

export type Country = { code: string; name: string; region: string; source?: string };
export type VisitState = 'visited' | 'want' | null;

async function get<T>(path: string, timeoutMs = 4000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // offline / unreachable -> caller uses fallback data
  }
}

export const fetchCountries = () => get<{ count: number; items: Country[] }>('/countries');
export const fetchVisited = () => get<Record<string, VisitState>>('/visited');
export const fetchPois = (code: string) => get<unknown>(`/pois/${code}`);
export const fetchRaster = (code: string, bio: string) => get<unknown>(`/raster/${code}/${bio}`);
export const isOnline = async () => (await get<{ status: string }>('/health', 2000))?.status === 'ok';
```

2. Create `.env.example`: `NEXT_PUBLIC_VAGARY_API=http://localhost:8080`
3. Create `.env.local` with the same value (gitignored — verify `.gitignore` covers it).
4. Verify: `node -e` import check isn't possible (TS), so rely on `npm run build` in A2. Commit.

## Task A2: Country data source with live/offline merge

**Objective:** Make the travel pages prefer live API data and fall back to the existing hardcoded `ALL_COUNTRIES`.

**Files:**
- Create: `kdc-next/src/data/countries.ts`
- Modify: `kdc-next/src/app/country/page.tsx`, `src/app/travel-index/page.tsx`

**Steps:**
1. Create `src/data/countries.ts`:

```ts
import { ALL_COUNTRIES } from './travel';
import { fetchCountries, type Country as ApiCountry } from '../lib/vagary';

export type CountryRow = { name: string; region: string; code: string };

// Hardcoded fallback (existing data, used when API unreachable — e.g. on Pages).
const FALLBACK: CountryRow[] = ALL_COUNTRIES.map((c) => ({ name: c.name, region: c.region, code: c.code }));

export async function loadCountries(): Promise<{ rows: CountryRow[]; live: boolean }> {
  const res = await fetchCountries();
  if (!res || !res.items?.length) return { rows: FALLBACK, live: false };
  return {
    rows: res.items.map((c: ApiCountry) => ({ name: c.name, region: c.region.trim(), code: c.code })),
    live: true,
  };
}
```

2. Update `src/app/country/page.tsx` to load via `useEffect` + `loadCountries()`, rendering a small "LIVE DATA" / "OFFLINE" pill next to the badge so the fallback is **visible, not silent**.
3. Update `src/app/travel-index/page.tsx` badge to reflect live count when available.
4. Verify: `npm run build` succeeds; locally (API up) the pill reads LIVE and count ≈ 257; with `NEXT_PUBLIC_VAGARY_API=http://127.0.0.1:9` (dead port) it reads OFFLINE and still renders all countries.
5. Commit: `feat(travel): Vagary API client with visible offline fallback`.

# PHASE B — World map (G1)

## Task B1: Canvas dot-map component from lat/lon

**Objective:** Port the 449-line injected map into a React component: equirectangular dot map, country dots from lat/lon, hover → panel, legend.

**Files:**
- Create: `kdc-next/src/components/WorldMap.tsx`, `kdc-next/src/components/WorldMap.css`
- Modify: `kdc-next/src/app/travel-index/page.tsx` (mount map)

**Steps:**
1. Read `KingDesignCollectiveinc/_vagary_map.py` — extract the geometry (equirectangular projection `x = (lon+180)/360*W`, `y = (90-lat)/180*H`), the legend (BEEN THERE gold / WANT red / UNVISITED teal→**gold per current theme**), and the click→panel behavior. **Do not copy the code** — rewrite as a React component using refs + `requestAnimationFrame`, no injected DOM.
2. Create `WorldMap.tsx`: a `<canvas>` sized to its container, dots plotted from the country rows (lat/lon from a bundled `latlon` map for the fallback set; from API when live), hover detection via nearest-dot within radius, and a side panel showing the selected country + Visited/Want/Clear buttons (persisted to `localStorage`, matching the existing `usePurchases` pattern).
3. Mount on `src/app/travel-index/page.tsx` in a dedicated section below the cards, with the `HeroBanner kind="globe"` retained above.
4. Verify locally: map renders dots, hovering shows a panel, clicking Visited persists across reload; on a dead API base it renders the fallback dots (never blank).
5. Commit: `feat(travel): Vagary world map component`.

## Task B2: Deep-link + auto-open

**Objective:** Preserve the old `?map=1` / `#map` behavior so existing links/bookmarks still work.

**Files:**
- Modify: `kdc-next/src/app/travel-index/page.tsx`, `kdc-next/src/components/WorldMap.tsx`

**Steps:**
1. In `WorldMap.tsx`, accept `autoOpen?: boolean`; in the travel page, read `useSearchParams().get('map')` / `location.hash === '#map'` and pass it.
2. Scroll the map into view when auto-opened.
3. Verify: `/travel-index/?map=1` opens with the map scrolled into view.
4. Commit.

# PHASE C — Tests (G4)

## Task C1: Vitest + component tests

**Objective:** Replace ad-hoc verification with a real suite covering the pure logic (highest regression risk).

**Files:**
- Create: `kdc-next/vitest.config.ts`, `kdc-next/src/lib/vagary.test.ts`, `kdc-next/src/data/travel.test.ts`, `kdc-next/src/data/shoes.test.ts`, `kdc-next/src/data/stories.test.ts`
- Modify: `kdc-next/package.json` (scripts + devDeps)

**Steps:**
1. `npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom` — **verify install succeeds** (network has been flaky; if it fails, note the blocker and keep ad-hoc verification).
2. Add `vitest.config.ts` with `environment: 'jsdom'` and `setupFiles`.
3. Tests (TDD order — write each, watch it fail, implement/fix):
   - `travel.test.ts`: `getCountryCode('Japan')==='JP'`, unknown → `'XX'`, `ALL_COUNTRIES` has no duplicate names, `CAPITALS['Japan']==='Tokyo'`.
   - `shoes.test.ts`: 6 products, unique ids, `sizes.length>0`, price > 0.
   - `stories.test.ts`: 8 stories, unique ids, every story has `text.length>=3`, `THEMES`/`AGE_GROUPS` non-empty.
   - `vagary.test.ts`: `get()` returns `null` on a refused fetch (mock `fetch` to reject) and parses JSON on success; `API_BASE` honors the env var.
4. Add `"test": "vitest run"` to `package.json`.
5. Verify: `npm test` → all pass. **Note:** tests run locally only — they must NOT be part of the Pages build (Next only builds `src/`, so keep tests out of the exported route tree, or confirm `next build` ignores them).
6. Commit: `test: add Vitest suite for data modules + API client`.

## Task C2: CI runs tests before deploy

**Objective:** Block a broken build from reaching production.

**Files:**
- Modify: `.github/workflows/deploy-kdc-app.yml`

**Steps:**
1. Insert a step after `Install deps`, before `Build static export`:
```yaml
      - name: Test
        working-directory: kdc-next
        run: npm test
```
2. Verify: push a deliberately failing test on a branch, confirm the workflow fails before the deploy step, then revert.
3. Commit: `ci: run tests before deploy`.

# PHASE D — Story audio (G3) — BLOCKED on user

## Task D1: Bundle audio + wire real playback

**Objective:** Replace the simulated clock with real `<audio>` playback.

**Files:**
- Create: `kdc-next/public/audio/*.mp3` (**user must supply**)
- Modify: `kdc-next/src/data/stories.ts` (set `audio` paths), `kdc-next/src/app/story-play/page.tsx`

**Steps:**
1. **Blocked:** 8 audio files (≈7 min each) must be provided. Currently all `audio: null`.
2. Once supplied: copy to `public/audio/`, set each story's `audio: '/KingDesignCollectiveinc/audio/<id>.mp3'`.
3. In `story-play/page.tsx`, drive `elapsed` from the `<audio>` element's `timeupdate` (falling back to the simulated clock when `audio` is null, so it degrades safely).
4. Verify: play advances the read-along highlight and progress bar; seeking works; stories without audio still function.
5. Commit.

# PHASE E — Legacy cleanup (G5) — DEFERRED

## Task E1: Archive dead code (do NOT delete outright)

**Objective:** Stop the dead code from being mistaken for live code, without risking a broken reference.

**Files:**
- Move: `KingDesignCollectiveinc/_*.py` → `_legacy/injectors/`
- Move: `corporate_runtime/documents/*/webapp/` → `_legacy/static-webapps/`

**Steps:**
1. Confirm nothing live references them: `grep -rn "_vagary_map\|_deploy_subpages\|_theme_subsidiaries" .github/ kdc-next/src/` must be empty.
2. `git mv` into `_legacy/` (recoverable, unlike `rm -rf`).
3. Tag the pre-cleanup state first: `git tag pre-legacy-cleanup`.
4. Verify the deploy workflow still passes and the live site is unchanged.
5. Commit: `chore: archive legacy injectors and static webapps`.

---

## Tests / validation

- Per task: `npm run build` succeeds; ad-hoc `hermes-verify-*.py` (Temp, run + remove) for this session's convention.
- Phase C onward: `npm test` (real suite) + the CI gate.
- Browser E2E for map (dots render, hover panel, persistence) and player (play advances highlight).
- Live: `curl -o /dev/null -w '%{http_code}'` per route + gh-pages `local==remote`.

## Risks / tradeoffs

- **API on Pages is unreachable by design** (public→localhost blocked). Every API feature must show a *visible* offline state, never a blank screen. This is the single biggest design constraint.
- **Network for `npm i`** has been flaky — C1 may be blocked; if so, keep ad-hoc verification and note it.
- **E1 cleanup** could break an unknown reference — hence `git mv` + tag, never `rm`.
- **D1 is fully blocked** until audio files are supplied.

## Open questions

1. **Audio** — do you have the story MP3s, or should the player stay simulated for now?
2. **Map priority** — is the world map worth Phase B, or would you rather have the API data in the country list (Phase A) and skip the visual map for now?
3. **Cleanup** — archive the legacy code now, or leave it until the map is ported (the map port reads `_vagary_map.py`)?
