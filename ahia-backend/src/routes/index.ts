import { Router } from 'express';
import authRoutes from './auth.routes.js';
import listingRoutes from './listing.routes.js';
import escrowRoutes from './escrow.routes.js';
import verificationRoutes from './verification.routes.js';
import adminRoutes from './admin.routes.js';

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
router.use(`/${API_VERSION}/auth`, authRoutes);
router.use(`/${API_VERSION}/listings`, listingRoutes);
router.use(`/${API_VERSION}/escrow`, escrowRoutes);
router.use(`/${API_VERSION}/verification`, verificationRoutes);
router.use(`/${API_VERSION}/admin`, adminRoutes);

export default router;
