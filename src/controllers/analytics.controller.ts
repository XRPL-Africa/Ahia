import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { uuidParamSchema } from '../validators/index.js';

export const analyticsController = {
  /**
   * POST /api/analytics/event
   * Track an analytics event
   */
  trackEvent: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { event, entityType, entityId, properties } = req.body;

    if (!event || typeof event !== 'string') {
      res.status(400).json({
        success: false,
        message: 'event name is required',
        error: { code: 'VALIDATION_ERROR', message: 'event field is required' },
      });
      return;
    }

    await analyticsService.trackEvent({
      userId: req.user?.id,
      event,
      entityType,
      entityId,
      properties,
      ipAddress: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked',
    });
  }),

  /**
   * GET /api/analytics/dashboard
   * Platform-wide analytics dashboard (admin only)
   */
  getDashboard: asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await analyticsService.getDashboard();

    res.json({
      success: true,
      message: 'Analytics dashboard retrieved',
      data: { stats },
    });
  }),

  /**
   * GET /api/analytics/user/:id
   * Activity stats for a specific user (admin or self)
   */
  getUserActivity: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);

    // Allow self or admins
    if (id !== req.user!.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: { code: 'FORBIDDEN', message: 'You cannot view another user\'s activity' },
      });
      return;
    }

    const activity = await analyticsService.getUserActivity(id);

    res.json({
      success: true,
      message: 'User activity retrieved',
      data: { activity },
    });
  }),

  /**
   * GET /api/analytics/transactions
   * Transaction metrics (admin only)
   */
  getTransactionMetrics: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const campusId = req.query.campusId as string | undefined;

    const metrics = await analyticsService.getTransactionMetrics({
      startDate,
      endDate,
      campusId,
    });

    res.json({
      success: true,
      message: 'Transaction metrics retrieved',
      data: { metrics },
    });
  }),

  /**
   * GET /api/analytics/export
   * Export analytics data as CSV (admin only)
   */
  exportAnalytics: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const type = (req.query.type as string) || 'transactions';

    if (!['transactions', 'users', 'listings'].includes(type)) {
      res.status(400).json({
        success: false,
        message: 'Invalid export type. Use: transactions, users, or listings',
        error: { code: 'INVALID_EXPORT_TYPE', message: 'Invalid type' },
      });
      return;
    }

    const csv = await analyticsService.exportAnalytics(
      type as 'transactions' | 'users' | 'listings'
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ahia-${type}-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  }),
};

export default analyticsController;
