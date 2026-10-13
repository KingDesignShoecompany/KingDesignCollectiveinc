import { describe, it, expect } from 'vitest';
import { ALL_COUNTRIES, getCountryCode, REGIONS } from './travel';

describe('travel data integrity', () => {
  it('getCountryCode("Japan") === "JP"', () => {
    expect(getCountryCode('Japan')).toBe('JP');
  });

  it('getCountryCode returns "XX" for unknown countries', () => {
    expect(getCountryCode('Nowhereland')).toBe('XX');
  });

  it('ALL_COUNTRIES has no duplicate names', () => {
    const names = ALL_COUNTRIES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every country has a region present in REGIONS', () => {
    for (const c of ALL_COUNTRIES) {
      expect(REGIONS[c.region]).toBeDefined();
    }
  });
});
