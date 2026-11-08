# Vagary Index World Map + Local Interactions — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build an interactive Vagary Index world map (exclusive to the Vagary/travel-index subsidiary) that shows visited vs. unvisited places, lets users mark visits, and surfaces local interactions — photos, weather (heat rasters), and gas stations — plus the cosmetic polish already queued for travel pages.

**Architecture:** The map is a client-side interactive layer injected into the committed `travel-index` pages on `gh-pages` (same id-guarded injection + git-plumbing pattern used all session). Data comes from the existing `vagary_index/api/` Flask service (endpoints `/countries`, `/regions`, `/search`, `/schema`, per-country) — extended to serve a visited-state store, heat rasters, and local POIs. Because the map needs live data + persistence, the API is hosted (Docker container `vagary-api` alongside the existing stack) and the front-end fetches from it; a static fallback renders from a baked JSON when the API is offline. Visited state persists server-side (JSON file / Postgres) keyed by a simple user token.

**Tech Stack:** Vanilla JS + SVG/Canvas world map (no build step — fits the injected-HTML constraint); Flask API (existing `vagary_index/api/app.py`); heat rasters (existing PNGs in `vagary_index/batch_output/*_rasters/`); git plumbing for gh-pages deploys; Docker for the API container. Verification ad-hoc (node --check + curl API + browser render), not a suite.

---

## Current context / verified state

- **Reference UI** (from your screenshots): dark navy theme; "Map" / "Provinces" tabs; legend (yellow=BEEN THERE, red=WANT TO VISIT, teal=UNVISITED); map with colored regions; "Currently 29/82" overlay; stats bar (VISITED / PLANNING / UNVISITED); FESTIVALS + MOUNTAINS topic tiles; Facebook share button. (Vision was rate-limited during planning; layout captured from your text description — confirm exact styling at build time.)
- **Vagary API** (`vagary_index/api/app.py`): Flask-style `do_GET` router. Endpoints: `/health`, `/schema`, `/countries`, `/regions`, `/search`, per-country. 38/250 country JSONs currently in `api/data/` (rich: country_code, country_name, region, capitalCity, latitude, longitude, entry_requirements, climate, attractions, top10_experiences, phrase_cards, fun_facts, itineraries_*, sources, history_culture). PHL not yet generated.
- **Heat rasters**: `vagary_index/batch_output/*_rasters/<Country>_thermal_bio{1,5,6}.png` (57 total, by region folders: east_asia_rasters, sea2_rasters, etc.). Not yet served over HTTP.
- **Travel webapp** (`corporate_runtime/documents/travel_index/webapp/`): has `REGIONS` map + `getCountryCode()` + `ALL_COUNTRIES` built from regions; `countries.html` currently shows "250 Countries" placeholder rows. Deployed to `gh-pages:travel-index/` with `kdc-subpage-chrome` injected (gold `#d4af37`).
- **Existing Docker stack** (from memory): ports 3100-3104, 5432; `docker-compose` in `hermes_skills/_packages/`. Vagary API would be a new service (e.g. port 8080 or 3105).

**Assumption:** "World map with visited markers + local interactions" = an SVG world map where each country is colored by visit state (visited/want/unvisited per the legend), clicking a country opens a panel with photos, weather (heat raster), gas stations, and a "mark visited" toggle. Persisted via the API.

**Open question (flag before building the POI layer):** "gas stations" and "photos" and "interact with locals" need a data source. Options: (a) static seeded sample POIs per country in the API JSON, (b) a third-party API (Google Places / Overpass) — but that needs keys/network and may violate the local-only constraint. Default assumption: seed realistic sample POIs locally per country (no external calls), clearly marked as sample data. CONFIRM with user.

---

## Step 0 — Safety + sync checkpoint (non-mutating)

```bash
cd /c/Users/young/agents
git fetch origin gh-pages
# expect local==origin (was 7f56346 after Task 1; may advance as Tasks 2-4 land)
git status --short | grep -vE '^(AD| D| M|MM|MD|RD|R |D )' || echo "clean of unexpected"
```

The parent tree has ~638 pre-existing staged deletions/renames. NEVER `git add -A`. Injectors + API work use git plumbing / their own paths only.

---

