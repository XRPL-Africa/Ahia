import multer from 'multer';
import path from 'path';
import { storageConfigs, cloudinaryService } from '../config/cloudinary.js';
import logger from '../config/logger.js';
// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    avatar: 2 * 1024 * 1024, // 2MB
};
// Allowed MIME types
const ALLOWED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    document: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
};
/**
 * Create file filter based on allowed types
 */
function createFileFilter(allowedTypes) {
    return (_req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
        }
    };
}
/**
 * Local storage configuration (for temporary uploads)
 */
const localStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads/temp/');
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});
/**
 * Memory storage configuration
 */
const memoryStorage = multer.memoryStorage();
// ============================================
// UPLOAD MIDDLEWARES
// ============================================
/**
 * Upload single ID card image
 */
export const uploadIdCard = multer({
    storage: storageConfigs.idCards,
    limits: {
        fileSize: FILE_SIZE_LIMITS.image,
        files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.image),
});
/**
 * Upload multiple listing images
 */
export const uploadListingImages = multer({
    storage: storageConfigs.listings,
    limits: {
        fileSize: FILE_SIZE_LIMITS.image,
        files: 5, // Max 5 images per listing
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.image),
});
/**
 * Upload single avatar image
 */
export const uploadAvatar = multer({
    storage: storageConfigs.avatars,
    limits: {
        fileSize: FILE_SIZE_LIMITS.avatar,
        files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.avatar),
});
/**
 * Upload dispute evidence files
 */
export const uploadDisputeEvidence = multer({
    storage: storageConfigs.disputes,
    limits: {
        fileSize: FILE_SIZE_LIMITS.document,
        files: 5, // Max 5 evidence files
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.document),
});
/**
 * Upload campus logo
 */
export const uploadCampusLogo = multer({
    storage: storageConfigs.campus,
    limits: {
        fileSize: FILE_SIZE_LIMITS.image,
        files: 1,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.image),
});
/**
 * Memory upload for processing before cloud upload
 */
export const uploadToMemory = multer({
    storage: memoryStorage,
    limits: {
        fileSize: FILE_SIZE_LIMITS.image,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES.image),
});
// ============================================
// FILE PROCESSING UTILITIES
// ============================================
/**
 * Process uploaded file and return URL + public ID
 */
export function processUploadedFile(file) {
    // For Cloudinary storage, the file info is already in the file object
    if (file.path) {
        return {
            url: file.path,
            publicId: file.filename,
        };
    }
    throw new Error('File not properly uploaded');
}
/**
 * Process multiple uploaded files
 */
export function processUploadedFiles(files) {
    return files.map((file, index) => ({
        ...processUploadedFile(file),
        order: index,
    }));
}
/**
 * Delete uploaded file from Cloudinary
 */
export async function deleteUploadedFile(publicId) {
    try {
        await cloudinaryService.deleteFile(publicId);
    }
    catch (error) {
        logger.error('Error deleting file:', error);
        throw error;
    }
}
/**
 * Delete multiple uploaded files
 */
export async function deleteUploadedFiles(publicIds) {
    try {
        await cloudinaryService.deleteFiles(publicIds);
    }
    catch (error) {
        logger.error('Error deleting files:', error);
        throw error;
    }
}
/**
 * Upload buffer to Cloudinary
 */
export async function uploadBuffer(buffer, folder, options = {}) {
    return cloudinaryService.uploadBuffer(buffer, folder, options);
}
// ============================================
// ERROR HANDLING
// ============================================
/**
 * Handle multer errors
 */
export function handleUploadError(error, _req, res, next) {
    if (error instanceof multer.MulterError) {
        let message = 'File upload error';
        let code = 'UPLOAD_ERROR';
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'File size exceeds the limit';
                code = 'FILE_TOO_LARGE';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'Too many files uploaded';
                code = 'TOO_MANY_FILES';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'Unexpected file field';
                code = 'UNEXPECTED_FILE';
                break;
            case 'LIMIT_PART_COUNT':
                message = 'Too many parts in the request';
                code = 'TOO_MANY_PARTS';
                break;
        }
        res.status(400).json({
            success: false,
            message,
            error: { code, message },
        });
        return;
    }
    if (error.message.includes('Invalid file type')) {
        res.status(400).json({
            success: false,
            message: error.message,
            error: { code: 'INVALID_FILE_TYPE', message: error.message },
        });
        return;
    }
    next(error);
}
// ============================================
// VALIDATION HELPERS
// ============================================
/**
 * Validate image dimensions (if needed)
 */
export function validateImageDimensions(file, minWidth, minHeight) {
    return new Promise((resolve) => {
        // For now, accept all valid images
        // You can add sharp or similar library to check dimensions
        resolve(true);
    });
}
/**
 * Check if file is an image
 */
export function isImage(mimeType) {
    return ALLOWED_MIME_TYPES.image.includes(mimeType);
}
/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType) {
    const extensions = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'application/pdf': '.pdf',
    };
    return extensions[mimeType] || '';
}
export default {
    uploadIdCard,
    uploadListingImages,
    uploadAvatar,
    uploadDisputeEvidence,
    uploadCampusLogo,
    uploadToMemory,
    processUploadedFile,
    processUploadedFiles,
    deleteUploadedFile,
    deleteUploadedFiles,
    uploadBuffer,
    handleUploadError,
};
//# sourceMappingURL=upload.js.map