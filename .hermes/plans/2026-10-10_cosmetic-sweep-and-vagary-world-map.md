# Cosmetic Sweep (E-waste + Travel) + Vagary World Map — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** (A) Finish the cosmetic sweep on the remaining subsidiaries — E-waste and Travel/Vagary get spacing/heading polish to match the dashboard aesthetic; (B) Build the Vagary Index interactive world map with clickable countries that color by visit-state and open a detail panel (photos, weather/heat-raster, gas stations, mark-visited).

**Architecture:** Two phases. Phase A is light CSS polish injected via the existing id-guarded injectors (`_update_subpages.py`, `_theme_subsidiaries.py`) using git plumbing to gh-pages. Phase B adds a client-side interactive SVG world map injected into the `travel-index` pages (new injector `_vagary_map.py`), backed by the existing `vagary_index/api/` Flask service extended with visited-state, raster, and POI endpoints. The map self-heals against React hydration (the `liveCanvas()` lesson) and falls back to baked static data when the API is unreachable, so it never renders blank.

**Tech Stack:** Vanilla JS + SVG world map (no build step, fits injected-HTML constraint); Flask API (existing `vagary_index/api/app.py`); heat rasters (existing PNGs); git plumbing for gh-pages; Docker for the API. Verification ad-hoc (node --check + curl API + browser render), not a suite.

---

## Current context / verified state (gh-pages @ `260f315`)

- **All 7 subsidiaries already have chrome + correct accents** (this session): ewaste `#2a9d8f`, travel `#d4af37`, kids `#f72585` (Task 2 done), game `#4361ee`, shoe `#01963d`, innovation `#4cc9f0`, quantum `#9b5de5`. Dashboard globe done (Task 1, `7f56346`).
- So Phase A is **polish only** (spacing/heading rhythm), NOT building chrome. Confirmed: ewaste materials/logistics/reports + travel countries/country all carry `kdc-subpage-chrome` (count 2 = style+js).
- **Injectors**: `_update_subpages.py` (static sub-pages, `block(slug,accent)` at line 79, emits `kdc-subpage-chrome`); `_theme_subsidiaries.py` (landing pages, `block(slug,accent,label)` at line 70, emits `kdc-subsidiary`). Both idempotent (strip prior by id).
- **Vagary API** (`vagary_index/api/app.py`): Flask `do_GET` router, endpoints `/health /schema /countries /regions /search` + per-country. **38/250** country JSONs in `api/data/` (rich: code, name, region, capitalCity, latitude, longitude, climate, attractions, top10_experiences, itineraries, sources). PHL not yet generated.
- **Heat rasters**: 57 PNGs in `vagary_index/batch_output/*_rasters/<Country>_thermal_bio{1,5,6}.png`. Not yet served over HTTP.
- **Travel webapp**: `REGIONS` map + `getCountryCode()` + `ALL_COUNTRIES`; `countries.html` shows "250 Countries" placeholder rows.

## Decisions (defaults chosen so execution isn't blocked — flag if wrong)

