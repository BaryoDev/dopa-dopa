export const LEGACY_KEY = 'dopa-dopa-highscore';
export const MIGRATED_KEY = 'dopadopa.migrated';

function readBest(legacy) {
  try {
    const best = Number(legacy.getItem(LEGACY_KEY));
    return Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  } catch {
    return 0;
  }
}

/* Returns the old best until markMigrated is called, which the caller does only once the best
   is in the new save. The old key is read, never written or removed. */
export async function migrateLegacy({ legacy, store }) {
  if ((await store.getItem(MIGRATED_KEY)) !== null) return 0;
  return readBest(legacy);
}

export async function markMigrated(store) {
  await store.setItem(MIGRATED_KEY, '1');
}
