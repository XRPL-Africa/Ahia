import Redis from 'ioredis';
export declare const redis: Redis;
export declare class CacheService {
    private readonly DEFAULT_TTL;
    /**
     * Get cached data
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set cached data with optional TTL
     */
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    /**
     * Delete cached data
     */
    del(key: string): Promise<void>;
    /**
     * Delete cached data by pattern
     */
    delPattern(pattern: string): Promise<void>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Increment counter
     */
    incr(key: string): Promise<number>;
    /**
     * Set expiration on key
     */
    expire(key: string, seconds: number): Promise<void>;
    /**
     * Get TTL of key
     */
    ttl(key: string): Promise<number>;
}
export declare class RateLimitService {
    /**
     * Check if request is rate limited
     */
    isRateLimited(identifier: string, maxRequests: number, windowSeconds: number): Promise<{
        limited: boolean;
        remaining: number;
        resetTime: number;
    }>;
}
export declare class SessionService {
    private readonly SESSION_PREFIX;
    private readonly DEFAULT_SESSION_TTL;
    /**
     * Create session
     */
    createSession(sessionId: string, data: unknown, ttl?: number): Promise<void>;
    /**
     * Get session
     */
    getSession<T>(sessionId: string): Promise<T | null>;
    /**
     * Delete session
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * Refresh session TTL
     */
    refreshSession(sessionId: string, ttl?: number): Promise<void>;
}
export declare const cacheService: CacheService;
export declare const rateLimitService: RateLimitService;
export declare const sessionService: SessionService;
export default redis;
//# sourceMappingURL=redis.d.ts.map