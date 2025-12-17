/**
 * Cache Type Definitions
 */

export interface CacheTTL {
  SEARCH: number;
  PLAYLIST: number;
  USER_PLAYLISTS: number;
  USER_PROFILE: number;
}

export interface CacheStats {
  connected: boolean;
  keys?: number;
  memory?: {
    used: string;
    peak: string;
    fragmentation: string;
  };
  stats?: {
    totalConnectionsReceived: string;
    totalCommandsProcessed: string;
    instantaneousOpsPerSec: string;
    keyspaceHits: string;
    keyspaceMisses: string;
  };
}
