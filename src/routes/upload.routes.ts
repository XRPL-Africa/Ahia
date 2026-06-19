import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { imageProcessor, resumableUploadService } from '../utils/imageProcessor.js';
import { cloudinaryService } from '../config/cloudinary.js';
import logger from '../config/logger.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Memory storage — buffer is passed to image processor
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Image upload and CDN management
 */

router.use(authenticate);

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload and process an image (returns all CDN variants)
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 example: listings
 *     responses:
 *       201:
 *         description: Image processed and uploaded
 */
router.post(
  '/image',
  uploadRateLimiter,
  memoryUpload.single('image'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided',
        error: { code: 'NO_FILE', message: 'Attach an image as multipart field "image"' },
      });
      return;
    }

    const folder = (req.body.folder as string) || 'general';
    const allowedFolders = ['listings', 'avatars', 'disputes', 'general'];
    if (!allowedFolders.includes(folder)) {
      res.status(400).json({
        success: false,
        message: `Invalid folder. Allowed: ${allowedFolders.join(', ')}`,
        error: { code: 'INVALID_FOLDER', message: 'Invalid upload folder' },
      });
      return;
    }

    const processed = await imageProcessor.processAndUpload(req.file.buffer, folder);

    res.status(201).json({
      success: true,
      message: 'Image uploaded and processed',
      data: {
        url: processed.url,
        publicId: processed.publicId,
        variants: processed.variants,
      },
    });
  })
);

/**
 * @swagger
 * /upload/thumbnail/{publicId}:
 *   get:
 *     summary: Get thumbnail URL for an already-uploaded image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thumbnail URLs
 */
router.get(
  '/thumbnail/:publicId(*)',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { publicId } = req.params;
    const variants = imageProcessor.generateVariants(publicId);
    const srcset = imageProcessor.getResponsiveSrcset(publicId);
    const blur = imageProcessor.getBlurPlaceholder(publicId);

    res.json({
      success: true,
      message: 'Image variants retrieved',
      data: { variants, srcset, blurPlaceholder: blur },
    });
  })
);

/**
 * @swagger
 * /upload/session:
 *   post:
 *     summary: Create a resumable upload session for large files
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - totalChunks
 *             properties:
 *               filename:
 *                 type: string
 *               folder:
 *                 type: string
 *               totalChunks:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Upload session created
 */
router.post(
  '/session',
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename, folder = 'general', totalChunks } = req.body;

    if (!filename || !totalChunks) {
      res.status(400).json({
        success: false,
        message: 'filename and totalChunks are required',
        error: { code: 'MISSING_FIELDS', message: 'Provide filename and totalChunks' },
      });
      return;
    }

    const sessionId = await resumableUploadService.createSession(
      req.user!.id,
      folder,
      filename,
      parseInt(totalChunks)
    );

    res.status(201).json({
      success: true,
      message: 'Upload session created',
      data: { sessionId },
    });
  })
);

/**
 * @swagger
 * /upload/session/{sessionId}/chunk/{chunkIndex}:
 *   post:
 *     summary: Upload a single chunk of a resumable upload
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chunkIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chunk uploaded
 *       201:
 *         description: All chunks received — image processed
 */
router.post(
  '/session/:sessionId/chunk/:chunkIndex',
  memoryUpload.single('chunk'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { sessionId, chunkIndex } = req.params;

    const session = await resumableUploadService.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        success: false,
        message: 'Upload session not found or expired',
        error: { code: 'SESSION_NOT_FOUND', message: 'Session expired or invalid' },
      });
      return;
    }

    if (session.userId !== req.user!.id) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: { code: 'FORBIDDEN', message: 'This upload session does not belong to you' },
      });
      return;
    }

    const updated = await resumableUploadService.markChunkUploaded(
      sessionId,
      parseInt(chunkIndex)
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    if (resumableUploadService.isComplete(updated) && req.file) {
      // All chunks received — process the final assembled file
      const processed = await imageProcessor.processAndUpload(
        req.file.buffer,
        session.folder
      );
      await resumableUploadService.removeSession(sessionId);

      res.status(201).json({
        success: true,
        message: 'Upload complete — image processed',
        data: {
          url: processed.url,
          publicId: processed.publicId,
          variants: processed.variants,
        },
      });
      return;
    }

    res.json({
      success: true,
      message: `Chunk ${chunkIndex} uploaded`,
      data: {
        uploadedChunks: updated.uploadedChunks.length,
        totalChunks: updated.totalChunks,
        progress: Math.round((updated.uploadedChunks.length / updated.totalChunks) * 100),
      },
    });
  })
);

export default router;
