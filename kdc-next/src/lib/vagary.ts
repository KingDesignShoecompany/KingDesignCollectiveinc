// Vagary API client — dual-mode. Every call returns null on failure; callers
// fall back to the committed snapshot. Never throws, never blank.

export const API_BASE =
  process.env.NEXT_PUBLIC_VAGARY_API || 'http://localhost:8080';

export type Country = {
  code: string;
  name: string;
  region: string;
  lat: number | null;
  lon: number | null;
  capital?: string | null;
};

export type Mode = 'live' | 'offline';

export type VisitState = Record<string, 'visited' | 'want'>;

async function get<T>(path: string, timeoutMs = 4000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_BASE}${path}`, {
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  health: () => get<{ status: string }>('/health', 2000),
  countries: () => get<{ items: any[] }>('/countries'),
  country: (code: string) => get<any>(`/countries/${code}`),
  visited: () => get<VisitState>('/visited'),
  pois: (code: string) => get<unknown>(`/pois/${code}`),
  raster: (code: string, bio: string) => get<unknown>(`/raster/${code}/${bio}`),
};
