# Dual-Mode Resilience — Never-Blank Platform Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make every data-driven feature work identically with or without the network — live API when reachable, committed static snapshot when not — with the offline state always *visible* and never a blank screen or dead spinner.

**Architecture:** Three-layer data strategy. (1) **Static snapshots committed to the repo** (`public/data/*.json`) are the always-works floor. (2) A **typed client** tries the live Vagary API first and falls back to the snapshot on any failure. (3) The UI renders an explicit **mode pill** (`LIVE` / `OFFLINE`) so degradation is honest, never silent. The world map plots from snapshot coordinates and layers live overlays only when the API answers.

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, plain CSS tokens, Vagary API (`localhost:8080`), Vitest (local guardrail, not a deploy gate).

---

## Core principle (from user, non-negotiable)

> "What still works when everything's on fire." Dual-mode, never-blank.

Every feature gets **both** modes:

| Feature | Online mode | Offline mode |
|---|---|---|
| Country data | Live API (257 countries) | Committed `public/data/countries.json` |
| World map | Live dots + visited overlay | Same dots from snapshot coords + `OFFLINE` banner |
| Visit state | API `/visited` | `localStorage` (already built) |
| Story audio | Real `<audio>` playback | Simulated timer, **honestly labeled** |
| Legacy code | — | Archived under `_legacy/` + git tag, never deleted |

**Rule: the UI always shows something. A failed fetch must never produce a spinner, blank panel, or error boundary.**

---

## Current state (verified read-only this turn)

**Working:** 24 routes, real hero images, black-and-gold theme, auto-deploy on push to `main` (`02d6aa4`), diamond cursor.

**Verified facts that shape this plan:**

1. **`/countries` returns NO lat/lon** — only `code`, `name`, `region`, `source`. My earlier plan assumed coordinates were available there. **Correction:** coordinates must come from either `/countries/<CODE>` (verified: returns `latitude`/`longitude`, e.g. Japan `35.67, 139.77`) or the local WorldBank file.
2. **`vagary_index/references/worldbank_countries.json` has 295 entries; 211 usable** (some lat/lon are empty strings — must guard with a safe float parser).
3. **`/countries/<CODE>`, `/raster/<CODE>/<bio>`, `/pois/<CODE>`, `/visited` all return 200.** `/schema` is 404.
4. **The API contains 2 corrupt entries** with `code: null, name: null, region: null` — must be filtered or the UI will render blank rows.
5. **No world GeoJSON/SVG exists locally** — the dot-map (equirectangular from lat/lon) remains the correct approach; there is no base-map asset to ship.
6. **`.gitignore` does NOT cover `.env.local`** — must add it before committing any env file.
7. **257 sequential per-country HTTP calls timed out at 400s** — do not hydrate coordinates that way. Join against the local WorldBank file instead (single pass, no network).

### Snapshot already generated this turn

`kdc-next/public/data/countries.json` — **26,438 bytes, valid JSON**:
- `count: 257`, 257 items
- **211 (82%) with `lat`/`lon`**, joined from WorldBank by ISO3
- Includes `capital` where known
- Region nulls normalized to `'Unclassified'`
- Sample: `{"code":"ABW","name":"Aruba","region":"Latin America & Caribbean","lat":12.5167,"lon":-70.0167,"capital":"Oranjestad"}`

Also created: `kdc-next/public/data/visited.json` (2 entries — the current API visit state).

**Remaining work on the snapshot (Task A0):** filter the 2 null-code entries, and decide whether the 46 coordinate-less countries get plotted via a name-based fallback or simply omitted from the map (recommended: omit, and state the count in the UI).

---

# PHASE A — Static snapshot + dual-mode client

## Task A0: Clean the committed snapshot

**Objective:** Ship a snapshot with no null rows and a documented coordinate coverage figure.

**Files:**
- Modify: `kdc-next/public/data/countries.json`

**Steps:**
1. Filter out entries where `code` or `name` is null (removes the 2 corrupt API rows).
2. Add a `coverage` field: `{"withCoords": 209, "total": 255, "pct": 82}` (recount after filtering).
3. Validate: `python -c "import json;d=json.load(open('kdc-next/public/data/countries.json'));assert all(i['code'] and i['name'] for i in d['items']);print('clean')"`.
4. Commit: `data(travel): commit offline country snapshot (255 countries, 82% coords)`.

