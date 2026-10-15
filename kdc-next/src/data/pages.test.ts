import { describe, it, expect } from 'vitest';
import {
  TRAVEL_TIPS, LEADERBOARD, DAILY_CHALLENGE, KID_BADGES,
  EWASTE_STEPS, HEALTH_STATS, INNOVATION_PIPELINE,
  TRAVEL_IMPACT, SHOE_IMPACT, GAME_IMPACT, INNOVATION_ACTIVITY,
} from './pages';

describe('pages data', () => {
  it('travel tips: at least 4, each with title+detail', () => {
    expect(TRAVEL_TIPS.length).toBeGreaterThanOrEqual(4);
    for (const t of TRAVEL_TIPS) { expect(t.title).toBeTruthy(); expect(t.detail).toBeTruthy(); }
  });
  it('leaderboard: 5 rows, ranks 1-5, first place is NovaKnight', () => {
    expect(LEADERBOARD).toHaveLength(5);
    expect(LEADERBOARD.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(LEADERBOARD[0].name).toBe('NovaKnight');
  });
  it('daily challenge has title, detail, positive xp', () => {
    expect(DAILY_CHALLENGE.title).toBeTruthy();
    expect(DAILY_CHALLENGE.detail).toBeTruthy();
    expect(DAILY_CHALLENGE.xp).toBeGreaterThan(0);
  });
  it('kid badges: 3 with icon+name', () => {
    expect(KID_BADGES).toHaveLength(3);
    for (const b of KID_BADGES) { expect(b.icon).toBeTruthy(); expect(b.name).toBeTruthy(); }
  });
  it('ewaste steps: 3 named steps (Schedule, Pickup, Recycle)', () => {
    expect(EWASTE_STEPS).toHaveLength(3);
    expect(EWASTE_STEPS.map((s) => s.name)).toEqual(['Schedule', 'Pickup', 'Recycle']);
  });
  it('health stats: 4, pct within 0-100', () => {
    expect(HEALTH_STATS).toHaveLength(4);
    for (const h of HEALTH_STATS) { expect(h.pct).toBeGreaterThanOrEqual(0); expect(h.pct).toBeLessThanOrEqual(100); }
  });
  it('innovation pipeline: 4 stages, descending counts', () => {
    expect(INNOVATION_PIPELINE).toHaveLength(4);
    const counts = INNOVATION_PIPELINE.map((s) => s.count);
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
  });
  it('impact arrays: pct within 0-100, non-empty', () => {
    for (const arr of [TRAVEL_IMPACT, SHOE_IMPACT, GAME_IMPACT]) {
      expect(arr.length).toBeGreaterThan(0);
      for (const i of arr) { expect(i.pct).toBeGreaterThanOrEqual(0); expect(i.pct).toBeLessThanOrEqual(100); expect(i.label).toBeTruthy(); }
    }
  });
  it('innovation activity: 3 items', () => {
    expect(INNOVATION_ACTIVITY).toHaveLength(3);
    for (const a of INNOVATION_ACTIVITY) { expect(a.title).toBeTruthy(); expect(a.detail).toBeTruthy(); expect(a.time).toBeTruthy(); }
  });
});
