import { Response } from 'express';
import { userService } from '../services/user.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { uuidParamSchema } from '../validators/index.js';
import { updateProfileSchema } from '../validators/index.js';

export const userController = {
  /**
   * GET /api/users/:id
   * Get a user's public profile
   */
  getUserProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const user = await userService.getUserProfile(id);

    res.json({
      success: true,
      message: 'User profile retrieved',
      data: { user },
    });
  }),

  /**
   * PUT /api/users/:id
   * Update a user's profile (own profile or admin)
   */
  updateUserProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await userService.updateUserProfile(
      id,
      req.user!.id,
      req.user!.role,
      validatedData
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  }),

  /**
   * POST /api/users/:id/verify
   * Resend verification reminder to a user
   */
  resendVerification: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);

    // Only the user themselves or an admin
    if (id !== req.user!.id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: { code: 'FORBIDDEN', message: 'You cannot perform this action' },
      });
      return;
    }

    await userService.resendVerification(id);

    res.json({
      success: true,
      message: 'Verification reminder sent',
    });
  }),

  /**
   * GET /api/users/:id/listings
   * Get all listings by a user
   */
  getUserListings: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await userService.getUserListings(id, { page, limit, status });

    res.json({
      success: true,
      message: 'User listings retrieved',
      data: result.listings,
      meta: result.meta,
    });
  }),

  /**
   * GET /api/users/:id/ratings
   * Get all ratings/reviews for a user
   */
  getUserRatings: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.getUserRatings(id, { page, limit });

    res.json({
      success: true,
      message: 'User ratings retrieved',
      data: {
        reviews: result.reviews,
        stats: result.stats,
      },
      meta: result.meta,
    });
  }),
};

export default userController;
