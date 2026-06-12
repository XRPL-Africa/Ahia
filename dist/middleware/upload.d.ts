import multer from 'multer';
/**
 * Upload single ID card image
 */
export declare const uploadIdCard: multer.Multer;
/**
 * Upload multiple listing images
 */
export declare const uploadListingImages: multer.Multer;
/**
 * Upload single avatar image
 */
export declare const uploadAvatar: multer.Multer;
/**
 * Upload dispute evidence files
 */
export declare const uploadDisputeEvidence: multer.Multer;
/**
 * Upload campus logo
 */
export declare const uploadCampusLogo: multer.Multer;
/**
 * Memory upload for processing before cloud upload
 */
export declare const uploadToMemory: multer.Multer;
/**
 * Process uploaded file and return URL + public ID
 */
export declare function processUploadedFile(file: Express.Multer.File): {
    url: string;
    publicId: string;
};
/**
 * Process multiple uploaded files
 */
export declare function processUploadedFiles(files: Express.Multer.File[]): {
    url: string;
    publicId: string;
    order: number;
}[];
/**
 * Delete uploaded file from Cloudinary
 */
export declare function deleteUploadedFile(publicId: string): Promise<void>;
/**
 * Delete multiple uploaded files
 */
export declare function deleteUploadedFiles(publicIds: string[]): Promise<void>;
/**
 * Upload buffer to Cloudinary
 */
export declare function uploadBuffer(buffer: Buffer, folder: string, options?: Record<string, unknown>): Promise<{
    url: string;
    publicId: string;
}>;
/**
 * Handle multer errors
 */
export declare function handleUploadError(error: Error, _req: Express.Request, res: Express.Response, next: Express.NextFunction): void;
/**
 * Validate image dimensions (if needed)
 */
export declare function validateImageDimensions(file: Express.Multer.File, minWidth: number, minHeight: number): Promise<boolean>;
/**
 * Check if file is an image
 */
export declare function isImage(mimeType: string): boolean;
/**
 * Get file extension from MIME type
 */
export declare function getExtensionFromMimeType(mimeType: string): string;
declare const _default: {
    uploadIdCard: multer.Multer;
    uploadListingImages: multer.Multer;
    uploadAvatar: multer.Multer;
    uploadDisputeEvidence: multer.Multer;
    uploadCampusLogo: multer.Multer;
    uploadToMemory: multer.Multer;
    processUploadedFile: typeof processUploadedFile;
    processUploadedFiles: typeof processUploadedFiles;
    deleteUploadedFile: typeof deleteUploadedFile;
    deleteUploadedFiles: typeof deleteUploadedFiles;
    uploadBuffer: typeof uploadBuffer;
    handleUploadError: typeof handleUploadError;
};
export default _default;
//# sourceMappingURL=upload.d.ts.map