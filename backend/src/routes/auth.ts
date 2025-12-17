import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { getAuthorizationUrl, getAccessToken, getCurrentUser } from '../services/spotifyService.js';
import { sessionStore } from '../db/mongodb.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Initiate Spotify OAuth flow
 * GET /auth/login
 */
router.get('/login', (_req: Request, res: Response): void => {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in cookie for verification
    res.cookie('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    const authUrl = getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Login initiation'
    });
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
});

/**
 * Handle Spotify OAuth callback
 * GET /auth/callback
 */
router.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state, error } = req.query;
  const storedState = req.cookies.spotify_auth_state;

  // Clear the state cookie
  res.clearCookie('spotify_auth_state');

  // Handle OAuth errors
  if (error) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=${error}`);
    return;
  }

  // Verify state to prevent CSRF
  if (!state || state !== storedState) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=state_mismatch`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=missing_code`);
    return;
  }

  try {
    // Exchange code for access token
    const tokens = await getAccessToken(code);

    // Get user profile
    const user = await getCurrentUser(tokens.access_token);

    // Store session in MongoDB
    await sessionStore.create(user.id, tokens);

    // Set session cookie
    res.cookie('spotify_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?auth=success`);
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'OAuth callback',
      state: req.query.state
    });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
  }
});

/**
 * Get current user info
 * GET /auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
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

    // Get fresh user data
    const user = await getCurrentUser(session.accessToken);

    res.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        images: user.images,
        product: user.product,
      }
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Get current user'
    });

    // If token expired, clear cookie
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        res.clearCookie('spotify_user_id');
        res.status(401).json({ error: 'Session expired' });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to get user info' });
  }
});

/**
 * Logout
 * POST /auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.cookies.spotify_user_id;

    if (userId) {
      await sessionStore.delete(userId);
      res.clearCookie('spotify_user_id');
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'Logout',
      userId: req.cookies.spotify_user_id
    });
    res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
