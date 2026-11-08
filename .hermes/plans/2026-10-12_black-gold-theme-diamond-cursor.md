# Black & Gold Theme Overhaul + Diamond Cursor — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Re-theme the entire KingDesignCollectiveINC site (dashboard + all 7 subsidiaries + their sub-pages) to a unified **black-and-gold** palette, and replace the default cursor with a **diamond cursor** site-wide.

**Architecture:** The site is built output on gh-pages (no Next.js source). Theme = CSS variables + accent overrides injected per-page via the existing injectors. Cursor = a custom SVG diamond cursor injected globally. Two work streams: (A) unify the palette to black/gold by overriding each subsidiary's per-subsidiary accent CSS in the injectors, and (B) add a diamond cursor to every page.

**Tech Stack:** CSS custom properties, the existing git-plumbing injectors (`_theme_subsidiaries.py`, `_update_subpages.py`, `_globe_network.py`), inline SVG data-URI cursor.

---

## Current state (verified)

- Each subsidiary has its OWN accent color via the `PAGES` map in `_theme_subsidiaries.py`:
  travel `#d4af37` (gold), shoe `#01963d` (green), game `#4361ee` (blue), kids `#f72585` (pink), innovation `#4cc9f0` (cyan), ewaste `#2a9d8f` (teal), quantum `#9b5de5` (purple).
- Those accents are injected as `--accent` overrides + per-subsidiary CSS (`KIDS_CSS`, `EWASTE_CSS`, `TRAVEL_CSS`) in `_theme_subsidiaries.py` (landing) and `_update_subpages.py` (sub-pages).
- The dashboard base is already dark (near-black) with gold `#d4af37` — the globe/atmosphere are gold. So the dashboard is close to target already.
- **No custom cursor exists** anywhere (no `.cur`/`.svg` cursor assets, no `cursor:url()` rules). The "globe mouse" is just the OS/browser default arrow over the globe canvas. So the diamond cursor is a net-new global injection, not a replacement of an existing asset.
- The globe canvas is black-space + gold; it stays (task is theme, not removing the globe).

## Design decisions

- **Black & gold = one unified identity.** Collapse all 7 subsidiary accents to the gold `#d4af37`. Keep the dark (near-black) backgrounds that already exist. This removes the per-subsidiary "moral compass" colors in favor of a single brand palette.
- **Diamond cursor:** a small gold diamond SVG as a data-URI, applied to `body` (and `a, button` keep `pointer` or also get the diamond). Fallback to `pointer`/`default` if the data-URI is unsupported.
- **Do NOT remove** the globe, the read-along, the map, the paywall, or any functionality — theme + cursor only.

## Risks / open questions

- Removing per-subsidiary colors is a visual identity change the user explicitly wants ("all page themes Black and gold"), so it's intended — but it means kids/ewaste/etc. lose their signature accent. Confirmed desired.
- The diamond cursor as an SVG data-URI works in all modern browsers; very old browsers fall back to `default`. Acceptable.
- Some pages (travel paywall buttons, kids highlight) use teal/pink/blue inline (`#00b4d8`, `#f72585`, etc.) baked into JS templates — those need overriding to gold too, or they'll clash. Flagged in Task A3.

---

# PHASE A — Unify palette to black & gold

## Task A1: Collapse subsidiary accents to gold in the injectors

**Objective:** Change every subsidiary's accent from its own color to gold `#d4af37`.

**Files:**
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_theme_subsidiaries.py` (PAGES map accents + per-subsidiary CSS)
- Modify: `C:\Users\young\agents\KingDesignCollectiveinc\_update_subpages.py` (accent args + per-subsidiary CSS)

**Steps:**
1. In `_theme_subsidiaries.py`, change every accent in `PAGES` to `#d4af37` (travel stays gold; shoe/game/kids/innovation/ewaste/quantum → `#d4af37`).
2. In the per-subsidiary CSS blocks (`KIDS_CSS` pink `#f72585`, `EWASTE_CSS` teal `#2a9d8f`, `TRAVEL_CSS` gold — already gold), replace the non-gold hex values with `#d4af37` (and matching rgba glows `rgba(212,175,55,...)`). Keep the structural rules (padding, font-size, gaps) — only colors change.
3. In `_update_subpages.py`, same: the accent passed to `block()` for each slug → `#d4af37`; any hardcoded per-subsidiary color in its CSS → gold.
4. Validate: extract changed `<script>` from each injector, `node --check`.
5. Run both injectors (`uv run --with pillow python _theme_subsidiaries.py` then `_update_subpages.py`), trigger Pages rebuild.
6. Verify live: each subsidiary landing + a sub-page shows gold accent (grep `#d4af37` present, old accent hex absent).

