# Rich Country Guides — Surface the Real Data (Dual-Mode) Implementation Plan

> **For Hermes:** Implement task-by-task. User prefers direct execution over
> subagents (per user profile) — do NOT use delegate_task.

**Goal:** (1) Replace the hardcoded per-country boilerplate on `country-detail`
with the **real rich content** that already exists in the Vagary dataset — for
the 37 countries that have it — and (2) provide a **real offline PDF export that
works for all 255 countries**, per the user's requirement: "255 countries should
be verified for offline use of pdf." Both keep the never-blank dual-mode contract
(live API first, committed snapshot floor).

**Architecture:** Two-layer data strategy, matching the existing country-list
pattern. (1) A new `loadCountryDetail(code)` in `src/data/countries.ts` tries the
live API `/countries/<CODE>` (and `/pois/<CODE>` for photos), then falls back to
a committed per-country snapshot. (2) A committed snapshot bundles the 37 rich
countries into `public/data/rich-countries.json` so the content works offline on
GitHub Pages (which can never reach localhost). The `country-detail` page renders
real fields when present and keeps the existing boilerplate tabs as the honest
fallback, with a "Rich guide" vs "Basic guide" indicator. For PDF: a
**zero-dependency, client-side print-to-PDF** generator renders whatever data a
country has (rich or base) into a printable view the browser saves as PDF — no
network, no library, works for all 255. The offline floor for PDF is the existing
`countries.json` (all 255 base rows) plus `rich-countries.json` (37 rich).

**Tech Stack:** Next.js 15 static export, React 18, TypeScript, Vagary API
(`localhost:8080`), Vitest (local guardrail, not in CI), plain CSS tokens.

---

## Current state (verified read-only this session)

1. **The rich data exists and is being ignored.** `country-detail` renders
   hardcoded boilerplate for every tab (Entry/Climate/Currency/Attractions/TikTok)
   — e.g. `"Visa: Check current entry requirements for {country}"`. Meanwhile:
2. **37 countries have complete rich content** — all 9 fields populated:
   `attractions` (list of 10), `top10_experiences` (10), `fun_facts` (10),
   `phrase_cards` (dict ~19 translations), `history_culture` (markdown string),
   `entry_requirements`, `climate`, `itineraries_couples`, `itineraries_solo`,
   plus `sources`.
   The 37: ABW AFG AGO AIA ALB AND ARE ARG ARM ASM ATF ATG AUS AUT AZE BDI BEL
   BEN BES BFA BGD BGR BHR BHS BIH BLM BLR BLZ BMU BOL BRA BRB BRN BTN BVT BWA CAF
   (sample verified: FRA/BRA return all fields from the live API; the local
   `vagary_index/api/data/<CODE>.json` files mirror them).
3. **196 countries are empty, 1 partial** — those keep the current boilerplate.
4. **Two data sources, both reachable:**
   - Live API: `GET /countries/<CODE>` returns the full rich object;
     `GET /pois/<CODE>` returns `{code, photos:[{url,caption}]}`.
   - Local floor: `vagary_index/api/data/<CODE>.json` (234 files) — the same shape.
   - `GET /raster/<CODE>/<BIO>` currently 404s (`{"error":"not found"}`) — the
     Climate tab's "heat rasters" claim is aspirational; do not depend on it.
5. **`src/lib/vagary.ts`** already has `api.country(code)`, `api.pois(code)`,
   `api.raster(code,bio)` — all return `null` on failure (never throw).
6. **`country-detail` is a client component** using `useSearchParams` for
   `?country=<name>` (a *name*, not a code — note the mismatch: rich data is
   keyed by ISO3 code, so we must resolve name→code, e.g. via the snapshot).
7. **Paywall**: tabs other than Overview are locked until `buyCountry`/
   `buyBundle` (localStorage `usePurchases`). Rich content should live *behind*
   the same paywall — it's the product being sold.
8. **Snapshot**: `public/data/countries.json` has `code` + `name` for all 255 —
   the name→code resolver already exists implicitly there.
