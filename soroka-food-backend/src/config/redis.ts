import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Graceful connection attempt
redis.connect().catch((err) => {
  logger.warn('Redis connection failed (will continue without cache):', err.message);
});

export default redis;
