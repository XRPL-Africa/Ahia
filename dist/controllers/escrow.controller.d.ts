import { Request, Response } from 'express';
export declare const escrowController: {
    /**
     * Create a new escrow
     */
    createEscrow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get escrow by ID
     */
    getEscrowById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get user's escrows
     */
    getMyEscrows: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Mark item as handed over (seller action)
     */
    markHandover: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Verify authenticity and release funds (buyer action)
     */
    verifyAndRelease: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Freeze escrow (buyer requests extension)
     */
    freezeEscrow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Open dispute
     */
    openDispute: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Cancel escrow
     */
    cancelEscrow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Initiate payment for escrow
     */
    initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Handle Paystack webhook
     */
    handlePaystackWebhook: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default escrowController;
//# sourceMappingURL=escrow.controller.d.ts.map