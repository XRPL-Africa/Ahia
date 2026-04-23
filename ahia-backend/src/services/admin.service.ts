import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import { notificationService } from './notification.service.js';
import logger from '../config/logger.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { UserStatus, UserRole, DisputeStatus, EscrowStatus } from '@prisma/client';
import type { CampusInput, SwapSpotInput } from '../types/index.js';

export class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    users: {
      total: number;
      verified: number;
      pending: number;
      banned: number;
      newToday: number;
    };
    listings: {
      total: number;
      active: number;
      sold: number;
      newToday: number;
    };
    escrows: {
      total: number;
      active: number;
      completed: number;
      disputed: number;
      volume: number;
    };
    transactions: {
      total: number;
      volume: number;
      fees: number;
    };
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      verifiedUsers,
      pendingUsers,
      bannedUsers,
      newUsersToday,
      totalListings,
      activeListings,
      soldListings,
      newListingsToday,
      totalEscrows,
      activeEscrows,
      completedEscrows,
      disputedEscrows,
      escrowVolume,
      totalTransactions,
      transactionVolume,
      platformFees,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.VERIFIED } }),
      prisma.user.count({ where: { status: UserStatus.PENDING_VERIFICATION } }),
      prisma.user.count({ where: { status: UserStatus.BANNED } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { status: 'SOLD' } }),
      prisma.listing.count({ where: { createdAt: { gte: today } } }),
      prisma.escrow.count(),
      prisma.escrow.count({
        where: {
          status: { in: [EscrowStatus.COMMITTED, EscrowStatus.PENDING_INSPECTION, EscrowStatus.FROZEN] },
        },
      }),
      prisma.escrow.count({ where: { status: EscrowStatus.COMPLETED } }),
      prisma.escrow.count({ where: { status: EscrowStatus.DISPUTED } }),
      prisma.escrow.aggregate({
        where: { status: EscrowStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.escrow.aggregate({
        where: { status: EscrowStatus.COMPLETED },
        _sum: { platformFee: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        pending: pendingUsers,
        banned: bannedUsers,
        newToday: newUsersToday,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        sold: soldListings,
        newToday: newListingsToday,
      },
      escrows: {
        total: totalEscrows,
        active: activeEscrows,
        completed: completedEscrows,
        disputed: disputedEscrows,
        volume: Number(escrowVolume._sum.amount || 0),
      },
      transactions: {
        total: totalTransactions,
        volume: Number(transactionVolume._sum.amount || 0),
        fees: Number(platformFees._sum.platformFee || 0),
      },
    };
  }

  /**
   * Get all users
   */
  async getUsers(
    options: {
      status?: UserStatus;
      role?: UserRole;
      campusId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ users: unknown[]; total: number }> {
    const { status, role, campusId, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(role && { role }),
      ...(campusId && { campusId }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          campus: {
            select: { name: true },
          },
          verification: {
            select: { status: true },
          },
          _count: {
            select: { listings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        campus: true,
        verification: true,
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        escrowAsBuyer: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            listing: {
              select: { title: true },
            },
          },
        },
        escrowAsSeller: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            listing: {
              select: { title: true },
            },
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        walletBalance: true,
      },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    return user;
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason: string, adminId: string): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ApiError(403, 'CANNOT_SUSPEND_ADMIN', 'Cannot suspend admin users');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    // Notify user
    await notificationService.notifySuspension(userId, reason);

    // Clear cache
    await cacheService.del(`user:${userId}`);

    logger.info(`User ${userId} suspended by admin ${adminId}. Reason: ${reason}`);

    return updatedUser;
  }

  /**
   * Ban user
   */
  async banUser(userId: string, reason: string, adminId: string): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ApiError(403, 'CANNOT_BAN_ADMIN', 'Cannot ban admin users');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.BANNED },
    });

    // Notify user
    await notificationService.createNotification({
      userId,
      type: 'SYSTEM',
      title: 'Account Banned',
      message: `Your account has been banned. Reason: ${reason}`,
      data: { reason },
    });

    // Clear cache
    await cacheService.del(`user:${userId}`);

    logger.info(`User ${userId} banned by admin ${adminId}. Reason: ${reason}`);

    return updatedUser;
  }

  /**
   * Unban user
   */
  async unbanUser(userId: string, adminId: string): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.VERIFIED },
    });

    // Notify user
    await notificationService.createNotification({
      userId,
      type: 'SYSTEM',
      title: 'Account Reinstated',
      message: 'Your account has been reinstated. You can now use Ahia again.',
    });

    // Clear cache
    await cacheService.del(`user:${userId}`);

    logger.info(`User ${userId} unbanned by admin ${adminId}`);

    return updatedUser;
  }

  /**
   * Add strike to user
   */
  async addStrike(userId: string, reason: string, adminId: string): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    const newStrikeCount = user.strikes + 1;
    let status = user.status;

    // Apply strike rules
    if (newStrikeCount >= 4) {
      status = UserStatus.BANNED;
    } else if (newStrikeCount >= 2) {
      status = UserStatus.SUSPENDED;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        strikes: newStrikeCount,
        status,
      },
    });

    // Notify user
    await notificationService.notifyStrike(userId, newStrikeCount, reason);

    // Clear cache
    await cacheService.del(`user:${userId}`);

    logger.info(`Strike added to user ${userId} by admin ${adminId}. Count: ${newStrikeCount}`);

    return updatedUser;
  }

  /**
   * Get disputes
   */
  async getDisputes(
    options: {
      status?: DisputeStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ disputes: unknown[]; total: number }> {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
    };

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          escrow: {
            include: {
              listing: {
                select: { title: true },
              },
              buyer: {
                select: { firstName: true, lastName: true, email: true },
              },
              seller: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          raisedBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return { disputes, total };
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER',
    notes: string,
    adminId: string
  ): Promise<unknown> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        escrow: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!dispute) {
      throw Errors.NOT_FOUND('Dispute');
    }

    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new ApiError(400, 'DISPUTE_CLOSED', 'Dispute is already resolved');
    }

    const updatedDispute = await prisma.$transaction(async (tx) => {
      // Update dispute
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: resolution,
          resolution: notes,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      });

      // Update escrow based on resolution
      if (resolution === 'RESOLVED_BUYER') {
        await tx.escrow.update({
          where: { id: dispute.escrowId },
          data: { status: EscrowStatus.REFUNDED, refundedAt: new Date() },
        });
      } else {
        await tx.escrow.update({
          where: { id: dispute.escrowId },
          data: { status: EscrowStatus.COMPLETED, completedAt: new Date() },
        });
      }

      return updated;
    });

    // Notify parties
    const winnerId = resolution === 'RESOLVED_BUYER' ? dispute.escrow.buyerId : dispute.escrow.sellerId;
    const loserId = resolution === 'RESOLVED_BUYER' ? dispute.escrow.sellerId : dispute.escrow.buyerId;

    await notificationService.createNotification({
      userId: winnerId,
      type: 'ESCROW',
      title: 'Dispute Resolved in Your Favor',
      message: `The dispute for "${dispute.escrow.listing.title}" has been resolved in your favor.`,
    });

    await notificationService.createNotification({
      userId: loserId,
      type: 'ESCROW',
      title: 'Dispute Resolved',
      message: `The dispute for "${dispute.escrow.listing.title}" has been resolved.`,
    });

    logger.info(`Dispute ${disputeId} resolved by admin ${adminId}: ${resolution}`);

    return updatedDispute;
  }

  /**
   * Create campus
   */
  async createCampus(input: CampusInput): Promise<unknown> {
    const existingCampus = await prisma.campus.findFirst({
      where: {
        OR: [{ subdomain: input.subdomain }, { slug: input.slug }],
      },
    });

    if (existingCampus) {
      throw new ApiError(409, 'CAMPUS_EXISTS', 'Campus with this subdomain or slug already exists');
    }

    const campus = await prisma.campus.create({
      data: input,
    });

    logger.info(`Campus created: ${campus.id}`);

    return campus;
  }

  /**
   * Update campus
   */
  async updateCampus(campusId: string, input: Partial<CampusInput>): Promise<unknown> {
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
    });

    if (!campus) {
      throw Errors.NOT_FOUND('Campus');
    }

    const updatedCampus = await prisma.campus.update({
      where: { id: campusId },
      data: input,
    });

    // Clear cache
    await cacheService.del(`campus:subdomain:${campus.subdomain}`);

    logger.info(`Campus updated: ${campusId}`);

    return updatedCampus;
  }

  /**
   * Create swap spot
   */
  async createSwapSpot(input: SwapSpotInput): Promise<unknown> {
    const campus = await prisma.campus.findUnique({
      where: { id: input.campusId },
    });

    if (!campus) {
      throw Errors.NOT_FOUND('Campus');
    }

    const swapSpot = await prisma.swapSpot.create({
      data: input,
    });

    logger.info(`Swap spot created: ${swapSpot.id}`);

    return swapSpot;
  }

  /**
   * Get all campuses
   */
  async getCampuses(): Promise<unknown[]> {
    return prisma.campus.findMany({
      include: {
        _count: {
          select: { users: true, listings: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export const adminService = new AdminService();
export default adminService;
