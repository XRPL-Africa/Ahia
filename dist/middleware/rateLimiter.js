import rateLimit from 'express-rate-limit';
import { rateLimitService } from '../config/redis.js';
import logger from '../config/logger.js';
// Default rate limit configuration
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
/**
 * Get client identifier (IP or user ID)
 */
function getClientIdentifier(req) {
    // Use user ID if authenticated, otherwise use IP
    const userId = req.user?.id;
    if (userId) {
        return `user:${userId}`;
    }
    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}
/**
 * Custom rate limiter using Redis
 */
export function createRateLimiter(maxRequests = DEFAULT_MAX_REQUESTS, windowMs = DEFAULT_WINDOW_MS, keyPrefix = '') {
    return async (req, res, next) => {
        const identifier = keyPrefix + getClientIdentifier(req);
        const windowSeconds = Math.floor(windowMs / 1000);
        try {
            const result = await rateLimitService.isRateLimited(identifier, maxRequests, windowSeconds);
            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', result.resetTime);
            if (result.limited) {
                logger.warn('Rate limit exceeded:', {
                    identifier,
                    path: req.path,
                    method: req.method,
                });
                res.status(429).json({
                    success: false,
                    message: 'Too many requests',
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: `Rate limit exceeded. Try again after ${new Date(result.resetTime * 1000).toISOString()}`,
                    },
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error('Rate limiter error:', error);
            // Fail open - allow request if rate limiter fails
            next();
        }
    };
}
/**
 * Express rate limit middleware (fallback)
 */
export const expressRateLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW_MS,
    max: DEFAULT_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req.user?.id ||
            req.ip ||
            req.socket.remoteAddress ||
            'unknown');
    },
    handler: (req, res) => {
        logger.warn('Rate limit exceeded (express-rate-limit):', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests',
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later',
            },
        });
    },
});
/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many attempts',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many attempts, please try again later',
        },
    },
    skipSuccessfulRequests: true,
});
/**
 * Auth rate limiter for login/register endpoints
 */
export const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 attempts per hour
    message: {
        success: false,
        message: 'Too many authentication attempts',
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Use email or IP for auth endpoints
        const email = req.body?.email;
        if (email) {
            return `auth:${email}`;
        }
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
});
/**
 * API rate limiter for general API endpoints
 */
export const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        success: false,
        message: 'Too many requests',
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API rate limit exceeded, please slow down',
        },
    },
});
/**
 * Upload rate limiter for file uploads
 */
export const uploadRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Upload limit exceeded',
        error: {
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            message: 'Too many file uploads, please try again later',
        },
    },
});
/**
 * Webhook rate limiter
 */
export const webhookRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 webhook requests per minute
    message: {
        success: false,
        message: 'Webhook rate limit exceeded',
        error: {
            code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
            message: 'Too many webhook requests',
        },
    },
    keyGenerator: (req) => {
        // Use webhook source IP
        return `webhook:${req.ip || req.socket.remoteAddress || 'unknown'}`;
    },
});
/**
 * Burst rate limiter for high-traffic endpoints
 */
export const burstRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 10, // 10 requests per second
    message: {
        success: false,
        message: 'Request burst detected',
        error: {
            code: 'BURST_RATE_LIMIT_EXCEEDED',
            message: 'Too many requests in a short time',
        },
    },
});
/**
 * Per-user rate limiter
 */
export function createUserRateLimiter(maxRequests, windowMs) {
    return async (req, res, next) => {
        const userId = req.user?.id;
        if (!userId) {
            // Fall back to IP-based limiting for unauthenticated users
            return createRateLimiter(maxRequests, windowMs)(req, res, next);
        }
        const identifier = `user:${userId}`;
        const windowSeconds = Math.floor(windowMs / 1000);
        try {
            const result = await rateLimitService.isRateLimited(identifier, maxRequests, windowSeconds);
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', result.resetTime);
            if (result.limited) {
                res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded',
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'You have exceeded your rate limit',
                    },
                });
                return;
            }
            next();
        }
        catch (error) {
            logger.error('User rate limiter error:', error);
            next();
        }
    };
}
export default createRateLimiter;
//# sourceMappingURL=rateLimiter.js.map