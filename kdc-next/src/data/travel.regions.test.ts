import { describe, it, expect } from 'vitest';
import { normalizeRegion, REGION_ORDER } from './travel';

describe('normalizeRegion', () => {
  it('maps WorldBank labels to canonical names', () => {
    expect(normalizeRegion('Europe & Central Asia')).toBe('Europe');
    expect(normalizeRegion('Latin America & Caribbean')).toBe('South America');
    expect(normalizeRegion('Sub-Saharan Africa')).toBe('Africa');
    expect(normalizeRegion('East Asia & Pacific')).toBe('East Asia');
  });

  it('maps slugified internal labels to the same canonical names', () => {
    expect(normalizeRegion('mena')).toBe('Middle East');
    expect(normalizeRegion('MENA')).toBe('Middle East');
    expect(normalizeRegion('ssa')).toBe('Africa');
    expect(normalizeRegion('north_america')).toBe('North America');
    expect(normalizeRegion('sea2')).toBe('Southeast Asia');
    expect(normalizeRegion('east_asia')).toBe('East Asia');
    expect(normalizeRegion('east_asia_block2')).toBe('East Asia');
    expect(normalizeRegion('south_asia_1')).toBe('South Asia');
    expect(normalizeRegion('americas')).toBe('South America');
    expect(normalizeRegion('africa')).toBe('Africa');
  });

  it('is idempotent on already-canonical values', () => {
    for (const r of REGION_ORDER) expect(normalizeRegion(r)).toBe(r);
  });

  it('falls back to Unclassified for empty/unknown input', () => {
    expect(normalizeRegion('')).toBe('Unclassified');
    expect(normalizeRegion(null as any)).toBe('Unclassified');
    expect(normalizeRegion('some_unknown_bucket')).toBe('Unclassified');
  });

  it('REGION_ORDER has no duplicates', () => {
    expect(new Set(REGION_ORDER).size).toBe(REGION_ORDER.length);
  });
});
