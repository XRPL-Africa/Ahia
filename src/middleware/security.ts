import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

// ============================================
// XSS PROTECTION
// ============================================

/**
 * Recursively sanitize strings in an object to remove XSS vectors.
 * Does NOT strip HTML from all fields — only escapes dangerous characters.
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove script tags, event handlers, and javascript: URIs
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = sanitizeValue(v);
    }
    return sanitized;
  }
  return value;
}

/**
 * XSS sanitization middleware — scrubs request body
 */
export function xssSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
}

// ============================================
// SQL INJECTION PREVENTION
// ============================================

const SQL_INJECTION_PATTERNS = [
  /('|\\').*(--)/, // SQL comment injection
  /(;)\s*(drop|alter|truncate|delete|insert|update)\s/i,
  /\b(union)\b.*\b(select)\b/i,
  /\b(exec|execute)\s*\(/i,
  /xp_\w+/i, // MSSQL extended procedures
  /0x[0-9a-fA-F]+/, // Hex encoding
];

function hasSqlInjection(value: unknown): boolean {
  if (typeof value === 'string') {
    return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) {
    return value.some(hasSqlInjection);
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasSqlInjection);
  }
  return false;
}

/**
 * SQL injection detection middleware
 */
export function sqlInjectionProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const suspicious =
    hasSqlInjection(req.body) ||
    hasSqlInjection(req.query) ||
    hasSqlInjection(req.params);

  if (suspicious) {
    logger.warn('Potential SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
    });

    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      error: {
        code: 'INVALID_INPUT',
        message: 'Request contains potentially dangerous input',
      },
    });
    return;
  }

  next();
}

// ============================================
// CSRF TOKEN MIDDLEWARE
// ============================================

const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/webhooks',
  '/health',
  '/docs',
];

const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF protection middleware
 *
 * Strategy: Double Submit Cookie pattern
 *   - Client sends token in both X-CSRF-Token header and a non-HttpOnly cookie
 *   - Server validates they match
 *
 * For SPA/mobile clients, the frontend must:
 *   1. Call GET /api/v1/auth/csrf to receive a token
 *   2. Include it as X-CSRF-Token header on state-mutating requests
 */
export async function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Safe methods skip CSRF validation
  if (CSRF_SAFE_METHODS.includes(req.method)) {
    next();
    return;
  }

  // Exempt paths skip CSRF validation
  const isExempt = CSRF_EXEMPT_PATHS.some((p) => req.path.startsWith(p));
  if (isExempt) {
    next();
    return;
  }

  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  const cookieToken = req.cookies?.['csrf-token'];

  if (!headerToken || !cookieToken) {
    res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      error: { code: 'CSRF_MISSING', message: 'Request is missing CSRF token' },
    });
    return;
  }

  // Timing-safe comparison
  try {
    const headerBuf = Buffer.from(headerToken, 'hex');
    const cookieBuf = Buffer.from(cookieToken, 'hex');

    if (
      headerBuf.length !== cookieBuf.length ||
      !crypto.timingSafeEqual(headerBuf, cookieBuf)
    ) {
      logger.warn('CSRF token mismatch', { ip: req.ip, path: req.path });
      res.status(403).json({
        success: false,
        message: 'Invalid CSRF token',
        error: { code: 'CSRF_INVALID', message: 'CSRF token validation failed' },
      });
      return;
    }
  } catch {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token format',
      error: { code: 'CSRF_INVALID', message: 'CSRF token is malformed' },
    });
    return;
  }

  next();
}

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Validate an API key against the cache/database
 * API keys are issued for server-to-server integrations
 */
export async function validateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    next(); // Let auth middleware handle it
    return;
  }

  const cacheKey = `apikey:${apiKey}`;
  const cached = await cacheService.get<{ userId: string; scopes: string[] }>(cacheKey);

  if (cached) {
    (req as unknown as Record<string, unknown>).apiKeyData = cached;
    next();
    return;
  }

  // API keys are stored as hashed values in audit_log for now
  // In production, implement a dedicated ApiKey model
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const storedKey = await cacheService.get<{ userId: string; scopes: string[] }>(
    `apikey:hash:${keyHash}`
  );

  if (!storedKey) {
    res.status(401).json({
      success: false,
      message: 'Invalid API key',
      error: { code: 'INVALID_API_KEY', message: 'The provided API key is not valid' },
    });
    return;
  }

  // Cache for 5 minutes
  await cacheService.set(cacheKey, storedKey, 300);
  (req as unknown as Record<string, unknown>).apiKeyData = storedKey;
  next();
}

/**
 * Issue a new API key for a user (admin action)
 * Returns the plain text key once — never stored in plain text
 */
export async function issueApiKey(userId: string): Promise<string> {
  const plainKey = `ahia_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

  const keyData = { userId, scopes: ['read', 'write'], issuedAt: new Date().toISOString() };

  // Store hash → data mapping (30 days TTL)
  await cacheService.set(`apikey:hash:${keyHash}`, keyData, 30 * 24 * 60 * 60);

  logger.info(`API key issued for user ${userId}`);
  return plainKey;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKey: string): Promise<void> {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  await cacheService.del(`apikey:hash:${keyHash}`);
  await cacheService.del(`apikey:${apiKey}`);
  logger.info('API key revoked');
}

// ============================================
// SECURITY AUDIT LOGGING
// ============================================

const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const AUDIT_SKIP_PATHS = ['/health', '/docs', '/api/v1/analytics/event'];

/**
 * Security audit logging middleware
 * Logs all mutating requests with user context
 */
export function securityAuditLog(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const shouldAudit =
    AUDITED_METHODS.includes(req.method) &&
    !AUDIT_SKIP_PATHS.some((p) => req.path.startsWith(p));

  if (shouldAudit) {
    const userId = (req as unknown as { user?: { id: string } }).user?.id;

    setImmediate(async () => {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: `${req.method}:${req.path}`,
            entityType: 'http_request',
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            userAgent: req.headers['user-agent'],
            newValue: {
              body: sanitizeAuditBody(req.body),
              query: req.query,
            } as any,
          },
        });
      } catch {
        // Audit logging must never break a request
      }
    });
  }

  next();
}

/**
 * Remove sensitive fields from audit log body
 */
function sanitizeAuditBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = new Set(['password', 'passwordHash', 'token', 'secret', 'seed', 'privateKey']);
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    sanitized[k] = sensitive.has(k) ? '[REDACTED]' : v;
  }
  return sanitized;
}

// ============================================
// SECURITY HEADERS (supplements helmet)
// ============================================

/**
 * Additional security headers beyond what helmet provides
 */
export function additionalSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https://res.cloudinary.com data:; script-src 'self';"
  );
  next();
}

export default {
  xssSanitize,
  sqlInjectionProtection,
  csrfProtection,
  generateCsrfToken,
  validateApiKey,
  issueApiKey,
  revokeApiKey,
  securityAuditLog,
  additionalSecurityHeaders,
};