## Task 1: Extend Vagary API — visited-state store + raster/POI endpoints

**Objective:** Add server endpoints for visit state, heat rasters, and local POIs (photos/gas/weather) to the existing Flask API.

**Files:**
- Modify: `vagary_index/api/app.py`
- Create: `vagary_index/api/data/visited.json` (seed: `{}`)
- Create: `vagary_index/api/data/pois.json` (seed sample POIs for a few countries)
- Create: `vagary_index/api/Dockerfile`

**Step 1 — Read the existing router**

Read `vagary_index/api/app.py` fully. Note the `do_GET` dispatch style, `_read_json`, `_json` helpers, and how per-country files load. Match that style exactly.

**Step 2 — Add visited-state endpoints (TDD-style: define contract first)**

```
GET  /visited                 -> { "<CODE>": "visited"|"want"|null, ... }
POST /visited                 body {"code":"PHL","state":"visited"} -> upsert, returns updated record
DELETE /visited?code=PHL      -> clears state
```
Persist to `api/data/visited.json` (atomic write: tmp file + rename). Validate `state` in {visited, want, null}.

**Step 3 — Add raster endpoint**

```
GET /raster/<CODE>/<bio>      -> serves vagary_index/batch_output/**/<Country>_thermal_bio<N>.png
```
Resolve the country's raster by scanning `batch_output/*_rasters/` for `<CountryName>_thermal_bio<N>.png` (map CODE->name via existing country JSON). Return `image/png` or 404. Guard path traversal (no `..`).

**Step 4 — Add POI endpoint (sample data, local-only)**

```
GET /pois/<CODE>              -> { photos:[{url,caption}], gas:[{name,lat,lon}], weather:{bio1,bio5,bio6,rasterUrls} }
```
Serve from `api/data/pois.json`. Seed 3-5 countries (PHL, JPN, USA, FRA, BRA) with realistic SAMPLE photos (placeholder image URLs or local `/static` paths), gas stations (name + lat/lon), and weather linking to the raster endpoint. Mark clearly as sample.

**Step 5 — Run + smoke-test locally**

```bash
cd /c/Users/young/agents/vagary_index/api
python app.py   # or flask run; note the port (default 8080)
curl -s localhost:8080/visited         # -> {}
curl -s -X POST localhost:8080/visited -d '{"code":"PHL","state":"visited"}' -H 'Content-Type: application/json'
curl -s localhost:8080/visited         # -> {"PHL":"visited"}
curl -s localhost:8080/pois/JPN | head
curl -s -o /dev/null -w '%{http_code}' localhost:8080/raster/PHL/1   # 200 or 404
```

**Step 6 — Commit** (vagary_index is NOT the gh-pages repo track; commit to the working repo normally, but still avoid `git add -A` — stage only the api files):
```bash
git add vagary_index/api/app.py vagary_index/api/data/visited.json vagary_index/api/data/pois.json vagary_index/api/Dockerfile
git commit -m "feat(vagary): visited-state, raster, and POI endpoints"
```

---

## Task 2: Complete country data to 250 (background, non-blocking)

**Objective:** The API has 38/250 country JSONs. The map needs all 250 for full coloring.

**Files:**
- Run existing generator against `vagary_index/` source assets (there are 250 country folders in `batch_output/` with attractions/entry/climate/etc.)

**Step 1 — Find/run the ingest**

Inspect `vagary_index/api/app.py`'s `load_countries()` + any `_ingested_at` / build script. There's likely a generator that reads `batch_output/<CODE>/` into `api/data/<CODE>.json`. Run it to fill all 250. If PHL/others are missing, generate them from `batch_output/PHL/*`.

**Step 2 — Verify count**
```bash
ls vagary_index/api/data/*.json | grep -v visited | grep -v pois | wc -l   # expect 250
```

**Step 3 — Commit** the new JSONs (stage the data dir, not `-A`).

> If generation is slow/flaky, this can proceed in parallel; the map renders whatever countries exist and fills in as data lands. Non-blocking for Tasks 3-4.

---

## Task 3: Inject the interactive world map into travel-index pages

**Objective:** Client-side SVG world map with legend, visit-state coloring, click-to-open country panel, and local-interaction tiles — injected into `travel-index/index.html` and `countries.html`.

