/* A write that fails (a full quota on the shared playground origin) lands in the fallback, and
   reads check the fallback first so the caller gets back what it just wrote. */
export function guardedLocalStorage() {
  const fallback = new Map();
  return {
    getItem(key) {
      if (fallback.has(key)) return fallback.get(key);
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
        fallback.delete(key);
      } catch {
        fallback.set(key, String(value));
      }
    },
    removeItem(key) {
      fallback.delete(key);
      try {
        window.localStorage.removeItem(key);
      } catch {}
    },
  };
}

export function asyncStore(sync) {
  return {
    getItem: async (key) => sync.getItem(key),
    setItem: async (key, value) => sync.setItem(key, value),
    removeItem: async (key) => sync.removeItem(key),
  };
}
