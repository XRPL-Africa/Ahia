import { Router } from 'express';
import { listingController } from '../controllers/listing.controller.js';
import {
  authenticate,
  optionalAuth,
  requireVerified,
  uploadListingImages,
  handleUploadError,
  apiRateLimiter,
} from '../middleware/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Listings
 *   description: Marketplace listing endpoints
 */

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: List of listings
 */
router.get('/', apiRateLimiter, listingController.getListings);

/**
 * @swagger
 * /listings/campus/{campusId}:
 *   get:
 *     summary: Get listings by campus
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: campusId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campus listings retrieved
 */
router.get('/campus/:campusId', apiRateLimiter, listingController.getCampusListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get a single listing
 *     tags: [Listings]
 */
router.get('/:id', optionalAuth, listingController.getListingById);

// ============================================
// PROTECTED ROUTES
// ============================================

router.use(authenticate);

/**
 * @swagger
 * /listings/my/listings:
 *   get:
 *     summary: Get my listings
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my/listings', listingController.getMyListings);

/**
 * @swagger
 * /listings/my/bids:
 *   get:
 *     summary: Get my bids
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my/bids', listingController.getMyBids);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  requireVerified,
  uploadListingImages.array('images', 5),
  handleUploadError,
  listingController.createListing
);

/**
 * @swagger
 * /listings/{id}:
 *   patch:
 *     summary: Update listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', listingController.updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete listing
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', listingController.deleteListing);

/**
 * @swagger
 * /listings/bids:
 *   post:
 *     summary: Create bid
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bids', requireVerified, listingController.createBid);

/**
 * @swagger
 * /listings/bids/{id}/respond:
 *   patch:
 *     summary: Respond to bid
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/bids/:id/respond', listingController.respondToBid);

export default router;