## Task A1: Dual-mode data layer

**Objective:** One function the UI calls; it returns live data or the snapshot, plus which mode it's in.

**Files:**
- Create: `kdc-next/src/lib/vagary.ts`
- Create: `kdc-next/src/data/countries.ts`
- Create: `kdc-next/.env.example`, `kdc-next/.env.local`
- Modify: `kdc-next/.gitignore` (add `.env.local`)

**Steps:**
1. Add `.env.local` to `kdc-next/.gitignore` (verified missing).
2. Create `src/lib/vagary.ts`:

```ts
export const API_BASE = process.env.NEXT_PUBLIC_VAGARY_API || 'http://localhost:8080';

export type Country = { code: string; name: string; region: string; lat: number | null; lon: number | null; capital?: string | null };
export type Mode = 'live' | 'offline';

async function get<T>(path: string, timeoutMs = 4000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export const api = {
  health: () => get<{ status: string }>('/health', 2000),
  countries: () => get<{ items: any[] }>('/countries'),
  country: (code: string) => get<any>(`/countries/${code}`),
  visited: () => get<Record<string, string>>('/visited'),
  pois: (code: string) => get<unknown>(`/pois/${code}`),
  raster: (code: string, bio: string) => get<unknown>(`/raster/${code}/${bio}`),
};
```

3. Create `src/data/countries.ts` — the single entry point:

```ts
import { api, type Country, type Mode } from '../lib/vagary';

type Snapshot = { count: number; items: Country[] };

// The committed snapshot is the always-works floor.
async function snapshot(): Promise<Country[]> {
  const res = await fetch('/KingDesignCollectiveinc/data/countries.json');
  return ((await res.json()) as Snapshot).items;
}

function normalize(raw: any): Country {
  return {
    code: raw.code, name: raw.name,
    region: (raw.region || 'Unclassified').trim(),
    lat: raw.lat ?? null, lon: raw.lon ?? null, capital: raw.capital ?? null,
  };
}

export async function loadCountries(): Promise<{ rows: Country[]; mode: Mode }> {
  const live = await api.countries();
  if (live?.items?.length) {
    // Live list has no coords; enrich from the snapshot by code so the map still plots.
    const snap = await snapshot();
    const coords = new Map(snap.map((c) => [c.code, c]));
    const rows = live.items
      .filter((i) => i.code && i.name)
      .map((i) => ({ ...normalize(i), lat: coords.get(i.code)?.lat ?? null, lon: coords.get(i.code)?.lon ?? null }));
    return { rows, mode: 'live' };
  }
  const rows = (await snapshot()).filter((c) => c.code && c.name).map(normalize);
  return { rows, mode: 'offline' };
}
```

4. `.env.example`: `NEXT_PUBLIC_VAGARY_API=http://localhost:8080`; copy to `.env.local`.
5. Verify: `npm run build` succeeds.
6. Commit: `feat(travel): dual-mode country loader (live API with committed snapshot fallback)`.

## Task A2: Mode pill on the country list

**Objective:** Make the mode visible — the user always knows whether data is live.

**Files:**
- Modify: `kdc-next/src/app/country/page.tsx`

**Steps:**
1. Replace the static `ALL_COUNTRIES` import with `useEffect` + `loadCountries()`, holding `{ rows, mode }` in state.
2. Render a pill next to the badge: `LIVE DATA` (gold) or `OFFLINE SNAPSHOT` (muted). Keep the existing search + region filters working against `rows`.
3. **Never-blank guard:** if `rows` is empty, render the existing hardcoded `ALL_COUNTRIES` as a last resort rather than an empty grid.
4. Verify: with API up → `LIVE DATA`, ~255 rows; with `NEXT_PUBLIC_VAGARY_API=http://127.0.0.1:9` → `OFFLINE SNAPSHOT`, same rows visible.
5. Commit.

# PHASE B — World map (dual-mode)

## Task B1: Canvas dot-map from snapshot coordinates

**Objective:** A map that renders identically online or offline — dots from committed coordinates, live overlay only as an upgrade.

