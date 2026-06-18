import { Router } from "express";
import xrplService from "../config/xrpl.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: XRPL
 *   description: XRP Ledger payment operations
 */

/**
 * @swagger
 * /xrpl/pay:
 *   post:
 *     summary: Send XRPL payment (RLUSD/XRP)
 *     tags: [XRPL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destination
 *               - amount
 *             properties:
 *               destination:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successful
 */
router.post("/pay", async (req, res) => {
  try {
    const { destination, amount } = req.body;

    const txHash = await xrplService.issueRLUSD(destination, amount);

    res.json({
      success: true,
      txHash,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;