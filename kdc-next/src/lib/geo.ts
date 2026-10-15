export type Point = { x: number; y: number };
export type Ring = [number, number][];
export type LandFeature = { name: string; ring: Ring };

/** Equirectangular projection matching WorldMap.tsx exactly. */
export function projectPoint(lon: number, lat: number, W: number, H: number): Point {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

export function ringPoints(ring: Ring, W: number, H: number): Point[] {
  return ring.map(([lon, lat]) => projectPoint(lon, lat, W, H));
}

/** One label per continent name, at the bbox center of its largest ring. */
export function continentLabelPoints(feats: LandFeature[], W: number, H: number) {
  const best = new Map<string, LandFeature>();
  for (const f of feats) {
    const prev = best.get(f.name);
    if (!prev || f.ring.length > prev.ring.length) best.set(f.name, f);
  }
  return [...best.values()].map((f) => {
    const lons = f.ring.map((p) => p[0]);
    const lats = f.ring.map((p) => p[1]);
    const lon = (Math.min(...lons) + Math.max(...lons)) / 2;
    const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    return { name: f.name, ...projectPoint(lon, lat, W, H) };
  });
}
