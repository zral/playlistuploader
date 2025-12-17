/**
 * Cache Utility Functions
 * High-level caching helpers for Spotify API responses
 */

import { getCache, setCache, deleteCache, deleteCachePattern } from '../cache/redis.js';
import logger from './logger.js';
import { CacheTTL } from '../types/cache.js';

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL: CacheTTL = {
  SEARCH: 3600,        // 1 hour for search results
  PLAYLIST: 900,       // 15 minutes for playlists
  USER_PLAYLISTS: 900, // 15 minutes for user playlist lists
  USER_PROFILE: 1800,  // 30 minutes for user profiles
};

/**
 * Generate cache key for search results
 * @param query - Search query
 * @returns Cache key
 */
export function getSearchCacheKey(query: string): string {
  const normalized = query.toLowerCase().trim();
  return `search:${normalized}`;
}

/**
 * Generate cache key for user playlists
 * @param userId - User ID
 * @returns Cache key
 */
export function getUserPlaylistsCacheKey(userId: string): string {
  return `playlists:user:${userId}`;
}

/**
 * Generate cache key for specific playlist
 * @param playlistId - Playlist ID
 * @returns Cache key
 */
export function getPlaylistCacheKey(playlistId: string): string {
  return `playlist:${playlistId}`;
}

/**
 * Generate cache key for user profile
 * @param userId - User ID
 * @returns Cache key
 */
export function getUserProfileCacheKey(userId: string): string {
  return `profile:${userId}`;
}

/**
 * Cache search result
 * @param query - Search query
 * @param result - Search result to cache
 * @param ttl - Optional TTL override
 * @returns Success status
 */
export async function cacheSearchResult(query: string, result: any, ttl: number = CACHE_TTL.SEARCH): Promise<boolean> {
  const key = getSearchCacheKey(query);
  const success = await setCache(key, result, ttl);

  if (success) {
    logger.debug('Search result cached', {
      query,
      key,
      ttl,
      resultCount: Array.isArray(result) ? result.length : 1
    });
  }

  return success;
}

/**
 * Get cached search result
 * @param query - Search query
 * @returns Cached result or null
 */
export async function getCachedSearchResult<T = any>(query: string): Promise<T | null> {
  const key = getSearchCacheKey(query);
  const result = await getCache<T>(key);

  if (result) {
    logger.info('Serving search from cache', {
      query,
      resultCount: Array.isArray(result) ? result.length : 1
    });
  }

  return result;
}

/**
 * Cache user playlists
 * @param userId - User ID
 * @param playlists - Playlists to cache
 * @param ttl - Optional TTL override
 * @returns Success status
 */
export async function cacheUserPlaylists(userId: string, playlists: any, ttl: number = CACHE_TTL.USER_PLAYLISTS): Promise<boolean> {
  const key = getUserPlaylistsCacheKey(userId);
  const success = await setCache(key, playlists, ttl);

  if (success) {
    logger.debug('User playlists cached', {
      userId,
      key,
      ttl,
      playlistCount: Array.isArray(playlists) ? playlists.length : 0
    });
  }

  return success;
}

/**
 * Get cached user playlists
 * @param userId - User ID
 * @returns Cached playlists or null
 */
export async function getCachedUserPlaylists<T = any>(userId: string): Promise<T | null> {
  const key = getUserPlaylistsCacheKey(userId);
  const result = await getCache<T>(key);

  if (result) {
    logger.info('Serving user playlists from cache', {
      userId,
      playlistCount: Array.isArray(result) ? result.length : 0
    });
  }

  return result;
}

/**
 * Invalidate user-specific cache (on playlist creation, etc.)
 * @param userId - User ID
 * @returns Number of keys deleted
 */
export async function invalidateUserCache(userId: string): Promise<number> {
  const count = await deleteCachePattern(`*:user:${userId}`);

  logger.info('User cache invalidated', {
    userId,
    keysDeleted: count
  });

  return count;
}

/**
 * Invalidate specific playlist cache
 * @param playlistId - Playlist ID
 * @returns Success status
 */
export async function invalidatePlaylistCache(playlistId: string): Promise<boolean> {
  const key = getPlaylistCacheKey(playlistId);
  const success = await deleteCache(key);

  if (success) {
    logger.debug('Playlist cache invalidated', { playlistId });
  }

  return success;
}

/**
 * Cache user profile
 * @param userId - User ID
 * @param profile - User profile to cache
 * @param ttl - Optional TTL override
 * @returns Success status
 */
export async function cacheUserProfile(userId: string, profile: any, ttl: number = CACHE_TTL.USER_PROFILE): Promise<boolean> {
  const key = getUserProfileCacheKey(userId);
  const success = await setCache(key, profile, ttl);

  if (success) {
    logger.debug('User profile cached', { userId, key, ttl });
  }

  return success;
}

/**
 * Get cached user profile
 * @param userId - User ID
 * @returns Cached profile or null
 */
export async function getCachedUserProfile<T = any>(userId: string): Promise<T | null> {
  const key = getUserProfileCacheKey(userId);
  const result = await getCache<T>(key);

  if (result) {
    logger.info('Serving user profile from cache', { userId });
  }

  return result;
}

/**
 * Batch cache search results
 * @param searches - Array of search query/result pairs
 * @param ttl - Optional TTL override
 * @returns Number of successfully cached items
 */
export async function batchCacheSearchResults(
  searches: Array<{ query: string; result: any }>,
  ttl: number = CACHE_TTL.SEARCH
): Promise<number> {
  let successCount = 0;

  for (const { query, result } of searches) {
    const success = await cacheSearchResult(query, result, ttl);
    if (success) successCount++;
  }

  logger.info('Batch search results cached', {
    total: searches.length,
    successful: successCount
  });

  return successCount;
}

/**
 * Get cache statistics for monitoring
 * @returns Cache usage statistics
 */
export async function getCacheUsageStats(): Promise<{
  enabled: boolean;
  connected?: boolean;
  error?: string;
  status?: string;
  dbSize?: number;
  info?: {
    stats: string;
    memory: string;
  };
}> {
  try {
    const { getCacheStats } = await import('../cache/redis.js');
    return await getCacheStats();
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Get cache usage stats'
    });
    return {
      enabled: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
