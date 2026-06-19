import { Request, Response } from 'express';
import { searchService } from '../services/search.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const searchController = {
  /**
   * GET /api/listings/search
   * Full-text search on listings
   */
  searchListings: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const q = (req.query.q as string) || (req.query.query as string) || '';

    if (!q.trim()) {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
        error: { code: 'MISSING_QUERY', message: 'Provide q= in the query string' },
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await searchService.searchListings(q.trim(), {
      campusId: req.query.campusId as string | undefined,
      category: req.query.category as string | undefined,
      condition: req.query.condition as string | undefined,
      listingType: req.query.listingType as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      page,
      limit,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as string) || 'desc',
    });

    res.json({
      success: true,
      message: 'Search results retrieved',
      data: result.listings,
      meta: result.meta,
    });
  }),

  /**
   * GET /api/listings/filter
   * Advanced filter listings
   */
  filterListings: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await searchService.filterListings(
      {
        campusId: req.query.campusId as string | undefined,
        category: req.query.category as string | undefined,
        condition: req.query.condition as string | undefined,
        listingType: req.query.listingType as string | undefined,
        sellerId: req.query.sellerId as string | undefined,
        status: req.query.status as string | undefined,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      },
      {
        page,
        limit,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as string) || 'desc',
      }
    );

    res.json({
      success: true,
      message: 'Filtered listings retrieved',
      data: result.listings,
      meta: result.meta,
    });
  }),

  /**
   * GET /api/categories
   * Get all listing categories with counts
   */
  getCategories: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const campusId = req.query.campusId as string | undefined;
    const categories = await searchService.getCategories(campusId);

    res.json({
      success: true,
      message: 'Categories retrieved',
      data: { categories },
    });
  }),

  /**
   * GET /api/campuses
   * Get all active campuses
   */
  getCampuses: asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const campuses = await searchService.getCampuses();

    res.json({
      success: true,
      message: 'Campuses retrieved',
      data: { campuses },
    });
  }),

  /**
   * GET /api/listings/nearby
   * Get nearby listings (campus-scoped)
   */
  getNearbyListings: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const campusId = req.query.campusId as string;

    if (!campusId) {
      res.status(400).json({
        success: false,
        message: 'campusId is required',
        error: { code: 'MISSING_CAMPUS_ID', message: 'Provide campusId= in the query string' },
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await searchService.getNearbyListings(campusId, { page, limit });

    res.json({
      success: true,
      message: 'Nearby listings retrieved',
      data: result.listings,
      meta: result.meta,
    });
  }),
};

export default searchController;
