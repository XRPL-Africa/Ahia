import type { NotificationInput } from '../types/index.js';
export declare class NotificationService {
    /**
     * Create a notification
     */
    createNotification(input: NotificationInput): Promise<void>;
    /**
     * Create multiple notifications at once
     */
    createBulkNotifications(userIds: string[], input: Omit<NotificationInput, 'userId'>): Promise<void>;
    /**
     * Get user notifications
     */
    getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{
        notifications: unknown[];
        unreadCount: number;
        total: number;
    }>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string, userId: string): Promise<void>;
    /**
     * Mark all notifications as read
     */
    markAllAsRead(userId: string): Promise<void>;
    /**
     * Get unread count
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Delete old notifications
     */
    cleanupOldNotifications(daysToKeep?: number): Promise<number>;
    /**
     * Notify user of verification status
     */
    notifyVerification(userId: string, status: 'APPROVED' | 'REJECTED', reason?: string): Promise<void>;
    /**
     * Notify seller of new bid
     */
    notifyNewBid(sellerId: string, listingTitle: string, bidAmount: number): Promise<void>;
    /**
     * Notify buyer of bid response
     */
    notifyBidResponse(buyerId: string, listingTitle: string, action: 'ACCEPTED' | 'REJECTED' | 'COUNTERED'): Promise<void>;
    /**
     * Notify escrow status change
     */
    notifyEscrowStatus(userId: string, status: string, listingTitle: string): Promise<void>;
    /**
     * Notify payment received
     */
    notifyPaymentReceived(userId: string, amount: number, listingTitle: string): Promise<void>;
    /**
     * Notify strike received
     */
    notifyStrike(userId: string, strikeCount: number, reason: string): Promise<void>;
    /**
     * Notify account suspension
     */
    notifySuspension(userId: string, reason: string, duration?: string): Promise<void>;
}
export declare const notificationService: NotificationService;
export default notificationService;
//# sourceMappingURL=notification.service.d.ts.map