9. **PDF export does not exist yet.** "PDF Export" is only a label in the
   paywall feature list (`country-detail/page.tsx:79`); there is no generator and
   no pdf dependency in `package.json`. **This plan builds one (Phase D).**
10. **Offline PDF coverage facts (verified this session):**
    - Committed `countries.json`: **all 255** rows; 208 have region+capital,
      47 missing one, 44 lack coordinates. This is the base-data offline floor.
    - Local `vagary_index/api/data/`: 234 files; 232 have code/name/region/capital;
      **only 38 have the rich fields** (37 fully rich + 1 partial PHL).
    - 24 codes in the UI's 255 have **no local file** (BRU CCK CHA COK CXR ESH
      GUF HMD IOT MMN MSR MYT NFK NIU NMI PAR PCN SGS SHN SJM SZW TIB TKL XAI) —
      mostly tiny territories; the live API returns null base fields for them too.
    - **Conclusion:** a real PDF must render from *whatever a country has* —
      rich (38) or base-only (the rest) — so all 255 can export offline. The
      committed `countries.json` already covers all 255 for the base layer, so no
      new per-country ingestion is required to meet "255 verified for offline PDF";
      the 24 no-file codes still export from the base snapshot.
11. **Known pitfalls** (from prior turns):
   - `<Link>` auto-applies `basePath` → use bare hrefs; `<a>` needs the literal prefix.
   - Python urllib TLS is broken on this host → verify live routes with `curl`.
   - `country-detail` links/content render client-side; verify in source + built
     chunk, not prerendered HTML.
   - CDN edge-lags new routes → retry loop on live checks.

---

# PHASE A — Snapshot the rich data (offline floor)

## Task A1: Build the committed rich-countries snapshot

**Objective:** Produce `public/data/rich-countries.json` containing the 37 rich
countries (keyed by ISO3 code) so the content is available offline on GitHub
Pages, matching the existing snapshot pattern.

**Files:**
- Create: `kdc-next/public/data/rich-countries.json`

**Step 1: Generate the snapshot from local files**

```bash
cd /c/Users/young/agents
python - <<'PY'
import json, glob, os
RICH = ['entry_requirements','climate','attractions','top10_experiences',
        'phrase_cards','fun_facts','itineraries_couples','itineraries_solo',
        'history_culture','sources']
out = {}
for f in glob.glob('vagary_index/api/data/*.json'):
    try: d = json.load(open(f, encoding='utf-8'))
    except: continue
    code = (d.get('country_code') or os.path.basename(f).split('.')[0]).upper()
    if all(d.get(k) for k in RICH):
        out[code] = {k: d[k] for k in RICH}
        out[code]['country_name'] = d.get('country_name')
snap = {'count': len(out), 'codes': sorted(out), 'items': out}
os.makedirs('kdc-next/public/data', exist_ok=True)
json.dump(snap, open('kdc-next/public/data/rich-countries.json','w',encoding='utf-8'),
          ensure_ascii=False, indent=2)
print('rich countries:', len(out))
PY
```

**Step 2: Verify integrity**

```bash
cd /c/Users/young/agents
python -c "
import json
d=json.load(open('kdc-next/public/data/rich-countries.json',encoding='utf-8'))
assert d['count']==len(d['items'])==len(d['codes'])==37, d['count']
assert all(len(v['attractions'])==10 for v in d['items'].values())
assert 'FRA' in d['items'] or 'BRA' in d['items']
print('OK —', d['count'], 'rich countries; sample codes:', d['codes'][:5])
"
```

Expected: `OK — 37 rich countries`.

**Step 3: Commit**

```bash
git add kdc-next/public/data/rich-countries.json
git commit -m "data(travel): commit rich-country snapshot (37 countries, offline floor)"
```

---

## Task A2: Add `loadCountryDetail` to the data layer (TDD)

**Objective:** One dual-mode loader: live API `/countries/<CODE>` +
`/pois/<CODE>` first, committed snapshot fallback; resolves name→code via the
base snapshot; never throws.

**Files:**
- Modify: `kdc-next/src/data/countries.ts`
- Test: `kdc-next/src/data/countries.test.ts`

**Step 1: Write failing tests**

