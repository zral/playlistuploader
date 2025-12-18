/**
 * AI Playlist Generator Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { generatePlaylist, getServiceStatus } from '../services/aiService.js';
import { userDailyLimit, ipHourlyLimit } from '../middleware/aiRateLimit.js';
import { sessionStore } from '../db/mongodb.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to require authentication (consistent with api.ts pattern)
async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.cookies.spotify_user_id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const session = await sessionStore.get(userId);

    if (!session) {
      res.clearCookie('spotify_user_id');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Store userId for rate limiting
    (req as any).userId = userId;
    next();
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'AI authentication middleware',
      url: req.url
    });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * POST /api/ai/generate-playlist
 * Generate a playlist using AI
 */
router.post(
  '/generate-playlist',
  requireAuth,
  ipHourlyLimit,
  userDailyLimit,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { description, songCount, durationMinutes } = req.body;

      logger.info('AI playlist generation requested', {
        userId: (req as any).userId,
        description: description?.substring(0, 50),
        songCount,
        durationMinutes
      });

      // Validate input
      if (!description || typeof description !== 'string') {
        res.status(400).json({
          error: 'Playlist description is required'
        });
        return;
      }

      if (description.length < 5 || description.length > 500) {
        res.status(400).json({
          error: 'Description must be between 5 and 500 characters'
        });
        return;
      }

      if (!songCount && !durationMinutes) {
        res.status(400).json({
          error: 'Either songCount or durationMinutes must be provided'
        });
        return;
      }

      if (songCount && !Number.isInteger(songCount)) {
        res.status(400).json({
          error: 'Song count must be an integer'
        });
        return;
      }

      if (durationMinutes && !Number.isInteger(durationMinutes)) {
        res.status(400).json({
          error: 'Duration must be an integer'
        });
        return;
      }

      // Generate playlist
      const startTime = Date.now();
      const result = await generatePlaylist(description, {
        songCount,
        durationMinutes
      });
      const duration = Date.now() - startTime;

      logger.info('AI playlist generation completed', {
        userId: (req as any).userId,
        duration: `${duration}ms`,
        playlistName: result.playlistName,
        songCount: result.playlist.split('\n').length
      });

      res.json({
        success: true,
        playlistName: result.playlistName,
        playlist: result.playlist,
        metadata: {
          songCount: result.playlist.split('\n').length,
          generationTime: duration
        }
      });
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error(String(error)), {
        context: 'AI playlist generation endpoint',
        userId: (req as any).userId
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate playlist'
      });
    }
  }
);

/**
 * GET /api/ai/status
 * Get AI service status (for debugging)
 */
router.get('/status', requireAuth, (_req: Request, res: Response): void => {
  const status = getServiceStatus();
  res.json(status);
});

export default router;
