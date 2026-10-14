import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCart } from './useCart';

// Drive the hook through a tiny host component so we exercise real state updates.
let latest: ReturnType<typeof useCart>;

function Host() {
  latest = useCart();
  return null;
}

function render() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const root = createRoot(el);
  act(() => root.render(<Host />));
  return () => act(() => root.unmount());
}

beforeEach(() => localStorage.clear());

describe('useCart', () => {
  it('add merges same sku+size, keeps distinct sizes separate', () => {
    render();
    act(() => latest.add('KING-001', 9));
    act(() => latest.add('KING-001', 9));
    act(() => latest.add('KING-001', 10));
    expect(latest.items).toEqual([
      { sku: 'KING-001', size: 9, qty: 2 },
      { sku: 'KING-001', size: 10, qty: 1 },
    ]);
    expect(latest.count).toBe(3);
  });

  it('setQty sets an absolute quantity', () => {
    render();
    act(() => latest.add('KING-002', 8, 1));
    act(() => latest.setQty('KING-002', 8, 5));
    expect(latest.items).toEqual([{ sku: 'KING-002', size: 8, qty: 5 }]);
    expect(latest.count).toBe(5);
  });

  it('setQty with qty <= 0 removes the line', () => {
    render();
    act(() => latest.add('KING-002', 8));
    act(() => latest.setQty('KING-002', 8, 0));
    expect(latest.items).toEqual([]);
    expect(latest.count).toBe(0);
  });

  it('remove drops only the matching sku+size', () => {
    render();
    act(() => latest.add('KING-001', 9));
    act(() => latest.add('KING-001', 10));
    act(() => latest.remove('KING-001', 9));
    expect(latest.items).toEqual([{ sku: 'KING-001', size: 10, qty: 1 }]);
  });

  it('persists to localStorage and reloads', () => {
    render();
    act(() => latest.add('KING-003', 11, 2));
    expect(JSON.parse(localStorage.getItem('kdc_cart')!)).toEqual([
      { sku: 'KING-003', size: 11, qty: 2 },
    ]);
    render(); // fresh mount should hydrate from storage
    expect(latest.items).toEqual([{ sku: 'KING-003', size: 11, qty: 2 }]);
  });

  it('clear empties the cart', () => {
    render();
    act(() => latest.add('KING-001', 9));
    act(() => latest.clear());
    expect(latest.items).toEqual([]);
    expect(latest.count).toBe(0);
  });
});
