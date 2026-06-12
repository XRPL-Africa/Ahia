import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
export declare function verifyCloudinaryConnection(): Promise<boolean>;
export declare const storageConfigs: {
    idCards: CloudinaryStorage;
    listings: CloudinaryStorage;
    avatars: CloudinaryStorage;
    disputes: CloudinaryStorage;
    campus: CloudinaryStorage;
};
export declare class CloudinaryService {
    /**
     * Upload a file to Cloudinary
     */
    uploadFile(filePath: string, folder: string, options?: Record<string, unknown>): Promise<{
        url: string;
        publicId: string;
    }>;
    /**
     * Upload from buffer (for memory storage)
     */
    uploadBuffer(buffer: Buffer, folder: string, options?: Record<string, unknown>): Promise<{
        url: string;
        publicId: string;
    }>;
    /**
     * Delete a file from Cloudinary
     */
    deleteFile(publicId: string): Promise<void>;
    /**
     * Delete multiple files
     */
    deleteFiles(publicIds: string[]): Promise<void>;
    /**
     * Get optimized URL for an image
     */
    getOptimizedUrl(publicId: string, options?: Record<string, unknown>): string;
    /**
     * Generate thumbnail URL
     */
    getThumbnailUrl(publicId: string, width?: number, height?: number): string;
    /**
     * Generate signed upload URL for direct client uploads
     */
    generateUploadSignature(params: Record<string, unknown>): {
        signature: string;
        timestamp: number;
        apiKey: string;
    };
}
export declare const cloudinaryService: CloudinaryService;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map