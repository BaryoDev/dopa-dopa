import { describe, it, expect } from 'vitest';
import { migrateLegacy, LEGACY_KEY, MIGRATED_KEY } from '../../src/migrate.js';

function syncStore(init = {}) {
  const data = new Map(Object.entries(init));
  const reads = [];
  return {
    data,
    reads,
    getItem(k) {
      reads.push(k);
      return data.has(k) ? data.get(k) : null;
    },
    setItem(k, v) {
      data.set(k, String(v));
    },
    removeItem(k) {
      data.delete(k);
    },
  };
}

function asyncOf(sync) {
  return {
    getItem: async (k) => sync.getItem(k),
    setItem: async (k, v) => sync.setItem(k, v),
    removeItem: async (k) => sync.removeItem(k),
  };
}

describe('migrateLegacy', () => {
  it('uses the old and new keys', () => {
    expect(LEGACY_KEY).toBe('dopa-dopa-highscore');
    expect(MIGRATED_KEY).toBe('dopadopa.migrated');
  });

  it('carries the old best over once and leaves it in place', async () => {
    const legacy = syncStore({ [LEGACY_KEY]: '37' });
    const backing = syncStore();
    const store = asyncOf(backing);
    expect(await migrateLegacy({ legacy, store })).toBe(37);
    expect(backing.data.get(MIGRATED_KEY)).toBe('1');
    expect(legacy.data.get(LEGACY_KEY)).toBe('37');

    legacy.reads.length = 0;
    expect(await migrateLegacy({ legacy, store })).toBe(0);
    expect(legacy.reads).toEqual([]);
  });

  for (const [label, init] of [
    ['non-numeric', { [LEGACY_KEY]: 'abc' }],
    ['negative', { [LEGACY_KEY]: '-5' }],
    ['missing', {}],
  ]) {
    it(`a ${label} old best gives 0`, async () => {
      const backing = syncStore();
      expect(await migrateLegacy({ legacy: syncStore(init), store: asyncOf(backing) })).toBe(0);
      expect(backing.data.get(MIGRATED_KEY)).toBe('1');
    });
  }

  it('a legacy read that throws gives 0 and still sets the flag', async () => {
    const legacy = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {},
      removeItem() {},
    };
    const backing = syncStore();
    expect(await migrateLegacy({ legacy, store: asyncOf(backing) })).toBe(0);
    expect(backing.data.get(MIGRATED_KEY)).toBe('1');
  });
});
