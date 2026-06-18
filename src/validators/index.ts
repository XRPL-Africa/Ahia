import { z } from 'zod';

// ============================================
// AUTH VALIDATORS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  campusId: z.string().uuid('Invalid campus ID'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// ============================================
// USER VALIDATORS
// ============================================

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50).optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  phoneNumber: z.string().optional(),
});

// ============================================
// VERIFICATION VALIDATORS
// ============================================

export const verificationSubmitSchema = z.object({
  studentIdNumber: z.string().min(5, 'Student ID number is required'),
  portalScreenshotUrl: z.string().url().optional(),
});

export const verificationReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional().refine(
    (val) => {
      // Rejection reason is required if status is REJECTED
      return true;
    },
    { message: 'Rejection reason is required when rejecting' }
  ),
});

// ============================================
// LISTING VALIDATORS
// ============================================

export const listingConditionEnum = z.enum(['new', 'like_new', 'good', 'fair', 'poor']);
export const listingTypeEnum = z.enum(['BUY_NOW', 'OPEN_BID']);
export const listingCategoryEnum = z.enum([
  'electronics',
  'fashion',
  'books',
  'furniture',
  'sports',
  'beauty',
  'food',
  'services',
  'others',
]);

export const createListingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: listingCategoryEnum,
  condition: listingConditionEnum,
  listingType: listingTypeEnum,
  buyNowPrice: z.number().positive().optional(),
  startingBid: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  swapSpotId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.listingType === 'BUY_NOW' && !data.buyNowPrice) {
      return false;
    }
    if (data.listingType === 'OPEN_BID' && !data.startingBid) {
      return false;
    }
    return true;
  },
  {
    message: 'Buy Now price is required for BUY_NOW listings, Starting bid is required for OPEN_BID listings',
  }
);

export const updateListingSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  category: listingCategoryEnum.optional(),
  condition: listingConditionEnum.optional(),
  buyNowPrice: z.number().positive().optional(),
  startingBid: z.number().positive().optional(),
  reservePrice: z.number().positive().optional(),
  swapSpotId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const listingFiltersSchema = z.object({
  campusId: z.string().uuid().optional(),
  category: listingCategoryEnum.optional(),
  condition: listingConditionEnum.optional(),
  listingType: listingTypeEnum.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  sellerId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// BID VALIDATORS
// ============================================

export const createBidSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  amount: z.number().positive('Bid amount must be positive'),
  message: z.string().max(500).optional(),
});

export const counterBidSchema = z.object({
  counterAmount: z.number().positive('Counter amount must be positive'),
  counterMessage: z.string().max(500).optional(),
});

export const bidResponseSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

// ============================================
// ESCROW VALIDATORS
// ============================================

export const createEscrowSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID'),
  bidId: z.string().uuid('Invalid bid ID').optional(),
  paymentMethod: z.enum(['FIAT_PAYSTACK', 'CRYPTO_RLUSD']),
});

export const escrowActionSchema = z.object({
  action: z.enum(['MARK_HANDOVER', 'VERIFY', 'FREEZE', 'DISPUTE', 'CANCEL']),
  reason: z.string().max(500).optional(),
});

export const freezeEscrowSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason').max(500),
});

// ============================================
// DISPUTE VALIDATORS
// ============================================

export const createDisputeSchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID'),
  reason: z.string().min(5, 'Reason is required'),
  description: z.string().min(20, 'Please provide a detailed description').max(2000),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['RESOLVED_BUYER', 'RESOLVED_SELLER']),
  notes: z.string().max(2000).optional(),
});

// ============================================
// PAYMENT VALIDATORS
// ============================================

export const initiatePaymentSchema = z.object({
  escrowId: z.string().uuid('Invalid escrow ID'),
});

export const offrampSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  bankName: z.string().min(2, 'Bank name is required'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
  accountName: z.string().min(2, 'Account name is required'),
});

// ============================================
// REVIEW VALIDATORS
// ============================================

export const createReviewSchema = z.object({
  revieweeId: z.string().uuid('Invalid user ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(1000).optional(),
  tradeId: z.string().uuid().optional(),
});

// ============================================
// ADMIN VALIDATORS
// ============================================

export const createCampusSchema = z.object({
  name: z.string().min(3, 'Campus name must be at least 3 characters'),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  address: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('Nigeria'),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

export const createSwapSpotSchema = z.object({
  campusId: z.string().uuid('Invalid campus ID'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().max(500).optional(),
  location: z.string().min(5, 'Location is required'),
  coordinates: z.string().optional(),
});

export const adminActionSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['SUSPEND', 'BAN', 'UNBAN', 'RESET_STRIKES']),
  reason: z.string().max(1000).optional(),
});

// ============================================
// UUID PARAM VALIDATOR
// ============================================

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// ============================================
// TYPE INFERENCES
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type OfframpInput = z.infer<typeof offrampSchema>;
