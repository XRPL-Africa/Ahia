import { Router } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import {
  authenticate,
  authorize,
  uploadIdCard,
  handleUploadError,
} from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: KYC and verification endpoints
 */

// Protected routes
router.use(authenticate);

// Submit verification
router.post(
  '/submit',
  uploadIdCard.single('idCard'),
  handleUploadError,
  verificationController.submitVerification
);

// Get my verification status
router.get('/my', verificationController.getMyVerification);

// Admin routes
router.get('/pending', authorize('ADMIN', 'SUPER_ADMIN'), verificationController.getPendingVerifications);
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), verificationController.getVerificationStats);
router.post('/:id/review', authorize('ADMIN', 'SUPER_ADMIN'), verificationController.reviewVerification);

export default router;
