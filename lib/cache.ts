/**
 * Caching Utilities
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  CONFESSIONS_FEED: 5 * 60 * 1000, // 5 minutes
  LEADERBOARD: 5 * 60 * 1000, // 5 minutes
  PROFILE: 2 * 60 * 1000, // 2 minutes
  STATS: 5 * 60 * 1000, // 5 minutes
  CONFESSION_DETAIL: 1 * 60 * 1000, // 1 minute
};

// In-memory cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data if valid
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cache data
 */
export function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate cache entries matching pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

/**
 * Generate cache key for confessions feed
 */
export function getConfessionsFeedCacheKey(
  category?: string,
  page?: number
): string {
  return `confessions:${category || "all"}:${page || 0}`;
}

/**
 * Generate cache key for leaderboard
 */
export function getLeaderboardCacheKey(): string {
  return "leaderboard";
}

/**
 * Generate cache key for profile
 */
export function getProfileCacheKey(address: string): string {
  return `profile:${address.toLowerCase()}`;
}

/**
 * Generate cache key for confession detail
 */
export function getConfessionCacheKey(id: string): string {
  return `confession:${id}`;
}

/**
 * API response cache headers
 */
export function getCacheHeaders(ttlSeconds: number): Record<string, string> {
  return {
    "Cache-Control": `public, s-maxage=${ttlSeconds}, stale-while-revalidate=${Math.floor(ttlSeconds / 2)}`,
  };
}

/**
 * React Query default options
 */
export const queryDefaults = {
  staleTime: CACHE_TTL.CONFESSIONS_FEED,
  gcTime: CACHE_TTL.CONFESSIONS_FEED * 2,
  refetchOnWindowFocus: false,
  retry: 1,
};
