import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
// @ts-ignore - No types available for opossum
import CircuitBreaker from 'opossum';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';
import {
  getCachedSearchResult,
  cacheSearchResult,
  getCachedUserPlaylists,
  cacheUserPlaylists,
  getCachedUserProfile,
  cacheUserProfile,
  invalidateUserCache,
} from '../utils/cache.js';
import {
  SpotifyTrack,
  SpotifyUser,
  SpotifyPlaylist,
  SpotifyTokenResponse,
  CircuitBreakerStats,
} from '../types/spotify.js';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

// Configure axios with retry logic
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 || // Rate limit
      (error.response?.status !== undefined && error.response?.status >= 500 && error.response?.status < 600);
  },
  onRetry: (retryCount: number, error: AxiosError) => {
    logger.warn('API retry attempt', {
      retryCount,
      url: error.config?.url,
      status: error.response?.status
    });
  }
});

// Default timeout for all API calls (5 seconds)
const DEFAULT_TIMEOUT = 5000;

// Circuit breaker configuration
const circuitBreakerOptions: CircuitBreaker.Options = {
  timeout: 3000, // If function takes longer than 3s, trigger a timeout
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000, // 10 second rolling window for error calculation
  rollingCountBuckets: 10,
  name: 'spotifyApiBreaker'
};

/**
 * Generate Spotify authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.spotify.clientId,
    response_type: 'code',
    redirect_uri: config.spotify.redirectUri,
    state: state,
    scope: config.spotify.scopes.join(' '),
  });

  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(code: string): Promise<SpotifyTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: config.spotify.redirectUri,
  });

  const response = await axios.post<SpotifyTokenResponse>(
    `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${config.spotify.clientId}:${config.spotify.clientSecret}`
        ).toString('base64')}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await axios.post<SpotifyTokenResponse>(
    `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${config.spotify.clientId}:${config.spotify.clientSecret}`
        ).toString('base64')}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  return response.data;
}

/**
 * Get current user's profile (with caching)
 */
export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  // Try cache first (cache by access token hash to avoid storing full token)
  const tokenHash = Buffer.from(accessToken.substring(0, 20)).toString('base64');
  const cached = await getCachedUserProfile<SpotifyUser>(tokenHash);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const params = new URLSearchParams({
    // Only request fields actually used by the frontend
    fields: 'id,display_name,email,images',
  });

  const response = await axios.get<SpotifyUser>(
    `${SPOTIFY_API_BASE}/me?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  const profile = response.data;

  // Cache the profile
  await cacheUserProfile(profile.id, profile);

  return profile;
}

/**
 * Search for a track (internal implementation)
 */
async function _searchTrackImpl(accessToken: string, query: string): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: '5', // Return top 5 matches
    market: 'from_token', // Use the user's market for preview availability
    // Only request fields actually used by the frontend
    fields: 'tracks.items(id,uri,name,artists(name),album(name,images),preview_url,duration_ms)',
  });

  const response = await axios.get<{ tracks: { items: SpotifyTrack[] } }>(
    `${SPOTIFY_API_BASE}/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  // Note: Preview URLs are not available for Spotify apps in Development Mode
  // The preview_url field will be null for all tracks until the app is approved
  // for Extended Quota Mode

  return response.data.tracks.items;
}

// Create circuit breaker for search track function
const searchTrackBreaker = new CircuitBreaker<[string, string], SpotifyTrack[]>(
  _searchTrackImpl,
  circuitBreakerOptions
);

// Circuit breaker event handlers
searchTrackBreaker.fallback(() => {
  logger.logCircuitBreaker('fallback', { message: 'Returning empty results due to open circuit' });
  return [];
});

searchTrackBreaker.on('open', () => {
  logger.logCircuitBreaker('open', { message: 'Too many Spotify API failures - circuit opened' });
});

searchTrackBreaker.on('halfOpen', () => {
  logger.logCircuitBreaker('half-open', { message: 'Testing Spotify API - circuit half-open' });
});

searchTrackBreaker.on('close', () => {
  logger.logCircuitBreaker('closed', { message: 'Spotify API healthy - circuit closed' });
});

/**
 * Search for a track (with circuit breaker protection and caching)
 */
export async function searchTrack(accessToken: string, query: string): Promise<SpotifyTrack[]> {
  // Try cache first
  const cached = await getCachedSearchResult<SpotifyTrack[]>(query);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API (with circuit breaker)
  const results = await searchTrackBreaker.fire(accessToken, query);

  // Cache the results (only if we got valid results)
  if (results && results.length > 0) {
    await cacheSearchResult(query, results);
  }

  return results;
}

/**
 * Get user's playlists (with caching)
 */
export async function getUserPlaylists(accessToken: string, limit: number = 50): Promise<SpotifyPlaylist[]> {
  // Get user ID from token (we'll need to call getCurrentUser first or pass userId)
  // For now, create a cache key based on token hash and limit
  const tokenHash = Buffer.from(accessToken.substring(0, 20)).toString('base64');
  const cacheKey = `${tokenHash}:${limit}`;

  // Try cache first
  const cached = await getCachedUserPlaylists<SpotifyPlaylist[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from API
  const params = new URLSearchParams({
    limit: limit.toString(),
    // Only request fields actually used by the frontend
    fields: 'items(id,name,owner(id,display_name),tracks.total)',
  });

  const response = await axios.get<{ items: SpotifyPlaylist[] }>(
    `${SPOTIFY_API_BASE}/me/playlists?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  const playlists = response.data.items;

  // Cache the playlists
  await cacheUserPlaylists(cacheKey, playlists);

  return playlists;
}

/**
 * Create a new playlist (invalidates playlist cache)
 */
export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description: string = '',
  isPublic: boolean = true
): Promise<SpotifyPlaylist> {
  const response = await axios.post<SpotifyPlaylist>(
    `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
    {
      name,
      description,
      public: isPublic,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  // Invalidate user's playlist cache since they now have a new playlist
  const tokenHash = Buffer.from(accessToken.substring(0, 20)).toString('base64');
  await invalidateUserCache(tokenHash);

  logger.info('Playlist created, cache invalidated', {
    userId,
    playlistName: name
  });

  return response.data;
}

/**
 * Add tracks to a playlist
 */
export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[]
): Promise<Array<{ snapshot_id: string }>> {
  // Spotify allows max 100 tracks per request
  const chunks: string[][] = [];
  for (let i = 0; i < trackUris.length; i += 100) {
    chunks.push(trackUris.slice(i, i + 100));
  }

  const results: Array<{ snapshot_id: string }> = [];
  for (const chunk of chunks) {
    const response = await axios.post<{ snapshot_id: string }>(
      `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
      {
        uris: chunk,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: DEFAULT_TIMEOUT,
      }
    );
    results.push(response.data);
  }

  return results;
}

/**
 * Get playlist details
 */
export async function getPlaylist(accessToken: string, playlistId: string): Promise<SpotifyPlaylist> {
  const params = new URLSearchParams({
    // Only request fields actually used by the frontend and backend
    fields: 'id,name,description,public,collaborative,owner(id,display_name),tracks.total,images,uri,external_urls.spotify',
  });

  const response = await axios.get<SpotifyPlaylist>(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: DEFAULT_TIMEOUT,
    }
  );

  return response.data;
}

/**
 * Get circuit breaker statistics (for monitoring)
 */
export function getCircuitBreakerStats(): CircuitBreakerStats {
  return {
    name: searchTrackBreaker.name,
    state: searchTrackBreaker.opened ? 'open' : searchTrackBreaker.halfOpen ? 'half-open' : 'closed',
    stats: searchTrackBreaker.stats
  };
}
