import { Request, Response } from 'express';
export declare const authController: {
    /**
     * Register new user
     */
    register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Login user
     */
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Refresh access token
     */
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Logout user
     */
    logout: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Get current user profile
     */
    getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Update user profile
     */
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Change password
     */
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Request password reset
     */
    forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * Reset password with token
     */
    resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
export default authController;
//# sourceMappingURL=auth.controller.d.ts.map