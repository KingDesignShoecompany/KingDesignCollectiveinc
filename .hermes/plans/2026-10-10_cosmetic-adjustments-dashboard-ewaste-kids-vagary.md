# Dashboard, E-Waste, Kids, Vagary — Cosmetic Adjustments Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Apply cosmetic-only polish (colors, layout, globe styling) across four surfaces — the dashboard globe, the E-Waste pages, the Kids Channel pages, and the Vagary/Travel pages — with no new features and no data changes.

**Architecture:** All four surfaces live in the committed `gh-pages` branch of `C:\Users\young\agents` as built output (no Next.js source on this machine). Every change is injected into the committed HTML/CSS via id-guarded blocks using git plumbing (the established pattern this session), so re-runs are idempotent. Each area keeps its own accent color and the shared dark-glass layout; adjustments tighten visual consistency without touching content, routing, or data.

**Tech Stack:** Static HTML/CSS on GitHub Pages; git plumbing (hash-object/update-index/write-tree/commit-tree/force-push); Pillow only if a raster asset is needed (not required here); `gh` CLI for Pages rebuilds. Verification is ad-hoc (node --check on injected JS + committed-state grep + browser render check), not a test suite.

---

## Current context / assumptions

Verified state (gh-pages @ `97748c0`):
- **Dashboard** (`index.html`): 7 injected blocks — `kdc-card-hover`, `kdc-card-logos`, `kdc-globe`, `kdc-globe-js`, `kdc-link-guard`, `kdc-nav-dropdown(-js)`. Globe is a 2D canvas (night earth + golden band + signal lines), self-healing via `liveCanvas()`.
- **E-Waste** (`ewaste-recycling/*.html`): themed, `--accent:#2a9d8f`. Has `style.css` + `styles/`. NOTE: earlier verification showed ewaste sub-pages served accent/header live.
- **Kids** (`kids-channel/*.html`): themed, `--accent:#f72585`. Has `scripts/` + `styles/` but NO `style.css` at the webapp root (unlike ewaste/travel) — cosmetic risk if any page references `style.css`.
- **Vagary/Travel** (`travel-index/*.html`): themed, `--accent:#d4af37`. Has `style.css` + `styles/`. `countries.html` shows "250 Countries" with placeholder rows (data change is OUT OF SCOPE — cosmetic only).

**Assumption:** "Cosmetic only" = spacing, color harmony, card/globe visual polish, consistent header/dropdown chrome, hover states. No routing, no data wiring, no new pages.

**Known pitfall (hit repeatedly this session):** React hydration wipes injected DOM nodes. Any JS-injected element must self-heal by re-fetching from the DOM each tick (the `liveCanvas()` pattern). Any injected `<canvas>`/`<div>` must be created in JS, not as a stray tag.

---

## Step 0 — Safety checkpoint (do first, non-mutating to gh-pages)

The parent `agents/` working tree has pre-existing staged deletions (`.nojekyll`, `404.html`, subsidiary assets) unrelated to this work. Before any gh-pages commit, confirm the index is clean so we never accidentally commit those.

```bash
cd /c/Users/young/agents
git status --short | grep -vE '^(AD| D| M)' || echo "clean of unexpected staged changes"
```

Expected: no output beyond the known `AD`/`D`/`M` lines. If anything else appears, stop and surface it.

---

## Task 1: Add a shared cosmetic CSS layer to the dashboard globe scene

**Objective:** Tighten the globe's visual polish (band contrast, pulse glow, starfield depth) via a small CSS/JS tweak to the existing `kdc-globe` block — no structural change.

**Files:**
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_globe_network.py` (the injector's `INJECT` string, CSS + a few draw constants)

**Step 1 — Read the current globe draw constants**

Read `_globe_network.py`, locate in `INJECT`: the atmospheric gradient stops, band `lineWidth`/gradient, `STARS` alpha range, and pulse dot radius.

**Step 2 — Apply cosmetic deltas (edit the `INJECT` string only)**

Concrete changes (values are starting points; keep subtle):
- Atmosphere: `rgba(30,90,180,0.18)` → `0.24` mid-stop for a slightly stronger rim.
- Band: increase `lineWidth` from `R*0.10` to `R*0.12`; add a second thinner highlight ellipse just above the band for a metallic sheen.
- Starfield: raise max alpha from `0.6` to `0.75` (`a:rnd()*.6+.2` → `rnd()*.75+.25`) for more depth.
- Pulse dot: radius `2.6` → `3.0`, and add a faint outer halo ring (stroke circle radius 5, low alpha) so pulses read as "radar pings".
- City lights: warm `#ffcf6b` stays; add a subtle blue-white mix for variety (alternate `#ffcf6b` / `#cfe6ff` by `l.w`).

