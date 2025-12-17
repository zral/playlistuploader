/**
 * API Request/Response Type Definitions
 */

import { SpotifyTrack } from './spotify.js';

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  query: string;
  tracks: SpotifyTrack[];
  confidence?: number;
}

export interface BatchSearchRequest {
  queries: string[];
}

export interface BatchSearchResponse {
  results: SearchResponse[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  public?: boolean;
}

export interface AddTracksRequest {
  trackUris: string[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}
