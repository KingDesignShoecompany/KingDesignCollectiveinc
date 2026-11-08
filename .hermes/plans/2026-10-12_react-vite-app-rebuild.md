# KingDesignCollectiveINC — Native React (Vite) App Rebuild

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the injection-into-built-HTML approach with a real, maintainable **Vite + React** source app that compiles to the same GitHub Pages site (`/KingDesignCollectiveinc/`), starting with the 8-panel dashboard and the shared chrome, then migrating subsidiaries page-by-page.

**Architecture:** Vite + React + React Router. A `kdc-ui` design system (black-and-gold, glass panels, diamond cursor) shared across all routes. Data layer fetches the Vagary API (localhost:8080 / docker 3105, configurable via env). Build output deploys to gh-pages via the existing Pages workflow. The current injected site stays live until the React app is verified, then cutover.

**Tech Stack:** Vite, React 18, React Router v6, plain CSS (design tokens) — no UI framework (keep it lean, match existing glass/gold aesthetic). TypeScript optional (start JS for speed, can migrate later). Env-based API base.

---

## Current state (verified read-only)

- Node 24 + npm 11 available. No root `package.json` (clean scaffold spot at `C:\Users\young\agents\`).
- Current site = built output on gh-pages, themed via CSS/JS injection (3 injectors: `_globe_network.py`, `_theme_subsidiaries.py`, `_update_subpages.py`, `_dashboard_grid.py`). Working but hacky.
- Routes to reproduce (from gh-pages):
  - `/` dashboard (8-panel grid)
  - `/travel-index/` + `countries`, `country`
  - `/shoe-brand/` + `products`, `product`, `about`, `contact`, `checkout`
  - `/game-design/` + `cards`, `card-detail`, `events`
  - `/kids-channel/` + `stories`, `story-play`, `create`, `about`
  - `/innovation-hub/` + `whitepapers`, `patents`, `tech-stack`
  - `/ewaste-recycling/` + `materials`, `logistics`, `reports`
  - `/quantum-wearables/` + `sensors`, `thermal`, `safety`
- Vagary API: `localhost:8080` (local) / `3105` (docker). Endpoints: `/countries`, `/visited`, `/raster/<CODE>/<bio>`, `/pois/<CODE>`, `/health`.
- Vite base path must be `/KingDesignCollectiveinc/` to match Pages serving.

## Key decisions

- **Vite over Next.js** — simpler, faster, static SPA is a perfect fit for GitHub Pages (no SSR needed; current site is client-rendered anyway). React Router handles the routes.
- **SPA on Pages** — needs a `404.html` → `index.html` redirect trick for client-side routing on refresh (standard Pages SPA pattern), OR hash routing to avoid it. **Decision: use a `404.html` redirect** (clean URLs) — documented in Task A2.
- **Incremental cutover** — scaffold + dashboard first, verify, then migrate subsidiaries one at a time. The old injected gh-pages stays live until each React route is proven.
- **Design tokens** — extract the black-and-gold palette + diamond cursor into a shared CSS file so all routes are consistent (replaces the per-injector CSS).

## Risks / tradeoffs

- SPA routing on GitHub Pages needs the `404.html` redirect (refresh on a deep link would 404 without it). Mitigated in A2.
- This is a from-scratch rebuild — the injected site remains the production fallback until cutover. No downtime.
- Migrating 7 subsidiaries + ~20 sub-pages is substantial; phased so each is independently verifiable.

---

# PHASE A — Scaffold + design system + dashboard

## Task A1: Scaffold the Vite + React app

**Objective:** Create the app skeleton at `C:\Users\young\agents\kdc-app\` with Vite, React, React Router, configured for the Pages base path.

**Files:**
- Create: `kdc-app/package.json`, `kdc-app/vite.config.js`, `kdc-app/index.html`, `kdc-app/src/main.jsx`, `kdc-app/src/App.jsx`

**Steps:**
1. `cd C:\Users\young\agents && npm create vite@latest kdc-app -- --template react`
2. `cd kdc-app && npm install react-router-dom`
3. Edit `vite.config.js`: set `base: '/KingDesignCollectiveinc/'`.
4. Edit `index.html`: set `<title>KingDesignCollectiveINC</title>`, add the gold serif font (Fraunces) via Google Fonts link, base meta.
5. Verify: `npm run dev` starts, `npm run build` produces `dist/` with assets under `/KingDesignCollectiveinc/`.
6. Commit: `git add kdc-app && git commit -m "chore: scaffold Vite+React app"` (note: `kdc-app` may need to be un-gitignored or committed with `-f` if `.gitignore` catches `node_modules` — add `kdc-app/node_modules` to `.gitignore`).

## Task A2: GitHub Pages SPA routing (404 redirect)

**Objective:** Make client-side routes survive refresh/deep-links on GitHub Pages.

**Files:**
- Create: `kdc-app/public/404.html`
- Modify: `kdc-app/package.json` (add `deploy` script)

**Steps:**
1. Create `public/404.html` with the standard SPA redirect: a script that rewrites the path into a query param and redirects to `/KingDesignCollectiveinc/?/<path>`, plus `index.html` reads that param and restores the route via history API.
2. Add to `index.html` `<head>` the corresponding restore script.
3. Verify: build, then test locally that a deep route restores (hard to fully test without Pages, but the mechanism is the well-known Pages SPA pattern — document it).
4. Commit.

## Task A3: Design system (black-and-gold tokens + diamond cursor)

**Objective:** Shared CSS design tokens replacing the injected theme.

**Files:**
- Create: `kdc-app/src/styles/tokens.css`, `kdc-app/src/styles/global.css`
- Modify: `kdc-app/src/main.jsx` (import styles)

**Steps:**
1. `tokens.css`: CSS custom properties — `--gold:#d4af37`, `--bg:#0a0a0a`, `--panel:rgba(255,255,255,.03)`, `--glass-border:rgba(212,175,55,.18)`, fonts (Fraunces serif + Inter).
2. `global.css`: reset, the **diamond cursor** (`body{cursor:url("data:image/svg+xml,...diamond...")}`), base typography, gold focus states.
3. Import both in `main.jsx`.
4. Verify: dev server shows black bg + gold accents + diamond cursor on a placeholder route.
5. Commit.

## Task A4: Shared chrome (header/nav/footer) as components

**Objective:** Reusable `<AppHeader>`, `<Nav>`, `<AppFooter>` matching the current dropdown + branding.

**Files:**
- Create: `kdc-app/src/components/AppHeader.jsx`, `Nav.jsx`, `AppFooter.jsx`, `kdc-app/src/components/chrome.css`
- Modify: `kdc-app/src/App.jsx` (layout with header/footer + `<Outlet>`)

**Steps:**
1. `AppHeader`: KINGDESIGNCOLLECTIVEINC logo + "Made with AI" badge + hamburger → dropdown nav (React state, no injection needed).
2. `Nav`: the 8 main links (Dashboard + 7 subsidiaries) using React Router `<NavLink>` (absolute `/KingDesignCollectiveinc/...` hrefs, active state built-in). Submenus per subsidiary.
3. `AppFooter`: logo + "INTELLIGENCE • INNOVATION • IMPACT" + crown.
4. Layout in `App.jsx`: header + `<main><Outlet/></main>` + footer.
5. Verify: nav renders, links use Router (no full reload), active state works.
6. Commit.

## Task A5: Dashboard 8-panel grid as a real component

**Objective:** Port the injected dashboard grid into React (`<Dashboard>` route) with the PANELS data + hero/stats/thumbs.

**Files:**
- Create: `kdc-app/src/data/panels.js` (the PANELS/ORDER data), `kdc-app/src/pages/Dashboard.jsx`, `kdc-app/src/pages/Dashboard.css`
- Modify: `kdc-app/src/App.jsx` (route `/` → Dashboard)

**Steps:**
1. `panels.js`: the 8-panel data (dashboard + 7 subsidiaries, stats/thumbs) — port from `_dashboard_grid.py`'s `PANELS`.
2. `Dashboard.jsx`: responsive 4×2 grid, each `<Panel>` = hero + title + 3 stats + 3 thumbs + `<Link>` to its route. Black-and-gold, hover lift.
3. Route `/` → Dashboard. Verify grid renders, links navigate via Router.
4. Commit.

## Task A6: Build + deploy pipeline to gh-pages

**Objective:** Automate `dist/` → gh-pages.

**Files:**
- Create: `kdc-app/.github/workflows/deploy.yml` (or reuse existing Pages workflow pattern)
- Modify: `kdc-app/package.json` (`build` script; `gh-pages` deploy dep optional)

**Steps:**
1. Add `npm run build` producing `dist/` with `base:/KingDesignCollectiveinc/`.
2. Deploy via `gh-pages` npm package OR a GitHub Action that pushes `dist/` to gh-pages branch. **Decision: GitHub Action** (matches existing `verify-pages` workflow style, no local push of build artifacts).
3. Verify: build succeeds, action deploys, site loads at the Pages URL.
4. Commit.

# PHASE B — Migrate subsidiaries (one per task, each independently verifiable)

## Task B1: Travel Index (countries + country detail + world map)

**Objective:** Port travel-index to React routes, wiring the Vagary API + world map.

**Files:**
- Create: `kdc-app/src/pages/travel/Countries.jsx`, `Country.jsx`, `WorldMap.jsx`, `kdc-app/src/api/vagary.js`
- Modify: `kdc-app/src/App.jsx` (routes)

**Steps:**
1. `api/vagary.js`: fetch wrapper for the Vagary API (base from `import.meta.env.VITE_VAGARY_API || 'http://localhost:8080'`), `/countries`, `/visited`, `/raster`, `/pois`.
2. `Countries.jsx`: grid of country cards (from API), clickable → `/country?code=`.
3. `Country.jsx`: guide detail (reads `?code=`), paywall (demo), free-sample PDF (print CSS).
4. `WorldMap.jsx`: the dot-map component (port from injected map) fetching `/countries` + `/visited`.
5. Routes: `/travel-index`, `/travel-index/countries`, `/travel-index/country`.
6. Verify against local API. Commit.

## Task B2–B7: Remaining subsidiaries

**Objective:** Port shoe-brand, game-design, kids-channel, innovation-hub, ewaste-recycling, quantum-wearables — same pattern (routes + components + data), reusing the design system + existing `corporate_runtime/documents/<sub>/webapp` logic where portable.

**Per subsidiary (repeat B1 structure):**
- Routes: `/<sub>/` + its sub-pages.
- Components: port the sub-page logic (cards, filters, detail, player) from the existing static webapp JS into React components.
- Data: local arrays (cards, products, stories) or API where applicable.
- Verify each route renders + navigates. Commit per subsidiary.

## Task B8: Cutover

**Objective:** Switch production from injected-HTML to the React build.

**Steps:**
1. Verify all React routes match the current site's behavior.
2. Point the Pages deploy at the React `dist/` (replace the injected gh-pages content).
3. Keep the old injectors in git history (reversible). Verify live site = React app.
4. Final sweep: all routes, API wiring, theme, cursor, responsive.

---

## Tests / validation

- Per task: `npm run build` succeeds; `npm run dev` route renders; browser-check navigation.
- Final: ad-hoc `hermes-verify-` script checking the built `dist/` (routes present, base path correct, assets resolve) + live Pages verification. Explicitly ad-hoc (no test framework yet — can add Vitest later).
- Existing `verify_gh_pages.py` guard still runs on the branch.

## Open questions

1. **TypeScript or JS?** — Recommend **JS** for speed now (can migrate to TS later). Confirm?
2. **Styling** — plain CSS with tokens (recommended, matches current) vs Tailwind vs CSS Modules. Confirm plain-CSS?
3. **Data source per subsidiary** — keep the existing hardcoded arrays (cards/products/stories) ported into React, or move to the Vagary API / a JSON file? Recommend port arrays first, API where it already exists (travel).
4. **Cutover timing** — build everything then cut over at the end (recommended), or cut over per-subsidiary as each lands?

## Out of scope

- SSR / Next.js (Vite SPA chosen).
- Backend changes (Vagary API stays as-is; React consumes it).
- Real hero images (still placeholder/gradient unless assets provided).
