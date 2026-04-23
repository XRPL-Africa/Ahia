import { Request } from 'express';
import { UserRole, UserStatus, EscrowStatus, ListingStatus, BidStatus } from '@prisma/client';

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  campusId: string;
  walletAddress?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  campusId: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// USER TYPES
// ============================================

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  campusId: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  campusId: string;
  role: UserRole;
  status: UserStatus;
  trustScore: number;
  successfulTrades: number;
  totalTrades: number;
  walletAddress: string | null;
  createdAt: Date;
}

// ============================================
// VERIFICATION TYPES
// ============================================

export interface VerificationInput {
  idCardUrl: string;
  idCardPublicId: string;
  portalScreenshotUrl?: string;
  studentIdNumber: string;
}

export interface VerificationReviewInput {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

// ============================================
// LISTING TYPES
// ============================================

export interface CreateListingInput {
  title: string;
  description: string;
  category: string;
  condition: string;
  listingType: ListingType;
  buyNowPrice?: number;
  startingBid?: number;
  reservePrice?: number;
  swapSpotId?: string;
  expiresAt?: Date;
}

export interface ListingImageInput {
  url: string;
  publicId: string;
  order: number;
}

export interface ListingFilters {
  campusId?: string;
  category?: string;
  condition?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  status?: ListingStatus;
  search?: string;
  sellerId?: string;
}

export interface ListingSort {
  field: 'createdAt' | 'price' | 'viewCount' | 'trustScore';
  order: 'asc' | 'desc';
}

export type ListingType = 'BUY_NOW' | 'OPEN_BID';

// ============================================
// BID TYPES
// ============================================

export interface CreateBidInput {
  listingId: string;
  amount: number;
  message?: string;
}

export interface CounterBidInput {
  bidId: string;
  counterAmount: number;
  counterMessage?: string;
}

export interface BidResponseInput {
  bidId: string;
  action: 'ACCEPT' | 'REJECT';
}

// ============================================
// ESCROW TYPES
// ============================================

export interface CreateEscrowInput {
  listingId: string;
  bidId?: string;
  paymentMethod: 'FIAT_PAYSTACK' | 'CRYPTO_RLUSD';
  amount: number;
}

export interface EscrowActionInput {
  escrowId: string;
  action: 'MARK_HANDOVER' | 'VERIFY' | 'FREEZE' | 'DISPUTE' | 'RELEASE' | 'CANCEL';
  reason?: string;
}

export interface FreezeEscrowInput {
  escrowId: string;
  reason: string;
}

export interface DisputeInput {
  escrowId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentInitiateInput {
  escrowId: string;
  paymentMethod: 'FIAT_PAYSTACK' | 'CRYPTO_RLUSD';
}

export interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    customer: {
      email: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export interface OfframpInput {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// ============================================
// WALLET TYPES
// ============================================

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ============================================
// REVIEW TYPES
// ============================================

export interface CreateReviewInput {
  revieweeId: string;
  rating: number;
  comment?: string;
  tradeId?: string;
}

// ============================================
// ADMIN TYPES
// ============================================

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalEscrows: number;
  pendingVerifications: number;
  openDisputes: number;
  totalVolume: number;
}

export interface CampusInput {
  name: string;
  subdomain: string;
  slug: string;
  address?: string;
  city: string;
  state: string;
  country?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface SwapSpotInput {
  campusId: string;
  name: string;
  description?: string;
  location: string;
  coordinates?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================
// MIDDLEWARE TYPES
// ============================================

export interface RateLimitInfo {
  limited: boolean;
  remaining: number;
  resetTime: number;
}

export interface UploadFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// ============================================
// CACHE TYPES
// ============================================

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
