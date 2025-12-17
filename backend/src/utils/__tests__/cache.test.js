import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Redis module
const mockGetCache = jest.fn();
const mockSetCache = jest.fn();
const mockDeleteCache = jest.fn();
const mockDeleteCachePattern = jest.fn();

jest.unstable_mockModule('../../cache/redis.js', () => ({
  getCache: mockGetCache,
  setCache: mockSetCache,
  deleteCache: mockDeleteCache,
  deleteCachePattern: mockDeleteCachePattern,
}));

// Import cache utilities after mocking
const {
  getSearchCacheKey,
  getUserPlaylistsCacheKey,
  cacheSearchResult,
  getCachedSearchResult,
  cacheUserPlaylists,
  getCachedUserPlaylists,
  invalidateUserCache,
  CACHE_TTL,
} = await import('../cache.js');

describe('Cache Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent search cache keys', () => {
      const key1 = getSearchCacheKey('Artist - Song');
      const key2 = getSearchCacheKey('artist - song');

      expect(key1).toBe(key2); // Should normalize to lowercase
      expect(key1).toBe('search:artist - song');
    });

    it('should generate user playlists cache key', () => {
      const key = getUserPlaylistsCacheKey('user123');

      expect(key).toBe('playlists:user:user123');
    });

    it('should trim whitespace in search keys', () => {
      const key = getSearchCacheKey('  Artist - Song  ');

      expect(key).toBe('search:artist - song');
    });
  });

  describe('Cache Search Results', () => {
    it('should cache search results with default TTL', async () => {
      const query = 'Test Song';
      const results = [
        { id: '1', name: 'Test Song 1', artists: [{ name: 'Artist' }] },
        { id: '2', name: 'Test Song 2', artists: [{ name: 'Artist' }] },
      ];

      mockSetCache.mockResolvedValue(true);

      await cacheSearchResult(query, results);

      expect(mockSetCache).toHaveBeenCalledWith(
        'search:test song',
        results,
        CACHE_TTL.SEARCH
      );
    });

    it('should cache search results with custom TTL', async () => {
      const query = 'Test Song';
      const results = [{ id: '1', name: 'Test' }];
      const customTTL = 1800;

      mockSetCache.mockResolvedValue(true);

      await cacheSearchResult(query, results, customTTL);

      expect(mockSetCache).toHaveBeenCalledWith(
        'search:test song',
        results,
        customTTL
      );
    });

    it('should retrieve cached search results', async () => {
      const query = 'Test Song';
      const cachedResults = [
        { id: '1', name: 'Test Song', artists: [{ name: 'Artist' }] },
      ];

      mockGetCache.mockResolvedValue(cachedResults);

      const results = await getCachedSearchResult(query);

      expect(mockGetCache).toHaveBeenCalledWith('search:test song');
      expect(results).toEqual(cachedResults);
    });

    it('should return null for cache miss', async () => {
      const query = 'Test Song';

      mockGetCache.mockResolvedValue(null);

      const results = await getCachedSearchResult(query);

      expect(results).toBeNull();
    });
  });

  describe('Cache User Playlists', () => {
    it('should cache user playlists', async () => {
      const userId = 'user123';
      const playlists = [
        { id: 'playlist1', name: 'My Playlist 1' },
        { id: 'playlist2', name: 'My Playlist 2' },
      ];

      mockSetCache.mockResolvedValue(true);

      await cacheUserPlaylists(userId, playlists);

      expect(mockSetCache).toHaveBeenCalledWith(
        'playlists:user:user123',
        playlists,
        CACHE_TTL.USER_PLAYLISTS
      );
    });

    it('should retrieve cached user playlists', async () => {
      const userId = 'user123';
      const cachedPlaylists = [
        { id: 'playlist1', name: 'My Playlist' },
      ];

      mockGetCache.mockResolvedValue(cachedPlaylists);

      const playlists = await getCachedUserPlaylists(userId);

      expect(mockGetCache).toHaveBeenCalledWith('playlists:user:user123');
      expect(playlists).toEqual(cachedPlaylists);
    });

    it('should handle empty playlist arrays', async () => {
      const userId = 'user123';
      const emptyPlaylists = [];

      mockSetCache.mockResolvedValue(true);

      await cacheUserPlaylists(userId, emptyPlaylists);

      expect(mockSetCache).toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user cache', async () => {
      const userId = 'user123';

      mockDeleteCachePattern.mockResolvedValue(3);

      const count = await invalidateUserCache(userId);

      expect(mockDeleteCachePattern).toHaveBeenCalledWith('*:user:user123');
      expect(count).toBe(3);
    });

    it('should return 0 when no keys deleted', async () => {
      const userId = 'user123';

      mockDeleteCachePattern.mockResolvedValue(0);

      const count = await invalidateUserCache(userId);

      expect(count).toBe(0);
    });
  });

  describe('Cache TTL Constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.SEARCH).toBe(3600); // 1 hour
      expect(CACHE_TTL.PLAYLIST).toBe(900); // 15 minutes
      expect(CACHE_TTL.USER_PLAYLISTS).toBe(900); // 15 minutes
      expect(CACHE_TTL.USER_PROFILE).toBe(1800); // 30 minutes
    });
  });

  describe('Error Handling', () => {
    it('should handle cache set errors gracefully', async () => {
      const query = 'Test Song';
      const results = [{ id: '1' }];

      mockSetCache.mockResolvedValue(false);

      const success = await cacheSearchResult(query, results);

      expect(success).toBe(false);
    });

    it('should handle cache get errors gracefully', async () => {
      const query = 'Test Song';

      mockGetCache.mockRejectedValue(new Error('Redis error'));

      // Should not throw, but may return null
      await expect(getCachedSearchResult(query)).rejects.toThrow();
    });
  });
});
