import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from './logger.js';

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Verify Cloudinary connection
export async function verifyCloudinaryConnection(): Promise<boolean> {
  try {
    const result = await cloudinary.api.ping();
    logger.info('Cloudinary connected successfully');
    return result.status === 'ok';
  } catch (error) {
    logger.error('Cloudinary connection failed:', error);
    return false;
  }
}

// Multer Storage Configuration for different upload types
export const storageConfigs = {
  // User ID Card uploads
  idCards: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ahia/id-cards',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }],
      resource_type: 'image',
    } as Record<string, unknown>,
  }),

  // Listing images
  listings: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ahia/listings',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1600, crop: 'limit' }, { quality: 'auto:good' }],
      resource_type: 'image',
    } as Record<string, unknown>,
  }),

  // User avatars
  avatars: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ahia/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
      ],
      resource_type: 'image',
    } as Record<string, unknown>,
  }),

  // Dispute evidence
  disputes: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ahia/disputes',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: 'auto',
    } as Record<string, unknown>,
  }),

  // Campus logos
  campus: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'ahia/campuses',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      transformation: [{ width: 500, crop: 'limit' }, { quality: 'auto' }],
      resource_type: 'image',
    } as Record<string, unknown>,
  }),
};

// Cloudinary Service
export class CloudinaryService {
  /**
   * Upload a file to Cloudinary
   */
  async uploadFile(
    filePath: string,
    folder: string,
    options: Record<string, unknown> = {}
  ): Promise<{ url: string; publicId: string }> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `ahia/${folder}`,
        ...options,
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      logger.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  /**
   * Upload from buffer (for memory storage)
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    options: Record<string, unknown> = {}
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ahia/${folder}`,
          ...options,
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary buffer upload error:', error);
            reject(new Error('Failed to upload file to Cloudinary'));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted file from Cloudinary: ${publicId}`);
    } catch (error) {
      logger.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete file from Cloudinary');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(publicIds: string[]): Promise<void> {
    try {
      await cloudinary.api.delete_resources(publicIds);
      logger.info(`Deleted ${publicIds.length} files from Cloudinary`);
    } catch (error) {
      logger.error('Cloudinary batch delete error:', error);
      throw new Error('Failed to delete files from Cloudinary');
    }
  }

  /**
   * Get optimized URL for an image
   */
  getOptimizedUrl(publicId: string, options: Record<string, unknown> = {}): string {
    return cloudinary.url(publicId, {
      secure: true,
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(publicId: string, width: number = 300, height: number = 300): string {
    return cloudinary.url(publicId, {
      secure: true,
      width,
      height,
      crop: 'fill',
      quality: 'auto:eco',
    });
  }

  /**
   * Generate signed upload URL for direct client uploads
   */
  generateUploadSignature(params: Record<string, unknown>): {
    signature: string;
    timestamp: number;
    apiKey: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, ...params },
      process.env.CLOUDINARY_API_SECRET!
    );
    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY!,
    };
  }
}

// Export singleton instance
export const cloudinaryService = new CloudinaryService();

export default cloudinary;
