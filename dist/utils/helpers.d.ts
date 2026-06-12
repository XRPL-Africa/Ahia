/**
 * Hash password using bcrypt
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare password with hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a random string
 */
export declare function generateRandomString(length?: number): string;
/**
 * Generate a random numeric code
 */
export declare function generateNumericCode(length?: number): string;
/**
 * Encrypt sensitive data
 */
export declare function encrypt(text: string, secretKey: string): string;
/**
 * Decrypt sensitive data
 */
export declare function decrypt(encryptedText: string, secretKey: string): string;
/**
 * Format currency amount
 */
export declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Format RLUSD amount
 */
export declare function formatRLUSD(amount: number): string;
/**
 * Calculate platform fee
 */
export declare function calculatePlatformFee(amount: number, feePercentage?: number): {
    fee: number;
    netAmount: number;
};
/**
 * Calculate escrow release date
 */
export declare function calculateEscrowReleaseDate(startDate?: Date, durationDays?: number): Date;
/**
 * Check if escrow can be frozen
 */
export declare function canFreezeEscrow(inspectionEndsAt: Date, freezeWindowHours?: number): boolean;
/**
 * Generate slug from string
 */
export declare function generateSlug(text: string): string;
/**
 * Truncate text
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Parse pagination params
 */
export declare function parsePaginationParams(page?: string | number, limit?: string | number, defaultLimit?: number, maxLimit?: number): {
    page: number;
    limit: number;
    skip: number;
};
/**
 * Build pagination meta
 */
export declare function buildPaginationMeta(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
/**
 * Sanitize search query
 */
export declare function sanitizeSearchQuery(query: string): string;
/**
 * Deep clone object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Omit keys from object
 */
export declare function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Pick keys from object
 */
export declare function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Sleep/delay function
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
/**
 * Calculate trust score
 */
export declare function calculateTrustScore(successfulTrades: number, totalTrades: number, averageRating: number, responseTimeAvg: number | null): number;
/**
 * Validate Nigerian phone number
 */
export declare function isValidNigerianPhone(phone: string): boolean;
/**
 * Format Nigerian phone number
 */
export declare function formatNigerianPhone(phone: string): string;
/**
 * Generate unique reference code
 */
export declare function generateReference(prefix?: string): string;
/**
 * Mask sensitive data
 */
export declare function maskEmail(email: string): string;
export declare function maskPhone(phone: string): string;
//# sourceMappingURL=helpers.d.ts.map