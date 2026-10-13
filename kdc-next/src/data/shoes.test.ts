import { describe, it, expect } from 'vitest';
import { PRODUCTS } from './shoes';

describe('shoe catalog integrity', () => {
  it('has 6 products with unique ids', () => {
    expect(PRODUCTS.length).toBe(6);
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every product has a positive price and stock', () => {
    for (const p of PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.stock).toBeGreaterThanOrEqual(0);
    }
  });
});
