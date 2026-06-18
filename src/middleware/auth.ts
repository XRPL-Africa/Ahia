import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import { AuthenticatedRequest, TokenPayload } from '../types/index.js';
import { UserRole, UserStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

/**
 * Generate access and refresh tokens
 */
export function generateTokens(payload: Omit<TokenPayload, 'type'>): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}

/**
 * Extract token from request headers
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
      });
      return;
    }

    // Verify token
    let payload: TokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expired',
          error: { code: 'TOKEN_EXPIRED', message: 'Please refresh your token' },
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: { code: 'INVALID_TOKEN', message: 'Token verification failed' },
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await cacheService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token revoked',
        error: { code: 'TOKEN_REVOKED', message: 'This token has been revoked' },
      });
      return;
    }

    // Check token type
    if (payload.type !== 'access') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: { code: 'INVALID_TOKEN_TYPE', message: 'Use access token for this endpoint' },
      });
      return;
    }

    // Get user from cache or database
    const cacheKey = `user:${payload.userId}`;
    let user = await cacheService.get<{
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      campusId: string;
      walletAddress: string | null;
    }>(cacheKey);

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          campusId: true,
          walletAddress: true,
        },
      });

      if (user) {
        await cacheService.set(cacheKey, user, 300); // Cache for 5 minutes
      }
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND', message: 'User associated with token not found' },
      });
      return;
    }

    // Check if user is active
    if (user.status === UserStatus.BANNED) {
      res.status(403).json({
        success: false,
        message: 'Account banned',
        error: { code: 'ACCOUNT_BANNED', message: 'Your account has been banned' },
      });
      return;
    }

    if (user.status === UserStatus.SUSPENDED) {
      res.status(403).json({
        success: false,
        message: 'Account suspended',
        error: { code: 'ACCOUNT_SUSPENDED', message: 'Your account has been suspended' },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      campusId: user.campusId,
      walletAddress: user.walletAddress,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: { code: 'AUTH_ERROR', message: 'An error occurred during authentication' },
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyAccessToken(token);
    
    if (payload.type !== 'access') {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        campusId: true,
        walletAddress: true,
      },
    });

    if (user && user.status !== UserStatus.BANNED && user.status !== UserStatus.SUSPENDED) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        campusId: user.campusId,
        walletAddress: user.walletAddress,
      };
    }

    next();
  } catch {
    // Ignore errors for optional auth
    next();
  }
}

/**
 * Role authorization middleware
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', message: 'Please authenticate first' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' },
      });
      return;
    }

    next();
  };
}

/**
 * Verified user middleware
 * Ensures user has completed verification
 */
export function requireVerified(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: { code: 'UNAUTHORIZED', message: 'Please authenticate first' },
    });
    return;
  }

  if (req.user.status !== UserStatus.VERIFIED) {
    res.status(403).json({
      success: false,
      message: 'Verification required',
      error: { 
        code: 'VERIFICATION_REQUIRED', 
        message: 'Please complete verification to access this feature' 
      },
    });
    return;
  }

  next();
}

/**
 * Campus context middleware
 * Extracts campus from subdomain or header
 */
export async function extractCampusContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get campus from subdomain
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];

    // Get campus from header (for mobile apps)
    const campusHeader = req.headers['x-campus-id'] as string;

    let campusId: string | undefined;

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      const campus = await cacheService.get<{ id: string }>(`campus:subdomain:${subdomain}`);
      if (campus) {
        campusId = campus.id;
      } else {
        const campusData = await prisma.campus.findUnique({
          where: { subdomain },
          select: { id: true },
        });
        if (campusData) {
          campusId = campusData.id;
          await cacheService.set(`campus:subdomain:${subdomain}`, campusData, 3600);
        }
      }
    }

    if (!campusId && campusHeader) {
      campusId = campusHeader;
    }

    // Attach campus context to request
    (req as unknown as Record<string, unknown>).campusId = campusId;

    next();
  } catch (error) {
    logger.error('Campus context extraction error:', error);
    next();
  }
}

/**
 * Refresh token middleware
 */
export async function refreshAccessToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token required',
        error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' },
      });
      return;
    }

    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Refresh token expired',
          error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Please login again' },
        });
        return;
      }
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token verification failed' },
      });
      return;
    }

    if (payload.type !== 'refresh') {
      res.status(401).json({
        success: false,
        message: 'Invalid token type',
        error: { code: 'INVALID_TOKEN_TYPE', message: 'Use refresh token for this endpoint' },
      });
      return;
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await cacheService.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token revoked',
        error: { code: 'TOKEN_REVOKED', message: 'This refresh token has been revoked' },
      });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true, campusId: true },
    });

    if (!user || user.status === UserStatus.BANNED) {
      res.status(401).json({
        success: false,
        message: 'User not found or banned',
        error: { code: 'USER_INVALID', message: 'User account is no longer valid' },
      });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
    });

    // Blacklist old refresh token
    await cacheService.set(`blacklist:${refreshToken}`, true, 7 * 24 * 60 * 60);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: { code: 'REFRESH_ERROR', message: 'An error occurred while refreshing token' },
    });
  }
}

/**
 * Logout middleware
 * Blacklists the token
 */
export async function logout(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const token = extractToken(req);
    const { refreshToken } = req.body;

    // Blacklist access token
    if (token) {
      // Decode to get expiration
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cacheService.set(`blacklist:${token}`, true, ttl);
        }
      }
    }

    // Blacklist refresh token
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as { exp?: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cacheService.set(`blacklist:${refreshToken}`, true, ttl);
        }
      }
    }

    // Clear user cache
    if (req.user) {
      await cacheService.del(`user:${req.user.id}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: { code: 'LOGOUT_ERROR', message: 'An error occurred during logout' },
    });
  }
}
