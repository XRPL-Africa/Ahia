import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import {
  authenticate,
  authorize,
  uploadCampusLogo,
  handleUploadError,
} from '../middleware/index.js';
import { issueApiKey, revokeApiKey } from '../middleware/security.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/verify', adminController.verifyUser);
router.delete('/users/:id', adminController.banUser);
router.post('/users/:id/suspend', adminController.suspendUser);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.post('/users/:id/strike', adminController.addStrike);

// Disputes
router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:id/resolve', adminController.resolveDispute);
router.post('/disputes/:id/resolve', adminController.resolveDispute);

// Stats
router.get('/stats', adminController.getDashboardStats);

// Campuses
router.get('/campuses', adminController.getCampuses);
router.post(
  '/campuses',
  uploadCampusLogo.single('logo'),
  handleUploadError,
  adminController.createCampus
);
router.patch('/campuses/:id', adminController.updateCampus);

// Swap spots
router.post('/swap-spots', adminController.createSwapSpot);

/**
 * @swagger
 * /admin/api-keys:
 *   post:
 *     summary: Issue a new API key for a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: API key issued (shown once — store it securely)
 */
router.post('/api-keys', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, message: 'userId is required' });
    return;
  }
  const apiKey = await issueApiKey(userId);
  res.status(201).json({
    success: true,
    message: 'API key issued. Store this securely — it will not be shown again.',
    data: { apiKey },
  });
}));

/**
 * @swagger
 * /admin/api-keys/revoke:
 *   post:
 *     summary: Revoke an API key
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: API key revoked
 */
router.post('/api-keys/revoke', asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    res.status(400).json({ success: false, message: 'apiKey is required' });
    return;
  }
  await revokeApiKey(apiKey);
  res.json({ success: true, message: 'API key revoked successfully' });
}));

export default router;