## Task A2: Override baked-in non-gold colors in page JS/CSS

**Objective:** Catch inline non-gold colors baked into HTML/JS templates that the injectors don't reach.

**Files:**
- Modify: `corporate_runtime/documents/travel_index/webapp/app.js` (paywall buttons `#00b4d8` teal → gold)
- Modify: `corporate_runtime/documents/travel_index/webapp/styles/KingDesignCollectiveINC-travel-index.css` (teal accents → gold)
- Check/Modify: kids `#f72585` in story-play inline styles; game/shoe/innovation/quantum sub-page CSS for their accent hex.

**Steps:**
1. Grep all deployed sub-page CSS + JS for non-gold brand hexes (`#00b4d8`, `#f72585`, `#01963d`, `#4361ee`, `#4cc9f0`, `#2a9d8f`, `#9b5de5`).
2. Replace brand-accent usages with `#d4af37` (+ gold rgba glows). Leave functional colors (success/error) if any.
3. Redeploy affected sub-pages via the injectors. Rebuild. Verify.

## Task A3: Dashboard gold confirmation + black background

**Objective:** Ensure the dashboard is unambiguously black + gold (it mostly is; confirm background is near-black, gold accents only).

**Files:**
- Inspect/Modify: `KingDesignCollectiveinc/_globe_network.py` (globe is gold on black — confirm; adjust atmosphere/star tints to stay gold/neutral, not blue).

**Steps:**
1. Confirm dashboard bg is near-black and all accents gold. If any blue/teal remains (atmosphere rim is blue `rgba(30,90,180,...)`), shift to a gold/neutral tint OR keep as subtle — user said "black and gold," so neutralize non-gold tints.
2. Redeploy globe injector. Rebuild. Verify.

# PHASE B — Diamond cursor (global)

## Task B1: Create the diamond cursor asset

**Objective:** A gold diamond SVG cursor as a data-URI.

**Files:**
- Create: inline SVG data-URI (embedded in the injected CSS, no external file needed).

**Steps:**
1. Author a small diamond SVG (gold `#d4af37` fill, subtle dark outline for visibility on black), ~24×24, hotspot at tip.
2. URL-encode it as a `cursor: url("data:image/svg+xml,...") 12 12, pointer;` rule.
3. Test render in browser (cursor shows as gold diamond over the page).

## Task B2: Inject the diamond cursor globally

**Objective:** Apply the diamond cursor to every page (dashboard + all subsidiaries + sub-pages).

**Files:**
- Modify: `_theme_subsidiaries.py` (add cursor rule to the injected `<style>` for all landing pages)
- Modify: `_update_subpages.py` (add cursor rule to the injected `<style>` for all sub-pages)
- Modify: `_globe_network.py` (add cursor rule to the dashboard globe `<style>`)

**Steps:**
1. Add a shared `CURSOR_CSS` constant (the `body { cursor: url(...) }` rule) to each injector, injected alongside the existing style block. Keep `a, button { cursor: pointer }` OR give them the diamond too (recommend diamond everywhere for consistency; buttons can keep pointer for affordance — decide: diamond on body, pointer on interactive).
2. Run all three injectors. Rebuild. Verify live: each page's injected CSS contains the cursor rule.

## Task B3: Verification sweep

**Objective:** Confirm black+gold + diamond cursor across the whole site.

**Steps:**
1. Ad-hoc verify: grep each deployed page (dashboard + 7 landings + representative sub-pages) for the cursor rule + gold accent + absence of old accent hexes.
2. Browser-load dashboard + one subsidiary + one sub-page; confirm visual (gold on black) + diamond cursor present.
3. Confirm gh-pages local == remote; no functionality regressions (globe, map, paywall, read-along intact).

---

## Tests / validation

- Per task: `node --check` on changed JS; injector runs return push rc=0; Pages rebuild `built`.
- Final: ad-hoc `hermes-verify-` script (Temp, run+remove) checking cursor + gold + no-old-accents across representative pages; browser visual confirmation. Explicitly ad-hoc, not a suite (static gh-pages site, no canonical test command).

## Out of scope

- Removing the globe, the world map, the paywall, the story read-along, or any feature. Theme + cursor only.
- Real payment / server PDF (stays demo).
- Country-data backfill (B2 deferred earlier) — unrelated to theme.
