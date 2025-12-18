/**
 * Frontend API Type Definitions
 */

export interface SpotifyTrack {
  id: string;
  uri: string;
  name: string;
  artists: Array<{
    name: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images: Array<{
    url: string;
  }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  tracks: {
    total: number;
  };
  images: Array<{
    url: string;
  }>;
  owner: {
    display_name: string;
  };
}

export interface SearchResult {
  query: string;
  tracks: SpotifyTrack[];
  confidence?: number;
  selected: boolean;
  selectedTrack?: SpotifyTrack;
}

export interface BatchSearchResponse {
  results: SearchResult[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  public?: boolean;
}

export interface AddTracksRequest {
  trackUris: string[];
}

export interface AuthResponse {
  authUrl: string;
}

export interface UserResponse {
  user: SpotifyUser;
}

export interface GeneratePlaylistRequest {
  description: string;
  songCount?: number;
  durationMinutes?: number;
}

export interface GeneratePlaylistResponse {
  success: boolean;
  playlistName: string;
  playlist: string;
  metadata: {
    songCount: number;
    generationTime: number;
  };
}

export interface AIServiceStatus {
  provider: string;
  configured: boolean;
  fallbackProvider?: string;
  fallbackConfigured?: boolean;
}
