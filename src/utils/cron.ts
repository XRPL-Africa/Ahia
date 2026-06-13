import { CronJob } from 'cron';
import { listingService } from '../services/listing.service.js';
import { escrowService } from '../services/escrow.service.js';
import { notificationService } from '../services/notification.service.js';
import logger from '../config/logger.js';

/**
 * Cron job to process expired listings
 * Runs every hour
 */
export const processExpiredListingsJob = new CronJob(
  '0 * * * *', // Every hour
  async () => {
    try {
      logger.info('Running expired listings cron job...');
      const count = await listingService.processExpiredListings();
      logger.info(`Processed ${count} expired listings`);
    } catch (error) {
      logger.error('Error in expired listings cron job:', error);
    }
  },
  null,
  false, // Don't start automatically
  'Africa/Lagos'
);

/**
 * Cron job to process expired escrows
 * Runs every 30 minutes
 */
export const processExpiredEscrowsJob = new CronJob(
  '*/30 * * * *', // Every 30 minutes
  async () => {
    try {
      logger.info('Running expired escrows cron job...');
      const count = await escrowService.processExpiredEscrows();
      logger.info(`Processed ${count} expired escrows`);
    } catch (error) {
      logger.error('Error in expired escrows cron job:', error);
    }
  },
  null,
  false,
  'Africa/Lagos'
);

/**
 * Cron job to clean up old notifications
 * Runs daily at midnight
 */
export const cleanupNotificationsJob = new CronJob(
  '0 0 * * *', // Daily at midnight
  async () => {
    try {
      logger.info('Running notification cleanup cron job...');
      const count = await notificationService.cleanupOldNotifications(30);
      logger.info(`Cleaned up ${count} old notifications`);
    } catch (error) {
      logger.error('Error in notification cleanup cron job:', error);
    }
  },
  null,
  false,
  'Africa/Lagos'
);

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
  processExpiredListingsJob.start();
  processExpiredEscrowsJob.start();
  cleanupNotificationsJob.start();

  logger.info('Cron jobs started');
}

/**
 * Stop all cron jobs
 */
export function stopCronJobs(): void {
  processExpiredListingsJob.stop();
  processExpiredEscrowsJob.stop();
  cleanupNotificationsJob.stop();

  logger.info('Cron jobs stopped');
}

export default {
  startCronJobs,
  stopCronJobs,
  processExpiredListingsJob,
  processExpiredEscrowsJob,
  cleanupNotificationsJob,
};