**Files:**
- Create: `kdc-next/src/components/WorldMap.tsx`, `kdc-next/src/components/WorldMap.css`
- Modify: `kdc-next/src/app/travel-index/page.tsx`

**Steps:**
1. Read `KingDesignCollectiveinc/_vagary_map.py` (449 lines) **for the geometry and behavior only** — do not copy code. Key logic to reimplement: equirectangular projection `x = (lon + 180) / 360 * W`, `y = (90 - lat) / 180 * H`.
2. `WorldMap.tsx`: props `{ countries, mode }`. Render a `<canvas>` sized via `ResizeObserver`; plot only countries where `lat !== null`; nearest-dot hover within ~10px; side panel with the selected country and Visited / Want / Clear buttons persisted to `localStorage` via the existing `usePurchases` pattern.
3. Legend: BEEN THERE (gold) / WANT (red) / UNVISITED (teal→**gold per current brand theme** — use gold for unvisited outline, not teal).
4. **Offline banner:** when `mode === 'offline'`, render "Live data unavailable — showing offline map snapshot." **The map itself still draws.**
5. Mount on the travel page below the cards, keeping `HeroBanner kind="globe"` above.
6. Verify: dots render in both modes; hover shows a panel; Visited persists across reload; with a dead API base the dots still draw (from snapshot coords) and the banner appears.
7. Commit: `feat(travel): dual-mode world map (snapshot coords, live overlay)`.

## Task B2: Live overlay + deep-link

**Objective:** Upgrade the map when the API answers; preserve old `?map=1` links.

**Files:**
- Modify: `kdc-next/src/components/WorldMap.tsx`, `kdc-next/src/app/travel-index/page.tsx`

**Steps:**
1. When `mode === 'live'`, call `api.visited()` and color dots accordingly; on failure, fall back to `localStorage` silently (the banner already covers the mode).
2. Accept `autoOpen`; read `useSearchParams().get('map')` and `location.hash === '#map'`, scroll into view.
3. Verify: `/travel-index/?map=1` auto-opens and scrolls.
4. Commit.

# PHASE C — Tests (local guardrail, NOT a deploy gate)

## Task C1: Vitest suite for the never-blank logic

**Objective:** Protect the fallback paths specifically — the code that runs when everything is on fire.

**Files:**
- Create: `kdc-next/vitest.config.ts`, `kdc-next/src/lib/vagary.test.ts`, `kdc-next/src/data/countries.test.ts`, `kdc-next/src/data/travel.test.ts`, `kdc-next/src/data/shoes.test.ts`, `kdc-next/src/data/stories.test.ts`
- Modify: `kdc-next/package.json`

**Steps:**
1. `npm i -D vitest jsdom`. **If this fails (network has been flaky), stop and report the blocker** — do not block the deploy on it.
2. `vitest.config.ts`: `environment: 'jsdom'`.
3. Tests, each written first and watched to fail:
   - `loadCountries()` returns `mode: 'offline'` and non-empty rows when `fetch` to the API rejects (mock `fetch`: reject for the API base, resolve for the snapshot path).
   - `loadCountries()` returns `mode: 'live'` and merges snapshot coordinates when the API resolves.
   - Null-code/null-name rows are filtered out of the result.
   - `getCountryCode('Japan') === 'JP'`, unknown → `'XX'`; `ALL_COUNTRIES` has no duplicate names.
   - 6 shoes with unique ids; 8 stories, each `text.length >= 3`.
   - `api.health()` returns `null` when the fetch rejects (never throws).
4. Add `"test": "vitest run"`.
5. Verify `npm test` passes locally. **Explicitly do NOT add it to the deploy workflow** — per your call, tests are a guardrail, not a gate.
6. Commit: `test: Vitest suite covering dual-mode fallback paths`.

# PHASE D — Story audio (honest simulated mode)

## Task D1: Label the simulated player truthfully

**Objective:** Stop the player from implying it has audio it doesn't have.

**Files:**
- Modify: `kdc-next/src/app/story-play/page.tsx`, `kdc-next/src/data/stories.ts`

