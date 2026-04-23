import { Router } from 'express';
import { escrowController } from '../controllers/escrow.controller.js';
import {
  authenticate,
  requireVerified,
  uploadDisputeEvidence,
  handleUploadError,
  webhookRateLimiter,
} from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Escrow
 *   description: Escrow and payment endpoints
 */

// Webhook (public but rate limited)
router.post('/webhooks/paystack', webhookRateLimiter, escrowController.handlePaystackWebhook);

// Protected routes
router.use(authenticate);

// Get my escrows
router.get('/my', escrowController.getMyEscrows);

// Create escrow (requires verification)
router.post('/', requireVerified, escrowController.createEscrow);

// Get escrow by ID
router.get('/:id', escrowController.getEscrowById);

// Escrow actions
router.post('/:id/handover', escrowController.markHandover);
router.post('/:id/verify', escrowController.verifyAndRelease);
router.post('/:id/freeze', escrowController.freezeEscrow);
router.post('/:id/cancel', escrowController.cancelEscrow);

// Payment
router.post('/:id/pay', requireVerified, escrowController.initiatePayment);

// Dispute
router.post(
  '/disputes',
  requireVerified,
  uploadDisputeEvidence.array('evidence', 5),
  handleUploadError,
  escrowController.openDispute
);


export default router;