Append to `kdc-next/src/data/countries.test.ts`:

```ts
describe('loadCountryDetail — dual-mode rich content', () => {
  const RICH = {
    count: 1, codes: ['FRA'],
    items: {
      FRA: {
        country_name: 'France',
        attractions: ['Paris – Eiffel Tower', 'Nice'],
        top10_experiences: ['Sunset at Eiffel Tower'],
        fun_facts: ['Most visited country'],
        phrase_cards: { hello: 'Bonjour' },
        history_culture: '# France',
        entry_requirements: 'Schengen visa', climate: 'Temperate',
        itineraries_couples: ['Paris + Lyon'], itineraries_solo: ['Backpacking'],
        sources: ['wikivoyage'],
      },
    },
  };
  const BASE = {
    items: [
      { code: 'FRA', name: 'France', region: 'Europe', lat: 46.2, lon: 2.2, capital: 'Paris' },
      { code: 'JPN', name: 'Japan', region: 'East Asia', lat: 35.67, lon: 139.77, capital: 'Tokyo' },
    ],
  };

  function mockFetch() {
    return vi.fn((url: string) => {
      const u = String(url);
      if (u.startsWith('http://localhost:8080/countries/FRA'))
        return Promise.resolve({ ok: true, json: async () => RICH.items.FRA });
      if (u.startsWith('http://localhost:8080/pois/FRA'))
        return Promise.resolve({ ok: true, json: async () => ({ code: 'FRA', photos: [{ url: 'x', caption: 'Eiffel' }] }) });
      if (u.startsWith('http://localhost:8080')) return Promise.reject(new Error('down'));
      if (u.includes('rich-countries.json')) return Promise.resolve({ ok: true, json: async () => RICH });
      if (u.includes('countries.json')) return Promise.resolve({ ok: true, json: async () => BASE });
      return Promise.reject(new Error('unexpected ' + u));
    });
  }

  it('resolves a country NAME to its code and returns rich fields (live)', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const d = await loadCountryDetail('France');
    expect(d?.code).toBe('FRA');
    expect(d?.attractions?.length).toBe(2);
    expect(d?.phraseCards).toEqual({ hello: 'Bonjour' });
    expect(d?.photos?.length).toBe(1);
    expect(d?.mode).toBe('live');
  });

  it('falls back to the committed snapshot when the API is down (offline)', async () => {
    vi.stubGlobal('fetch', mockFetch()); // API calls still reject for /countries/FRA? no—
    // force offline: make the API branch reject
    const offline = vi.fn((url: string) => {
      const u = String(url);
      if (u.startsWith('http://localhost:8080')) return Promise.reject(new Error('down'));
      if (u.includes('rich-countries.json')) return Promise.resolve({ ok: true, json: async () => RICH });
      if (u.includes('countries.json')) return Promise.resolve({ ok: true, json: async () => BASE });
      return Promise.reject(new Error('unexpected ' + u));
    });
    vi.stubGlobal('fetch', offline);
    const d = await loadCountryDetail('France');
    expect(d?.code).toBe('FRA');
    expect(d?.attractions?.length).toBe(2);
    expect(d?.mode).toBe('offline');
  });

  it('returns null for a country with no rich data (e.g. Japan here)', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const d = await loadCountryDetail('Japan');
    expect(d).toBeNull();
  });

  it('returns null for an unknown country name', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const d = await loadCountryDetail('Atlantis');
    expect(d).toBeNull();
  });
});
```

**Step 2: Run to verify failure**

Run: `cd kdc-next && npx vitest run src/data/countries.test.ts`
Expected: FAIL — `loadCountryDetail` is not exported.

**Step 3: Implement `loadCountryDetail`**

Add to `kdc-next/src/data/countries.ts`:

