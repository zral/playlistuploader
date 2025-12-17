import { MongoClient, Db } from 'mongodb';
import { config } from '../config/config.js';
import logger from '../utils/logger.js';
import { SpotifyTokenResponse } from '../types/spotify.js';

let db: Db | null = null;
let client: MongoClient | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client = new MongoClient(config.mongodb.uri);
    await client.connect();

    db = client.db(config.mongodb.dbName);

    logger.logDatabaseOperation('connect', true, {
      uri: config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Mask credentials
      database: db.databaseName
    });

    // Create indexes for sessions collection
    await db.collection('sessions').createIndex({ userId: 1 });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    return db;
  } catch (error) {
    logger.logDatabaseOperation('connect', false, {
      uri: config.mongodb.uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    db = null;
    client = null;
    logger.logDatabaseOperation('disconnect', true, { message: 'MongoDB connection closed' });
  }
}

// Session storage operations
interface SessionDocument {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export const sessionStore = {
  async create(userId: string, tokens: SpotifyTokenResponse): Promise<SessionDocument> {
    const db = getDatabase();
    const session: SessionDocument = {
      userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      createdAt: new Date(),
    };

    await db.collection('sessions').updateOne(
      { userId },
      { $set: session },
      { upsert: true }
    );

    return session;
  },

  async get(userId: string): Promise<SessionDocument | null> {
    const db = getDatabase();
    return await db.collection<SessionDocument>('sessions').findOne({ userId });
  },

  async update(userId: string, tokens: SpotifyTokenResponse): Promise<void> {
    const db = getDatabase();
    await db.collection('sessions').updateOne(
      { userId },
      {
        $set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '',
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      }
    );
  },

  async delete(userId: string): Promise<void> {
    const db = getDatabase();
    await db.collection('sessions').deleteOne({ userId });
  },
};
