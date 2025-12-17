import axios, { AxiosResponse } from 'axios';
import type {
  AuthResponse,
  UserResponse,
  SpotifyPlaylist,
  BatchSearchResponse,
  SpotifyTrack,
  GeneratePlaylistRequest,
  GeneratePlaylistResponse,
  AIServiceStatus,
} from '../types/api';

const API_BASE = '';  // Uses Vite proxy

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const auth = {
  async login(): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.get('/auth/login');
    return response.data;
  },

  async getMe(): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await api.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};

interface PlaylistsResponse {
  playlists: SpotifyPlaylist[];
}

interface CreatePlaylistResponse {
  playlist: SpotifyPlaylist;
}

interface AddTracksResponse {
  snapshot_id: string;
}

interface GetPlaylistResponse {
  playlist: SpotifyPlaylist;
}

// Playlist API
export const playlists = {
  async getAll(): Promise<PlaylistsResponse> {
    const response: AxiosResponse<PlaylistsResponse> = await api.get('/api/playlists');
    return response.data;
  },

  async create(name: string, description?: string, isPublic: boolean = true): Promise<CreatePlaylistResponse> {
    const response: AxiosResponse<CreatePlaylistResponse> = await api.post('/api/playlists', {
      name,
      description,
      isPublic,
    });
    return response.data;
  },

  async addTracks(playlistId: string, trackUris: string[]): Promise<AddTracksResponse> {
    const response: AxiosResponse<AddTracksResponse> = await api.post(`/api/playlists/${playlistId}/tracks`, {
      trackUris,
    });
    return response.data;
  },

  async get(playlistId: string): Promise<GetPlaylistResponse> {
    const response: AxiosResponse<GetPlaylistResponse> = await api.get(`/api/playlists/${playlistId}`);
    return response.data;
  },
};

interface SingleSearchResponse {
  track: SpotifyTrack | null;
}

// Search API
export const search = {
  async single(query: string): Promise<SingleSearchResponse> {
    const response: AxiosResponse<SingleSearchResponse> = await api.post('/api/search', { query });
    return response.data;
  },

  async batch(queries: string[]): Promise<BatchSearchResponse> {
    const response: AxiosResponse<BatchSearchResponse> = await api.post('/api/search/batch', { queries });
    return response.data;
  },
};

// AI API
export const ai = {
  async generatePlaylist(request: GeneratePlaylistRequest): Promise<GeneratePlaylistResponse> {
    const response: AxiosResponse<GeneratePlaylistResponse> = await api.post('/api/ai/generate-playlist', request);
    return response.data;
  },

  async getStatus(): Promise<AIServiceStatus> {
    const response: AxiosResponse<AIServiceStatus> = await api.get('/api/ai/status');
    return response.data;
  },
};

export default {
  auth,
  playlists,
  search,
  ai,
};
