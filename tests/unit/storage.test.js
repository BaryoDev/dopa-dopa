import { describe, it, expect, afterEach } from 'vitest';
import { guardedLocalStorage } from '../../src/platform/storage.js';

function quotaFull(init = {}) {
  const data = new Map(Object.entries(init));
  return {
    full: true,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem(k, v) {
      if (this.full) throw new Error('QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem: (k) => data.delete(k),
  };
}

describe('guardedLocalStorage', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('reads back a value whose write failed while reads still work', () => {
    globalThis.window = { localStorage: quotaFull({ k: 'old' }) };
    const store = guardedLocalStorage();
    store.setItem('k', 'new');
    expect(store.getItem('k')).toBe('new');
  });

  it('a later successful write wins over the fallback', () => {
    const local = quotaFull();
    globalThis.window = { localStorage: local };
    const store = guardedLocalStorage();
    store.setItem('k', 'a');
    local.full = false;
    store.setItem('k', 'b');
    expect(local.getItem('k')).toBe('b');
    expect(store.getItem('k')).toBe('b');
  });

  it('removing a key clears the fallback too', () => {
    globalThis.window = { localStorage: quotaFull({ k: 'old' }) };
    const store = guardedLocalStorage();
    store.setItem('k', 'new');
    store.removeItem('k');
    expect(store.getItem('k')).toBe(null);
  });
});