1. **POI data** (gas stations / photos / "interact with locals"): **seed realistic SAMPLE data locally** per country in `api/data/pois.json`. No external API calls (respects local-only). Clearly marked sample.
2. **API hosting**: **local Docker + baked static fallback**. The GitHub Pages front-end fetches the API if reachable; if not ( Pages can't hit localhost), it renders from a baked `visited.json`/country snapshot and is read-only with a "data offline" note. Map never blank. (Public hosting is a later option if you want live writes from Pages.)

---

## Audit finding (sub-page functional/asset check — DO THIS FIRST)

Verified all 24 subsidiary sub-pages. **JS is functional everywhere** (every subsidiary's `scripts/*.js` has real handlers/functions; shoe-brand renders product cards via forEach/innerHTML + 6 listeners; browser-confirmed products page works — 6 products, category filters, VIEW DETAILS links). CSS/JS all resolve.

**ONE real gap: shoe-brand `images/` folder was never deployed to gh-pages.** All 12 product images on `products.html` (and the logo on `about.html`, product image on `product.html`/`checkout.html`) are 404/broken. Source images EXIST at `corporate_runtime/documents/shoe_brand/webapp/images/{logos,products}/`. The `_deploy_subpages.py` only copied HTML+CSS+JS.

Minor note: products.html shows TWO "Menu" buttons (duplicate from chrome injection) — cosmetic, fix alongside if trivial.

## Task A0: Deploy shoe-brand images (fix broken assets) — DO FIRST

**Objective:** Deploy the missing `images/` folder so shoe-brand product/logo images load.

**Files:**
- Deploy to gh-pages: `shoe-brand/images/logos/*.png`, `shoe-brand/images/products/*.jpg` (from `corporate_runtime/documents/shoe_brand/webapp/images/`)
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_deploy_subpages.py` (add `images/` to the deployed asset set so future re-runs include it)

**Step 1 — Extend `_deploy_subpages.py`:** in the asset-copy section, also copy the `images/` directory (currently only `scripts/`, `styles/`, `style.css`, `app.js`). Add `images` to the recursive dirs copied per subsidiary (guard: only if the source `images/` exists).

**Step 2 — Re-run the injector** (it re-deploys all sub-pages + now images via plumbing, force-push gh-pages).

**Step 3 — Trigger Pages rebuild.**

**Step 4 — Verify live:**
```bash
curl -sk -o /dev/null -w '%{http_code}\n' .../KingDesignCollectiveinc/shoe-brand/images/products/KING-001-side.jpg   # 200
curl -sk -o /dev/null -w '%{http_code}\n' .../KingDesignCollectiveinc/shoe-brand/images/logos/LOGOKDSC.png        # 200
```
Browser-load products.html → `document.images` all `naturalWidth>0` (0 broken).

**Step 5 — Commit** (injector self-commits; never `git add -A`).

> Optional: while in `_deploy_subpages.py`, dedupe the double "Menu" button (the chrome JS appends a button without checking for an existing one — add an id guard like the nav-dropdown's `header.querySelector('.kdc-menu-btn')`).

---

# PHASE A — Cosmetic sweep (E-waste + Travel)

## Task A1: E-waste cosmetic polish

**Objective:** Subtle spacing/heading polish on ewaste sub-pages (materials/logistics/reports) + landing, teal accent harmony. Cosmetic CSS only.

**Files:**
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_update_subpages.py` (ewaste branch of `block()`)
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_theme_subsidiaries.py` (ewaste branch)

**Step 1 — Read `block()` in both injectors.** Locate where `slug`/`accent` flow into the emitted `<style>`. The ewaste accent is `#2a9d8f`.

**Step 2 — Add ewaste-only cosmetic CSS** (guard on `slug=="ewaste-recycling"` so it doesn't leak — mirror how kids did it in Task 2): bump section-title `font-size` ~+0.25rem, increase card/panel padding ~10%, ensure teal reads on `:hover`/`.active`. Do NOT change layout structure, routing, or content.

**Step 3 — Validate JS** (extract any changed `<script>`, `node --check` → OK).

**Step 4 — Deploy:** run both injectors (each commits+force-pushes via plumbing), trigger Pages rebuild.

**Step 5 — Verify:** curl ewaste pages, grep new CSS + teal accent present; confirm NO leak to other subsidiaries (grep the ewaste-only CSS string on the other 6 → 0).

**Step 6 — Commit** (injectors self-commit; do NOT `git add -A`).

## Task A2: Travel/Vagary cosmetic polish

**Objective:** Same light polish on travel countries/country + landing, gold accent harmony, align headings with dashboard Fraunces. This dovetails with Phase B (the map inherits this styling).

**Files:**
- Modify: `_update_subpages.py` (travel branch)
- Modify: `_theme_subsidiaries.py` (travel branch)

**Steps:** identical pattern to A1, guarded on `slug=="travel-index"`, accent `#d4af37`. Validate/deploy/verify/leak-check the same way.

## Task A3: Phase A verification sweep (ad-hoc)

**Objective:** Prove ewaste + travel polished, nothing regressed, no cross-leak.

**Files:** Create `C:\Users\young\AppData\Local\Temp\hermes-verify-cosmetic-ab.py` (temp, delete after).

**Checks:** ewaste + travel pages carry new CSS + correct accent; the 5 already-done subsidiaries (kids/game/shoe/innovation/quantum) + dashboard features (globe/nav/logos/guard) intact; exactly-one-block idempotency; gh-pages local==origin; `node --check` on touched JS. Run → ALL PASS → delete temp.

---

# PHASE B — Vagary World Map (clickable countries)

## Task B1: Extend Vagary API — visited-state + raster + POI endpoints

**Objective:** Add `/visited` (GET/POST/DELETE), `/raster/<CODE>/<bio>`, `/pois/<CODE>` to the Flask API, with CORS.

**Files:**
- Modify: `vagary_index/api/app.py`
- Create: `vagary_index/api/data/visited.json` (seed `{}`)
- Create: `vagary_index/api/data/pois.json` (seed PHL, JPN, USA, FRA, BRA)
- Create: `vagary_index/api/Dockerfile`

**Step 1 — Read `app.py`** fully; match the `do_GET`/`_json`/`_read_json` style.

**Step 2 — `/visited`**: GET returns `{CODE: "visited"|"want"|null}`; POST body `{"code","state"}` upserts (atomic tmp+rename write to visited.json; validate state ∈ {visited,want,null}); DELETE `?code=` clears.

**Step 3 — `/raster/<CODE>/<bio>`**: map CODE→country name via country JSON, find `batch_output/*_rasters/<Name>_thermal_bio<N>.png`, serve `image/png` or 404. Guard `..` traversal.

**Step 4 — `/pois/<CODE>`**: from pois.json → `{photos:[{url,caption}], gas:[{name,lat,lon}], weather:{bio1,bio5,bio6,rasterUrls}}`. Seed 5 countries with SAMPLE data; weather.rasterUrls point at `/raster/<CODE>/<bio>`.

**Step 5 — CORS**: emit `Access-Control-Allow-Origin: *` on all responses + handle OPTIONS.

**Step 6 — Smoke-test locally:**
```bash
cd /c/Users/young/agents/vagary_index/api && python app.py &
curl -s localhost:8080/visited                         # {}
curl -s -XPOST localhost:8080/visited -d '{"code":"PHL","state":"visited"}' -H 'Content-Type: application/json'
curl -s localhost:8080/visited                          # {"PHL":"visited"}
curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/raster/PHL/1   # 200/404
curl -s localhost:8080/pois/JPN | head
curl -sI localhost:8080/countries | grep -i access-control-allow-origin
```

**Step 7 — Commit** (stage only api files, never `-A`):
```bash
git add vagary_index/api/app.py vagary_index/api/data/visited.json vagary_index/api/data/pois.json vagary_index/api/Dockerfile
git commit -m "feat(vagary): visited/raster/poi endpoints + CORS"
```

## Task B2: Complete country data toward 250 (non-blocking)

**Objective:** API has 38/250. Generate the rest from `batch_output/<CODE>/` source assets so the map can color all countries.

**Files:** `vagary_index/api/data/<CODE>.json` (generated)

**Step 1 — Find the ingest** in `app.py` (`load_countries`/`_ingested_at`) or a build script; run it to fill all 250 from `batch_output/`. Ensure PHL generated.

**Step 2 — Verify:** `ls vagary_index/api/data/*.json | grep -vE 'visited|pois' | wc -l` → 250 (or note count if partial).

**Step 3 — Commit** the data dir (stage explicitly).

> Non-blocking: map renders whatever exists; fills in as data lands.

## Task B3: Inject interactive SVG world map into travel-index

**Objective:** Client-side clickable world map — countries colored by visit-state, legend, stats bar, click→detail panel (mark-visited + photos/weather/gas), Map/Provinces tabs. Injected into `travel-index/index.html` + `countries.html`.

**Files:**
- Create: `C:\Users\young\agents\KingDesignCollectiveinc\_vagary_map.py` (injector)
- Deploy: `gh-pages:travel-index/assets/world.svg` (ISO3-keyed simplified world paths) via plumbing

**Step 1 — World geometry:** use a public-domain simplified world SVG with `<path id="PHL">` ISO3 keys. Bake into injector OR ship `travel-index/assets/world.svg` and fetch it. Keep it low-poly to bound size.

**Step 2 — Map component** (`<style id="kdc-vagary-map">` + `<script id="kdc-vagary-map-js">`):
- Render SVG; fill each country: visited=`#d4af37` (gold), want=`#e63946` (red), unvisited=`#2a9d8f` (teal) — matches your reference legend.
- Legend top-left (BEEN THERE / WANT TO VISIT / UNVISITED); stats bar bottom (`X VISITED · Y PLANNING · Z UNVISITED`); "Currently X/250" overlay.
- Click country → panel: name, capital, flag emoji, Mark visited/Want/Clear buttons (POST `/visited`), tiles: **Photos** (`/pois`), **Weather** (heat-raster `<img>` from `/raster`), **Gas Stations** (list + lat/lon), **Attractions/Top experiences** (country JSON).
- Tabs Map/Provinces (Provinces = existing countries list). Keep dropdown chrome.
- API base configurable const; on fetch failure → baked fallback (render map uncolored + "data offline" note). Never blank.

**Step 3 — Self-heal + idempotent:** create map DOM in JS, re-fetch each render (liveCanvas pattern); id-guard `kdc-vagary-map`; strip prior before inject. Mount overlay on `document.body` if inside React tree gets wiped.

**Step 4 — Validate JS:** extract `kdc-vagary-map-js`, `node --check` → OK.

**Step 5 — Deploy:** `uv run --with pillow python _vagary_map.py` (plumbing commit + force-push), trigger Pages rebuild.

**Step 6 — Verify live:** `curl .../travel-index/ | grep -c kdc-vagary-map` ≥1; browser-load → map renders, click country → panel, mark visited → stat increments (if API reachable) or shows offline note (if not).

## Task B4: Host API in Docker + wire into stack

**Objective:** Run the Vagary API in the existing Docker stack with CORS so it's reachable where deployed.

**Files:**
- `vagary_index/api/Dockerfile` (from B1)
- Modify: `hermes_skills/_packages/docker-compose.yml` (add `vagary-api`, port 3105→8080, mount data, restart policy)

**Step 1 — compose service** (CORS already in B1):
```yaml
vagary-api:
  build: ../../../../vagary_index/api   # adjust relative path to repo
  ports: ["3105:8080"]
  volumes: [".../vagary_index/api/data:/app/data"]
  restart: unless-stopped
```

**Step 2 — Bring up + smoke:**
```bash
docker compose up -d vagary-api
curl -s localhost:3105/health
curl -s localhost:3105/countries | head
```

**Step 3 — Commit** compose + Dockerfile (stage explicitly).

> If API stays local-only, Phase B map uses the baked fallback (B3) — still fully interactive for viewing, read-only for writes. FLAG this tradeoff; public hosting is the upgrade path.

## Task B5: Wire map into dashboard globe (optional integration)

**Objective:** The dashboard globe currently has 7 subsidiary nodes. Make the Travel node (or a hover) deep-link into the Vagary map. Small, optional.

**Files:** Modify `_globe_network.py` (travel node href already `/KingDesignCollectiveinc/travel-index/` — confirm it lands on the map).

**Step 1 — Verify** travel node click → travel-index (map). If the map is on `countries.html` not the landing, point the node there.

## Task B6: Full verification sweep (ad-hoc)

**Objective:** End-to-end proof.

**Files:** Create `C:\Users\young\AppData\Local\Temp\hermes-verify-vagary.py` (temp, delete after).

**Checks:**
- API: `/health` 200; `/countries` count (250 or noted); visited POST/GET/DELETE round-trip; `/raster/PHL/1` 200/404; `/pois/JPN` shape; CORS header present.
- Front-end: `kdc-vagary-map` on travel-index landing + countries.html; ISO3 paths present (`id="PHL"`); legend + stats markup; offline-fallback present.
- Phase A: ewaste+travel polish present; no cross-leak; dashboard features intact; idempotency (one block each).
- gh-pages local==origin; `node --check` on all touched JS.
- Browser E2E: load travel-index → map renders → click country → panel → mark visited → stat++ (or offline note if API unreachable).

Run → ALL PASS/explained → delete temp.

---

## Tests / validation summary

| Check | Command | Expected |
|---|---|---|
| API health | `curl localhost:3105/health` | 200 |
| Country count | `ls api/data/*.json \| grep -vE 'visited\|pois' \| wc -l` | 250 (or noted) |
| Visited round-trip | POST→GET→DELETE `/visited` | persists then clears |
| Raster | `curl -o /dev/null -w %{http_code} localhost:3105/raster/PHL/1` | 200/404 |
| POI shape | `curl localhost:3105/pois/JPN` | photos/gas/weather keys |
| CORS | `curl -sI localhost:3105/countries` | ACAO header |
| Map injected | `curl .../travel-index/ \| grep -c kdc-vagary-map` | ≥1 |
| ISO3 paths | grep `id="PHL"` in map SVG | present |
| Phase A no-leak | ewaste/travel CSS absent on other 6 | 0 |
| Idempotency | each `kdc-*` block count == 1 | pass |
| Dashboard intact | globe/nav/logos/guard present | pass |
| Browser E2E | click country, mark visited | panel + stat++ |

## Risks, tradeoffs, open questions

- **POI data = SAMPLE (local-only).** Real gas/photos/locals need Google Places/Overpass (keys + network, breaks local-only). Defaulted to sample. Upgrade path noted.
- **API local vs public:** Pages can't reach localhost → map uses baked fallback, read-only writes until API publicly hosted. Defaulted to local + fallback. FLAG if you want public hosting now.
- **World SVG size:** full paths are large; use simplified/low-poly or ship as separate `.svg` fetch (B3 Step 1).
- **250-country generation** may be slow/flaky; non-blocking (B2).
- **React hydration wipe:** map DOM must self-heal (B3 Step 3) — non-negotiable, hit repeatedly.
- **curl TLS flakiness / CDN cache:** retry; browser is ground truth.
- **Phase A is light** because chrome already exists — this is polish, not construction.

## Files likely to change (summary)

Phase A: `_update_subpages.py`, `_theme_subsidiaries.py` (ewaste + travel CSS branches).
Phase B: `vagary_index/api/app.py`; `api/data/visited.json`, `pois.json`, `<CODE>.json`×250; `api/Dockerfile`; `hermes_skills/_packages/docker-compose.yml`; new `KingDesignCollectiveinc\_vagary_map.py`; possibly `gh-pages:travel-index/assets/world.svg`; `_globe_network.py` (B5). Deploys to gh-pages via injectors; API via Docker. No Next.js source changes.
