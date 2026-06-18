import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  return bcrypt.hash(password, rounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random string
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a random numeric code
 */
export function generateNumericCode(length: number = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, secretKey: string): string {
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
export function decrypt(encryptedText: string, secretKey: string): string {
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
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format RLUSD amount
 */
export function formatRLUSD(amount: number): string {
  return `${amount.toFixed(2)} RLUSD`;
}

/**
 * Calculate platform fee
 */
export function calculatePlatformFee(amount: number, feePercentage: number = 2.5): {
  fee: number;
  netAmount: number;
} {
  const fee = (amount * feePercentage) / 100;
  return {
    fee: parseFloat(fee.toFixed(8)),
    netAmount: parseFloat((amount - fee).toFixed(8)),
  };
}

/**
 * Calculate escrow release date
 */
export function calculateEscrowReleaseDate(
  startDate: Date = new Date(),
  durationDays: number = 14
): Date {
  const releaseDate = new Date(startDate);
  releaseDate.setDate(releaseDate.getDate() + durationDays);
  return releaseDate;
}

/**
 * Check if escrow can be frozen
 */
export function canFreezeEscrow(
  inspectionEndsAt: Date,
  freezeWindowHours: number = 24
): boolean {
  const now = new Date();
  const freezeDeadline = new Date(inspectionEndsAt);
  freezeDeadline.setHours(freezeDeadline.getHours() - freezeWindowHours);
  return now >= freezeDeadline && now < inspectionEndsAt;
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse pagination params
 */
export function parsePaginationParams(
  page?: string | number,
  limit?: string | number,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { page: number; limit: number; skip: number } {
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
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
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
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/[<>]/g, '')
    .replace(/[%_]/g, '\\$&')
    .trim();
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Omit keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
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
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
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
export function calculateTrustScore(
  successfulTrades: number,
  totalTrades: number,
  averageRating: number,
  responseTimeAvg: number | null
): number {
  // Base score from successful trades (max 40 points)
  const tradeScore = Math.min(40, (successfulTrades / Math.max(1, totalTrades)) * 40);
  
  // Rating score (max 40 points)
  const ratingScore = (averageRating / 5) * 40;
  
  // Response time score (max 20 points)
  let responseScore = 20;
  if (responseTimeAvg !== null) {
    if (responseTimeAvg <= 30) responseScore = 20;
    else if (responseTimeAvg <= 60) responseScore = 15;
    else if (responseTimeAvg <= 120) responseScore = 10;
    else if (responseTimeAvg <= 240) responseScore = 5;
    else responseScore = 0;
  }
  
  return Math.round(tradeScore + ratingScore + responseScore);
}

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Check if it matches Nigerian format
  return /^(0|234)?[7-9][0-1][0-9]{8}$/.test(cleaned);
}

/**
 * Format Nigerian phone number
 */
export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  // Remove leading 0 or 234 and add +234
  const normalized = cleaned.replace(/^(0|234)/, '');
  return `+234${normalized}`;
}

/**
 * Generate unique reference code
 */
export function generateReference(prefix: string = 'AHIA'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Mask sensitive data
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return cleaned.slice(0, -4).replace(/./g, '*') + cleaned.slice(-4);
}
