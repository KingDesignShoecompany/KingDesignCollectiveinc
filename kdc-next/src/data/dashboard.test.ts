import { describe, it, expect } from 'vitest';
import { KPIS, ACTIVITY, INSIGHTS, MODULES, searchModules } from './dashboard';

describe('dashboard data', () => {
  it('has 4 KPIs with value, label, delta', () => {
    expect(KPIS).toHaveLength(4);
    for (const k of KPIS) {
      expect(k.value).toBeTruthy();
      expect(k.label).toBeTruthy();
      expect(k.delta).toMatch(/^\+\d/);
    }
  });

  it('has activity and insights entries', () => {
    expect(ACTIVITY.length).toBeGreaterThanOrEqual(3);
    expect(INSIGHTS.length).toBeGreaterThanOrEqual(2);
    expect(INSIGHTS.every((i) => i.tag)).toBe(true);
  });

  it('has 8 subsidiary modules (dashboard itself excluded)', () => {
    expect(MODULES).toHaveLength(8);
    expect(MODULES.map((m) => m.title)).toEqual([
      'Vagary Index', 'KingDesignShoeCompany', 'KDCI Gaming',
      'Seven Minute Story Sessions', 'King Design Collective Briheight Box',
      'KingDesign E-Collective', 'Quantum Mode', 'Gooniversity',
    ]);
  });

  it('searchModules filters by title/tagline, case-insensitive', () => {
    expect(searchModules('shoe').map((m) => m.title)).toContain('KingDesignShoeCompany');
    expect(searchModules('gooner').map((m) => m.title)).toEqual(['Gooniversity']);
    expect(searchModules('').length).toBe(8);
    const mod = searchModules('KDCI');
    expect(mod.length).toBeGreaterThan(0);
    expect(mod[0].title).toBe('KDCI Gaming');
  });
});
