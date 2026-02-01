export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  
  const token = localStorage.getItem('adminToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

type SessionCacheEntry<T> = {
  data: T;
};

const SESSION_CACHE_PREFIX = 'mail-relay:';

function buildSessionCacheKey(key: string): string {
  return `${SESSION_CACHE_PREFIX}${key}`;
}

export const pageCache = new Map<string, SessionCacheEntry<any>>();

export function readSessionCache<T>(key: string): T | null {
  try {
    const cacheKey = buildSessionCacheKey(key);
    const entry = pageCache.get(cacheKey);
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: string, data: T): void {
  try {
    const cacheKey = buildSessionCacheKey(key);
    const entry: SessionCacheEntry<T> = { data };
    pageCache.set(cacheKey, entry);
  } catch {
    // Ignore cache errors
  }
}

export function clearSessionCacheByPrefix(prefix: string): void {
  try {
    const fullPrefix = buildSessionCacheKey(prefix);
    const keysToDelete: string[] = [];
    for (const [key] of pageCache) {
      if (key.startsWith(fullPrefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => pageCache.delete(k));
  } catch {
    // Ignore cache errors
  }
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
