import { Request, Response } from 'express';
import { listingService } from '../services/listing.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import {
  createListingSchema,
  updateListingSchema,
  listingFiltersSchema,
  createBidSchema,
  bidResponseSchema,
  uuidParamSchema,
} from '../validators/index.js';
import { processUploadedFiles } from '../middleware/upload.js';

export const listingController = {
  /**
   * Create a new listing
   */
  createListing: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = createListingSchema.parse(req.body);
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one image is required',
        error: { code: 'IMAGES_REQUIRED', message: 'Please upload at least one image' },
      });
      return;
    }

    const images = processUploadedFiles(files);
    const listing = await listingService.createListing(req.user!.id, validatedData, images);

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: { listing },
    });
  }),

  /**
   * Get all listings with filters
   */
  getListings: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = listingFiltersSchema.parse(req.query);
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ...filters
    } = validatedQuery;

    const result = await listingService.getListings(
      filters,
      { field: sortBy, order: sortOrder },
      page,
      limit
    );

    res.json({
      success: true,
      message: 'Listings retrieved successfully',
      data: result.listings,
      meta: result.meta,
    });
  }),

  /**
   * Get listing by ID
   */
  getListingById: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const listing = await listingService.getListingById(id, true);

    res.json({
      success: true,
      message: 'Listing retrieved successfully',
      data: { listing },
    });
  }),

  /**
   * Update listing
   */
  updateListing: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    const validatedData = updateListingSchema.parse(req.body);
    const listing = await listingService.updateListing(id, req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: { listing },
    });
  }),

  /**
   * Delete listing
   */
  deleteListing: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = uuidParamSchema.parse(req.params);
    await listingService.deleteListing(id, req.user!.id);

    res.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  }),

  /**
   * Create a bid
   */
  createBid: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = createBidSchema.parse(req.body);
    const bid = await listingService.createBid(req.user!.id, validatedData);

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: { bid },
    });
  }),

  /**
   * Respond to bid (accept/reject)
   */
  respondToBid: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: bidId } = uuidParamSchema.parse(req.params);
    const { action } = bidResponseSchema.parse(req.body);

    const bid = await listingService.respondToBid(
      req.user!.id,
      bidId,
      action,
      req.body.counterAmount,
      req.body.counterMessage
    );

    res.json({
      success: true,
      message: `Bid ${action.toLowerCase()}ed successfully`,
      data: { bid },
    });
  }),

  /**
   * Get user's listings
   */
  getMyListings: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await listingService.getUserListings(
      req.user!.id,
      status as any,
      page,
      limit
    );

    res.json({
      success: true,
      message: 'My listings retrieved successfully',
      data: result.listings,
      meta: result.meta,
    });
  }),

  /**
   * Get user's bids
   */
  getMyBids: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const result = await listingService.getUserBids(req.user!.id, status as any, page, limit);

    res.json({
      success: true,
      message: 'My bids retrieved successfully',
      data: result.bids,
      meta: result.meta,
    });
  }),

  /**
   * Get campus listings
   */
  getCampusListings: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { campusId } = req.params;
    const validatedQuery = listingFiltersSchema.parse(req.query);
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', ...filters } = validatedQuery;

    const result = await listingService.getListings(
      { ...filters, campusId },
      { field: sortBy, order: sortOrder },
      page,
      limit
    );

    res.json({
      success: true,
      message: 'Campus listings retrieved successfully',
      data: result.listings,
      meta: result.meta,
    });
  }),
};

export default listingController;
