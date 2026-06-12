import bcrypt from 'bcrypt';
import crypto from 'crypto';
/**
 * Hash password using bcrypt
 */
export async function hashPassword(password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, rounds);
}
/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
/**
 * Generate a random string
 */
export function generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}
/**
 * Generate a random numeric code
 */
export function generateNumericCode(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
}
/**
 * Encrypt sensitive data
 */
export function encrypt(text, secretKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText, secretKey) {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipher(algorithm, secretKey);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * Format currency amount
 */
export function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
    }).format(amount);
}
/**
 * Format RLUSD amount
 */
export function formatRLUSD(amount) {
    return `${amount.toFixed(2)} RLUSD`;
}
/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount, feePercentage = 2.5) {
    const fee = (amount * feePercentage) / 100;
    return {
        fee: parseFloat(fee.toFixed(8)),
        netAmount: parseFloat((amount - fee).toFixed(8)),
    };
}
/**
 * Calculate escrow release date
 */
export function calculateEscrowReleaseDate(startDate = new Date(), durationDays = 14) {
    const releaseDate = new Date(startDate);
    releaseDate.setDate(releaseDate.getDate() + durationDays);
    return releaseDate;
}
/**
 * Check if escrow can be frozen
 */
export function canFreezeEscrow(inspectionEndsAt, freezeWindowHours = 24) {
    const now = new Date();
    const freezeDeadline = new Date(inspectionEndsAt);
    freezeDeadline.setHours(freezeDeadline.getHours() - freezeWindowHours);
    return now >= freezeDeadline && now < inspectionEndsAt;
}
/**
 * Generate slug from string
 */
export function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
/**
 * Truncate text
 */
export function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * Parse pagination params
 */
export function parsePaginationParams(page, limit, defaultLimit = 20, maxLimit = 100) {
    const parsedPage = Math.max(1, parseInt(String(page)) || 1);
    const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(String(limit)) || defaultLimit));
    return {
        page: parsedPage,
        limit: parsedLimit,
        skip: (parsedPage - 1) * parsedLimit,
    };
}
/**
 * Build pagination meta
 */
export function buildPaginationMeta(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query) {
    return query
        .replace(/[<>]/g, '')
        .replace(/[%_]/g, '\\$&')
        .trim();
}
/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Omit keys from object
 */
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}
/**
 * Pick keys from object
 */
export function pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
}
/**
 * Sleep/delay function
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry function with exponential backoff
 */
export async function retry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await sleep(delayMs * Math.pow(2, i));
            }
        }
    }
    throw lastError;
}
/**
 * Calculate trust score
 */
export function calculateTrustScore(successfulTrades, totalTrades, averageRating, responseTimeAvg) {
    // Base score from successful trades (max 40 points)
    const tradeScore = Math.min(40, (successfulTrades / Math.max(1, totalTrades)) * 40);
    // Rating score (max 40 points)
    const ratingScore = (averageRating / 5) * 40;
    // Response time score (max 20 points)
    let responseScore = 20;
    if (responseTimeAvg !== null) {
        if (responseTimeAvg <= 30)
            responseScore = 20;
        else if (responseTimeAvg <= 60)
            responseScore = 15;
        else if (responseTimeAvg <= 120)
            responseScore = 10;
        else if (responseTimeAvg <= 240)
            responseScore = 5;
        else
            responseScore = 0;
    }
    return Math.round(tradeScore + ratingScore + responseScore);
}
/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it matches Nigerian format
    return /^(0|234)?[7-9][0-1][0-9]{8}$/.test(cleaned);
}
/**
 * Format Nigerian phone number
 */
export function formatNigerianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    // Remove leading 0 or 234 and add +234
    const normalized = cleaned.replace(/^(0|234)/, '');
    return `+234${normalized}`;
}
/**
 * Generate unique reference code
 */
export function generateReference(prefix = 'AHIA') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
/**
 * Mask sensitive data
 */
export function maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
    return `${maskedLocal}@${domain}`;
}
export function maskPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4)
        return phone;
    return cleaned.slice(0, -4).replace(/./g, '*') + cleaned.slice(-4);
}
//# sourceMappingURL=helpers.js.map