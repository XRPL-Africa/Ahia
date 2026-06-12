import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, TokenPayload } from '../types/index.js';
import { UserRole } from '@prisma/client';
/**
 * Generate access and refresh tokens
 */
export declare function generateTokens(payload: Omit<TokenPayload, 'type'>): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
};
/**
 * Verify access token
 */
export declare function verifyAccessToken(token: string): TokenPayload;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): TokenPayload;
/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export declare function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Role authorization middleware
 */
export declare function authorize(...allowedRoles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Verified user middleware
 * Ensures user has completed verification
 */
export declare function requireVerified(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
/**
 * Campus context middleware
 * Extracts campus from subdomain or header
 */
export declare function extractCampusContext(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Refresh token middleware
 */
export declare function refreshAccessToken(req: Request, res: Response): Promise<void>;
/**
 * Logout middleware
 * Blacklists the token
 */
export declare function logout(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=auth.d.ts.map