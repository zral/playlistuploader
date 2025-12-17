/**
 * Type declarations for rate-limit-mongo
 */

declare module 'rate-limit-mongo' {
  import { Store } from 'express-rate-limit';

  interface MongoStoreOptions {
    uri: string;
    collectionName?: string;
    expireTimeMs?: number;
    resetExpireDateOnChange?: boolean;
    errorHandler?: (error: Error) => void;
  }

  class MongoStore implements Store {
    constructor(options: MongoStoreOptions);
    increment(key: string): Promise<{ totalHits: number; resetTime: Date }>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
  }

  export = MongoStore;
}
