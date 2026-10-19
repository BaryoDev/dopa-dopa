export function guardedLocalStorage() {
  const fallback = new Map();
  return {
    getItem(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return fallback.get(key) ?? null;
      }
    },
    setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        fallback.set(key, String(value));
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        fallback.delete(key);
      }
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