```ts
export type CountryDetail = {
  code: string;
  name: string;
  attractions?: string[];
  top10?: string[];
  funFacts?: string[];
  phraseCards?: Record<string, string>;
  history?: string;
  entry?: string;
  climate?: string;
  itinerariesCouples?: string[];
  itinerariesSolo?: string[];
  sources?: string[];
  photos?: { url: string; caption: string }[];
  mode: Mode;
};

type RichSnap = {
  count: number;
  codes: string[];
  items: Record<string, any>;
};

async function richSnapshot(): Promise<RichSnap> {
  const res = await fetch('/KingDesignCollectiveinc/data/rich-countries.json');
  return (await res.json()) as RichSnap;
}

async function baseSnapshot(): Promise<Country[]> {
  const res = await fetch('/KingDesignCollectiveinc/data/countries.json');
  const d = (await res.json()) as { items: Country[] };
  return (d.items || []).filter((c) => c && c.code && c.name);
}

function shapeRich(code: string, name: string, raw: any, photos: any[] | null, mode: Mode): CountryDetail {
  return {
    code,
    name,
    attractions: raw.attractions ?? undefined,
    top10: raw.top10_experiences ?? undefined,
    funFacts: raw.fun_facts ?? undefined,
    phraseCards: raw.phrase_cards ?? undefined,
    history: raw.history_culture ?? undefined,
    entry: raw.entry_requirements ?? undefined,
    climate: raw.climate ?? undefined,
    itinerariesCouples: raw.itineraries_couples ?? undefined,
    itinerariesSolo: raw.itineraries_solo ?? undefined,
    sources: raw.sources ?? undefined,
    photos: photos ?? undefined,
    mode,
  };
}

// Load rich content for a country by NAME. Tries the live API first, falls back
// to the committed snapshot. Returns null when no rich data exists for the
// country (the caller then shows the basic boilerplate guide). Never throws.
export async function loadCountryDetail(name: string): Promise<CountryDetail | null> {
  try {
    const base = await baseSnapshot();
    const row = base.find((c) => c.name === name);
    if (!row) return null;

    const live = await api.country(row.code);
    if (live && (live.attractions || live.history_culture || live.entry_requirements)) {
      const pois = await api.pois(row.code);
      const photos = (pois as any)?.photos ?? null;
      return shapeRich(row.code, row.name, live, photos, 'live');
    }

    const snap = await richSnapshot();
    const raw = snap.items[row.code];
    if (!raw) return null;
    return shapeRich(row.code, row.name, raw, null, 'offline');
  } catch {
    return null;
  }
}
```

**Step 4: Run to verify pass**

Run: `npx vitest run src/data/countries.test.ts`
Expected: PASS (all tests, including the 4 new ones).

**Step 5: Build**

Run: `npm run build`
Expected: Compiled successfully.

**Step 6: Commit**

```bash
git add kdc-next/src/data/countries.ts kdc-next/src/data/countries.test.ts
git commit -m "feat(travel): loadCountryDetail dual-mode loader (live API + rich snapshot)"
```

---

# PHASE B — Render rich content on country-detail

## Task B1: Fetch rich detail and show a guide-type indicator

**Objective:** On `country-detail`, call `loadCountryDetail(country)` and show
whether a rich guide exists; keep rendering the existing boilerplate when it
doesn't (never-blank).

**Files:**
- Modify: `kdc-next/src/app/country-detail/page.tsx`

**Step 1: Add state + fetch**

Inside `CountryDetailInner`, after the existing `snapCapital` effect, add:

```tsx
  const [detail, setDetail] = useState<CountryDetail | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadCountryDetail(country)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [country]);
```

and add the import:

```tsx
import { loadCountryDetail, type CountryDetail } from '../../data/countries';
```

**Step 2: Render the indicator next to the GUIDE badge**

Replace the `<span className="code-badge">GUIDE</span>` line with:

```tsx
        <span className="code-badge">{detail ? 'RICH GUIDE' : 'BASIC GUIDE'}</span>
```

(No layout change; the badge text now reflects data availability. Rich guide =
gold-accented via existing `.code-badge`.)

**Step 3: Build + verify in-browser**

Run: `npm run build`. Serve locally (prefix proxy on :8897) and open
`/KingDesignCollectiveinc/country-detail/?country=France` — expect `RICH GUIDE`;
`/country-detail/?country=Japan` — expect `BASIC GUIDE`.

**Step 4: Commit**

