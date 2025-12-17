import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios before importing api
const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: mockGet,
        post: mockPost,
      })),
    },
  };
});

// Import after mock is set up
const { auth, playlists, search } = await import('./api.js');

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth.login', () => {
    test('should fetch login URL successfully', async () => {
      const mockResponse = {
        data: {
          authUrl: 'https://accounts.spotify.com/authorize?...',
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await auth.login();

      expect(result.authUrl).toContain('accounts.spotify.com');
      expect(mockGet).toHaveBeenCalledWith('/auth/login');
    });

    test('should handle error when fetching login URL', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(auth.login()).rejects.toThrow('Network error');
    });
  });

  describe('auth.getMe', () => {
    test('should fetch current user successfully', async () => {
      const mockUser = {
        data: {
          id: 'user123',
          displayName: 'Test User',
          email: 'test@example.com',
        },
      };

      mockGet.mockResolvedValue(mockUser);

      const user = await auth.getMe();

      expect(user.id).toBe('user123');
      expect(user.displayName).toBe('Test User');
      expect(mockGet).toHaveBeenCalledWith('/auth/me');
    });

    test('should handle error when fetching user', async () => {
      mockGet.mockRejectedValue(new Error('Unauthorized'));

      await expect(auth.getMe()).rejects.toThrow();
    });
  });

  describe('auth.logout', () => {
    test('should call logout endpoint', async () => {
      mockPost.mockResolvedValue({ data: { success: true } });

      const result = await auth.logout();

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    });

    test('should handle logout error', async () => {
      mockPost.mockRejectedValue(new Error('Logout failed'));

      await expect(auth.logout()).rejects.toThrow();
    });
  });

  describe('search.single', () => {
    test('should search for a single track', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'track1',
              name: 'Test Song',
              artists: ['Test Artist'],
            },
          ],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const results = await search.single('Test Song');

      expect(results.results).toBeInstanceOf(Array);
      expect(mockPost).toHaveBeenCalledWith('/api/search', {
        query: 'Test Song',
      });
    });

    test('should handle search error', async () => {
      mockPost.mockRejectedValue(new Error('Search failed'));

      await expect(search.single('Test')).rejects.toThrow();
    });
  });

  describe('search.batch', () => {
    test('should batch search multiple tracks', async () => {
      const mockResponse = {
        data: {
          results: [
            { query: 'Song 1', success: true },
            { query: 'Song 2', success: true },
          ],
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const queries = ['Song 1', 'Song 2'];
      const results = await search.batch(queries);

      expect(results.results).toBeInstanceOf(Array);
      expect(results.results.length).toBe(2);
      expect(mockPost).toHaveBeenCalledWith('/api/search/batch', {
        queries,
      });
    });

    test('should handle batch search error', async () => {
      mockPost.mockRejectedValue(new Error('Batch search failed'));

      await expect(search.batch(['Song 1'])).rejects.toThrow();
    });
  });

  describe('playlists.getAll', () => {
    test('should fetch all playlists', async () => {
      const mockResponse = {
        data: {
          playlists: [
            {
              id: 'playlist1',
              name: 'Christmas Songs',
              trackCount: 50,
            },
          ],
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await playlists.getAll();

      expect(result.playlists).toBeInstanceOf(Array);
      expect(mockGet).toHaveBeenCalledWith('/api/playlists');
    });

    test('should handle error fetching playlists', async () => {
      mockGet.mockRejectedValue(new Error('Failed to fetch playlists'));

      await expect(playlists.getAll()).rejects.toThrow();
    });
  });

  describe('playlists.create', () => {
    test('should create a new playlist', async () => {
      const mockResponse = {
        data: {
          playlist: {
            id: 'new_playlist',
            name: 'Test Playlist',
          },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await playlists.create('Test Playlist', 'Description', true);

      expect(result.playlist.id).toBe('new_playlist');
      expect(mockPost).toHaveBeenCalledWith('/api/playlists', {
        name: 'Test Playlist',
        description: 'Description',
        isPublic: true,
      });
    });

    test('should default to public playlist when isPublic not provided', async () => {
      const mockResponse = {
        data: {
          playlist: { id: 'new_playlist' },
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      await playlists.create('Test Playlist', 'Description');

      expect(mockPost).toHaveBeenCalledWith(
        '/api/playlists',
        expect.objectContaining({
          isPublic: true,
        })
      );
    });

    test('should handle create playlist error', async () => {
      mockPost.mockRejectedValue(new Error('Failed to create playlist'));

      await expect(playlists.create('Test')).rejects.toThrow();
    });
  });

  describe('playlists.addTracks', () => {
    test('should add tracks to playlist', async () => {
      const mockResponse = {
        data: {
          message: 'Tracks added successfully',
          count: 2,
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const trackUris = ['spotify:track:1', 'spotify:track:2'];
      const result = await playlists.addTracks('playlist123', trackUris);

      expect(result.message).toBe('Tracks added successfully');
      expect(result.count).toBe(2);
      expect(mockPost).toHaveBeenCalledWith('/api/playlists/playlist123/tracks', {
        trackUris,
      });
    });

    test('should handle add tracks error', async () => {
      mockPost.mockRejectedValue(new Error('Failed to add tracks'));

      await expect(
        playlists.addTracks('playlist123', ['spotify:track:1'])
      ).rejects.toThrow();
    });
  });

  describe('playlists.get', () => {
    test('should get playlist details', async () => {
      const mockResponse = {
        data: {
          playlist: {
            id: 'playlist123',
            name: 'Test Playlist',
            trackCount: 10,
          },
        },
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await playlists.get('playlist123');

      expect(result.playlist.id).toBe('playlist123');
      expect(mockGet).toHaveBeenCalledWith('/api/playlists/playlist123');
    });

    test('should handle get playlist error', async () => {
      mockGet.mockRejectedValue(new Error('Playlist not found'));

      await expect(playlists.get('invalid')).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      };

      mockGet.mockRejectedValue(error);

      await expect(auth.getMe()).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(playlists.getAll()).rejects.toThrow('Network Error');
    });

    test('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
      };

      mockPost.mockRejectedValue(error);

      await expect(search.single('test')).rejects.toThrow();
    });
  });
});
