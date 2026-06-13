import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import { xrplService } from '../config/xrpl.js';
import logger from '../config/logger.js';
import { hashPassword, comparePassword } from '../utils/helpers.js';
import { generateTokens } from '../middleware/auth.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { UserStatus, UserRole } from '@prisma/client';
import type {
  RegisterInput,
  LoginInput,
  AuthTokens,
  UserProfile,
} from '../types/index.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw Errors.ALREADY_EXISTS('User');
    }

    // Check if phone number already exists
    if (input.phoneNumber) {
      const existingPhone = await prisma.user.findUnique({
        where: { phoneNumber: input.phoneNumber },
      });
      if (existingPhone) {
        throw new ApiError(409, 'PHONE_EXISTS', 'Phone number already registered');
      }
    }

    // Verify campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: input.campusId },
    });

    if (!campus) {
      throw Errors.NOT_FOUND('Campus');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Generate XRPL wallet for user
    const wallet = xrplService.generateWallet();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        campusId: input.campusId,
        walletAddress: wallet.address,
        walletSeedEncrypted: wallet.seed, // TODO: Encrypt this
        status: UserStatus.PENDING_VERIFICATION,
        role: UserRole.STUDENT,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        campusId: true,
        role: true,
        status: true,
        trustScore: true,
        successfulTrades: true,
        totalTrades: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    // Fund wallet on testnet (for development)
    if (process.env.XRPL_NODE_URL?.includes('test')) {
      try {
        await xrplService.fundWallet(wallet.address);
        logger.info(`Funded testnet wallet for user ${user.id}`);
      } catch (error) {
        logger.error('Failed to fund testnet wallet:', error);
      }
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
    });

    logger.info(`User registered: ${user.email}`);

    return { user, tokens };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw Errors.UNAUTHORIZED('Invalid email or password');
    }

    // Check if user is banned or suspended
    if (user.status === UserStatus.BANNED) {
      throw new ApiError(403, 'ACCOUNT_BANNED', 'Your account has been banned');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
    }

    // Verify password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw Errors.UNAUTHORIZED('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
    });

    // Cache user data
    await cacheService.set(
      `user:${user.id}`,
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        campusId: user.campusId,
        walletAddress: user.walletAddress,
      },
      300
    );

    logger.info(`User logged in: ${user.email}`);

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      campusId: user.campusId,
      role: user.role,
      status: user.status,
      trustScore: user.trustScore,
      successfulTrades: user.successfulTrades,
      totalTrades: user.totalTrades,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    };

    return { user: userProfile, tokens };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        campusId: true,
        role: true,
        status: true,
        trustScore: true,
        successfulTrades: true,
        totalTrades: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      bio?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    }
  ): Promise<UserProfile> {
    // Check phone number uniqueness if provided
    if (data.phoneNumber) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phoneNumber: data.phoneNumber,
          id: { not: userId },
        },
      });
      if (existingPhone) {
        throw new ApiError(409, 'PHONE_EXISTS', 'Phone number already registered');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        campusId: true,
        role: true,
        status: true,
        trustScore: true,
        successfulTrades: true,
        totalTrades: true,
        walletAddress: true,
        createdAt: true,
      },
    });

    // Clear user cache
    await cacheService.del(`user:${userId}`);

    logger.info(`User profile updated: ${user.email}`);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new ApiError(400, 'INVALID_PASSWORD', 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = generateTokens(
      { userId: user.id, email: user.email, role: user.role, campusId: user.campusId },
    ).accessToken;

    // Store reset token in cache (valid for 1 hour)
    await cacheService.set(`password_reset:${user.id}`, resetToken, 3600);

    // TODO: Send email with reset link
    logger.info(`Password reset requested for: ${email}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Implement token verification and password reset
    logger.info('Password reset with token');
  }
}

export const authService = new AuthService();
export default authService;
