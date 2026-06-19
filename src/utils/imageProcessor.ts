import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryService } from '../config/cloudinary.js';
import logger from '../config/logger.js';

// ============================================
// TYPES
// ============================================

export interface ImageVariant {
  original: string;
  thumbnail: string;   // 300×300
  medium: string;      // 800px wide
  large: string;       // 1200px wide
  webp: string;        // Auto-converted WebP
}

export interface ProcessedImage {
  url: string;
  publicId: string;
  variants: ImageVariant;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface CompressionOptions {
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  progressive?: boolean;
}

// ============================================
// IMAGE PROCESSING PIPELINE
// ============================================

export class ImageProcessor {
  /**
   * Upload and process an image from a buffer with full compression pipeline
   * Generates multiple variants (thumbnail, medium, large, webp)
   */
  async processAndUpload(
    buffer: Buffer,
    folder: string,
    options: CompressionOptions = {}
  ): Promise<ProcessedImage> {
    const {
      quality = 'auto:good',
      maxWidth = 1600,
      format = 'auto',
    } = options;

    // Upload with aggressive optimization transformations
    const uploadOptions: Record<string, unknown> = {
      folder: `ahia/${folder}`,
      transformation: [
        // Step 1: Resize to max dimensions while maintaining aspect ratio
        { width: maxWidth, crop: 'limit' },
        // Step 2: Auto quality compression
        { quality, fetch_format: format },
      ],
      resource_type: 'image',
      // Enable progressive JPEG for faster perceived load
      flags: 'progressive',
    };

    const result = await cloudinaryService.uploadBuffer(buffer, folder, uploadOptions);

    // Generate CDN variants — these are URL-based, no extra upload needed
    // Cloudinary generates them on-the-fly from the original
    const variants = this.generateVariants(result.publicId);

    logger.info(`Image processed and uploaded: ${result.publicId}`);

    return {
      url: result.url,
      publicId: result.publicId,
      variants,
    };
  }

  /**
   * Generate all CDN variant URLs for an already-uploaded image
   * Cloudinary transforms images on-the-fly via URL parameters
   */
  generateVariants(publicId: string): ImageVariant {
    return {
      // Original with auto quality
      original: cloudinary.url(publicId, {
        secure: true,
        quality: 'auto:good',
        fetch_format: 'auto',
      }),

      // Thumbnail: 300×300 center crop, ultra compressed
      thumbnail: cloudinary.url(publicId, {
        secure: true,
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto:eco',
        fetch_format: 'auto',
      }),

      // Medium: 800px wide, aspect-ratio preserved
      medium: cloudinary.url(publicId, {
        secure: true,
        width: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
      }),

      // Large: 1200px wide, aspect-ratio preserved
      large: cloudinary.url(publicId, {
        secure: true,
        width: 1200,
        crop: 'limit',
        quality: 'auto:best',
        fetch_format: 'auto',
      }),

      // WebP variant for modern browsers
      webp: cloudinary.url(publicId, {
        secure: true,
        width: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'webp',
      }),
    };
  }

  /**
   * Generate a secure Cloudinary CDN URL with cache-busting
   */
  getCdnUrl(publicId: string, options: Record<string, unknown> = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }

  /**
   * Get responsive image srcset for a listing image
   * Returns a srcset string for use in <img srcset="...">
   */
  getResponsiveSrcset(publicId: string): string {
    const widths = [320, 640, 800, 1080, 1200, 1600];
    return widths
      .map((w) => {
        const url = cloudinary.url(publicId, {
          secure: true,
          width: w,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        });
        return `${url} ${w}w`;
      })
      .join(', ');
  }

  /**
   * Get blur placeholder URL — tiny 20px image for blur-up loading
   */
  getBlurPlaceholder(publicId: string): string {
    return cloudinary.url(publicId, {
      secure: true,
      width: 20,
      quality: 10,
      fetch_format: 'auto',
      effect: 'blur:300',
    });
  }

  /**
   * Process listing images — adds thumbnail and CDN variants to each image
   */
  enrichListingImages(
    images: { url: string; publicId: string; order: number }[]
  ): Array<{ url: string; publicId: string; order: number; variants: ImageVariant }> {
    return images.map((img) => ({
      ...img,
      variants: this.generateVariants(img.publicId),
    }));
  }

  /**
   * Batch delete images from Cloudinary CDN
   */
  async deleteImages(publicIds: string[]): Promise<void> {
    if (!publicIds.length) return;
    try {
      await cloudinary.api.delete_resources(publicIds);
      logger.info(`Deleted ${publicIds.length} images from CDN`);
    } catch (error) {
      logger.error('Failed to delete images from CDN:', error);
      throw error;
    }
  }
}

// ============================================
// UPLOAD RESUMABILITY TRACKER
// ============================================

import { cacheService } from '../config/redis.js';

export interface UploadSession {
  sessionId: string;
  userId: string;
  folder: string;
  filename: string;
  totalChunks: number;
  uploadedChunks: number[];
  expiresAt: number;
}

export class ResumableUploadService {
  private readonly SESSION_TTL = 60 * 60; // 1 hour

  /**
   * Initialise a resumable upload session
   */
  async createSession(
    userId: string,
    folder: string,
    filename: string,
    totalChunks: number
  ): Promise<string> {
    const sessionId = `upload_${userId}_${Date.now()}`;
    const session: UploadSession = {
      sessionId,
      userId,
      folder,
      filename,
      totalChunks,
      uploadedChunks: [],
      expiresAt: Date.now() + this.SESSION_TTL * 1000,
    };

    await cacheService.set(`upload:session:${sessionId}`, session, this.SESSION_TTL);
    return sessionId;
  }

  /**
   * Mark a chunk as uploaded
   */
  async markChunkUploaded(sessionId: string, chunkIndex: number): Promise<UploadSession | null> {
    const session = await cacheService.get<UploadSession>(`upload:session:${sessionId}`);
    if (!session) return null;

    if (!session.uploadedChunks.includes(chunkIndex)) {
      session.uploadedChunks.push(chunkIndex);
    }

    await cacheService.set(`upload:session:${sessionId}`, session, this.SESSION_TTL);
    return session;
  }

  /**
   * Get upload session
   */
  async getSession(sessionId: string): Promise<UploadSession | null> {
    return cacheService.get<UploadSession>(`upload:session:${sessionId}`);
  }

  /**
   * Check if all chunks are uploaded
   */
  isComplete(session: UploadSession): boolean {
    return session.uploadedChunks.length === session.totalChunks;
  }

  /**
   * Clean up completed session
   */
  async removeSession(sessionId: string): Promise<void> {
    await cacheService.del(`upload:session:${sessionId}`);
  }
}

export const imageProcessor = new ImageProcessor();
export const resumableUploadService = new ResumableUploadService();
export default imageProcessor;
