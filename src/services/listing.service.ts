import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import logger from '../config/logger.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { ListingStatus, BidStatus, Prisma } from '@prisma/client';
import type {
  CreateListingInput,
  CreateBidInput,
  ListingFilters,
  ListingSort,
} from '../types/index.js';
import { notificationService } from './notification.service.js';

export class ListingService {
  private readonly LISTING_CACHE_TTL = 300; // 5 minutes
  private readonly LISTING_EXPIRY_DAYS = 30;

  /**
   * Create a new listing
   */
  async createListing(sellerId: string, input: CreateListingInput, images: { url: string; publicId: string; order: number }[]): Promise<unknown> {
    // Verify seller is verified
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller || seller.status !== 'VERIFIED') {
      throw new ApiError(403, 'VERIFICATION_REQUIRED', 'You must be verified to create listings');
    }

    // Validate swap spot if provided
    if (input.swapSpotId) {
      const swapSpot = await prisma.swapSpot.findUnique({
        where: { id: input.swapSpotId },
      });
      if (!swapSpot) {
        throw Errors.NOT_FOUND('Swap spot');
      }
    }

    // Set expiry date
    const expiresAt = input.expiresAt 
      ? new Date(input.expiresAt)
      : new Date(Date.now() + this.LISTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        sellerId,
        campusId: seller.campusId,
        title: input.title,
        description: input.description,
        category: input.category,
        condition: input.condition,
        listingType: input.listingType,
        buyNowPrice: input.buyNowPrice ? new Prisma.Decimal(input.buyNowPrice) : null,
        startingBid: input.startingBid ? new Prisma.Decimal(input.startingBid) : null,
        reservePrice: input.reservePrice ? new Prisma.Decimal(input.reservePrice) : null,
        swapSpotId: input.swapSpotId,
        expiresAt,
        status: ListingStatus.ACTIVE,
        images: {
          create: images,
        },
      },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
          },
        },
        swapSpot: true,
      },
    });

    // Clear campus listings cache
    await cacheService.delPattern(`listings:campus:${seller.campusId}:*`);

    logger.info(`Listing created: ${listing.id} by ${sellerId}`);

    return listing;
  }

  /**
   * Get listing by ID
   */
  async getListingById(listingId: string, incrementViews: boolean = false): Promise<unknown> {
    const cacheKey = `listing:${listingId}`;
    
    // Try cache first
    const cached = await cacheService.get<unknown>(cacheKey);
    if (cached && !incrementViews) {
      return cached;
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            trustScore: true,
            successfulTrades: true,
            totalTrades: true,
            createdAt: true,
          },
        },
        swapSpot: true,
        bids: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          include: {
            buyer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { amount: 'desc' },
        },
        _count: {
          select: { bids: true },
        },
      },
    });

    if (!listing) {
      throw Errors.NOT_FOUND('Listing');
    }

    // Increment view count if requested
    if (incrementViews) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { viewCount: { increment: 1 } },
      });
    }

    // Cache the result
    await cacheService.set(cacheKey, listing, this.LISTING_CACHE_TTL);

    return listing;
  }

  /**
   * Get listings with filters
   */
  async getListings(
    filters: ListingFilters,
    sort: ListingSort = { field: 'createdAt', order: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<{ listings: unknown[]; total: number; meta: { page: number; limit: number; totalPages: number } }> {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.ACTIVE,
      ...(filters.campusId && { campusId: filters.campusId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.listingType && { listingType: filters.listingType }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
      ...(filters.minPrice && { buyNowPrice: { gte: new Prisma.Decimal(filters.minPrice) } }),
      ...(filters.maxPrice && { buyNowPrice: { lte: new Prisma.Decimal(filters.maxPrice) } }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build order by
    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sort.field === 'price'
        ? { buyNowPrice: sort.order }
        : sort.field === 'viewCount'
        ? { viewCount: sort.order }
        : { createdAt: sort.order };

    // Try cache for common queries
    const cacheKey = `listings:campus:${filters.campusId || 'all'}:page:${page}:limit:${limit}`;
    if (!filters.search && !filters.minPrice && !filters.maxPrice) {
      const cached = await cacheService.get<{ listings: unknown[]; total: number }>(cacheKey);
      if (cached) {
        return {
          ...cached,
          meta: {
            page,
            limit,
            totalPages: Math.ceil(cached.total / limit),
          },
        };
      }
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1 },
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              avatarUrl: true,
              trustScore: true,
            },
          },
          swapSpot: true,
          _count: {
            select: { bids: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const result = {
      listings,
      total,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // Cache result
    if (!filters.search && !filters.minPrice && !filters.maxPrice) {
      await cacheService.set(cacheKey, { listings, total }, this.LISTING_CACHE_TTL);
    }

    return result;
  }

  /**
   * Update listing
   */
  async updateListing(listingId: string, sellerId: string, data: Partial<CreateListingInput>): Promise<unknown> {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, sellerId },
    });

    if (!listing) {
      throw Errors.NOT_FOUND('Listing');
    }

    if (listing.status === 'SOLD' || listing.status === 'DELETED') {
      throw new ApiError(400, 'CANNOT_UPDATE_LISTING', 'Cannot update sold or deleted listing');
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.condition && { condition: data.condition }),
        ...(data.buyNowPrice && { buyNowPrice: new Prisma.Decimal(data.buyNowPrice) }),
        ...(data.swapSpotId && { swapSpotId: data.swapSpotId }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
      },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Clear cache
    await cacheService.del(`listing:${listingId}`);
    await cacheService.delPattern(`listings:campus:${listing.campusId}:*`);

    logger.info(`Listing updated: ${listingId}`);

    return updatedListing;
  }

  /**
   * Delete listing
   */
  async deleteListing(listingId: string, sellerId: string): Promise<void> {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, sellerId },
    });

    if (!listing) {
      throw Errors.NOT_FOUND('Listing');
    }

    if (listing.status === 'SOLD') {
      throw new ApiError(400, 'CANNOT_DELETE_SOLD_LISTING', 'Cannot delete sold listing');
    }

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.DELETED },
    });

    // Clear cache
    await cacheService.del(`listing:${listingId}`);
    await cacheService.delPattern(`listings:campus:${listing.campusId}:*`);

    logger.info(`Listing deleted: ${listingId}`);
  }

  /**
   * Create a bid
   */
  async createBid(buyerId: string, input: CreateBidInput): Promise<unknown> {
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw Errors.NOT_FOUND('Listing');
    }

    if (listing.status !== 'ACTIVE') {
      throw new ApiError(400, 'LISTING_NOT_ACTIVE', 'Listing is not active');
    }

    if (listing.sellerId === buyerId) {
      throw new ApiError(400, 'CANNOT_BID_OWN_LISTING', 'Cannot bid on your own listing');
    }

    // Validate bid amount
    if (listing.listingType === 'OPEN_BID') {
      if (!listing.startingBid || input.amount < Number(listing.startingBid)) {
        throw new ApiError(400, 'BID_TOO_LOW', 'Bid must be at least the starting bid');
      }

      // Check if there's a higher bid
      const highestBid = await prisma.bid.findFirst({
        where: { listingId: input.listingId, status: 'PENDING' },
        orderBy: { amount: 'desc' },
      });

      if (highestBid && input.amount <= Number(highestBid.amount)) {
        throw new ApiError(400, 'BID_TOO_LOW', 'Bid must be higher than current highest bid');
      }
    }

    // Check if user already has a pending bid
    const existingBid = await prisma.bid.findFirst({
      where: {
        listingId: input.listingId,
        buyerId,
        status: 'PENDING',
      },
    });

    if (existingBid) {
      throw new ApiError(400, 'BID_EXISTS', 'You already have a pending bid on this listing');
    }

    const bid = await prisma.bid.create({
      data: {
        listingId: input.listingId,
        buyerId,
        sellerId: listing.sellerId,
        amount: new Prisma.Decimal(input.amount),
        message: input.message,
        status: BidStatus.PENDING,
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update bid count
    await prisma.listing.update({
      where: { id: input.listingId },
      data: { bidCount: { increment: 1 } },
    });

    // Notify seller
    await notificationService.notifyNewBid(
      listing.sellerId,
      listing.title,
      input.amount
    );

    // Clear cache
    await cacheService.del(`listing:${input.listingId}`);

    logger.info(`Bid created: ${bid.id} on listing ${input.listingId}`);

    return bid;
  }

  /**
   * Respond to bid (accept/reject/counter)
   */
  async respondToBid(
    sellerId: string,
    bidId: string,
    action: 'ACCEPT' | 'REJECT' | 'COUNTER',
    counterAmount?: number,
    counterMessage?: string
  ): Promise<unknown> {
    const bid = await prisma.bid.findFirst({
      where: { id: bidId, sellerId },
      include: { listing: true, buyer: true },
    });

    if (!bid) {
      throw Errors.NOT_FOUND('Bid');
    }

    if (bid.status !== 'PENDING') {
      throw new ApiError(400, 'BID_NOT_PENDING', 'Bid is not pending');
    }

    let updatedBid;

    if (action === 'ACCEPT') {
      updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED },
        include: {
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      });

      // Notify buyer
      await notificationService.notifyBidResponse(bid.buyerId, bid.listing.title, 'ACCEPTED');
    } else if (action === 'REJECT') {
      updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.REJECTED },
      });

      // Notify buyer
      await notificationService.notifyBidResponse(bid.buyerId, bid.listing.title, 'REJECTED');
    } else if (action === 'COUNTER') {
      if (!counterAmount) {
        throw new ApiError(400, 'COUNTER_AMOUNT_REQUIRED', 'Counter amount is required');
      }

      updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.COUNTERED,
          counterAmount: new Prisma.Decimal(counterAmount),
          counterMessage,
        },
      });

      // Notify buyer
      await notificationService.notifyBidResponse(bid.buyerId, bid.listing.title, 'COUNTERED');
    }

    logger.info(`Bid ${bidId} ${action.toLowerCase()}ed by seller`);

    return updatedBid;
  }

  /**
   * Get user's listings
   */
  async getUserListings(
    userId: string,
    status?: ListingStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ listings: unknown[]; total: number; meta: { page: number; limit: number; totalPages: number } }> {
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      sellerId: userId,
      ...(status && { status }),
      status: { not: ListingStatus.DELETED },
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1 },
          _count: {
            select: { bids: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings,
      total,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user's bids
   */
  async getUserBids(
    userId: string,
    status?: BidStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<{ bids: unknown[]; total: number; meta: { page: number; limit: number; totalPages: number } }> {
    const skip = (page - 1) * limit;

    const where: Prisma.BidWhereInput = {
      buyerId: userId,
      ...(status && { status }),
    };

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        include: {
          listing: {
            include: {
              images: { take: 1 },
              seller: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bid.count({ where }),
    ]);

    return {
      bids,
      total,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Process expired listings
   */
  async processExpiredListings(): Promise<number> {
    const now = new Date();

    const result = await prisma.listing.updateMany({
      where: {
        status: ListingStatus.ACTIVE,
        expiresAt: { lt: now },
      },
      data: { status: ListingStatus.EXPIRED },
    });

    logger.info(`Processed ${result.count} expired listings`);
    return result.count;
  }
}

export const listingService = new ListingService();
export default listingService;
