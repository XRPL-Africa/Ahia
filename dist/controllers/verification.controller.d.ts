import { Request, Response } from 'express';
export declare const verificationController: {
    /**
     * Submit verification documents
     */
    submitVerification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get my verification status
     */
    getMyVerification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get pending verifications (admin only)
     */
    getPendingVerifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Review verification (admin only)
     */
    reviewVerification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get verification statistics (admin only)
     */
    getVerificationStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default verificationController;
//# sourceMappingURL=verification.controller.d.ts.map