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
 *   description: Escrow, payments, disputes, and lifecycle management
 */

/**
 * @swagger
 * /escrow/webhooks/paystack:
 *   post:
 *     summary: Paystack webhook handler
 *     tags: [Escrow]
 *     description: Handles payment confirmation from Paystack
 */
router.post(
  '/webhooks/paystack',
  webhookRateLimiter,
  escrowController.handlePaystackWebhook
);

router.use(authenticate);

/**
 * @swagger
 * /escrow/my:
 *   get:
 *     summary: Get my escrows
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', escrowController.getMyEscrows);

/**
 * @swagger
 * /escrow:
 *   post:
 *     summary: Create escrow
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireVerified, escrowController.createEscrow);

/**
 * @swagger
 * /escrow/{id}:
 *   get:
 *     summary: Get escrow by ID
 *     tags: [Escrow]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', escrowController.getEscrowById);

/**
 * @swagger
 * /escrow/{id}/handover:
 *   post:
 *     summary: Mark item as handed over
 *     tags: [Escrow]
 */
router.post('/:id/handover', escrowController.markHandover);

/**
 * @swagger
 * /escrow/{id}/verify:
 *   post:
 *     summary: Verify and release funds
 *     tags: [Escrow]
 */
router.post('/:id/verify', escrowController.verifyAndRelease);

/**
 * @swagger
 * /escrow/{id}/freeze:
 *   post:
 *     summary: Freeze escrow
 *     tags: [Escrow]
 */
router.post('/:id/freeze', escrowController.freezeEscrow);

/**
 * @swagger
 * /escrow/{id}/cancel:
 *   post:
 *     summary: Cancel escrow
 *     tags: [Escrow]
 */
router.post('/:id/cancel', escrowController.cancelEscrow);

/**
 * @swagger
 * /escrow/{id}/pay:
 *   post:
 *     summary: Initiate escrow payment
 *     tags: [Escrow]
 */
router.post('/:id/pay', requireVerified, escrowController.initiatePayment);






// router.post('/:id/verify-payment', escrowController.verifyCryptoPayment);

/**
 * @swagger
 * /escrow/disputes:
 *   post:
 *     summary: Open dispute
 *     tags: [Escrow]
 */
router.post(
  '/disputes',
  requireVerified,
  uploadDisputeEvidence.array('evidence', 5),
  handleUploadError,
  escrowController.openDispute
);


console.log(
  "handlePaystackWebhook:",
  typeof escrowController.handlePaystackWebhook
);

// console.log(
// //   "verifyCryptoPayment:",
// //   typeof escrowController.verifyCryptoPayment
// // );

console.log(
  "openDispute:",
  typeof escrowController.openDispute
);

console.log(
  "webhookRateLimiter:",
  typeof webhookRateLimiter
);

console.log(
  "handleUploadError:",
  typeof handleUploadError
);

export default router;