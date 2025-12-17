import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Redis module
const mockGetCache = jest.fn();
const mockSetCache = jest.fn();
const mockDeleteCachePattern = jest.fn();

jest.unstable_mockModule('../../cache/redis.js', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  deleteCachePattern: mockDeleteCachePattern,
}));

// Import middleware after mocking
const {
  cacheMiddleware,
  cacheSearchMiddleware,
  invalidateCacheMiddleware,
} = await import('../cache.js');

describe('Cache Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    req = {
      method: 'GET',
      path: '/api/test',
      query: {},
      body: {},
      session: {
        user: { id: 'user123' },
      },
    };

    // Mock response
    res = {
      json: jest.fn(),
      setHeader: jest.fn(),
      statusCode: 200,
    };

    // Mock next
    next = jest.fn();
  });

  describe('cacheMiddleware', () => {
    it('should serve cached response on cache hit', async () => {
      const cachedData = { result: 'cached' };
      mockGetCache.mockResolvedValue(cachedData);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      expect(mockGetCache).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(next).not.toHaveBeenCalled();
    });

    it('should set X-Cache MISS and continue on cache miss', async () => {
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      expect(mockGetCache).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(next).toHaveBeenCalled();
    });

    it('should cache response after successful request', async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(true);

      const middleware = cacheMiddleware(3600);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();

      // Simulate the response being sent
      const responseData = { result: 'fresh' };
      await res.json(responseData);

      // Wait for async cache operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).toHaveBeenCalledWith(
        expect.any(String),
        responseData,
        3600
      );
    });

    it('should not cache unsuccessful responses', async () => {
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      res.statusCode = 404;
      await res.json({ error: 'Not found' });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).not.toHaveBeenCalled();
    });

    it('should skip caching for non-GET/POST requests', async () => {
      req.method = 'DELETE';

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      expect(mockGetCache).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should include query params in cache key', async () => {
      req.query = { page: '1', limit: '10' };
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      const cacheKey = mockGetCache.mock.calls[0][0];
      expect(cacheKey).toContain(JSON.stringify(req.query));
    });

    it('should include POST body query in cache key', async () => {
      req.method = 'POST';
      req.body = { query: 'test search' };
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      const cacheKey = mockGetCache.mock.calls[0][0];
      expect(cacheKey).toContain('test search');
    });

    it('should handle cache errors gracefully', async () => {
      mockGetCache.mockRejectedValue(new Error('Cache error'));

      const middleware = cacheMiddleware();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should use custom TTL when provided', async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(true);

      const customTTL = 1800;
      const middleware = cacheMiddleware(customTTL);
      await middleware(req, res, next);

      await res.json({ data: 'test' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        customTTL
      );
    });
  });

  describe('cacheSearchMiddleware', () => {
    it('should cache responses with results', async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(true);

      const middleware = cacheSearchMiddleware(3600);
      await middleware(req, res, next);

      const responseData = { results: [{ id: 1 }, { id: 2 }] };
      await res.json(responseData);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).toHaveBeenCalled();
    });

    it('should not cache responses without results', async () => {
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheSearchMiddleware(3600);
      await middleware(req, res, next);

      const responseData = { results: [] };
      await res.json(responseData);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).not.toHaveBeenCalled();
    });

    it('should cache array responses with items', async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(true);

      const middleware = cacheSearchMiddleware(3600);
      await middleware(req, res, next);

      const responseData = [{ id: 1 }, { id: 2 }];
      await res.json(responseData);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).toHaveBeenCalled();
    });

    it('should not cache empty array responses', async () => {
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheSearchMiddleware(3600);
      await middleware(req, res, next);

      const responseData = [];
      await res.json(responseData);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSetCache).not.toHaveBeenCalled();
    });
  });

  describe('invalidateCacheMiddleware', () => {
    it('should invalidate cache on successful response', async () => {
      mockDeleteCachePattern.mockResolvedValue(5);

      const middleware = invalidateCacheMiddleware('test:pattern:*');
      await middleware(req, res, next);

      res.statusCode = 200;
      await res.json({ success: true });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDeleteCachePattern).toHaveBeenCalledWith('test:pattern:*');
    });

    it('should not invalidate cache on error response', async () => {
      const middleware = invalidateCacheMiddleware('test:pattern:*');
      await middleware(req, res, next);

      res.statusCode = 500;
      await res.json({ error: 'Server error' });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDeleteCachePattern).not.toHaveBeenCalled();
    });

    it('should support pattern function', async () => {
      mockDeleteCachePattern.mockResolvedValue(3);

      const patternFn = (req, userId) => `user:${userId}:*`;
      const middleware = invalidateCacheMiddleware(patternFn);
      await middleware(req, res, next);

      res.statusCode = 201;
      await res.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDeleteCachePattern).toHaveBeenCalledWith('user:user123:*');
    });

    it('should handle invalidation errors gracefully', async () => {
      mockDeleteCachePattern.mockRejectedValue(new Error('Redis error'));

      const middleware = invalidateCacheMiddleware('test:*');
      await middleware(req, res, next);

      res.statusCode = 200;
      await res.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not throw, error is logged
      expect(mockDeleteCachePattern).toHaveBeenCalled();
    });

    it('should work without user session', async () => {
      req.session = null;
      mockDeleteCachePattern.mockResolvedValue(1);

      const patternFn = (req, userId) => userId ? `user:${userId}:*` : 'anonymous:*';
      const middleware = invalidateCacheMiddleware(patternFn);
      await middleware(req, res, next);

      res.statusCode = 200;
      await res.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockDeleteCachePattern).toHaveBeenCalledWith('anonymous:*');
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate unique keys for different users', async () => {
      mockGetCache.mockResolvedValue(null);

      // First user
      req.session.user.id = 'user1';
      const middleware1 = cacheMiddleware();
      await middleware1(req, res, next);
      const key1 = mockGetCache.mock.calls[0][0];

      jest.clearAllMocks();

      // Second user
      req.session.user.id = 'user2';
      const middleware2 = cacheMiddleware();
      await middleware2(req, res, next);
      const key2 = mockGetCache.mock.calls[0][0];

      expect(key1).not.toBe(key2);
    });

    it('should generate unique keys for different paths', async () => {
      mockGetCache.mockResolvedValue(null);

      req.path = '/api/test1';
      const middleware1 = cacheMiddleware();
      await middleware1(req, res, next);
      const key1 = mockGetCache.mock.calls[0][0];

      jest.clearAllMocks();

      req.path = '/api/test2';
      const middleware2 = cacheMiddleware();
      await middleware2(req, res, next);
      const key2 = mockGetCache.mock.calls[0][0];

      expect(key1).not.toBe(key2);
    });

    it('should generate same key for same request', async () => {
      mockGetCache.mockResolvedValue(null);

      const middleware = cacheMiddleware();
      await middleware(req, res, next);
      const key1 = mockGetCache.mock.calls[0][0];

      jest.clearAllMocks();

      await middleware(req, res, next);
      const key2 = mockGetCache.mock.calls[0][0];

      expect(key1).toBe(key2);
    });
  });
});
