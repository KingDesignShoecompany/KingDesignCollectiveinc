'use client';

import { useState, useEffect, useCallback } from 'react';

// Demo cart — localStorage-backed (no real payment gateway). Mirrors the
// static webapp's checkout.html?sku= flow.
const KEY = 'kdc_cart';

export type CartItem = { sku: string; size: number; qty: number };

function load(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function save(items: CartItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => { setItems(load()); }, []);

  const add = useCallback((sku: string, size: number, qty = 1) => {
    setItems((prev) => {
      const next = [...prev];
      const found = next.find((i) => i.sku === sku && i.size === size);
      if (found) found.qty += qty;
      else next.push({ sku, size, qty });
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => { setItems([]); save([]); }, []);

  const count = items.reduce((n, i) => n + i.qty, 0);

  return { items, add, clear, count };
}
