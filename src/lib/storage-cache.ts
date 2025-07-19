// Simple in-memory cache for storage calculations
// In production, this should be replaced with Redis or another persistent cache

interface StorageEntry {
  used: number;
  lastUpdated: number;
}

const storageCache = new Map<string, StorageEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedStorageUsage(userId: string): number | null {
  const entry = storageCache.get(userId);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.lastUpdated > CACHE_TTL) {
    storageCache.delete(userId);
    return null;
  }
  
  return entry.used;
}

export function setCachedStorageUsage(userId: string, used: number): void {
  storageCache.set(userId, {
    used,
    lastUpdated: Date.now(),
  });
}

export function updateCachedStorageUsage(userId: string, delta: number): void {
  const entry = storageCache.get(userId);
  if (entry) {
    entry.used += delta;
    entry.lastUpdated = Date.now();
  }
}

export function clearStorageCache(userId: string): void {
  storageCache.delete(userId);
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of storageCache.entries()) {
    if (now - entry.lastUpdated > CACHE_TTL) {
      storageCache.delete(userId);
    }
  }
}, CACHE_TTL);