import { Request, Response, NextFunction } from 'express';
/**
 * Custom rate limiter using Redis
 */
export declare function createRateLimiter(maxRequests?: number, windowMs?: number, keyPrefix?: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Express rate limit middleware (fallback)
 */
export declare const expressRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for sensitive endpoints
 */
export declare const strictRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Auth rate limiter for login/register endpoints
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * API rate limiter for general API endpoints
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Upload rate limiter for file uploads
 */
export declare const uploadRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Webhook rate limiter
 */
export declare const webhookRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Burst rate limiter for high-traffic endpoints
 */
export declare const burstRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Per-user rate limiter
 */
export declare function createUserRateLimiter(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default createRateLimiter;
//# sourceMappingURL=rateLimiter.d.ts.map