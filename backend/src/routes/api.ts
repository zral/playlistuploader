import express, { Request, Response, NextFunction } from 'express';
import {
  searchTrack,
  getUserPlaylists,
  createPlaylist,
  addTracksToPlaylist,
  getPlaylist,
  getCurrentUser,
  refreshAccessToken,
} from '../services/spotifyService.js';
import { sessionStore } from '../db/mongodb.js';
import logger from '../utils/logger.js';
import { SpotifyTrack } from '../types/spotify.js';

const router = express.Router();

// Extend Request type to include authenticated properties
interface AuthenticatedRequest extends Request {
  accessToken: string;
  userId: string;
}

/**
 * Middleware to verify authentication and refresh token if needed
 */
async function authenticateSpotify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.cookies.spotify_user_id;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const session = await sessionStore.get(userId);

    if (!session) {
      res.clearCookie('spotify_user_id');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    const buffer = 5 * 60 * 1000; // 5 minutes

    if (expiresAt.getTime() - now.getTime() < buffer) {
      // Token expired or about to expire, refresh it
      try {
        const tokens = await refreshAccessToken(session.refreshToken);
        await sessionStore.update(userId, tokens);
        (req as AuthenticatedRequest).accessToken = tokens.access_token;
      } catch (error) {
        logger.error('Token refresh failed', {
          userId,
          error: error instanceof Error ? error.message : String(error)
        });
        res.clearCookie('spotify_user_id');
        res.status(401).json({ error: 'Failed to refresh token' });
        return;
      }
    } else {
      (req as AuthenticatedRequest).accessToken = session.accessToken;
    }

    (req as AuthenticatedRequest).userId = userId;
    next();
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Authentication middleware',
      url: req.url
    });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Search for tracks
 * POST /api/search
 */
router.post('/search', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const tracks = await searchTrack(authReq.accessToken, query);

    // Format response with relevant track info
    const results = tracks.map((track) => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists.map((artist) => artist.name),
      album: track.album.name,
      albumImage: track.album.images[0]?.url,
      duration: track.duration_ms,
      popularity: (track as any).popularity,
      previewUrl: track.preview_url,
    }));

    res.json({ results });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Search track',
      query: req.body.query
    });
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * Batch search for multiple tracks
 * POST /api/search/batch
 */
router.post('/search/batch', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const { queries } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!queries || !Array.isArray(queries)) {
      res.status(400).json({ error: 'Queries array is required' });
      return;
    }

    if (queries.length > 100) {
      res.status(400).json({ error: 'Maximum 100 queries allowed' });
      return;
    }

    // Search for all tracks
    const searchPromises = queries.map(async (query: string) => {
      try {
        const tracks = await searchTrack(authReq.accessToken, query);

        // Filter alternatives: if same artist as best match, must have different song name
        const bestMatch = tracks[0];
        const filteredAlternatives = bestMatch
          ? tracks.slice(1).filter((track) => {
              const bestMatchArtists = bestMatch.artists.map(a => a.name.toLowerCase());
              const trackArtists = track.artists.map(a => a.name.toLowerCase());

              // Check if any artist matches
              const hasMatchingArtist = trackArtists.some(artist =>
                bestMatchArtists.includes(artist)
              );

              // If same artist, must have different song name
              if (hasMatchingArtist) {
                return track.name.toLowerCase() !== bestMatch.name.toLowerCase();
              }

              // Different artist, always allowed
              return true;
            }).slice(0, 2)
          : [];

        return {
          query,
          success: true,
          bestMatch: bestMatch
            ? {
                id: bestMatch.id,
                uri: bestMatch.uri,
                name: bestMatch.name,
                artists: bestMatch.artists.map((artist) => artist.name),
                album: bestMatch.album.name,
                albumImage: bestMatch.album.images[0]?.url,
                popularity: (bestMatch as any).popularity,
                confidence: calculateConfidence(query, bestMatch),
                previewUrl: bestMatch.preview_url,
              }
            : null,
          alternatives: filteredAlternatives.map((track) => ({
            id: track.id,
            uri: track.uri,
            name: track.name,
            artists: track.artists.map((artist) => artist.name),
            album: track.album.name,
            previewUrl: track.preview_url,
          })),
        };
      } catch (error) {
        return {
          query,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          bestMatch: null,
          alternatives: [],
        };
      }
    });

    const results = await Promise.all(searchPromises);

    res.json({ results });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Batch search',
      queryCount: req.body.queries?.length
    });
    res.status(500).json({ error: 'Batch search failed' });
  }
});

