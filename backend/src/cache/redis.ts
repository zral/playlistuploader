/**
 * Redis Cache Connection Module
 * Provides Redis client for caching Spotify API responses
 */

import Redis from 'ioredis';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const cacheEnabled = process.env.CACHE_ENABLED !== 'false';

let redis: Redis | null = null;

if (cacheEnabled) {
  redis = new Redis(redisUrl, {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect', () => {
    logger.info('Redis connection established', {
      url: redisUrl.replace(/\/\/[^@]*@/, '//***:***@'), // Hide credentials in logs
      cacheEnabled: true
    });
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('error', (err: Error) => {
    logger.logError(err, {
      context: 'Redis connection error',
      url: redisUrl.replace(/\/\/[^@]*@/, '//***:***@')
    });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });
} else {
  logger.info('Redis caching disabled (CACHE_ENABLED=false)');
}

/**
 * Get value from cache
 * @param key - Cache key
 * @returns Parsed value or null
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (!redis || !cacheEnabled) return null;

  try {
    const value = await redis.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value) as T;
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Cache get',
      key
    });
    return null; // Fail gracefully
  }
}

/**
 * Set value in cache with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON.stringified)
 * @param ttl - Time to live in seconds
 * @returns Success status
 */
export async function setCache(key: string, value: any, ttl: number = 3600): Promise<boolean> {
  if (!redis || !cacheEnabled) return false;

  try {
    const serialized = JSON.stringify(value);
    await redis.setex(key, ttl, serialized);
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Cache set',
      key,
      ttl
    });
    return false; // Fail gracefully
  }
}

/**
 * Delete value from cache
 * @param key - Cache key
 * @returns Success status
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redis || !cacheEnabled) return false;

  try {
    await redis.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Cache delete',
      key
    });
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param pattern - Key pattern (e.g., 'user:*')
 * @returns Number of keys deleted
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!redis || !cacheEnabled) return 0;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info('Cache pattern deleted', { pattern, count: keys.length });
      return keys.length;
    }
    return 0;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Cache pattern delete',
      pattern
    });
    return 0;
  }
}

/**
 * Get cache stats
 * @returns Cache statistics
 */
export async function getCacheStats(): Promise<{
  enabled: boolean;
  connected: boolean;
  status?: string;
  dbSize?: number;
  info?: {
    stats: string;
    memory: string;
  };
  error?: string;
}> {
  if (!redis || !cacheEnabled) {
    return {
      enabled: false,
      connected: false
    };
  }

  try {
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();
    const memory = await redis.info('memory');

    return {
      enabled: true,
      connected: redis.status === 'ready',
      status: redis.status,
      dbSize,
      info: {
        stats: info,
        memory: memory
      }
    };
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Get cache stats'
    });
    return {
      enabled: true,
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Flush all cache
 * WARNING: Deletes all cached data
 * @returns Success status
 */
export async function flushCache(): Promise<boolean> {
  if (!redis || !cacheEnabled) return false;

  try {
    await redis.flushdb();
    logger.warn('Cache flushed - all data cleared');
    return true;
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Cache flush'
    });
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'Redis close'
      });
    }
  }
}

export default redis;
