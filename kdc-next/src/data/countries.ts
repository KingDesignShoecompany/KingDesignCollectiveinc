// Dual-mode country loader — the single entry point for country data.
// Tries the live Vagary API first, falls back to the committed snapshot.
// Always returns rows and the mode; never throws.

import { api, type Country, type Mode, type VisitState } from '../lib/vagary';
export type { Country, Mode, VisitState };

type Snapshot = {
  count: number;
  coverage?: { withCoords: number; total: number; pct: number };
  items: Country[];
};

// The committed snapshot is the always-works floor (basePath-prefixed).
async function snapshot(): Promise<Snapshot> {
  const res = await fetch('/KingDesignCollectiveinc/data/countries.json');
  const data = (await res.json()) as Snapshot;
  data.items = (data.items || []).filter((c) => c && c.code && c.name);
  return data;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalize(raw: any): Country {
  return {
    code: raw.code,
    name: raw.name,
    region: String(raw.region || 'Unclassified').trim() || 'Unclassified',
    lat: num(raw.lat),
    lon: num(raw.lon),
    capital: raw.capital ?? null,
  };
}

export async function loadCountries(): Promise<{
  rows: Country[];
  mode: Mode;
  coverage: Snapshot['coverage'];
}> {
  const live = await api.countries();
  if (live?.items?.length) {
    // Live list has no coords; enrich from the snapshot by code so the map plots.
    const snap = await snapshot();
    const coords = new Map(snap.items.map((c) => [c.code, c]));
    const rows = live.items
      .filter((i: any) => i && i.code && i.name)
      .map((i: any) => {
        const c = coords.get(i.code);
        return {
          ...normalize(i),
          lat: c?.lat ?? null,
          lon: c?.lon ?? null,
          capital: c?.capital ?? null,
        };
      });
    return { rows, mode: 'live', coverage: snap.coverage };
  }
  const snap = await snapshot();
  return {
    rows: snap.items.map(normalize),
    mode: 'offline',
    coverage: snap.coverage,
  };
}

// Visit state: live API first, localStorage fallback. Silent degradation —
// the mode pill on the caller already tells the user whether data is live.
export async function loadVisited(): Promise<VisitState> {
  const live = await api.visited();
  if (live && Object.keys(live).length) return live;
  try {
    const raw = localStorage.getItem('kdc-visits');
    if (raw) return JSON.parse(raw) as VisitState;
  } catch {
    /* ignore */
  }
  return {};
}

export function saveVisitedLocal(state: VisitState): void {
  try {
    localStorage.setItem('kdc-visits', JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
