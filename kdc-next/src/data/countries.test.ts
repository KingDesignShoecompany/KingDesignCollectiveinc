import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadCountries, loadVisited, saveVisitedLocal } from './countries';

afterEach(() => {
  vi.unstubAllGlobals();
});

const API = 'http://localhost:8080';

// Build a fetch mock: rejects for the API base, resolves the snapshot for the
// snapshot path. Mirrors the real offline condition.
function offlineFetch(snapshot: any) {
  return vi.fn((url: string) => {
    if (String(url).startsWith(API)) return Promise.reject(new Error('down'));
    return Promise.resolve({ ok: true, json: async () => snapshot });
  });
}

const SNAP = {
  count: 2,
  coverage: { withCoords: 1, total: 2, pct: 50 },
  items: [
    { code: 'JPN', name: 'Japan', region: 'East Asia', lat: 35.67, lon: 139.77, capital: 'Tokyo' },
    { code: 'NULL', name: null, region: null, lat: null, lon: null }, // corrupt row
  ],
};

describe('loadCountries — never-blank fallbacks', () => {
  it('returns mode=offline and non-empty rows when the API rejects', async () => {
    vi.stubGlobal('fetch', offlineFetch(SNAP));
    const { rows, mode, coverage } = await loadCountries();
    expect(mode).toBe('offline');
    expect(rows.length).toBeGreaterThan(0);
    expect(coverage).toEqual({ withCoords: 1, total: 2, pct: 50 });
  });

  it('filters out null-code / null-name rows', async () => {
    vi.stubGlobal('fetch', offlineFetch(SNAP));
    const { rows } = await loadCountries();
    expect(rows.every((r) => r.code && r.name)).toBe(true);
    expect(rows.find((r) => r.code === 'NULL')).toBeUndefined();
  });

  it('returns mode=live and merges snapshot coords when the API resolves', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (String(url).startsWith(API)) {
        // live list has NO coords
        return Promise.resolve({
          ok: true,
          json: async () => ({ items: [{ code: 'JPN', name: 'Japan', region: 'East Asia' }] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => SNAP });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { rows, mode } = await loadCountries();
    expect(mode).toBe('live');
    const jp = rows.find((r) => r.code === 'JPN');
    expect(jp?.lat).toBe(35.67);
    expect(jp?.lon).toBe(139.77);
  });

  it('normalizes missing region to Unclassified', async () => {
    vi.stubGlobal(
      'fetch',
      offlineFetch({
        items: [{ code: 'X', name: 'Xland', region: null, lat: null, lon: null }],
      })
    );
    const { rows } = await loadCountries();
    expect(rows[0].region).toBe('Unclassified');
  });

  it('preserves the snapshot capital (richer than the hardcoded name map)', async () => {
    vi.stubGlobal(
      'fetch',
      offlineFetch({
        items: [
          { code: 'JPN', name: 'Japan', region: 'East Asia', lat: 35.67, lon: 139.77, capital: 'Tokyo' },
          { code: 'ALA', name: 'Aland', region: 'Europe', lat: 60.17, lon: 19.93, capital: 'Mariehamn' },
          { code: 'NOC', name: 'No Capital', region: 'Europe', lat: 1, lon: 1 },
        ],
      })
    );
    const { rows } = await loadCountries();
    const byName = new Map(rows.map((r) => [r.name, r]));
    expect(byName.get('Japan')?.capital).toBe('Tokyo');
    // 'Aland' is absent from the hardcoded CAPITALS map in travel.ts — the
    // snapshot's own capital is what makes the detail page show a real value.
    expect(byName.get('Aland')?.capital).toBe('Mariehamn');
    expect(byName.get('No Capital')?.capital).toBeNull();
  });

  it('normalizes the LIVE API branch regions to canonical names too', async () => {
    // The live API returns raw slugified labels; the loader must normalize them
    // so live and offline branches show the same taxonomy.
    const fetchMock = vi.fn((url: string) => {
      if (String(url).startsWith(API)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [
              { code: 'DEU', name: 'Germany', region: 'mena' },
              { code: 'JPN', name: 'Japan', region: 'East Asia' },
              { code: 'FJI', name: 'Fiji', region: 'oceania' },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ items: [] }) });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { rows, mode } = await loadCountries();
    expect(mode).toBe('live');
    const byName = new Map(rows.map((r) => [r.name, r]));
    expect(byName.get('Germany')?.region).toBe('Middle East');
    expect(byName.get('Japan')?.region).toBe('East Asia');
    expect(byName.get('Fiji')?.region).toBe('Oceania');
  });
});

describe('visit state — localStorage fallback', () => {
  it('loadVisited() falls back to localStorage when API rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('down')))
    );
    localStorage.setItem('kdc-visits', JSON.stringify({ JPN: 'visited' }));
    const v = await loadVisited();
    expect(v).toEqual({ JPN: 'visited' });
    localStorage.clear();
  });

  it('saveVisitedLocal() persists state', () => {
    saveVisitedLocal({ JPN: 'want' });
    expect(JSON.parse(localStorage.getItem('kdc-visits')!)).toEqual({ JPN: 'want' });
    localStorage.clear();
  });
});
