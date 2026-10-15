import { describe, it, expect } from 'vitest';
import { sparkPoints, ringDash } from './charts';

describe('sparkPoints', () => {
  it('maps values to svg coords, normalized to box', () => {
    const pts = sparkPoints([0, 5, 10], 100, 40);
    expect(pts).toHaveLength(3);
    expect(pts[0]).toEqual({ x: 0, y: 40 });
    expect(pts[1]).toEqual({ x: 50, y: 20 });
    expect(pts[2]).toEqual({ x: 100, y: 0 });
  });
  it('flat series sits at bottom', () => {
    const pts = sparkPoints([3, 3, 3], 60, 30);
    expect(pts.every((p) => p.y === 30)).toBe(true);
  });
});

describe('ringDash', () => {
  it('converts pct to stroke-dasharray for r=20 circle', () => {
    const { dash, gap } = ringDash(50);
    const circ = 2 * Math.PI * 20;
    expect(dash).toBeCloseTo(circ * 0.5);
    expect(gap).toBeCloseTo(circ);
  });
  it('clamps pct to 0-100', () => {
    expect(ringDash(150).dash).toBeCloseTo(ringDash(100).dash);
    expect(ringDash(-20).dash).toBe(0);
  });
});
