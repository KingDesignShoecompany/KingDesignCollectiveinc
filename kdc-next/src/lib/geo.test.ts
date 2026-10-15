import { describe, it, expect } from 'vitest';
import { projectPoint, ringPoints, continentLabelPoints, type LandFeature } from './geo';

describe('projectPoint', () => {
  it('maps 0,0 to canvas center', () => {
    const p = projectPoint(0, 0, 800, 400);
    expect(p.x).toBeCloseTo(400);
    expect(p.y).toBeCloseTo(200);
  });
  it('maps corners correctly (equirectangular)', () => {
    expect(projectPoint(-180, 90, 800, 400)).toEqual({ x: 0, y: 0 });
    expect(projectPoint(180, -90, 800, 400)).toEqual({ x: 800, y: 400 });
  });
});

describe('ringPoints', () => {
  const ring: [number, number][] = [
    [-10, 10], [10, 10], [10, -10], [-10, -10], [-10, 10],
  ];
  it('projects every ring vertex', () => {
    const pts = ringPoints(ring, 800, 400);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ x: (170 / 360) * 800, y: (80 / 180) * 400 });
  });
});

describe('continentLabelPoints', () => {
  const feats: LandFeature[] = [
    { name: 'Africa', ring: [[10, 35], [40, 35], [40, 0], [10, 0], [10, 35]] },
    { name: 'Australia', ring: [[110, -10], [155, -10], [155, -40], [110, -40], [110, -10]] },
  ];
  it('labels the largest feature per name once, centroid at ring bbox center', () => {
    const labels = continentLabelPoints(feats, 800, 400);
    expect(labels.map((l) => l.name).sort()).toEqual(['Africa', 'Australia']);
    const af = labels.find((l) => l.name === 'Africa')!;
    expect(af.x).toBeCloseTo(((25 + 180) / 360) * 800);
    expect(af.y).toBeCloseTo(((90 - 17.5) / 180) * 400);
  });
});