```bash
git add kdc-next/src/app/country-detail/page.tsx
git commit -m "feat(travel): rich-guide indicator on country-detail"
```

---

## Task B2: Render real content in the unlocked tabs

**Objective:** When rich data exists and the guide is unlocked, render the real
attractions / experiences / facts / phrases / history instead of boilerplate.

**Files:**
- Modify: `kdc-next/src/app/country-detail/page.tsx` (the `renderTab` function)

**Step 1: Thread `detail` into `renderTab`**

Change the signature and the two call sites:

```tsx
function renderTab(tab: string, country: string, capital: string, detail: CountryDetail | null) {
```

Call sites (both inside the unlocked branch and the free Overview):
`{renderTab(tab, country, capital, detail)}` and
`{renderTab('Overview', country, capital, detail)}`.

**Step 2: Rich branches (fall through to boilerplate when a field is absent)**

Replace the `Attractions`, `TikTok`, and add rich handling. Minimal, DRY version
— prepend real content when present, else keep boilerplate:

```tsx
    case 'Attractions':
      if (detail?.attractions?.length) {
        return (
          <ul className="guide-list">
            {detail.attractions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        );
      }
      return (
        <ul className="guide-list">
          <li><strong>Landmarks:</strong> Curated top sites in {country}</li>
          <li><strong>Nature:</strong> Parks and natural wonders</li>
          <li><strong>Culture:</strong> Museums, food, experiences</li>
        </ul>
      );
    case 'TikTok':
      if (detail?.top10?.length || detail?.funFacts?.length) {
        return (
          <div className="rich-block">
            {detail.top10?.length ? (
              <>
                <h4>Top experiences</h4>
                <ul className="guide-list">{detail.top10.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            ) : null}
            {detail.funFacts?.length ? (
              <>
                <h4>Fun facts</h4>
                <ul className="guide-list">{detail.funFacts.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </>
            ) : null}
          </div>
        );
      }
      return (
        <ul className="guide-list">
          <li><strong>Travel tips:</strong> What creators recommend</li>
          <li><strong>Food tour:</strong> Viral local eats</li>
        </ul>
      );
    case 'Entry':
      if (detail?.entry) {
        return <ul className="guide-list"><li><strong>Entry:</strong> {detail.entry}</li></ul>;
      }
      return (/* existing boilerplate */);
    case 'Climate':
      if (detail?.climate) {
        return <ul className="guide-list"><li><strong>Climate:</strong> {detail.climate}</li></ul>;
      }
      return (/* existing boilerplate */);
```

For `Overview`, when `detail?.history` exists, render it (it's markdown — render
as a paragraph, stripping leading `#`):

```tsx
    case 'Overview':
      return (
        <ul className="guide-list">
          <li><strong>Country:</strong> {country}</li>
          <li><strong>Capital:</strong> {capital}</li>
          <li><strong>Verified:</strong> Vagary Index — 250-country dataset</li>
          <li><strong>Status:</strong> {detail ? 'Rich guide' : 'Free preview'}</li>
          {detail?.history ? <li className="rich-history">{detail.history.replace(/^#+\s*/gm, '')}</li> : null}
        </ul>
      );
```

Note: Overview stays free (not behind the paywall); the rich tabs (Attractions/
TikTok/Entry/Climate) remain locked until purchase, same as today.

**Step 3: Add `.rich-block` / `.rich-history` CSS**

Append to `kdc-next/src/styles/globals.css`:

```css
.rich-block h4 { color: var(--gold); font-size: .8rem; text-transform: uppercase;
  letter-spacing: .6px; margin: 14px 0 6px; }
.rich-history { white-space: pre-wrap; line-height: 1.7; color: #d8dce5; }
```

**Step 4: Build + verify in-browser**

Run: `npm run build`. Open `/country-detail/?country=France`, unlock via "Buy
this guide", confirm Attractions shows the 10 real entries (Eiffel Tower, etc.)
and TikTok shows real experiences/facts. `/country-detail/?country=Japan` still
shows boilerplate.

**Step 5: Commit**

```bash
git add kdc-next/src/app/country-detail/page.tsx kdc-next/src/styles/globals.css
git commit -m "feat(travel): render real attractions/experiences/facts/history when rich data exists"
```

