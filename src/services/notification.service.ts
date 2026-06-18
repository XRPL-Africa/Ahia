import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import { NotificationType } from '@prisma/client';
import type { NotificationInput } from '../types/index.js';

export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(input: NotificationInput): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type as NotificationType,
          title: input.title,
          message: input.message,
          data: input.data || {},
        },
      });

      // Increment unread count in cache
      const cacheKey = `notifications:unread:${input.userId}`;
      await cacheService.incr(cacheKey);

      logger.debug(`Notification created for user ${input.userId}: ${input.title}`);
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  /**
   * Create multiple notifications at once
   */
  async createBulkNotifications(
    userIds: string[],
    input: Omit<NotificationInput, 'userId'>
  ): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: input.type as NotificationType,
          title: input.title,
          message: input.message,
          data: input.data || {},
        })),
      });

      // Increment unread counts
      for (const userId of userIds) {
        const cacheKey = `notifications:unread:${userId}`;
        await cacheService.incr(cacheKey);
      }

      logger.debug(`Bulk notifications created for ${userIds.length} users`);
    } catch (error) {
      logger.error('Error creating bulk notifications:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    notifications: unknown[];
    unreadCount: number;
    total: number;
  }> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    // Update cache with correct unread count
    await cacheService.set(`notifications:unread:${userId}`, unreadCount, 300);

    return {
      notifications,
      unreadCount,
      total,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      return;
    }

    if (!notification.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() },
      });

      // Decrement unread count
      const cacheKey = `notifications:unread:${userId}`;
      const currentCount = await cacheService.get<number>(cacheKey);
      if (currentCount && currentCount > 0) {
        // Use Redis DECR
        const redis = await import('../config/redis.js');
        await redis.redis.decr(cacheKey);
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    // Reset unread count in cache
    await cacheService.set(`notifications:unread:${userId}`, 0, 300);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Try cache first
    const cacheKey = `notifications:unread:${userId}`;
    const cached = await cacheService.get<number>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    // Get from database
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Cache the result
    await cacheService.set(cacheKey, count, 300);

    return count;
  }

  /**
   * Delete old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    logger.info(`Cleaned up ${result.count} old notifications`);
    return result.count;
  }

  // ============================================
  // NOTIFICATION TEMPLATES
  // ============================================

  /**
   * Notify user of verification status
   */
  async notifyVerification(userId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<void> {
    const title = status === 'APPROVED' 
      ? 'Verification Approved!' 
      : 'Verification Rejected';
    
    const message = status === 'APPROVED'
      ? 'Your account has been verified. You can now buy and sell on Ahia!'
      : `Your verification was rejected. Reason: ${reason || 'Please check your documents and try again.'}`;

    await this.createNotification({
      userId,
      type: 'VERIFICATION',
      title,
      message,
      data: { status, reason },
    });
  }

  /**
   * Notify seller of new bid
   */
  async notifyNewBid(sellerId: string, listingTitle: string, bidAmount: number): Promise<void> {
    await this.createNotification({
      userId: sellerId,
      type: 'BID',
      title: 'New Bid Received!',
      message: `Someone bid ${bidAmount} RLUSD on your listing "${listingTitle}"`,
      data: { listingTitle, bidAmount },
    });
  }

  /**
   * Notify buyer of bid response
   */
  async notifyBidResponse(buyerId: string, listingTitle: string, action: 'ACCEPTED' | 'REJECTED' | 'COUNTERED'): Promise<void> {
    const messages = {
      ACCEPTED: `Your bid on "${listingTitle}" was accepted! Proceed to payment.`,
      REJECTED: `Your bid on "${listingTitle}" was rejected.`,
      COUNTERED: `The seller made a counter offer on "${listingTitle}".`,
    };

    await this.createNotification({
      userId: buyerId,
      type: 'BID',
      title: `Bid ${action}`,
      message: messages[action],
      data: { listingTitle, action },
    });
  }

  /**
   * Notify escrow status change
   */
  async notifyEscrowStatus(
    userId: string,
    status: string,
    listingTitle: string
  ): Promise<void> {
    const messages: Record<string, string> = {
      COMMITTED: `Payment received for "${listingTitle}". Please arrange handover.`,
      PENDING_INSPECTION: `Item "${listingTitle}" marked as handed over. Please verify authenticity.`,
      COMPLETED: `Escrow completed for "${listingTitle}". Funds released to seller.`,
      REFUNDED: `Escrow cancelled for "${listingTitle}". Funds refunded.`,
      DISPUTED: `A dispute has been opened for "${listingTitle}".`,
    };

    await this.createNotification({
      userId,
      type: 'ESCROW',
      title: 'Escrow Update',
      message: messages[status] || `Escrow status updated for "${listingTitle}"`,
      data: { status, listingTitle },
    });
  }

  /**
   * Notify payment received
   */
  async notifyPaymentReceived(userId: string, amount: number, listingTitle: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'PAYMENT',
      title: 'Payment Received!',
      message: `You received ${amount} RLUSD for "${listingTitle}"`,
      data: { amount, listingTitle },
    });
  }

  /**
   * Notify strike received
   */
  async notifyStrike(userId: string, strikeCount: number, reason: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SYSTEM',
      title: `Strike ${strikeCount} Received`,
      message: `You received a strike. Reason: ${reason}. ${strikeCount >= 4 ? 'Your account has been banned.' : `${4 - strikeCount} more strikes will result in a ban.`}`,
      data: { strikeCount, reason },
    });
  }

  /**
   * Notify account suspension
   */
  async notifySuspension(userId: string, reason: string, duration?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'SYSTEM',
      title: 'Account Suspended',
      message: `Your account has been suspended${duration ? ` for ${duration}` : ''}. Reason: ${reason}`,
      data: { reason, duration },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
