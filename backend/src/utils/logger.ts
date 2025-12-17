import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { Request, Response } from 'express';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'spotify-uploader-backend' },
  transports: [
    // Error log - only errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d', // Keep 14 days of error logs
      maxSize: '20m',  // Max 20MB per file
      zippedArchive: true
    }),

    // Combined log - all levels
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',  // Keep 7 days of combined logs
      maxSize: '20m',
      zippedArchive: true
    }),

    // HTTP requests log - separate file for requests
    new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: '7d',
      maxSize: '20m',
      zippedArchive: true
    })
  ],
  // Don't exit on error
  exitOnError: false
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
} else {
  // In production, still show errors in console
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'error'
  }));
}

// Custom methods type
interface LoggerExtensions {
  stream: {
    write: (message: string) => void;
  };
  logRequest: (req: Request, additionalInfo?: Record<string, unknown>) => void;
  logResponse: (req: Request, res: Response, responseTime: number) => void;
  logError: (error: Error, context?: Record<string, unknown>) => void;
  logSpotifyApiCall: (endpoint: string, success: boolean, metadata?: Record<string, unknown>) => void;
  logDatabaseOperation: (operation: string, success: boolean, metadata?: Record<string, unknown>) => void;
  logCircuitBreaker: (state: string, metadata?: Record<string, unknown>) => void;
}

const extendedLogger = logger as winston.Logger & LoggerExtensions;

// Stream for Morgan HTTP request logging
(extendedLogger as any).stream = {
  write: (message: string) => {
    extendedLogger.http(message.trim());
  }
};

// Helper functions for common logging patterns
extendedLogger.logRequest = (req: Request, additionalInfo: Record<string, unknown> = {}) => {
  extendedLogger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
    ...additionalInfo
  });
};

extendedLogger.logResponse = (req: Request, res: Response, responseTime: number) => {
  extendedLogger.http('HTTP Response', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`
  });
};

extendedLogger.logError = (error: Error, context: Record<string, unknown> = {}) => {
  extendedLogger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as NodeJS.ErrnoException).code
    },
    ...context
  });
};

extendedLogger.logSpotifyApiCall = (endpoint: string, success: boolean, metadata: Record<string, unknown> = {}) => {
  const level = success ? 'info' : 'error';
  extendedLogger.log(level, 'Spotify API Call', {
    endpoint,
    success,
    ...metadata
  });
};

extendedLogger.logDatabaseOperation = (operation: string, success: boolean, metadata: Record<string, unknown> = {}) => {
  const level = success ? 'info' : 'error';
  extendedLogger.log(level, 'Database Operation', {
    operation,
    success,
    ...metadata
  });
};

extendedLogger.logCircuitBreaker = (state: string, metadata: Record<string, unknown> = {}) => {
  const level = state === 'open' ? 'error' : 'info';
  extendedLogger.log(level, 'Circuit Breaker State Change', {
    state,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

export default extendedLogger;
