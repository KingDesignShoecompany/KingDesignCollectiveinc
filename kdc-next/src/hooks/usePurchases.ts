'use client';

import { useState, useEffect, useCallback } from 'react';

// Demo commerce: one-time purchase per country + all-country bundle.
// localStorage-backed (no real payment gateway). Mirrors the static webapp.
const KEY = 'vagary_purchases';

type Purchases = { countries: Record<string, boolean>; bundle: boolean };

function load(): Purchases {
  if (typeof window === 'undefined') return { countries: {}, bundle: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { countries: {}, bundle: false };
}

function save(p: Purchases) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function usePurchases() {
  const [p, setP] = useState<Purchases>({ countries: {}, bundle: false });

  useEffect(() => { setP(load()); }, []);

  const isUnlocked = useCallback((country: string) => p.bundle || !!p.countries[country], [p]);

  const buyCountry = useCallback((country: string) => {
    setP((prev) => {
      const next = { ...prev, countries: { ...prev.countries, [country]: true } };
      save(next);
      return next;
    });
  }, []);

  const buyBundle = useCallback(() => {
    setP((prev) => {
      const next = { ...prev, bundle: true };
      save(next);
      return next;
    });
  }, []);

  return { isUnlocked, buyCountry, buyBundle, purchases: p };
}
