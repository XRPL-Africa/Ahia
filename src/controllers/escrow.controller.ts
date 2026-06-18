import { Request, Response } from 'express';
import { escrowService } from '../services/escrow.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import {
  createEscrowSchema,
  escrowActionSchema,
  freezeEscrowSchema,
  createDisputeSchema,
  uuidParamSchema,
} from '../validators/index.js';

export const escrowController = {
  /**
   * Create a new escrow
   */
  createEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = createEscrowSchema.parse(req.body);
    const escrow = await escrowService.createEscrow(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Escrow created successfully',
      data: { escrow },
    });
  }),

  /**
   * Get escrow by ID
   */
  getEscrowById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const escrow = await escrowService.getEscrowById(id);

    res.json({
      success: true,
      message: 'Escrow retrieved successfully',
      data: { escrow },
    });
  }),

  /**
   * Get user's escrows
   */
  getMyEscrows: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const role = req.query.role as 'buyer' | 'seller' | 'all' | undefined;
    const status = req.query.status as string | undefined;

    const escrows = await escrowService.getUserEscrows(
      req.user!.id,
      role || 'all',
      status as any
    );

    res.json({
      success: true,
      message: 'Escrows retrieved successfully',
      data: { escrows },
    });
  }),

  /**
   * Mark item as handed over (seller action)
   */
  markHandover: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const escrow = await escrowService.markHandover(id, req.user!.id);

    res.json({
      success: true,
      message: 'Item marked as handed over',
      data: { escrow },
    });
  }),

  /**
   * Verify authenticity and release funds (buyer action)
   */
  verifyAndRelease: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const escrow = await escrowService.verifyAndRelease(id, req.user!.id);

    res.json({
      success: true,
      message: 'Item verified and funds released',
      data: { escrow },
    });
  }),

  /**
   * Freeze escrow (buyer requests extension)
   */
  freezeEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = freezeEscrowSchema.parse(req.body);
    const escrow = await escrowService.freezeEscrow(id, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Escrow frozen successfully',
      data: { escrow },
    });
  }),

  /**
   * Open dispute
   */
  openDispute: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = createDisputeSchema.parse(req.body);
    const escrow = await escrowService.openDispute(
      validatedData.escrowId,
      req.user!.id,
      validatedData.reason,
      validatedData.description,
      req.body.evidenceUrls
    );

    res.status(201).json({
      success: true,
      message: 'Dispute opened successfully',
      data: { escrow },
    });
  }),

  /**
   * Cancel escrow
   */
  cancelEscrow: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const escrow = await escrowService.cancelEscrow(id, req.user!.id);

    res.json({
      success: true,
      message: 'Escrow cancelled successfully',
      data: { escrow },
    });
  }),

  /**
   * Initiate payment for escrow
   */
  initiatePayment: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const { paymentMethod } = req.body;

    // This would integrate with Paystack or XRPL
    // For now, just return the escrow details
    const escrow = await escrowService.getEscrowById(id);

    res.json({
      success: true,
      message: 'Payment initiated',
      data: {
        escrow,
        paymentMethod,
        // Add payment instructions based on method
      },
    });
  }),

  /**
   * Handle Paystack webhook
   */
  handlePaystackWebhook: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Verify webhook signature
    // Process payment
    // Update escrow status

    res.status(200).send('OK');
  }),
};

export default escrowController;