---

## Task B3: Surface phrase cards (nice, high-signal, cheap)

**Objective:** Phrase cards are a distinct, visual asset — show them as a grid
in the Currency tab (renamed mentally to "Phrases") when present.

**Files:**
- Modify: `kdc-next/src/app/country-detail/page.tsx`

**Step 1: Add a Phrases case**

In `renderTab`, before `default`, and add `'Phrases'` to `TABS`:

```tsx
const TABS = ['Overview', 'Entry', 'Climate', 'Currency', 'Attractions', 'Phrases', 'TikTok'];
```

```tsx
    case 'Phrases':
      if (detail?.phraseCards && Object.keys(detail.phraseCards).length) {
        return (
          <div className="phrase-grid">
            {Object.entries(detail.phraseCards).map(([en, loc]) => (
              <div key={en} className="phrase-card">
                <div className="phrase-en">{en.replace(/_/g, ' ')}</div>
                <div className="phrase-loc">{loc as string}</div>
              </div>
            ))}
          </div>
        );
      }
      return <ul className="guide-list"><li>Phrase cards coming soon for {country}.</li></ul>;
```

**Step 2: CSS**

```css
.phrase-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.phrase-card { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(212,175,55,0.2);
  background: rgba(255,255,255,0.03); }
.phrase-en { font-size: .72rem; text-transform: uppercase; letter-spacing: .5px; color: var(--muted); }
.phrase-loc { font-size: 1rem; color: #f0e6c8; font-weight: 600; margin-top: 2px; }
```

**Step 3: Build + verify, commit**

```bash
git add kdc-next/src/app/country-detail/page.tsx kdc-next/src/styles/globals.css
git commit -m "feat(travel): phrase-card grid on country-detail (19 translations when present)"
```

---

# PHASE C — Verification + deploy

## Task C1: Canonical suite

```bash
cd kdc-next
npm run build   # Compiled successfully
npm test        # expect: 7 files, 35 tests (31 + 4 new loadCountryDetail)
```

## Task C2: Ad-hoc runtime verification

Write `C:\Users\young\AppData\Local\Temp\hermes-verify-rich-guides.py` checking:

1. `public/data/rich-countries.json`: 37 items, each with 10 attractions
2. `out/data/rich-countries.json` exists (snapshot shipped in build)
3. `loadCountryDetail` returns rich for 'France', null for 'Japan'/'Atlantis'
   (node eval mirroring the loader, or re-run the vitest subset)
4. Built `country-detail` chunk contains `RICH GUIDE` and `loadCountryDetail`
5. No doubled basePath in built pages
6. Live routes 200 via **curl**: `/country-detail/?country=France`,
   `/data/rich-countries.json`

Run it, capture output, delete the script.

## Task C3: Push + confirm deploy

```bash
cd /c/Users/young/agents
git push origin main
gh run list --workflow=deploy-kdc-app.yml --limit 1
gh run watch <id> --exit-status
```

Re-verify live with curl (CDN retry loop).

---

# PHASE D — Offline PDF export (all 255 countries)

## Task D1: Print-to-PDF view + generator (zero-dependency)

**Objective:** A real, offline PDF export for every country — rich or base — with
no network call and no new dependency. Approach: a dedicated print stylesheet +
a hidden print container; the browser's native "Save as PDF" does the rendering.
This is the most robust offline option (no WASM/jsPDF bundle, works on all 255
identically).

**Files:**
- Create: `kdc-next/src/app/country-detail/print.css` (or add to globals under `@media print`)
- Modify: `kdc-next/src/app/country-detail/page.tsx` (add "Export PDF" button + print container)

**Step 1: Add a print stylesheet**

Create `kdc-next/src/app/country-detail/print.css`:

