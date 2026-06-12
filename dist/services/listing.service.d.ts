import { ListingStatus, BidStatus } from '@prisma/client';
import type { CreateListingInput, CreateBidInput, ListingFilters, ListingSort } from '../types/index.js';
export declare class ListingService {
    private readonly LISTING_CACHE_TTL;
    private readonly LISTING_EXPIRY_DAYS;
    /**
     * Create a new listing
     */
    createListing(sellerId: string, input: CreateListingInput, images: {
        url: string;
        publicId: string;
        order: number;
    }[]): Promise<unknown>;
    /**
     * Get listing by ID
     */
    getListingById(listingId: string, incrementViews?: boolean): Promise<unknown>;
    /**
     * Get listings with filters
     */
    getListings(filters: ListingFilters, sort?: ListingSort, page?: number, limit?: number): Promise<{
        listings: unknown[];
        total: number;
        meta: {
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Update listing
     */
    updateListing(listingId: string, sellerId: string, data: Partial<CreateListingInput>): Promise<unknown>;
    /**
     * Delete listing
     */
    deleteListing(listingId: string, sellerId: string): Promise<void>;
    /**
     * Create a bid
     */
    createBid(buyerId: string, input: CreateBidInput): Promise<unknown>;
    /**
     * Respond to bid (accept/reject/counter)
     */
    respondToBid(sellerId: string, bidId: string, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterAmount?: number, counterMessage?: string): Promise<unknown>;
    /**
     * Get user's listings
     */
    getUserListings(userId: string, status?: ListingStatus, page?: number, limit?: number): Promise<{
        listings: unknown[];
        total: number;
        meta: {
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Get user's bids
     */
    getUserBids(userId: string, status?: BidStatus, page?: number, limit?: number): Promise<{
        bids: unknown[];
        total: number;
        meta: {
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * Process expired listings
     */
    processExpiredListings(): Promise<number>;
}
export declare const listingService: ListingService;
export default listingService;
//# sourceMappingURL=listing.service.d.ts.map