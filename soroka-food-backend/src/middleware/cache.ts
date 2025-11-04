import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import { logger } from '../config/logger';

/**
 * Cache middleware for GET requests
 * @param duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Check if Redis is connected
      if (redis.status !== 'ready') {
        logger.debug('Redis not available, skipping cache');
        return next();
      }

      // Try to get cached response
      const cached = await redis.get(key);
      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return res.json(JSON.parse(cached));
      }

      logger.debug(`Cache miss: ${key}`);
    } catch (error) {
      logger.error('Cache read error:', error);
      // Continue without cache on error
      return next();
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      // Try to cache the response
      redis.setex(key, duration, JSON.stringify(data)).catch((err) => {
        logger.error('Cache write error:', err);
      });
      return originalJson(data);
    };

    next();
  };
};

/**
 * Invalidate cache by pattern
 * @param pattern - Redis key pattern (e.g., 'cache:/api/recipes*')
 */
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    if (redis.status !== 'ready') {
      logger.debug('Redis not available, skipping cache invalidation');
      return;
    }

    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};