**Step 3 — Validate JS**

```bash
cd /c/Users/young/agents/KingDesignCollectiveinc
uv run --with pillow python -c "
src=open('_globe_network.py').read(); head=src.split('git([')[0]; ns={}; exec(head, ns)
import re
m=re.search(r'<script id=\"kdc-globe-js\">\n(.*?)</script>', ns['INJECT'], re.S)
open('C:/Users/young/AppData/Local/Temp/hermes-globe.js','w').write(m.group(1))
"
node --check "C:/Users/young/AppData/Local/Temp/hermes-globe.js" && echo OK
rm -f "C:/Users/young/AppData/Local/Temp/hermes-globe.js"
```

Expected: `OK`.

**Step 4 — Inject + rebuild**

```bash
uv run --with pillow python _globe_network.py   # prints commit + push rc=0
# then trigger Pages rebuild:
gh api -X POST repos/KingDesignShoecompany/KingDesignCollectiveinc/pages/builds
```

**Step 5 — Verify live**

```bash
curl -sk "https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/" | grep -c 'kdc-globe'
```

Expected: `5` (style + js + canvas refs). Then browser-load `.../index.html?cos=1` and confirm globe renders (canvas `width>300`).

**Step 6 — Commit** (the injector commits+pushes itself; no separate commit needed).

---

## Task 2: Kids Channel — guard against missing root style.css

**Objective:** Kids pages lack a root `style.css` (other subsidiaries have one). If any kids page or future tweak references it, it 404s. Add a tiny shared `style.css` shim OR confirm none reference it, then ensure uniform chrome.

**Files:**
- Possibly Create: `gh-pages:kids-channel/style.css` (only if referenced)
- Modify: kids injector blocks (chrome/accent) if spacing needs a nudge

**Step 1 — Check references**

```bash
cd /c/Users/young/agents
git grep -l 'href="style.css"' gh-pages -- 'kids-channel/*.html' || echo "no root style.css refs in kids"
```

**Step 2a — If referenced:** create a minimal `kids-channel/style.css` that imports the shared UI and sets the pink accent base, deploy via plumbing (same pattern as `_deploy_subpages.py`).

**Step 2b — If not referenced:** skip file creation; only apply cosmetic chrome tweaks.

**Step 3 — Cosmetic tweak (either way):** in the kids chrome injector, bump card/page padding and heading size by ~10% for readability (kids content is larger-type friendly). Edit the `kdc-subpage-chrome` / kids theme block in `_update_subpages.py` / `_theme_subsidiaries.py` as applicable.

**Step 4 — Validate + deploy + verify** (same node --check + inject + rebuild + curl grep pattern as Task 1).

---

## Task 3: Vagary/Travel — cosmetic polish on countries/index chrome

**Objective:** Cosmetic only. Improve the countries page header/spacing and card grid rhythm. Do NOT touch the "250 Countries" data or placeholder rows.

**Files:**
- Modify: `travel-index` chrome/theme blocks in `_theme_subsidiaries.py` / `_update_subpages.py`

**Step 1 — Cosmetic deltas:** gold `--accent` stays. Increase card grid gap, add subtle hover lift to country cards, align the page H2 with the dashboard's Fraunces treatment. All via the injected `kdc-subpage-chrome` style block.

**Step 2 — Validate + deploy + verify** (same pattern).

---

## Task 4: E-Waste — cosmetic polish + confirm chrome uniformity

**Objective:** E-waste is already themed/uniform. Apply light cosmetic polish (spacing, teal accent harmony) and confirm every ewaste sub-page still carries the header/hide-navbar rules.

**Files:**
- Modify: ewaste blocks in `_update_subpages.py`

