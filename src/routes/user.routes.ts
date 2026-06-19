import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, apiRateLimiter } from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user's public profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       404:
 *         description: User not found
 */
router.get('/:id', apiRateLimiter, userController.getUserProfile);

/**
 * @swagger
 * /users/{id}/listings:
 *   get:
 *     summary: Get all listings by a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User listings retrieved
 */
router.get('/:id/listings', apiRateLimiter, userController.getUserListings);

/**
 * @swagger
 * /users/{id}/ratings:
 *   get:
 *     summary: Get all ratings/reviews for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User ratings retrieved
 */
router.get('/:id/ratings', apiRateLimiter, userController.getUserRatings);

// ============================================
// Protected routes
// ============================================
router.use(authenticate);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               displayName:
 *                 type: string
 *               bio:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       403:
 *         description: Not authorized
 */
router.put('/:id', userController.updateUserProfile);

/**
 * @swagger
 * /users/{id}/verify:
 *   post:
 *     summary: Resend verification reminder
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Verification reminder sent
 */
router.post('/:id/verify', userController.resendVerification);

export default router;
