/**
 * Express and Session Type Definitions
 */

import { Session, SessionData } from 'express-session';
import { SpotifyUser } from './spotify.js';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      profile: SpotifyUser;
    };
    oauthState?: string;
    stateExpiry?: number;
  }
}

declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>;
  }
}

export interface AuthenticatedRequest extends Express.Request {
  session: Session & Required<Pick<SessionData, 'user'>>;
}