**Steps:**
1. When `story.audio` is null, render a badge: **"Story Timer — audio coming soon"** plus the note "Works fully offline; narration will be added when available."
2. Keep the read-along/chapters/progress working on the simulated clock (already functional).
3. Verify: badge appears on all 8 stories (all currently `audio: null`); play/pause/seek still work.
4. Commit: `feat(kids): honest simulated-player labeling`.

## Task D2: Real audio when files exist — BLOCKED on user

**Objective:** Swap to genuine playback the moment MP3s are supplied.

**Files:**
- Create: `kdc-next/public/audio/*.mp3` (**user must supply — 8 files, ~7 min each**)
- Modify: `kdc-next/src/data/stories.ts`, `kdc-next/src/app/story-play/page.tsx`

**Steps:**
1. **Blocked:** no audio files exist. Nothing to implement until they're provided.
2. When supplied: copy to `public/audio/`, set `audio: '/KingDesignCollectiveinc/audio/<id>.mp3'`.
3. Drive `elapsed` from the `<audio>` `timeupdate` event; if the file fails to load (`error` event), fall back to the simulated clock and re-show the honest badge.
4. Verify: play advances the highlight; seeking works; a missing file degrades to simulated mode without breaking.
5. Commit.

# PHASE E — Legacy archive (accessible, not in the way)

## Task E1: Archive with a tag + README

**Objective:** Keep old code reachable for reference without it polluting the new platform.

**Files:**
- Move: `KingDesignCollectiveinc/_*.py` → `_legacy/injectors/`
- Move: `corporate_runtime/documents/*/webapp/` → `_legacy/static-webapps/`
- Create: `_legacy/README.md`

**Steps:**
1. **Do this AFTER Phase B** — the map port reads `_vagary_map.py`.
2. Tag first: `git tag legacy-runtime-backup`.
3. Confirm no live references: `grep -rn "_vagary_map\|_deploy_subpages\|_theme_subsidiaries" .github/ kdc-next/src/` must return empty.
4. `git mv` into `_legacy/` (recoverable — never `rm -rf`).
5. Write `_legacy/README.md`: what each folder was, why it's archived, and that the React app in `kdc-next/` is now the source of truth.
6. Verify the deploy workflow still passes and the live site is unchanged.
7. Commit: `chore: archive legacy injectors and static webapps (tagged legacy-runtime-backup)`.

---

## Tests / validation

- **Per task:** `npm run build` succeeds; ad-hoc `hermes-verify-*.py` under Temp (run + remove) per this session's convention.
- **Dual-mode proof (the important one):** for every data feature, test **twice** — API reachable and API unreachable — and confirm the UI renders in both.
- **Phase C:** `npm test` locally only; deliberately excluded from CI.
- **Live:** `curl -o /dev/null -w '%{http_code}'` per route; confirm `local==remote` on both branches.
- **Snapshot integrity:** valid JSON, no null `code`/`name`, `coverage` field matches a recount.

## Risks / tradeoffs

- **Pages can never reach the API** (public→localhost). Offline is therefore the *normal* production mode, not an edge case — the snapshot must be genuinely good, which is why it's committed rather than generated at runtime.
- **Snapshot staleness:** the committed file won't reflect new API data until re-exported. Mitigation: document the export command in `_legacy/README.md` or a `scripts/` note. Acceptable trade-off for a static site.
- **46 countries lack coordinates** (82% coverage). They'll be absent from the map. Alternative is a name-based fuzzy match, which risks plotting dots in the wrong place — recommend omission with the count shown.
- **`npm i` flakiness** may block Phase C entirely.
- **Phase D2 is fully blocked** pending audio files.
- **`git mv` in Phase E** is safe but touches many paths; the tag is the safety net.

## Open questions

1. **Audio** — do you have the story MP3s? Until then, Phase D1 (honest labeling) is all that's actionable.
2. **Map** — confirm Phase B is wanted, given the map will normally run in offline mode on the public site.
3. **Cleanup timing** — Phase E must wait for the map port. Archive now (and read the old map code before moving it), or defer?

## Recommended order

**A0 → A1 → A2 → B1 → B2 → C1 → D1 → E1**, with **D2** unblocked whenever audio arrives. A0's snapshot is already generated and just needs the null-row filter.
