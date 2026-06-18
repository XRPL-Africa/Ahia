import { Router } from "express";
import { webhookController }
from "../controllers/webhook.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: XRPL Webhooks
 *   description: XRPL transaction listener
 */

/**
 * @swagger
 * /api/v1/webhooks/health:
 *   get:
 *     summary: Check XRPL webhook listener status
 *     description: Returns the current status of the XRPL websocket listener.
 *     tags:
 *       - XRPL Webhooks
 *     responses:
 *       200:
 *         description: Webhook listener is active.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: listening
 *                     network:
 *                       type: string
 *                       example: XRPL Testnet
 *                     connected:
 *                       type: boolean
 *                       example: true
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-18T16:45:31.221Z"
 */
router.get(
    "/health",
    webhookController.health
);

export default router;