/**
 * Rate Limiting Middleware for AI API
 * Prevents abuse and controls costs
 */

import rateLimit from 'express-rate-limit';
import MongoStore from 'rate-limit-mongo';
import type { Request, Response } from 'express';
import logger from '../utils/logger.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/spotify-uploader';

// Per-user daily limit
export const userDailyLimit = rateLimit({
  store: new MongoStore({
    uri: mongoUri,
    collectionName: 'ai_rate_limits_user',
    expireTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.AI_RATE_LIMIT_PER_USER_DAILY || '5'),
  keyGenerator: (req: Request) => {
    // Use user ID from authentication middleware
    return (req as any).userId || req.ip || 'anonymous';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('AI rate limit exceeded - daily user limit', {
      userId: (req as any).userId,
      ip: req.ip
    });
    res.status(429).json({
      error: 'Daily AI generation limit reached. Please try again tomorrow.',
      retryAfter: '24 hours'
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Per-IP hourly limit (prevents abuse)
export const ipHourlyLimit = rateLimit({
  store: new MongoStore({
    uri: mongoUri,
    collectionName: 'ai_rate_limits_ip',
    expireTimeMs: 60 * 60 * 1000 // 1 hour
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_PER_IP_HOURLY || '10'),
  keyGenerator: (req: Request) => req.ip || 'unknown',
  handler: (req: Request, res: Response) => {
    logger.warn('AI rate limit exceeded - hourly IP limit', {
      ip: req.ip
    });
    res.status(429).json({
      error: 'Too many AI generation requests. Please try again later.',
      retryAfter: '1 hour'
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});
