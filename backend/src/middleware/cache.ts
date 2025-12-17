/**
 * Cache Middleware
 * Provides response caching for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../cache/redis.js';
import logger from '../utils/logger.js';

/**
 * Generate cache key from request
 * @param req - Express request object
 * @returns Cache key
 */
function generateCacheKey(req: Request): string {
  const { path, method, body, query } = req;
  const userId = req.session?.user?.id || 'anonymous';

  // Create a unique key based on path, method, and relevant data
  const keyParts = [
    'api-cache',
    method,
    path,
    userId
  ];

  // Add query params if present
  if (Object.keys(query).length > 0) {
    keyParts.push(JSON.stringify(query));
  }

  // Add body for POST requests
  if (method === 'POST' && body) {
    // For search queries, use the query as part of the key
    if (body.query) {
      keyParts.push(body.query);
    } else if (body.queries) {
      // For batch searches, create a hash of the queries
      keyParts.push(JSON.stringify(body.queries).substring(0, 100));
    }
  }

  return keyParts.join(':');
}

/**
 * Type for the shouldCache function
 */
type ShouldCacheFunction = (req: Request, res: Response, data: any) => boolean;

/**
 * Cache middleware factory
 * @param ttl - Time to live in seconds (default: 1 hour)
 * @param shouldCache - Optional function to determine if response should be cached
 * @returns Express middleware
 */
export function cacheMiddleware(ttl: number = 3600, shouldCache: ShouldCacheFunction | null = null) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching for non-GET and non-POST requests
    if (!['GET', 'POST'].includes(req.method)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      // Try to get from cache
      const cached = await getCache(cacheKey);

      if (cached) {
        logger.info('API response served from cache', {
          path: req.path,
          method: req.method,
          cacheKey
        });

        // Set cache header
        res.setHeader('X-Cache', 'HIT');
        res.json(cached);
        return;
      }

      // Cache miss - set header
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data: any) {
        // Determine if we should cache this response
        const shouldCacheResponse = shouldCache ? shouldCache(req, res, data) : true;

        if (shouldCacheResponse && res.statusCode >= 200 && res.statusCode < 300) {
          // Cache successful responses only
          setCache(cacheKey, data, ttl).then((success) => {
            if (success) {
              logger.debug('API response cached', {
                path: req.path,
                method: req.method,
                cacheKey,
                ttl,
                dataSize: JSON.stringify(data).length
              });
            }
          }).catch((error) => {
            logger.logError(error instanceof Error ? error : new Error(String(error)), {
              context: 'Cache middleware - set cache',
              cacheKey
            });
          });
        }

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'Cache middleware',
        path: req.path,
        cacheKey
      });
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Conditional cache middleware that only caches successful search results
 * @param ttl - Time to live in seconds
 * @returns Express middleware
 */
export function cacheSearchMiddleware(ttl: number = 3600) {
  return cacheMiddleware(ttl, (_req: Request, _res: Response, data: any) => {
    // Only cache if we have results
    if (Array.isArray(data)) {
      return data.length > 0;
    }
    if (data && typeof data === 'object') {
      // Check if data has results array
      return data.results && Array.isArray(data.results) && data.results.length > 0;
    }
    return false;
  });
}

/**
 * Type for pattern function
 */
type PatternFunction = (req: Request, userId?: string) => string;

/**
 * Cache invalidation middleware
 * Invalidates cache for specific patterns when data is modified
 */
export function invalidateCacheMiddleware(pattern: string | PatternFunction) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously (fire and forget)
        (async () => {
          try {
            const { deleteCachePattern } = await import('../cache/redis.js');
            const userId = req.session?.user?.id;
            const patternToDelete = typeof pattern === 'function'
              ? pattern(req, userId)
              : pattern;

            await deleteCachePattern(patternToDelete);

            logger.info('Cache invalidated', {
              pattern: patternToDelete,
              path: req.path,
              userId
            });
          } catch (error) {
            logger.logError(error instanceof Error ? error : new Error(String(error)), {
              context: 'Cache invalidation middleware',
              pattern
            });
          }
        })();
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

export default cacheMiddleware;
