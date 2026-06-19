import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import { Prisma } from '@prisma/client';

// ============================================
// TYPES
// ============================================

export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  event: string;
  entityType?: string;
  entityId?: string;
  properties?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface DashboardStats {
  users: {
    total: number;
    verified: number;
    newThisWeek: number;
    growthRate: number; // percentage vs previous week
  };
  listings: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  transactions: {
    total: number;
    volume: number;
    completedThisWeek: number;
    volumeThisWeek: number;
  };
  escrows: {
    total: number;
    active: number;
    successRate: number; // percentage
    avgCompletionDays: number;
  };
  disputes: {
    total: number;
    open: number;
    resolvedThisWeek: number;
  };
}

export interface UserActivityStats {
  userId: string;
  listingsCreated: number;
  listingsSold: number;
  bidsPlaced: number;
  bidsWon: number;
  totalPurchases: number;
  totalSales: number;
  totalSpent: number;
  totalEarned: number;
  reviewsReceived: number;
  averageRating: number;
  lastActive: Date | null;
  joinedAt: Date;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  volumeByMethod: Record<string, number>;
  volumeByDay: { date: string; volume: number; count: number }[];
  topCategories: { category: string; volume: number; count: number }[];
}

// ============================================
// SERVICE
// ============================================

export class AnalyticsService {
  private readonly ANALYTICS_CACHE_TTL = 300; // 5 minutes

