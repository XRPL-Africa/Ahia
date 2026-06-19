import { prisma } from '../config/database.js';
import { cacheService } from '../config/redis.js';
import { Prisma } from '@prisma/client';

export class SearchService {
  private readonly CACHE_TTL = 60; // 1 minute for search results

  /**
   * Full-text search across listings
   */
  async searchListings(
    query: string,
    options: {
      campusId?: string;
      category?: string;
      condition?: string;
      listingType?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ): Promise<{ listings: unknown[]; total: number; meta: unknown }> {
    const {
      campusId,
      category,
      condition,
      listingType,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      AND: [
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        ...(campusId ? [{ campusId }] : []),
        ...(category ? [{ category }] : []),
        ...(condition ? [{ condition }] : []),
        ...(listingType ? [{ listingType: listingType as any }] : []),
        ...(minPrice !== undefined
          ? [{ buyNowPrice: { gte: new Prisma.Decimal(minPrice) } }]
          : []),
        ...(maxPrice !== undefined
          ? [{ buyNowPrice: { lte: new Prisma.Decimal(maxPrice) } }]
          : []),
      ],
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sortBy === 'price'
        ? { buyNowPrice: sortOrder as 'asc' | 'desc' }
        : sortBy === 'viewCount'
        ? { viewCount: sortOrder as 'asc' | 'desc' }
        : { createdAt: sortOrder as 'asc' | 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
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
          campus: { select: { name: true } },
          _count: { select: { bids: true } },
        },
        orderBy,
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
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Advanced filter listings (no text search, just structured filters)
   */
  async filterListings(
    filters: {
      campusId?: string;
      category?: string;
      condition?: string;
      listingType?: string;
      minPrice?: number;
      maxPrice?: number;
      sellerId?: string;
      status?: string;
    },
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    } = {}
  ): Promise<{ listings: unknown[]; total: number; meta: unknown }> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: (filters.status as any) || 'ACTIVE',
      ...(filters.campusId && { campusId: filters.campusId }),
      ...(filters.category && { category: filters.category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.listingType && { listingType: filters.listingType as any }),
      ...(filters.sellerId && { sellerId: filters.sellerId }),
      ...(filters.minPrice !== undefined && {
        buyNowPrice: { gte: new Prisma.Decimal(filters.minPrice) },
      }),
      ...(filters.maxPrice !== undefined && {
        buyNowPrice: { lte: new Prisma.Decimal(filters.maxPrice) },
      }),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sortBy === 'price'
        ? { buyNowPrice: sortOrder as 'asc' | 'desc' }
        : sortBy === 'viewCount'
        ? { viewCount: sortOrder as 'asc' | 'desc' }
        : { createdAt: sortOrder as 'asc' | 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
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
          campus: { select: { name: true } },
          _count: { select: { bids: true } },
        },
        orderBy,
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
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all available categories with listing counts
   */
  async getCategories(campusId?: string): Promise<{ category: string; count: number }[]> {
    const cacheKey = `categories:${campusId || 'all'}`;
    const cached = await cacheService.get<{ category: string; count: number }[]>(cacheKey);
    if (cached) return cached;

    const grouped = await prisma.listing.groupBy({
      by: ['category'],
      where: {
        status: 'ACTIVE',
        ...(campusId && { campusId }),
      },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    const result = grouped.map((g) => ({
      category: g.category,
      count: g._count.category,
    }));

    await cacheService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get all active campuses
   */
  async getCampuses(): Promise<unknown[]> {
    const cacheKey = 'campuses:active';
    const cached = await cacheService.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const campuses = await prisma.campus.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        subdomain: true,
        slug: true,
        city: true,
        state: true,
        logoUrl: true,
        primaryColor: true,
        _count: {
          select: { users: true, listings: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    await cacheService.set(cacheKey, campuses, 600); // 10 minutes
    return campuses;
  }

  /**
   * Get nearby listings based on campus proximity
   * Since we don't have GPS coordinates on users, this uses campus-based proximity
   * by listing swap spot coordinates when available
   */
  async getNearbyListings(
    campusId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ listings: unknown[]; total: number; meta: unknown }> {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // First get listings in the same campus with swap spot locations
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      campusId,
      swapSpotId: { not: null },
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
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
          swapSpot: {
            select: {
              id: true,
              name: true,
              location: true,
              coordinates: true,
            },
          },
          _count: { select: { bids: true } },
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
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

export const searchService = new SearchService();
export default searchService;
