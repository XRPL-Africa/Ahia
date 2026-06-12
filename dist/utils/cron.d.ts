import { CronJob } from 'cron';
/**
 * Cron job to process expired listings
 * Runs every hour
 */
export declare const processExpiredListingsJob: CronJob<null, null>;
/**
 * Cron job to process expired escrows
 * Runs every 30 minutes
 */
export declare const processExpiredEscrowsJob: CronJob<null, null>;
/**
 * Cron job to clean up old notifications
 * Runs daily at midnight
 */
export declare const cleanupNotificationsJob: CronJob<null, null>;
/**
 * Start all cron jobs
 */
export declare function startCronJobs(): void;
/**
 * Stop all cron jobs
 */
export declare function stopCronJobs(): void;
declare const _default: {
    startCronJobs: typeof startCronJobs;
    stopCronJobs: typeof stopCronJobs;
    processExpiredListingsJob: CronJob<null, null>;
    processExpiredEscrowsJob: CronJob<null, null>;
    cleanupNotificationsJob: CronJob<null, null>;
};
export default _default;
//# sourceMappingURL=cron.d.ts.map