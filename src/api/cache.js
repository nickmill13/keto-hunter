const CACHE_PREFIX = 'keto-cache:';
export const CHAIN_MENU_TTL = 30 * 24 * 60 * 60 * 1000;  // 30 days
export const LOCAL_MENU_TTL = 7 * 24 * 60 * 60 * 1000;    // 7 days

export const getCachedData = (key) => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, timestamp, ttl } = JSON.parse(raw);
    if (Date.now() - timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch { return null; }
};

export const setCachedData = (key, data, ttl) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
  } catch { /* quota exceeded — silently skip */ }
};

export const clearMenuCache = () => {
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => localStorage.removeItem(k));
};
