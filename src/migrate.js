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

/* Returns the old best once. The old key is read, never written or removed. */
export async function migrateLegacy({ legacy, store }) {
  if ((await store.getItem(MIGRATED_KEY)) !== null) return 0;
  const best = readBest(legacy);
  await store.setItem(MIGRATED_KEY, '1');
  return best;
}
