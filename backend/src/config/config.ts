import { AppConfig } from '../types/config.js';

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/callback',
    scopes: [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
    ],
  },
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/spotify-uploader',
    dbName: 'spotify-uploader',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  backup: {
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
  },
  batchSearch: {
    concurrentLimit: parseInt(process.env.BATCH_SEARCH_CONCURRENT_LIMIT || '50', 10),
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'openrouter',
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama3-70b-8192',
    openaiApiKey: process.env.OPENAI_API_KEY,
    rateLimitPerUserDaily: parseInt(process.env.AI_RATE_LIMIT_PER_USER_DAILY || '5', 10),
    rateLimitPerIpHourly: parseInt(process.env.AI_RATE_LIMIT_PER_IP_HOURLY || '10', 10),
    maxSongsPerRequest: parseInt(process.env.AI_MAX_SONGS_PER_REQUEST || '50', 10),
    maxDurationMinutes: parseInt(process.env.AI_MAX_DURATION_MINUTES || '180', 10),
  },
};