**Files:**
- Create: `C:\Users\young\agents\KingDesignCollectiveinc\_vagary_map.py` (new injector)
- Data asset: a compact world GeoJSON/country-paths SVG (source: a public domain world map SVG paths file; bake the path data into the injector or ship as `travel-index/world.svg`)

**Step 1 — Acquire world map geometry**

Use a public-domain simplified world map (ISO3-coded) SVG paths. Bake the `<path id="PHL" .../>` set into the injector as a string, or deploy `travel-index/assets/world.svg` via plumbing and fetch it. Path data keyed by ISO3 so it maps to the API's `country_code`.

**Step 2 — Build the map component (injected `<style>` + `<script>`)**

- Render SVG world map; each country `<path>` filled by state: visited=gold/yellow `#d4af37`, want=red `#e63946`, unvisited=teal `#2a9d8f` (matches legend).
- Legend box (top-left): BEEN THERE / WANT TO VISIT / UNVISITED.
- Stats bar (bottom): `X VISITED · Y PLANNING · Z UNVISITED` computed from `/visited` + country count.
- "Currently X/250" overlay.
- Click a country → side panel: country name, capital, flag emoji, "Mark visited / Want to visit / Clear" buttons (POST `/visited`), and tiles: **Photos** (from `/pois`), **Weather** (heat raster `<img>` from `/raster`), **Gas Stations** (list with lat/lon + a mini-map pin), **Attractions/Top experiences** (from country JSON).
- Tabs: "Map" / "Provinces" (Provinces = the existing countries list view). Keep existing dropdown chrome.
- API base configurable; if fetch fails (API offline), fall back to a baked `visited.json` + render map uncolored with a "data offline" note — never a blank page.

**Step 3 — Self-heal + idempotent**

Follow the `liveCanvas()` lesson: any DOM the map creates must survive React hydration (create in JS, re-fetch each render, or mount on `document.body`). Id-guard block `kdc-vagary-map`; strip prior before inject.

**Step 4 — Validate JS**
```bash
# extract kdc-vagary-map script, node --check -> OK
```

**Step 5 — Deploy**
```bash
uv run --with pillow python _vagary_map.py   # plumbing commit + force-push gh-pages
gh api -X POST repos/KingDesignShoecompany/KingDesignCollectiveinc/pages/builds
```

**Step 6 — Verify live**
```bash
curl -sk .../KingDesignCollectiveinc/travel-index/ | grep -c kdc-vagary-map   # >=1
# browser-load, confirm map renders, click a country, panel opens, mark visited persists
```

---

## Task 4: Host the Vagary API in Docker + wire CORS

**Objective:** Make the API reachable from the GitHub Pages front-end (CORS) and runnable in the existing stack.

**Files:**
- Create: `vagary_index/api/Dockerfile` (from Task 1)
- Modify: `hermes_skills/_packages/docker-compose.yml` (add `vagary-api` service, port e.g. 3105, mount `vagary_index/api/data`)
- Modify: `vagary_index/api/app.py` (add permissive CORS headers for the Pages origin, or `*` for dev)

**Step 1 — CORS**: in `_json()`/`do_GET`, emit `Access-Control-Allow-Origin: *` (+ handle OPTIONS). Pages is a different origin than the API host.

**Step 2 — Dockerfile**: `FROM python:3.12-slim`, copy app.py + data, `CMD ["python","app.py"]`, expose port.

**Step 3 — compose**: add service, `ports: "3105:8080"`, volume for data persistence, `restart: unless-stopped`.

**Step 4 — Bring up + smoke**
```bash
docker compose up -d vagary-api
curl -s localhost:3105/health
curl -s localhost:3105/countries | head
```

**Step 5 — Commit** compose + Dockerfile + app.py (stage explicitly).

> If the API can't be publicly hosted (local-only constraint), the front-end falls back to baked static JSON (Task 3 fallback) and the map is read-only until the API is reachable. FLAG this tradeoff.

---

## Task 5: Cosmetic polish — travel/Vagary pages (from original plan)

**Objective:** Fold in the queued travel cosmetic tweaks so the new map matches the dashboard aesthetic.

