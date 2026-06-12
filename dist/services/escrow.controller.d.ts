import { Request, Response } from "express";
export declare const escrowController: {
    createEscrow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyEscrows: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getEscrowById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    initiatePayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyCryptoPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    markHandover: (req: Request, res: Response, next: import("express").NextFunction) => void;
    verifyAndRelease: (req: Request, res: Response, next: import("express").NextFunction) => void;
    cancelEscrow: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=escrow.controller.d.ts.map