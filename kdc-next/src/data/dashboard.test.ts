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

  it('has 7 subsidiary modules (dashboard itself excluded)', () => {
    expect(MODULES).toHaveLength(7);
    expect(MODULES.map((m) => m.title)).toEqual([
      'Vagary Index', 'KingDesignShoeCompany', 'Aura Champions',
      'Seven Minute Story Sessions', 'King Design Collective Briheight Box',
      'KingDesign E-Collective', 'Quantum Mode',
    ]);
  });

  it('searchModules filters by title/tagline, case-insensitive', () => {
    expect(searchModules('aura').map((m) => m.title)).toEqual(['Aura Champions']);
    expect(searchModules('shoes').length).toBe(0); // title is KingDesignShoeCompany
    expect(searchModules('SHOE').map((m) => m.title)).toContain('KingDesignShoeCompany');
    expect(searchModules('').length).toBe(7);
  });
});
