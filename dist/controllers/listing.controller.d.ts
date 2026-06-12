import { Request, Response } from 'express';
export declare const listingController: {
    /**
     * Create a new listing
     */
    createListing: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get all listings with filters
     */
    getListings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get listing by ID
     */
    getListingById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Update listing
     */
    updateListing: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Delete listing
     */
    deleteListing: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Create a bid
     */
    createBid: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Respond to bid (accept/reject)
     */
    respondToBid: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get user's listings
     */
    getMyListings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get user's bids
     */
    getMyBids: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get campus listings
     */
    getCampusListings: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default listingController;
//# sourceMappingURL=listing.controller.d.ts.map