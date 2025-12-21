import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Create mock axios before importing
const mockAxiosGet = jest.fn();
const mockAxiosPost = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: {
    get: mockAxiosGet,
    post: mockAxiosPost,
  },
}));

// Mock axios-retry
jest.unstable_mockModule('axios-retry', () => ({
  default: jest.fn(),
  exponentialDelay: jest.fn(),
  isNetworkOrIdempotentRequestError: jest.fn(),
}));

// Mock opossum (circuit breaker)
const mockCircuitBreaker = jest.fn();
const mockFallback = jest.fn();
const mockOn = jest.fn();
const mockFire = jest.fn();

mockCircuitBreaker.mockImplementation((fn, options) => {
  return {
    fire: mockFire.mockImplementation(fn),
    fallback: mockFallback.mockReturnThis(),
    on: mockOn.mockReturnThis(),
    opened: false,
    halfOpen: false,
    stats: {},
    name: options.name || 'breaker',
  };
});

jest.unstable_mockModule('opossum', () => ({
  default: mockCircuitBreaker,
}));

// Mock Redis cache module to prevent connection attempts during testing
jest.unstable_mockModule('../../cache/redis.js', () => ({
  getCache: jest.fn().mockResolvedValue(null), // Always return cache miss
  setCache: jest.fn().mockResolvedValue(true),
  deleteCache: jest.fn().mockResolvedValue(true),
  deleteCachePattern: jest.fn().mockResolvedValue(0),
  getCacheStats: jest.fn().mockResolvedValue({}),
}));

// Import after mocks are set up
const { default: axios } = await import('axios');
const spotifyService = await import('../spotifyService.js');

