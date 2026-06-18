import { Request, Response } from 'express';
import { verificationService } from '../services/verification.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { verificationSubmitSchema, verificationReviewSchema, uuidParamSchema } from '../validators/index.js';
import { processUploadedFile } from '../middleware/upload.js';

export const verificationController = {
  /**
   * Submit verification documents
   */
  submitVerification: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = verificationSubmitSchema.parse(req.body);
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'ID card image is required',
        error: { code: 'ID_CARD_REQUIRED', message: 'Please upload your ID card' },
      });
      return;
    }

    const { url, publicId } = processUploadedFile(file);

    const verification = await verificationService.submitVerification(req.user!.id, {
      idCardUrl: url,
      idCardPublicId: publicId,
      portalScreenshotUrl: validatedData.portalScreenshotUrl,
      studentIdNumber: validatedData.studentIdNumber,
    });

    res.status(201).json({
      success: true,
      message: 'Verification submitted successfully',
      data: { verification },
    });
  }),

  /**
   * Get my verification status
   */
  getMyVerification: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const verification = await verificationService.getVerificationByUserId(req.user!.id);

    res.json({
      success: true,
      message: 'Verification status retrieved',
      data: { verification },
    });
  }),

  /**
   * Get pending verifications (admin only)
   */
  getPendingVerifications: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await verificationService.getPendingVerifications(page, limit);

    res.json({
      success: true,
      message: 'Pending verifications retrieved',
      data: result.verifications,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  }),

  /**
   * Review verification (admin only)
   */
  reviewVerification: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = verificationReviewSchema.parse(req.body);
    const adminId = (req as unknown as { user: { id: string } }).user.id;

    const verification = await verificationService.reviewVerification(
      id,
      adminId,
      validatedData
    );

    res.json({
      success: true,
      message: `Verification ${validatedData.status.toLowerCase()}`,
      data: { verification },
    });
  }),

  /**
   * Get verification statistics (admin only)
   */
  getVerificationStats: asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await verificationService.getVerificationStats();

    res.json({
      success: true,
      message: 'Verification statistics retrieved',
      data: { stats },
    });
  }),
};

export default verificationController;
