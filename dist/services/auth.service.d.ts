import type { RegisterInput, LoginInput, AuthTokens, UserProfile } from '../types/index.js';
export declare class AuthService {
    /**
     * Register a new user
     */
    register(input: RegisterInput): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    /**
     * Login user
     */
    login(input: LoginInput): Promise<{
        user: UserProfile;
        tokens: AuthTokens;
    }>;
    /**
     * Get current user profile
     */
    getProfile(userId: string): Promise<UserProfile>;
    /**
     * Update user profile
     */
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        bio?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }): Promise<UserProfile>;
    /**
     * Change password
     */
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    /**
     * Request password reset
     */
    requestPasswordReset(email: string): Promise<void>;
    /**
     * Reset password with token
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
export default authService;
//# sourceMappingURL=auth.service.d.ts.map