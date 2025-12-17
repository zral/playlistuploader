import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/config.js';
import { connectToDatabase, closeDatabase } from './db/mongodb.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import aiRoutes from './routes/aiRoutes.js';
import { apiLimiter, authLimiter, searchLimiter, batchLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxy (Nginx)
// Trust first proxy only (more secure than 'true')
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint (no rate limiting)
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response): void => {
  res.json({
    message: '🎄 Christmas Spotify Playlist Uploader API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/*',
      api: '/api/*',
      ai: '/api/ai/*',
    },
  });
});

// Routes with rate limiting
app.use('/auth', authLimiter, authRoutes);
app.use('/api/search/batch', batchLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/ai', aiRoutes); // AI routes have their own rate limiting
app.use('/api', apiLimiter, apiRoutes);

// Error handling middleware
interface ErrorWithStatus extends Error {
  status?: number;
}

app.use((err: ErrorWithStatus, req: Request, res: Response, _next: NextFunction): void => {
  logger.logError(err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode: err.status || 500
  });
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      path: req.path,
    },
  });
});

// Graceful shutdown
process.on('SIGTERM', async (): Promise<void> => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async (): Promise<void> => {
  logger.info('SIGINT signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Start Express server
    app.listen(config.port, '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        corsOrigin: config.corsOrigin
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    process.exit(1);
  }
}

startServer();
