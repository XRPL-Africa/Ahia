import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: RLUSD Escrow Payments
 */

/**
 * @swagger
 * /api/v1/payments/ping:
 *   get:
 *     summary: Test payments module
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payments module active
 */
router.get("/ping", (_req, res) => {
  res.json({
    success: true,
    message: "payments alive",
  });
});

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/**
 * @swagger
 * /api/v1/payments/create:
 *   post:
 *     summary: Create RLUSD escrow
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - buyerId
 *               - sellerId
 *               - amount
 *             properties:
 *               listingId:
 *                 type: string
 *               buyerId:
 *                 type: string
 *               sellerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 example: CRYPTO_RLUSD
 *     responses:
 *       201:
 *         description: Escrow created
 */
router.post("/create", paymentsController.create);

/**
 * @swagger
 * /api/v1/payments/confirm:
 *   post:
 *     summary: Confirm XRPL payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escrowId
 *               - txHash
 *             properties:
 *               escrowId:
 *                 type: string
 *               txHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post("/confirm", paymentsController.confirm);

/**
 * @swagger
 * /api/v1/payments/status/{id}:
 *   get:
 *     summary: Get escrow status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow status
 */
router.get("/status/:id", paymentsController.status);

/**
 * @swagger
 * /api/v1/payments/refund:
 *   post:
 *     summary: Refund escrow
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - escrowId
 *             properties:
 *               escrowId:
 *                 type: string
 */
router.post("/refund", paymentsController.refund);

/**
 * @swagger
 * /api/v1/payments/balance/{address}:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet balance
 */
router.get("/balance/:address", paymentsController.balance);

/**
 * @swagger
 * /api/v1/payments/history:
 *   get:
 *     summary: Transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User transaction history
 */
router.get("/history", paymentsController.history);

/**
 * @swagger
 * /api/v1/payments/offramp:
 *   post:
 *     summary: Create offramp request
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountRLUSD
 *               - amountNGN
 *               - bankName
 *               - accountName
 *               - accountNumber
 *             properties:
 *               amountRLUSD:
 *                 type: number
 *               amountNGN:
 *                 type: number
 *               bankName:
 *                 type: string
 *               accountName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 */
router.post("/offramp", paymentsController.offramp);

/**
 * @swagger
 * /api/v1/payments/offramp/{id}/approve:
 *   patch:
 *     summary: Approve offramp request
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  "/offramp/:id/approve",
  paymentsController.approveOfframp
);

/**
 * @swagger
 * /api/v1/payments/offramp/{id}/complete:
 *   patch:
 *     summary: Mark offramp request as completed
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch(
  "/offramp/:id/complete",
  paymentsController.completeOfframp
);

export default router;