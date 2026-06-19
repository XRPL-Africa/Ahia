import { Router } from 'express';
import authRoutes from './auth.routes.js';
import listingRoutes from './listing.routes.js';
import escrowRoutes from './escrow.routes.js';
import verificationRoutes from './verification.routes.js';
import adminRoutes from './admin.routes.js';
import xrplRoutes from "./xrpl.routes.js";
import paymentRoutes from "./payments.routes.js";
import webhooksRoutes from "./webhooks.routes.js";
import userRoutes from "./user.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import { searchController } from '../controllers/search.controller.js';
import { apiRateLimiter } from '../middleware/index.js';

const router = Router();

// API version prefix
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    data: {
      version: API_VERSION,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
  });
});

// API routes
router.get("/debug-routes", (_req, res) => {
  res.json({
    payments: true
  });
});

router.use(`/${API_VERSION}/auth`, authRoutes);
router.use(`/${API_VERSION}/users`, userRoutes);
router.use(`/${API_VERSION}/listings`, listingRoutes);
router.use(`/${API_VERSION}/escrow`, escrowRoutes);
router.use(`/${API_VERSION}/verification`, verificationRoutes);
router.use(`/${API_VERSION}/admin`, adminRoutes);
router.use(`/${API_VERSION}/analytics`, analyticsRoutes);
router.use("/xrpl", xrplRoutes);
router.use(`/${API_VERSION}/payments`, paymentRoutes);
router.use(`/${API_VERSION}/webhooks`, webhooksRoutes);

// Standalone category & campus lookup endpoints
router.get(`/${API_VERSION}/categories`, apiRateLimiter, searchController.getCategories);
router.get(`/${API_VERSION}/campuses`, apiRateLimiter, searchController.getCampuses);

// Upload / image processing
import uploadRoutes from './upload.routes.js';
router.use(`/${API_VERSION}/upload`, uploadRoutes);

console.log(paymentRoutes);
export default router;