```css
@media print {
  .app-sidebar, .app-footer, .no-print, .tab-nav, .paywall .btn-gold, .paywall .btn-outline { display: none !important; }
  body { background: #fff !important; color: #000 !important; }
  .page-frame, .detail-header, .tab-pane, .guide-list, .rich-block, .phrase-grid { color: #000 !important; }
  .guide-list li, .rich-history { color: #111 !important; }
  a { color: #000 !important; text-decoration: none; }
  .pdf-header { border-bottom: 2px solid #d4af37; padding-bottom: 8px; margin-bottom: 12px; }
  .pdf-title { font-size: 22pt; font-weight: 700; }
  .pdf-sub { font-size: 10pt; color: #555; }
}
```

Import it at the top of `country-detail/page.tsx`:
`import './print.css';`

**Step 2: Add the Export button + print header**

In the component, add a handler and a print-only header. The button triggers
`window.print()`; the `@media print` CSS reveals a clean header and hides chrome:

```tsx
  // near the top of CountryDetailInner
  const exportPdf = () => window.print();
```

Add the button in the detail header area (wrapped in `no-print` so it doesn't
appear in the PDF):

```tsx
        <button className="no-print btn-outline" onClick={exportPdf} style={{ marginLeft: 12 }}>
          ⬇ Export PDF
        </button>
```

Add a print-only header at the top of the `PageFrame` children:

```tsx
      <div className="pdf-header">
        <div className="pdf-title">{country} — Vagary Guide</div>
        <div className="pdf-sub">Capital: {capital} · {detail ? 'Rich guide' : 'Basic guide'} · KingDesignCollectiveINC</div>
      </div>
```

**Step 3: Build + manual verify**

Run: `npm run build`. Open `/country-detail/?country=France`, click Export PDF,
choose "Save as PDF" — confirm the PDF has the title header, real content (if
unlocked), no sidebar/nav. Repeat for `/country-detail/?country=Japan` (base-only)
— confirm it still exports a clean one-page guide. **This works fully offline**
(no fetch on print; data already in component state).

**Step 4: Commit**

```bash
git add kdc-next/src/app/country-detail/print.css kdc-next/src/app/country-detail/page.tsx
git commit -m "feat(travel): offline PDF export via print stylesheet (all countries, zero-dep)"
```

---

## Task D2: Verify all 255 export offline (coverage test)

**Objective:** Prove every one of the 255 countries has the base data needed to
render a PDF with no network — i.e. the committed snapshot is complete.

**Files:**
- Test: `kdc-next/src/data/pdf-coverage.test.ts`

**Step 1: Write the coverage test**

```ts
import { describe, it, expect } from 'vitest';
import countries from '../../public/data/countries.json';

describe('offline PDF coverage — all 255 countries', () => {
  const items = (countries as any).items as Array<{ code: string; name: string; region: string; capital?: string | null }>;

  it('has 255 countries', () => {
    expect(items.length).toBe(255);
  });

  it('every country has a code and name (required to render a PDF)', () => {
    for (const c of items) {
      expect(c.code, `missing code for ${c.name}`).toBeTruthy();
      expect(c.name, `missing name for ${c.code}`).toBeTruthy();
    }
  });

  it('every country has a canonical region', () => {
    const ORDER = ['East Asia','Southeast Asia','South Asia','Central Asia','Middle East','Europe','Africa','North America','South America','Oceania','Unclassified'];
    for (const c of items) expect(ORDER).toContain(c.region);
  });

  it('codes are unique', () => {
    expect(new Set(items.map((c) => c.code)).size).toBe(255);
  });
});
```

