export const BASE_URL = (import.meta.env.VITE_API_URL || 'https://keto-hunter-backend-production.up.railway.app').replace(/\/$/, '');
export const SEARCH_URL = `${BASE_URL}/api/search-keto-restaurants`;

export const fetchWithTimeout = (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeout));
};
