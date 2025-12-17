/**
 * Configuration Type Definitions
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  corsOrigin: string;
  sessionSecret: string;
  spotify: SpotifyConfig;
  mongodb: MongoDBConfig;
  redis: RedisConfig;
  backup: BackupConfig;
  logging: LoggingConfig;
  cache: CacheConfig;
  ai: AIConfig;
}

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface MongoDBConfig {
  uri: string;
  dbName: string;
}

export interface RedisConfig {
  url: string;
}

export interface BackupConfig {
  retentionDays: number;
}

export interface LoggingConfig {
  level: string;
}

export interface CacheConfig {
  enabled: boolean;
}

export interface AIConfig {
  provider: string;
  fallbackProvider?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  openaiApiKey?: string;
  rateLimitPerUserDaily: number;
  rateLimitPerIpHourly: number;
  maxSongsPerRequest: number;
  maxDurationMinutes: number;
}