Note: importing JSON requires `resolveJsonModule` (already on for the build via
Next's tsconfig). If Vitest can't import JSON directly, read it with
`fs.readFileSync` in the test instead:

```ts
import { readFileSync } from 'fs';
const countries = JSON.parse(readFileSync('public/data/countries.json', 'utf-8'));
```

**Step 2: Run to verify pass**

Run: `npx vitest run src/data/pdf-coverage.test.ts`
Expected: PASS (255, all with code+name+canonical region, unique codes).

**Step 3: Commit**

```bash
git add kdc-next/src/data/pdf-coverage.test.ts
git commit -m "test: offline PDF coverage — all 255 countries have renderable base data"
```

---

## Task D3: Wire "Export PDF" into the paywall promise + verify live

**Objective:** The paywall already advertises "PDF Export"; make the button
reflect reality and confirm the whole loop on the deployed site.

**Files:**
- Modify: `kdc-next/src/app/country-detail/page.tsx` (only if the export button
  should be gated — see open question below)

**Step 1: Decide gating**

Recommended: the **Export PDF button works for all 255** (base or rich) since the
requirement is "255 verified for offline use of pdf" — gating it would contradict
that. Keep it always available; rich *content* inside the PDF still respects the
paywall (a locked guide exports the free Overview only). Implement: render the
print container from the same `unlocked` gate the tabs use, so a locked country
prints Overview only, an unlocked rich country prints everything.

**Step 2: Build + ad-hoc verify (Phase C2) + push (Phase C3)**

Fold these checks into the Phase C2 ad-hoc script:
- `out/data/countries.json` present (255 rows) — the offline PDF floor is shipped
- `country-detail` chunk contains `Export PDF` / `window.print` / `pdf-header`
- Live `/country-detail/?country=France` and `?country=Japan` → 200

**Step 3: Commit**

```bash
git add kdc-next/src/app/country-detail/page.tsx
git commit -m "feat(travel): PDF export reflects paywall (locked=Overview, unlocked=full)"
```

---

## Tests / validation summary

- **Per task:** `npm run build` succeeds; new Vitest tests pass locally.
- **Manual (ground truth):** `/country-detail/?country=France` shows RICH GUIDE +
  real attractions/experiences/facts/phrases/history after unlock;
  `/country-detail/?country=Japan` shows BASIC GUIDE + boilerplate; offline
  (dead API) still shows rich content from the snapshot.
- **`npm test` stays a local guardrail**, not in CI (per user's standing call).

## Risks / tradeoffs

- **Only 37 of 255 countries have rich data** — the other 218 keep boilerplate.
  That's honest (the indicator says BASIC GUIDE) and the content is real where it
  exists. Expanding coverage is a data-ingestion task, not a UI task.
- **Live vs snapshot skew**: the live API and local files could diverge. The
  loader prefers live (fresher) and falls back to the committed snapshot; both
  verified to carry the same 9 fields for the 37.
- **`/raster/<CODE>/<BIO>` 404s** — the Climate tab's "heat rasters" line stays
  boilerplate; do not wire a raster call that 404s. Revisit only if the endpoint
  ships real data.
- **Snapshot staleness**: `rich-countries.json` won't reflect new API content
  until re-exported. Document the export command (Task A1) in `_legacy/README.md`
  or a scripts note. Acceptable for a static site.
- **Paywall interaction**: rich tabs stay locked until purchase (Overview +
  indicator are free). This is intentional — rich content is the product.

## Open questions

1. **Paywall on rich tabs** — keep locked (planned, matches current model) or
   make rich content free to drive engagement? Recommendation: keep locked.
2. **Phrases as a 7th tab** (planned) vs folding into Currency — minor; planned
   as its own tab since it's visually distinct.
3. **Climate tab** — the API `climate` field, when present, is richer than the
   boilerplate but its shape varies; planned to render it as a single line.
   Want a fuller climate layout, or is one line fine for now?
4. **PDF export gating** — planned: Export button works for **all 255** (the
   requirement), but a *locked* guide prints only the free Overview while an
   unlocked guide prints full rich content. Confirm that's the intent, or should
   PDF require purchase entirely?
5. **PDF mechanism** — planned: zero-dependency browser print-to-PDF (robust,
   offline, all 255 identical). Alternative: a jsPDF/WASM bundle for a true
   downloaded `.pdf` file without the print dialog — heavier, one more dep.
   Print-to-PDF is recommended unless you specifically need a direct download.

## Recommended order

**A1 → A2 → B1 → B2 → B3 → D1 → D2 → D3 → C1 → C2 → C3**, committing after
each task. Phase A (snapshot + loader) is independently useful and testable;
Phase B is pure UI on top of it; Phase D (PDF) is independent of A/B and can run
in parallel — it only needs the base `countries.json` (already all 255) plus the
`detail` state from B1. The user's hard requirement — **all 255 countries
verified for offline PDF** — is met by D1 (generator) + D2 (coverage test).