**Step 1 — Cosmetic deltas:** tighten card padding, ensure the teal accent reads consistently on `materials/logistics/reports` (hover states, active link).

**Step 2 — Verify all ewaste sub-pages have chrome:**

```bash
cd /c/Users/young/agents
for f in materials logistics reports; do
  git show gh-pages:ewaste-recycling/$f.html | grep -c 'kdc-subpage-chrome'
done
```

Expected: `1` each.

**Step 3 — Validate + deploy + verify** (same pattern).

---

## Task 5: Full verification sweep (ad-hoc)

**Objective:** Prove all four areas are cosmetically consistent and nothing regressed.

**Files:**
- Create: `C:\Users\young\AppData\Local\Temp\hermes-verify-cosmetic.py` (temp, deleted after)

**Step 1 — Write the sweep script** (checks, per area):
- Dashboard: `kdc-globe` present, canvas fixed full-viewport, cards z-index:5, no stray canvas tag.
- Kids: chrome present on all kids `*.html`; if `style.css` was added, it's committed and referenced consistently.
- Travel: `--accent:#d4af37` on travel pages; chrome present; NO data mutation (grep that "250 Countries" text still present, unchanged).
- E-waste: `--accent:#2a9d8f`; chrome on all 3 sub-pages.
- Global: exactly one of each injected block (idempotency); gh-pages local==remote; node --check on any JS touched.

**Step 2 — Run it**

```bash
python "C:/Users/young/AppData/Local/Temp/hermes-verify-cosmetic.py"
```

Expected: `ALL PASS` (or a short, explained FAIL list).

**Step 3 — Browser spot-check** dashboard + one page per subsidiary (load, confirm renders, no console errors, accent correct).

**Step 4 — Clean up** the temp script.

---

## Tests / validation summary

| Check | Command / method | Expected |
|---|---|---|
| Globe JS valid | `node --check` on extracted `kdc-globe-js` | OK |
| Dashboard live | `curl ... \| grep -c kdc-globe` | 5 |
| Kids chrome | `git show gh-pages:kids-channel/*.html \| grep -c kdc-subpage-chrome` | ≥1 each |
| Travel accent | grep `--accent:#d4af37` | present |
| Travel data unchanged | grep "250 Countries" | still present (no data change) |
| E-waste chrome ×3 | grep `kdc-subpage-chrome` per sub-page | 1 each |
| Idempotency | count each `kdc-*` block == 1 | pass |
| Sync | gh-pages local==remote | pass |
| Browser render | load each page, no console errors, correct accent | pass |

## Risks, tradeoffs, open questions

- **React hydration wipe** (recurring): any new JS-injected element must self-heal (re-fetch from DOM each tick). Reuse the `liveCanvas()` pattern; never rely on a stray injected tag.
- **Pages CDN cache**: after push, `index.html` may serve stale for a bit; force a Pages rebuild and/or cache-bust query param when verifying in-browser.
- **curl TLS flakiness** on this host (`000`/CERTIFICATE_VERIFY_FAILED): retry, or verify via browser as ground truth. Don't treat `000` as a real 404.
- **Kids `style.css`**: unknown until Task 2 Step 1 grep runs — the plan branches on it.
- **Cosmetic magnitude**: values above are starting points. If the user wants subtler/bolder, adjust the constants; this is taste, not correctness.
- **Open question**: does "Vagary index" mean the travel-index pages specifically, or a separate future "Vagary Index" front-page? This plan treats it as the existing `travel-index/*` cosmetic polish. If a distinct Vagary front-page is intended, that's a new surface and out of "cosmetic only" scope — flag before building.

## Files likely to change (summary)

- `C:\Users\young\agents\KingDesignCollectiveinc\_globe_network.py` (dashboard globe CSS/draw constants)
- `C:\Users\young\agents\KingDesignCollectiveinc\_theme_subsidiaries.py` (travel/kids accent+chrome blocks)
- `C:\Users\young\agents\KingDesignCollectiveinc\_update_subpages.py` (ewaste/kids/travel chrome blocks)
- Possibly `gh-pages:kids-channel/style.css` (conditional, Task 2)
- All deploy to `gh-pages` via the existing injectors (git plumbing + force-push); no source-repo changes.
