// Simple in-memory cache for storage calculations
// In production, this should be replaced with Redis or another persistent cache

interface StorageEntry {
  used: number;
  lastUpdated: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

const storageCache = new Map<string, StorageEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 10000; // Prevent memory leaks
const stats: CacheStats = { hits: 0, misses: 0, evictions: 0 };

export function getCachedStorageUsage(userId: string): number | null {
  const entry = storageCache.get(userId);
  if (!entry) {
    stats.misses++;
    return null;
  }
  
  const now = Date.now();
  if (now - entry.lastUpdated > CACHE_TTL) {
    storageCache.delete(userId);
    stats.evictions++;
    return null;
  }
  
  stats.hits++;
  return entry.used;
}

export function setCachedStorageUsage(userId: string, used: number): void {
  // Evict oldest entries if cache is getting too large
  if (storageCache.size >= MAX_CACHE_SIZE) {
    const oldest = [...storageCache.entries()]
      .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated)
      .slice(0, Math.floor(MAX_CACHE_SIZE * 0.1)); // Remove 10%
    
    for (const [key] of oldest) {
      storageCache.delete(key);
      stats.evictions++;
    }
  }

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

export function clearStorageCache(userId?: string): void {
  if (userId) {
    storageCache.delete(userId);
  } else {
    storageCache.clear();
    stats.hits = 0;
    stats.misses = 0;
    stats.evictions = 0;
  }
}

export function getCacheStats(): CacheStats & { size: number } {
  return {
    ...stats,
    size: storageCache.size,
  };
}

// Clean up expired entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [userId, entry] of storageCache.entries()) {
    if (now - entry.lastUpdated > CACHE_TTL) {
      storageCache.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    stats.evictions += cleaned;
  }
}, CACHE_TTL);

// Prevent memory leaks on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    clearInterval(cleanupInterval);
  });
}