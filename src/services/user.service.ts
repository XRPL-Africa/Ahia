import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { UserStatus } from '@prisma/client';
import { notificationService } from './notification.service.js';

export class UserService {
  private readonly USER_CACHE_TTL = 300; // 5 minutes

  /**
   * Get public user profile by ID
   */
  async getUserProfile(userId: string): Promise<unknown> {
    const cacheKey = `user:profile:${userId}`;
    const cached = await cacheService.get<unknown>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
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
        responseTimeAvg: true,
        walletAddress: true,
        createdAt: true,
        campus: {
          select: { name: true, city: true },
        },
        _count: {
          select: {
            listings: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) throw Errors.NOT_FOUND('User');

    await cacheService.set(cacheKey, user, this.USER_CACHE_TTL);
    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    requesterId: string,
    requesterRole: string,
    data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      bio?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    }
  ): Promise<unknown> {
    // Only the user themselves or an admin can update the profile
    if (userId !== requesterId && !['ADMIN', 'SUPER_ADMIN'].includes(requesterRole)) {
      throw Errors.FORBIDDEN('You do not have permission to update this profile');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Errors.NOT_FOUND('User');

    // Check phone uniqueness if provided
    if (data.phoneNumber) {
      const existing = await prisma.user.findFirst({
        where: { phoneNumber: data.phoneNumber, id: { not: userId } },
      });
      if (existing) throw new ApiError(409, 'PHONE_EXISTS', 'Phone number already in use');
    }

    const updated = await prisma.user.update({
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
        walletAddress: true,
        createdAt: true,
      },
    });

    // Invalidate caches
    await cacheService.del(`user:profile:${userId}`);
    await cacheService.del(`user:${userId}`);

    logger.info(`Profile updated for user ${userId} by ${requesterId}`);
    return updated;
  }

  /**
   * Resend verification email / trigger re-verification
   */
  async resendVerification(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { verification: true },
    });

    if (!user) throw Errors.NOT_FOUND('User');

    if (user.status === UserStatus.VERIFIED) {
      throw new ApiError(400, 'ALREADY_VERIFIED', 'User is already verified');
    }

    // Notify user to re-submit verification
    await notificationService.createNotification({
      userId,
      type: 'VERIFICATION',
      title: 'Verification Reminder',
      message:
        'Please submit your student ID to complete verification and start using Ahia.',
      data: {},
    });

    logger.info(`Verification reminder sent to user ${userId}`);
  }

  /**
   * Get listings for a specific user
   */
  async getUserListings(
    userId: string,
    options: { page?: number; limit?: number; status?: string } = {}
  ): Promise<{ listings: unknown[]; total: number; meta: unknown }> {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    // Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) throw Errors.NOT_FOUND('User');

    const where = {
      sellerId: userId,
      status: status
        ? (status as any)
        : { notIn: ['DELETED'] as any[] },
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          campus: { select: { name: true } },
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get ratings / reviews for a specific user
   */
  async getUserRatings(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    reviews: unknown[];
    stats: {
      averageRating: number;
      totalReviews: number;
      distribution: Record<number, number>;
    };
    meta: unknown;
  }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) throw Errors.NOT_FOUND('User');

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { revieweeId: userId } }),
    ]);

    // Compute aggregate stats
    const aggregate = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Rating distribution (1-5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const grouped = await prisma.review.groupBy({
      by: ['rating'],
      where: { revieweeId: userId },
      _count: { rating: true },
    });
    grouped.forEach((g) => {
      distribution[g.rating] = g._count.rating;
    });

    return {
      reviews,
      stats: {
        averageRating: Number((aggregate._avg.rating || 0).toFixed(2)),
        totalReviews: aggregate._count.rating,
        distribution,
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

export const userService = new UserService();
export default userService;