**Files:**
- Modify: `KingDesignCollectiveinc/_theme_subsidiaries.py` + `_update_subpages.py` (travel blocks)

**Step 1 — Cosmetic deltas**: gold `#d4af37` stays; align countries/map headers with dashboard Fraunces; tighten card/panel spacing; consistent hover on country paths (brighten + slight stroke).

**Step 2 — Validate + deploy + verify** (node --check on changed JS, run injectors, rebuild, curl).

---

## Task 6: Full verification sweep (ad-hoc)

**Objective:** Prove the feature works end-to-end and nothing regressed.

**Files:**
- Create: `C:\Users\young\AppData\Local\Temp\hermes-verify-vagary.py` (temp, deleted after)

**Checks:**
- API: `/health` 200; `/countries` count == 250 (or >=38 with note); POST/GET/DELETE `/visited` round-trip; `/raster/PHL/1` 200 or clean 404; `/pois/JPN` shape correct; CORS header present.
- Front-end: `kdc-vagary-map` present on travel-index landing + countries.html; map SVG has ISO3 paths; legend + stats markup present; fallback path present (grep for offline note).
- gh-pages: local==origin; exactly one of each injected block (idempotent); prior features (card-logos, nav-dropdown, globe, link-guard) intact.
- Browser: load travel-index, map renders, click country → panel, mark visited → stat increments, weather raster image loads.

**Run:** `python hermes-verify-vagary.py` → expect ALL PASS or explained FAILs. Then delete temp script.

---

## Tests / validation summary

| Check | Command | Expected |
|---|---|---|
| API health | `curl localhost:3105/health` | 200 |
| Country count | `ls api/data/*.json \| grep -vE 'visited\|pois' \| wc -l` | 250 |
| Visited round-trip | POST then GET `/visited` | state persists |
| Raster | `curl -o /dev/null -w %{http_code} localhost:3105/raster/PHL/1` | 200/404 |
| POI shape | `curl localhost:3105/pois/JPN` | photos/gas/weather keys |
| CORS | `curl -I localhost:3105/countries` | `Access-Control-Allow-Origin` |
| Map injected | `curl .../travel-index/ \| grep -c kdc-vagary-map` | ≥1 |
| Map ISO3 paths | grep `id="PHL"` in injected SVG | present |
| Idempotency | count each `kdc-*` block == 1 | pass |
| No regression | globe/nav/logos/guard still present | pass |
| Browser E2E | click country, mark visited, stat++ | pass |

## Risks, tradeoffs, open questions

- **POI data source (BIGGEST OPEN QUESTION):** gas stations / photos / "interact with locals" have no real backend. Default = seed SAMPLE data locally. Real data needs Google Places/Overpass (keys + network, may break local-only). CONFIRM before Task 1 Step 4.
- **API hosting vs local-only:** GitHub Pages can't reach your localhost. Either host the API publicly (defeats local-only) or the map uses baked static data + read-only until API reachable. Decide in Task 4.
- **World map geometry size:** full SVG paths are large; may need a simplified/low-poly world map to keep the injected HTML reasonable, or ship as a separate `.svg` fetch.
- **250-country generation:** may be slow/flaky; non-blocking (map renders partial).
- **React hydration wipe:** map DOM must self-heal (Task 3 Step 3). Non-negotiable — hit repeatedly.
- **curl TLS flakiness / CDN cache:** retry; browser is ground truth.
- **Vision rate-limited during planning:** reference UI styling captured from your text; confirm exact colors/spacing at build (Task 5).

## Files likely to change (summary)

- `vagary_index/api/app.py` (endpoints + CORS)
- `vagary_index/api/data/visited.json`, `pois.json` (new)
- `vagary_index/api/data/<CODE>.json` × up to 250 (generation)
- `vagary_index/api/Dockerfile` (new)
- `hermes_skills/_packages/docker-compose.yml` (vagary-api service)
- `C:\Users\young\agents\KingDesignCollectiveinc\_vagary_map.py` (new injector)
- `KingDesignCollectiveinc\_theme_subsidiaries.py`, `_update_subpages.py` (travel cosmetic)
- Possibly `gh-pages:travel-index/assets/world.svg` (map geometry)
- Deploys to `gh-pages` via injectors; API via Docker. No source-repo (Next.js) changes.
