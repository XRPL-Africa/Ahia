import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { generateTokens, refreshAccessToken, logout } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/index.js';

export const authController = {
  /**
   * Register new user
   */
  register: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = registerSchema.parse(req.body);
    const { user, tokens } = await authService.register(validatedData);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user, tokens },
    });
  }),

  /**
   * Login user
   */
  login: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = loginSchema.parse(req.body);
    const { user, tokens } = await authService.login(validatedData);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, tokens },
    });
  }),

  /**
   * Refresh access token
   */
  refreshToken: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await refreshAccessToken(req, res);
  }),

  /**
   * Logout user
   */
  logout: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    await logout(req, res);
  }),

  /**
   * Get current user profile
   */
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = await authService.getProfile(req.user!.id);

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  }),

  /**
   * Update user profile
   */
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user!.id, validatedData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  }),

  /**
   * Change password
   */
  changePassword: asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = changePasswordSchema.parse(req.body);
    await authService.changePassword(
      req.user!.id,
      validatedData.currentPassword,
      validatedData.newPassword
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }),

  /**
   * Request password reset
   */
  forgotPassword: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(validatedData.email);

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent',
    });
  }),

  /**
   * Reset password with token
   */
  resetPassword: asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validatedData.token, validatedData.password);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  }),
};

export default authController;
