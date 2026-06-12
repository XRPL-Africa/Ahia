import { Request, Response } from 'express';
export declare const adminController: {
    /**
     * Get dashboard statistics
     */
    getDashboardStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get all users
     */
    getUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get user details
     */
    getUserDetails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Suspend user
     */
    suspendUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Ban user
     */
    banUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Unban user
     */
    unbanUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Add strike to user
     */
    addStrike: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get disputes
     */
    getDisputes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Resolve dispute
     */
    resolveDispute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Create campus
     */
    createCampus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Update campus
     */
    updateCampus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Create swap spot
     */
    createSwapSpot: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get all campuses
     */
    getCampuses: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default adminController;
//# sourceMappingURL=admin.controller.d.ts.map