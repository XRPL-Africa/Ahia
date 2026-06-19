import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize, apiRateLimiter } from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Platform analytics and reporting
 */

// All analytics routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /analytics/event:
 *   post:
 *     summary: Track an analytics event
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 example: listing_viewed
 *               entityType:
 *                 type: string
 *                 example: listing
 *               entityId:
 *                 type: string
 *               properties:
 *                 type: object
 *     responses:
 *       201:
 *         description: Event tracked
 */
router.post('/event', apiRateLimiter, analyticsController.trackEvent);

/**
 * @swagger
 * /analytics/user/{id}:
 *   get:
 *     summary: Get activity stats for a specific user
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User activity stats
 */
router.get('/user/:id', analyticsController.getUserActivity);

// Admin-only routes below
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get platform-wide analytics dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics dashboard data
 */
router.get('/dashboard', analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/transactions:
 *   get:
 *     summary: Get transaction metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: campusId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction metrics
 */
router.get('/transactions', analyticsController.getTransactionMetrics);

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Export analytics data as CSV
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [transactions, users, listings]
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', analyticsController.exportAnalytics);

export default router;
