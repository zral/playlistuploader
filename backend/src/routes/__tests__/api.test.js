import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Mock the dependencies before importing the router
const mockSearchTrack = jest.fn();
const mockGetUserPlaylists = jest.fn();
const mockCreatePlaylist = jest.fn();
const mockAddTracksToPlaylist = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockSessionStoreGet = jest.fn();

jest.unstable_mockModule('../../services/spotifyService.js', () => ({
  searchTrack: mockSearchTrack,
  getUserPlaylists: mockGetUserPlaylists,
  createPlaylist: mockCreatePlaylist,
  addTracksToPlaylist: mockAddTracksToPlaylist,
  getCurrentUser: mockGetCurrentUser,
  refreshAccessToken: jest.fn(),
  getPlaylist: jest.fn(),
}));

jest.unstable_mockModule('../../db/mongodb.js', () => ({
  sessionStore: {
    get: mockSessionStoreGet,
    set: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Mock Redis cache module to prevent connection attempts during testing
jest.unstable_mockModule('../../cache/redis.js', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(true),
  deleteCache: jest.fn().mockResolvedValue(true),
  deleteCachePattern: jest.fn().mockResolvedValue(0),
  getCacheStats: jest.fn().mockResolvedValue({}),
}));

// Import router after mocks are set up
const { default: apiRouter } = await import('../api.js');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', apiRouter);

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

describe('API Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();

    // Default session mock - authenticated user
    mockSessionStoreGet.mockResolvedValue({
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token',
      expiresAt: Date.now() + 3600000, // 1 hour from now
    });
  });

  describe('POST /api/search', () => {
    test('should search for a single track successfully', async () => {
      const mockTracks = [
        {
          id: 'track1',
          uri: 'spotify:track:1',
          name: 'All I Want for Christmas Is You',
          artists: [{ name: 'Mariah Carey' }],
          album: {
            name: 'Merry Christmas',
            images: [{ url: 'https://example.com/image.jpg' }],
          },
          popularity: 95,
          preview_url: 'https://example.com/preview.mp3',
        },
      ];

      mockSearchTrack.mockResolvedValue(mockTracks);

      const response = await request(app)
        .post('/api/search')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({ query: 'All I Want for Christmas Is You' })
        .expect(200);

      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(mockSearchTrack).toHaveBeenCalledWith(
        'mock_access_token',
        'All I Want for Christmas Is You'
      );
    });

    test('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/search')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Query is required');
    });

    test('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: 'test' })
        .expect(401);

      expect(response.body.error).toBe('Not authenticated');
    });
  });

  describe('POST /api/search/batch', () => {
    test('should batch search multiple tracks successfully', async () => {
      const mockTracks = [
        {
          id: 'track1',
          uri: 'spotify:track:1',
          name: 'Song 1',
          artists: [{ name: 'Artist 1' }],
          album: {
            name: 'Album 1',
            images: [{ url: 'https://example.com/image1.jpg' }],
          },
          popularity: 90,
          preview_url: null,
        },
      ];

      mockSearchTrack.mockResolvedValue(mockTracks);

      const response = await request(app)
        .post('/api/search/batch')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({
          queries: ['Song 1', 'Song 2', 'Song 3'],
        })
        .expect(200);

      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results.length).toBe(3);
      expect(mockSearchTrack).toHaveBeenCalledTimes(3);
    });

    test('should return 400 for missing queries array', async () => {
      const response = await request(app)
        .post('/api/search/batch')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({})
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('should return 400 for too many queries', async () => {
      const queries = Array.from({ length: 101 }, (_, i) => `Song ${i}`);

      const response = await request(app)
        .post('/api/search/batch')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({ queries })
        .expect(400);

      expect(response.body.error).toContain('Maximum 100');
    });

    test('should handle empty queries array', async () => {
      mockSearchTrack.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/search/batch')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({ queries: [] })
        .expect(200);

      expect(response.body.results).toBeInstanceOf(Array);
      expect(response.body.results.length).toBe(0);
    });

    test('should include confidence scores in results', async () => {
      const mockTracks = [
        {
          id: 'track1',
          uri: 'spotify:track:1',
          name: 'All I Want for Christmas Is You',
          artists: [{ name: 'Mariah Carey' }],
          album: {
            name: 'Merry Christmas',
            images: [{ url: 'https://example.com/image.jpg' }],
          },
          popularity: 95,
          preview_url: null,
        },
      ];

      mockSearchTrack.mockResolvedValue(mockTracks);

      const response = await request(app)
        .post('/api/search/batch')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({
          queries: ['Mariah Carey - All I Want for Christmas Is You'],
        })
        .expect(200);

      expect(response.body.results[0].bestMatch).toHaveProperty('confidence');
      expect(typeof response.body.results[0].bestMatch.confidence).toBe('number');
      expect(response.body.results[0].bestMatch.confidence).toBeGreaterThan(0);
    });
  });

  describe('GET /api/playlists', () => {
    test('should get user playlists successfully', async () => {
      const mockUser = {
        id: 'test_user_id',
        display_name: 'Test User',
      };

      const mockPlaylists = [
        {
          id: 'playlist1',
          name: 'Christmas Songs',
          description: 'My favorite Christmas songs',
          public: true,
          tracks: { total: 50 },
          owner: { display_name: 'Test User', id: 'test_user_id' },
          images: [{ url: 'https://example.com/playlist.jpg' }],
        },
        {
          id: 'playlist2',
          name: 'Followed Playlist',
          description: 'Someone elses playlist',
          public: true,
          tracks: { total: 30 },
          owner: { display_name: 'Other User', id: 'other_user_id' },
          images: [],
        },
      ];

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetUserPlaylists.mockResolvedValue(mockPlaylists);

      const response = await request(app)
        .get('/api/playlists')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .expect(200);

      expect(response.body.playlists).toBeInstanceOf(Array);
      // Should only return owned playlists (filtered out followed playlist)
      expect(response.body.playlists.length).toBe(1);
      expect(response.body.playlists[0].id).toBe('playlist1');
      expect(response.body.playlists[0]).toHaveProperty('trackCount');
      expect(response.body.playlists[0].trackCount).toBe(50);
    });

    test('should handle playlists without images', async () => {
      const mockUser = {
        id: 'test_user_id',
        display_name: 'Test User',
      };

      const mockPlaylists = [
        {
          id: 'playlist1',
          name: 'Test Playlist',
          description: 'Test',
          public: true,
          tracks: { total: 10 },
          owner: { display_name: 'Test User', id: 'test_user_id' },
          images: null,
        },
      ];

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockGetUserPlaylists.mockResolvedValue(mockPlaylists);

      const response = await request(app)
        .get('/api/playlists')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .expect(200);

      expect(response.body.playlists[0].image).toBeNull();
    });
  });

  describe('POST /api/playlists', () => {
    test('should create a new playlist successfully', async () => {
      const mockUser = {
        id: 'test_user_id',
        display_name: 'Test User',
      };

      const mockPlaylist = {
        id: 'new_playlist_id',
        name: 'Test Playlist',
        description: 'Test description',
        public: true,
        external_urls: {
          spotify: 'https://open.spotify.com/playlist/new_playlist_id',
        },
      };

      mockGetCurrentUser.mockResolvedValue(mockUser);
      mockCreatePlaylist.mockResolvedValue(mockPlaylist);

      const response = await request(app)
        .post('/api/playlists')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({
          name: 'Test Playlist',
          description: 'Test description',
          isPublic: true,
        })
        .expect(200);

      expect(response.body.playlist.id).toBe('new_playlist_id');
      expect(response.body.playlist.name).toBe('Test Playlist');
      expect(response.body.playlist.url).toBe('https://open.spotify.com/playlist/new_playlist_id');
      expect(mockCreatePlaylist).toHaveBeenCalledWith(
        'mock_access_token',
        'test_user_id',
        'Test Playlist',
        'Test description',
        true
      );
    });

    test('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/playlists')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({
          description: 'Test description',
        })
        .expect(400);

      expect(response.body.error).toContain('name');
    });
  });

  describe('POST /api/playlists/:playlistId/tracks', () => {
    test('should add tracks to playlist successfully', async () => {
      const mockResponse = [
        {
          snapshot_id: 'snapshot123',
        },
      ];

      mockAddTracksToPlaylist.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/playlists/playlist123/tracks')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({
          trackUris: [
            'spotify:track:1',
            'spotify:track:2',
            'spotify:track:3',
          ],
        })
        .expect(200);

      expect(response.body.message).toBe('Tracks added successfully');
      expect(response.body.count).toBe(3);
      expect(mockAddTracksToPlaylist).toHaveBeenCalledWith(
        'mock_access_token',
        'playlist123',
        ['spotify:track:1', 'spotify:track:2', 'spotify:track:3']
      );
    });

    test('should return 400 for missing trackUris', async () => {
      const response = await request(app)
        .post('/api/playlists/playlist123/tracks')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Track URIs array is required');
    });

    test('should return 400 for empty trackUris array', async () => {
      const response = await request(app)
        .post('/api/playlists/playlist123/tracks')
        .set('Cookie', ['spotify_user_id=test_user_id'])
        .send({ trackUris: [] })
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    test('should reject requests without cookie', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({ query: 'test' })
        .expect(401);

      expect(response.body.error).toBe('Not authenticated');
    });

    test('should reject requests with invalid session', async () => {
      mockSessionStoreGet.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/search')
        .set('Cookie', ['spotify_user_id=invalid_user'])
        .send({ query: 'test' })
        .expect(401);

      expect(response.body.error).toBe('Session expired');
    });
  });
});