  /**
   * Track an analytics event — stored in the AuditLog table
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: event.userId,
          action: event.event,
          entityType: event.entityType || 'event',
          entityId: event.entityId,
          newValue: event.properties as Prisma.InputJsonValue,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch (error) {
      // Analytics tracking should never crash the application
      logger.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Get platform-wide analytics dashboard
   */
  async getDashboard(): Promise<DashboardStats> {
    const cacheKey = 'analytics:dashboard';
    const cached = await cacheService.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      verifiedUsers,
      newUsersThisWeek,
      newUsersPrevWeek,
      totalListings,
      activeListings,
      newListingsThisWeek,
      totalTransactions,
      transactionVolume,
      transactionsThisWeek,
      volumeThisWeek,
      totalEscrows,
      activeEscrows,
      completedEscrows,
      totalDisputes,
      openDisputes,
      resolvedThisWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'VERIFIED' } }),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.transaction.count({
        where: { status: 'COMPLETED', createdAt: { gte: oneWeekAgo } },
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: oneWeekAgo } },
        _sum: { amount: true },
      }),
      prisma.escrow.count(),
      prisma.escrow.count({
        where: { status: { in: ['COMMITTED', 'PENDING_INSPECTION', 'FROZEN'] } },
      }),
      prisma.escrow.count({ where: { status: 'COMPLETED' } }),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.dispute.count({
        where: {
          status: { in: ['RESOLVED_BUYER', 'RESOLVED_SELLER', 'CLOSED'] },
          resolvedAt: { gte: oneWeekAgo },
        },
      }),
    ]);

    // Calculate escrow average completion days
    const completedEscrowsData = await prisma.escrow.findMany({
      where: { status: 'COMPLETED', completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
      take: 100,
      orderBy: { completedAt: 'desc' },
    });

    let avgCompletionDays = 0;
    if (completedEscrowsData.length > 0) {
      const totalDays = completedEscrowsData.reduce((sum, e) => {
        const days =
          (e.completedAt!.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgCompletionDays = Math.round(totalDays / completedEscrowsData.length);
    }

    const growthRate =
      newUsersPrevWeek > 0
        ? Math.round(((newUsersThisWeek - newUsersPrevWeek) / newUsersPrevWeek) * 100)
        : 0;

    const successRate =
      totalEscrows > 0 ? Math.round((completedEscrows / totalEscrows) * 100) : 0;

    const result: DashboardStats = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        newThisWeek: newUsersThisWeek,
        growthRate,
      },
      listings: {
        total: totalListings,
        active: activeListings,
        newThisWeek: newListingsThisWeek,
      },
      transactions: {
        total: totalTransactions,
        volume: Number(transactionVolume._sum.amount || 0),
        completedThisWeek: transactionsThisWeek,
        volumeThisWeek: Number(volumeThisWeek._sum.amount || 0),
      },
      escrows: {
        total: totalEscrows,
        active: activeEscrows,
        successRate,
        avgCompletionDays,
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
        resolvedThisWeek,
      },
    };

    await cacheService.set(cacheKey, result, this.ANALYTICS_CACHE_TTL);
    return result;
  }

  /**
   * Get activity stats for a specific user
   */
  async getUserActivity(userId: string): Promise<UserActivityStats> {
    const cacheKey = `analytics:user:${userId}`;
    const cached = await cacheService.get<UserActivityStats>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            bids: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const [
      soldListings,
      wonBids,
      purchaseAggregate,
      saleAggregate,
      reviewAggregate,
    ] = await Promise.all([
      prisma.listing.count({ where: { sellerId: userId, status: 'SOLD' } }),
      prisma.bid.count({ where: { buyerId: userId, status: 'ACCEPTED' } }),
      prisma.transaction.aggregate({
        where: { buyerId: userId, status: 'COMPLETED', type: 'ESCROW_RELEASE' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: { sellerId: userId, status: 'COMPLETED', type: 'ESCROW_RELEASE' },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
      }),
    ]);

    const result: UserActivityStats = {
      userId,
      listingsCreated: user._count.listings,
      listingsSold: soldListings,
      bidsPlaced: user._count.bids,
      bidsWon: wonBids,
      totalPurchases: purchaseAggregate._count.id,
      totalSales: saleAggregate._count.id,
      totalSpent: Number(purchaseAggregate._sum.amount || 0),
      totalEarned: Number(saleAggregate._sum.amount || 0),
      reviewsReceived: user._count.reviewsReceived,
      averageRating: Number((reviewAggregate._avg.rating || 0).toFixed(2)),
      lastActive: user.lastLoginAt,
      joinedAt: user.createdAt,
    };

    await cacheService.set(cacheKey, result, this.ANALYTICS_CACHE_TTL);
    return result;
  }

  /**
   * Get transaction metrics
   */
  async getTransactionMetrics(options: {
    startDate?: Date;
    endDate?: Date;
    campusId?: string;
  } = {}): Promise<TransactionMetrics> {
    const { startDate, endDate, campusId } = options;

    const baseWhere: Prisma.TransactionWhereInput = {
      status: 'COMPLETED',
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    };

    // Total & volume
    const [totals, methodBreakdown] = await Promise.all([
      prisma.transaction.aggregate({
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        where: { ...baseWhere, paymentMethod: { not: null } },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Volume by day — last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTransactions = await prisma.transaction.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: startDate || thirtyDaysAgo },
      },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyMap = new Map<string, { volume: number; count: number }>();
    dailyTransactions.forEach((t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { volume: 0, count: 0 };
      dailyMap.set(date, {
        volume: existing.volume + Number(t.amount),
        count: existing.count + 1,
      });
    });

    const volumeByDay = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      volume: Math.round(data.volume * 100) / 100,
      count: data.count,
    }));

    // Top categories by transaction volume
    const escrowsWithCategories = await prisma.escrow.findMany({
      where: { status: 'COMPLETED' },
      select: {
        amount: true,
        listing: { select: { category: true } },
      },
      take: 500,
      orderBy: { completedAt: 'desc' },
    });

    const categoryMap = new Map<string, { volume: number; count: number }>();
    escrowsWithCategories.forEach((e) => {
      const cat = e.listing.category;
      const existing = categoryMap.get(cat) || { volume: 0, count: 0 };
      categoryMap.set(cat, {
        volume: existing.volume + Number(e.amount),
        count: existing.count + 1,
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        volume: Math.round(data.volume * 100) / 100,
        count: data.count,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    // Volume by payment method
    const volumeByMethod: Record<string, number> = {};
    methodBreakdown.forEach((m) => {
      if (m.paymentMethod) {
        volumeByMethod[m.paymentMethod] = Number(m._sum.amount || 0);
      }
    });

    return {
      totalTransactions: totals._count.id,
      totalVolume: Number(totals._sum.amount || 0),
      averageTransactionValue: Number((totals._avg.amount || 0).toFixed(2)),
      volumeByMethod,
      volumeByDay,
      topCategories,
    };
  }

  /**
   * Export analytics data as CSV string
   */
  async exportAnalytics(type: 'transactions' | 'users' | 'listings'): Promise<string> {
    if (type === 'transactions') {
      const transactions = await prisma.transaction.findMany({
        where: { status: 'COMPLETED' },
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          completedAt: true,
          buyer: { select: { email: true } },
          seller: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      const rows = [
        'id,type,amount,currency,paymentMethod,status,buyerEmail,sellerEmail,createdAt,completedAt',
      ];
      transactions.forEach((t) => {
        rows.push(
          [
            t.id,
            t.type,
            t.amount,
            t.currency,
            t.paymentMethod || '',
            t.status,
            t.buyer?.email || '',
            t.seller?.email || '',
            t.createdAt.toISOString(),
            t.completedAt?.toISOString() || '',
          ].join(',')
        );
      });
      return rows.join('\n');
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          trustScore: true,
          successfulTrades: true,
          totalTrades: true,
          createdAt: true,
          lastLoginAt: true,
          campus: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      const rows = [
        'id,email,firstName,lastName,campus,role,status,trustScore,successfulTrades,totalTrades,createdAt,lastLoginAt',
      ];
      users.forEach((u) => {
        rows.push(
          [
            u.id,
            u.email,
            u.firstName,
            u.lastName,
            u.campus.name,
            u.role,
            u.status,
            u.trustScore,
            u.successfulTrades,
            u.totalTrades,
            u.createdAt.toISOString(),
            u.lastLoginAt?.toISOString() || '',
          ].join(',')
        );
      });
      return rows.join('\n');
    }

    if (type === 'listings') {
      const listings = await prisma.listing.findMany({
        select: {
          id: true,
          title: true,
          category: true,
          condition: true,
          listingType: true,
          buyNowPrice: true,
          status: true,
          viewCount: true,
          bidCount: true,
          createdAt: true,
          campus: { select: { name: true } },
          seller: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      });

      const rows = [
        'id,title,category,condition,listingType,price,status,views,bids,campus,seller,createdAt',
      ];
      listings.forEach((l) => {
        rows.push(
          [
            l.id,
            `"${l.title.replace(/"/g, '""')}"`,
            l.category,
            l.condition,
            l.listingType,
            l.buyNowPrice || '',
            l.status,
            l.viewCount,
            l.bidCount,
            l.campus.name,
            l.seller.email,
            l.createdAt.toISOString(),
          ].join(',')
        );
      });
      return rows.join('\n');
    }

    throw new Error('Invalid export type');
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