describe('spotifyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    test('should generate valid Spotify authorization URL', () => {
      const state = 'test-state-123';
      const url = spotifyService.getAuthorizationUrl(state);

      expect(url).toContain('https://accounts.spotify.com/authorize');
      expect(url).toContain('state=test-state-123');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
    });

    test('should include all required scopes', () => {
      const state = 'test-state';
      const url = spotifyService.getAuthorizationUrl(state);

      expect(url).toContain('scope=');
      expect(url).toContain('user-read-private');
      expect(url).toContain('user-read-email');
      expect(url).toContain('playlist-modify-public');
      expect(url).toContain('playlist-modify-private');
    });
  });

  describe('searchTrack', () => {
    test('should return tracks for valid query', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [
              {
                id: 'track1',
                name: 'All I Want for Christmas Is You',
                artists: [{ name: 'Mariah Carey', id: 'artist1' }],
                album: {
                  name: 'Merry Christmas',
                  images: [{ url: 'https://example.com/image.jpg' }],
                },
                popularity: 95,
                preview_url: 'https://example.com/preview.mp3',
              },
            ],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const tracks = await spotifyService.searchTrack(
        'valid_token',
        'All I Want for Christmas Is You'
      );

      expect(tracks).toBeInstanceOf(Array);
      expect(tracks.length).toBe(1);
      expect(tracks[0].name).toBe('All I Want for Christmas Is You');
      expect(tracks[0].artists[0].name).toBe('Mariah Carey');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/search'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
          },
        })
      );
    });

    test('should handle empty search results', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const tracks = await spotifyService.searchTrack('valid_token', 'nonexistent song');

      expect(tracks).toBeInstanceOf(Array);
      expect(tracks.length).toBe(0);
    });

    test('should throw error on invalid token', async () => {
      const error = new Error('Request failed with status code 401');
      error.response = {
        status: 401,
        data: { error: 'Invalid access token' },
      };

      mockAxiosGet.mockRejectedValue(error);

      await expect(
        spotifyService.searchTrack('invalid_token', 'test')
      ).rejects.toThrow();
    });

    test('should include market parameter for preview availability', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.searchTrack('valid_token', 'test song');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('market=from_token'),
        expect.any(Object)
      );
    });

    test('should include fields parameter to limit response size', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.searchTrack('valid_token', 'test song');

      const call = mockAxiosGet.mock.calls[0][0];
      expect(call).toContain('fields=');
      expect(call).toContain('tracks.items');
      expect(call).toContain('id');
      expect(call).toContain('uri');
      expect(call).toContain('name');
      expect(call).toContain('artists');
      expect(call).toContain('album');
    });
  });

  describe('getUserPlaylists', () => {
    test('should return user playlists', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 'playlist1',
              name: 'Christmas Songs',
              description: 'My favorite Christmas songs',
              public: true,
              tracks: { total: 50 },
              owner: { display_name: 'Test User', id: 'user1' },
              images: [{ url: 'https://example.com/playlist.jpg' }],
            },
          ],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const playlists = await spotifyService.getUserPlaylists('valid_token');

      expect(playlists).toBeInstanceOf(Array);
      expect(playlists.length).toBe(1);
      expect(playlists[0].name).toBe('Christmas Songs');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/me/playlists'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
          },
        })
      );
    });

    test('should use custom limit when provided', async () => {
      const mockResponse = {
        data: {
          items: [],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.getUserPlaylists('valid_token', 20);

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.any(Object)
      );
    });

    test('should include fields parameter to limit response size', async () => {
      const mockResponse = {
        data: {
          items: [],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.getUserPlaylists('valid_token', 50);

      const call = mockAxiosGet.mock.calls[0][0];
      expect(call).toContain('fields=');
      expect(call).toContain('items');
      expect(call).toContain('id');
      expect(call).toContain('name');
      expect(call).toContain('owner');
      expect(call).toContain('tracks.total');
    });
  });

  describe('createPlaylist', () => {
    test('should create a new playlist', async () => {
      const mockResponse = {
        data: {
          id: 'new_playlist_id',
          name: 'Test Playlist',
          description: 'Test description',
          public: true,
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      const playlist = await spotifyService.createPlaylist(
        'valid_token',
        'user123',
        'Test Playlist',
        'Test description',
        true
      );

      expect(playlist.id).toBe('new_playlist_id');
      expect(playlist.name).toBe('Test Playlist');
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/users/user123/playlists',
        {
          name: 'Test Playlist',
          description: 'Test description',
          public: true,
        },
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('should create private playlist when specified', async () => {
      const mockResponse = {
        data: {
          id: 'new_playlist_id',
          public: false,
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      await spotifyService.createPlaylist(
        'valid_token',
        'user123',
        'Private Playlist',
        '',
        false
      );

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          public: false,
        }),
        expect.any(Object)
      );
    });
  });

  describe('addTracksToPlaylist', () => {
    test('should add tracks to playlist', async () => {
      const mockResponse = {
        data: {
          snapshot_id: 'snapshot123',
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      const trackUris = [
        'spotify:track:1',
        'spotify:track:2',
        'spotify:track:3',
      ];

      const results = await spotifyService.addTracksToPlaylist(
        'valid_token',
        'playlist123',
        trackUris
      );

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/playlists/playlist123/tracks',
        {
          uris: trackUris,
        },
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
            'Content-Type': 'application/json',
          },
        })
      );
    });

    test('should chunk tracks into batches of 100', async () => {
      const mockResponse = {
        data: {
          snapshot_id: 'snapshot123',
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      // Create 150 track URIs
      const trackUris = Array.from({ length: 150 }, (_, i) => `spotify:track:${i}`);

      const results = await spotifyService.addTracksToPlaylist(
        'valid_token',
        'playlist123',
        trackUris
      );

      // Should be called twice (100 + 50)
      expect(mockAxiosPost).toHaveBeenCalledTimes(2);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);

      // First call should have 100 tracks
      expect(mockAxiosPost.mock.calls[0][1].uris.length).toBe(100);
      // Second call should have 50 tracks
      expect(mockAxiosPost.mock.calls[1][1].uris.length).toBe(50);
    });
  });

  describe('getAccessToken', () => {
    test('should exchange code for access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 3600,
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      const tokens = await spotifyService.getAccessToken('auth_code_123');

      expect(tokens.access_token).toBe('new_access_token');
      expect(tokens.refresh_token).toBe('new_refresh_token');
      expect(tokens.expires_in).toBe(3600);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.stringContaining('grant_type=authorization_code'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic '),
          },
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    test('should refresh access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'refreshed_access_token',
          expires_in: 3600,
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      const tokens = await spotifyService.refreshAccessToken('old_refresh_token');

      expect(tokens.access_token).toBe('refreshed_access_token');
      expect(mockAxiosPost).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.stringContaining('grant_type=refresh_token'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: expect.stringContaining('Basic '),
          },
        })
      );
    });
  });

  describe('getCurrentUser', () => {
    test('should get current user profile', async () => {
      const mockResponse = {
        data: {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          product: 'premium',
          images: [{ url: 'https://example.com/avatar.jpg' }],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const user = await spotifyService.getCurrentUser('valid_token');

      expect(user.id).toBe('user123');
      expect(user.display_name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/me'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
          },
        })
      );
    });

    test('should include fields parameter to limit response size', async () => {
      const mockResponse = {
        data: {
          id: 'user123',
          display_name: 'Test User',
          email: 'test@example.com',
          images: [],
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.getCurrentUser('valid_token');

      const call = mockAxiosGet.mock.calls[0][0];
      expect(call).toContain('fields=');
      expect(call).toContain('id');
      expect(call).toContain('display_name');
      expect(call).toContain('email');
      expect(call).toContain('images');
    });
  });

  describe('Timeout Configuration', () => {
    test('should include timeout in all API calls', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.searchTrack('valid_token', 'test');

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 5000, // DEFAULT_TIMEOUT is 5000ms
        })
      );
    });

    test('should include timeout in POST requests', async () => {
      const mockResponse = {
        data: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
        },
      };

      mockAxiosPost.mockResolvedValue(mockResponse);

      await spotifyService.getAccessToken('code123');

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });
  });

  describe('Circuit Breaker', () => {
    test('should use circuit breaker for searchTrack', async () => {
      const mockResponse = {
        data: {
          tracks: {
            items: [{ id: '1', name: 'Test Track' }],
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.searchTrack('valid_token', 'test');

      // Circuit breaker should be called
      expect(mockFire).toHaveBeenCalled();
    });

    test('should return circuit breaker stats', () => {
      const stats = spotifyService.getCircuitBreakerStats();

      expect(stats).toHaveProperty('name');
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('stats');
      expect(stats.state).toBe('closed'); // Initially closed
    });
  });

  describe('getPlaylist', () => {
    test('should get playlist details', async () => {
      const mockResponse = {
        data: {
          id: 'playlist123',
          name: 'Test Playlist',
          description: 'Test description',
          public: true,
          collaborative: false,
          owner: {
            id: 'user123',
            display_name: 'Test User',
          },
          tracks: {
            total: 10,
          },
          images: [],
          uri: 'spotify:playlist:123',
          external_urls: {
            spotify: 'https://open.spotify.com/playlist/123',
          },
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      const playlist = await spotifyService.getPlaylist('valid_token', 'playlist123');

      expect(playlist.id).toBe('playlist123');
      expect(playlist.name).toBe('Test Playlist');
      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/playlists/playlist123'),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer valid_token',
          },
        })
      );
    });

    test('should include fields parameter to limit response size', async () => {
      const mockResponse = {
        data: {
          id: 'playlist123',
          name: 'Test Playlist',
        },
      };

      mockAxiosGet.mockResolvedValue(mockResponse);

      await spotifyService.getPlaylist('valid_token', 'playlist123');

      const call = mockAxiosGet.mock.calls[0][0];
      expect(call).toContain('fields=');
      expect(call).toContain('id');
      expect(call).toContain('name');
      expect(call).toContain('description');
      expect(call).toContain('owner');
      expect(call).toContain('tracks.total');
      expect(call).toContain('images');
      expect(call).toContain('uri');
      expect(call).toContain('external_urls');
    });
  });

  describe('Error Handling with Retry Logic', () => {
    test('should handle timeout errors gracefully', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';

      mockAxiosGet.mockRejectedValue(timeoutError);

      await expect(
        spotifyService.searchTrack('valid_token', 'test')
      ).rejects.toThrow();
    });

    test('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' },
      };

      mockAxiosGet.mockRejectedValue(rateLimitError);

      await expect(
        spotifyService.searchTrack('valid_token', 'test')
      ).rejects.toThrow();
    });

    test('should handle server errors (5xx)', async () => {
      const serverError = new Error('Internal Server Error');
      serverError.response = {
        status: 500,
        data: { error: 'Internal Server Error' },
      };

      mockAxiosGet.mockRejectedValue(serverError);

      await expect(
        spotifyService.searchTrack('valid_token', 'test')
      ).rejects.toThrow();
    });
  });
});
