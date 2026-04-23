import Redis from 'ioredis';
import logger from './logger.js';

// Redis Client Configuration
const redisConfig = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
};

// Redis Client Singleton
export const redis = new Redis(redisConfig);

// Redis Event Handlers
redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redis.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

// Cache Utilities
export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with optional TTL
   */
  async set(key: string, value: unknown, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  /**
   * Delete cached data by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    return redis.incr(key);
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await redis.expire(key, seconds);
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    return redis.ttl(key);
  }
}

// Rate Limiting Utilities
export class RateLimitService {
  /**
   * Check if request is rate limited
   */
  async isRateLimited(
    identifier: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSeconds;

    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Get current count
    const currentCount = await redis.zcard(key);

    if (currentCount >= maxRequests) {
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = parseInt(oldest[1]) + windowSeconds;
      return { limited: true, remaining: 0, resetTime };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, windowSeconds);

    return {
      limited: false,
      remaining: maxRequests - currentCount - 1,
      resetTime: now + windowSeconds,
    };
  }
}

// Session Store Utilities
export class SessionService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly DEFAULT_SESSION_TTL = 86400 * 7; // 7 days

  /**
   * Create session
   */
  async createSession(sessionId: string, data: unknown, ttl?: number): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.setex(key, ttl || this.DEFAULT_SESSION_TTL, JSON.stringify(data));
  }

  /**
   * Get session
   */
  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.del(key);
  }

  /**
   * Refresh session TTL
   */
  async refreshSession(sessionId: string, ttl?: number): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await redis.expire(key, ttl || this.DEFAULT_SESSION_TTL);
  }
}

// Export singleton instances
export const cacheService = new CacheService();
export const rateLimitService = new RateLimitService();
export const sessionService = new SessionService();

export default redis;