/**
 * Calculate match confidence score
 */
function calculateConfidence(query: string, track: SpotifyTrack): number {
  const queryLower = query.toLowerCase();
  const trackName = track.name.toLowerCase();
  const artistNames = track.artists.map((a) => a.name.toLowerCase()).join(' ');
  const combined = `${trackName} ${artistNames}`;

  // Simple scoring based on text matching
  let score = 0;

  // Exact match
  if (combined === queryLower) return 100;

  // Track name exact match
  if (trackName === queryLower) score += 50;

  // Contains all query words
  const queryWords = queryLower.split(/\s+/);
  const matchedWords = queryWords.filter((word) => combined.includes(word));
  score += (matchedWords.length / queryWords.length) * 30;

  // Popularity bonus (0-20 points based on Spotify popularity)
  const popularity = (track as any).popularity || 0;
  score += (popularity / 100) * 20;

  return Math.min(100, Math.round(score));
}

/**
 * Get user's playlists
 * GET /api/playlists
 */
router.get('/playlists', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;

    // Get current user to filter owned playlists
    const user = await getCurrentUser(authReq.accessToken);
    const playlists = await getUserPlaylists(authReq.accessToken);

    // Filter to only playlists owned by the current user
    // (Spotify only allows adding tracks to playlists you own)
    const ownedPlaylists = playlists.filter(
      (playlist) => playlist.owner.id === user.id
    );

    const results = ownedPlaylists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackCount: playlist.tracks.total,
      image: playlist.images?.[0]?.url || null,
      public: playlist.public,
      owner: playlist.owner.display_name,
    }));

    res.json({ playlists: results });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Get playlists'
    });
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

/**
 * Create a new playlist
 * POST /api/playlists
 */
router.post('/playlists', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, isPublic } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!name) {
      res.status(400).json({ error: 'Playlist name is required' });
      return;
    }

    // Get current user to create playlist
    const user = await getCurrentUser(authReq.accessToken);

    const playlist = await createPlaylist(
      authReq.accessToken,
      user.id,
      name,
      description || '',
      isPublic !== false
    );

    res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        url: playlist.external_urls.spotify,
      },
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Create playlist',
      name: req.body.name
    });
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

/**
 * Add tracks to a playlist
 * POST /api/playlists/:playlistId/tracks
 */
router.post('/playlists/:playlistId/tracks', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const { trackUris } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!trackUris || !Array.isArray(trackUris)) {
      res.status(400).json({ error: 'Track URIs array is required' });
      return;
    }

    if (trackUris.length === 0) {
      res.status(400).json({ error: 'At least one track URI is required' });
      return;
    }

    await addTracksToPlaylist(authReq.accessToken, playlistId!, trackUris);

    res.json({
      message: 'Tracks added successfully',
      count: trackUris.length,
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Add tracks to playlist',
      playlistId: req.params.playlistId,
      trackCount: req.body.trackUris?.length
    });
    res.status(500).json({ error: 'Failed to add tracks to playlist' });
  }
});

/**
 * Get playlist details
 * GET /api/playlists/:playlistId
 */
router.get('/playlists/:playlistId', authenticateSpotify, async (req: Request, res: Response): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const authReq = req as AuthenticatedRequest;

    const playlist = await getPlaylist(authReq.accessToken, playlistId!);

    res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.total,
        image: playlist.images[0]?.url,
        url: playlist.external_urls.spotify,
      },
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Get playlist',
      playlistId: req.params.playlistId
    });
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

export default router;
