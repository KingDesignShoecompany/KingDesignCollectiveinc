import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from './vagary';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client — never throws, returns null on failure', () => {
  it('api.health() returns null when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down')))
    );
    const r = await api.health();
    expect(r).toBeNull();
  });

  it('api.countries() returns null on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) }))
    );
    const r = await api.countries();
    expect(r).toBeNull();
  });

  it('api.countries() returns parsed data on ok response', async () => {
    const items = [{ code: 'JPN', name: 'Japan', region: 'East Asia' }];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ items }) }))
    );
    const r = await api.countries();
    expect(r).toEqual({ items });
  });
});
