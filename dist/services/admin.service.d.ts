import { UserStatus, UserRole, DisputeStatus } from '@prisma/client';
import type { CampusInput, SwapSpotInput } from '../types/index.js';
export declare class AdminService {
    /**
     * Get dashboard statistics
     */
    getDashboardStats(): Promise<{
        users: {
            total: number;
            verified: number;
            pending: number;
            banned: number;
            newToday: number;
        };
        listings: {
            total: number;
            active: number;
            sold: number;
            newToday: number;
        };
        escrows: {
            total: number;
            active: number;
            completed: number;
            disputed: number;
            volume: number;
        };
        transactions: {
            total: number;
            volume: number;
            fees: number;
        };
    }>;
    /**
     * Get all users
     */
    getUsers(options?: {
        status?: UserStatus;
        role?: UserRole;
        campusId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: unknown[];
        total: number;
    }>;
    /**
     * Get user details
     */
    getUserDetails(userId: string): Promise<unknown>;
    /**
     * Suspend user
     */
    suspendUser(userId: string, reason: string, adminId: string): Promise<unknown>;
    /**
     * Ban user
     */
    banUser(userId: string, reason: string, adminId: string): Promise<unknown>;
    /**
     * Unban user
     */
    unbanUser(userId: string, adminId: string): Promise<unknown>;
    /**
     * Add strike to user
     */
    addStrike(userId: string, reason: string, adminId: string): Promise<unknown>;
    /**
     * Get disputes
     */
    getDisputes(options?: {
        status?: DisputeStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        disputes: unknown[];
        total: number;
    }>;
    /**
     * Resolve dispute
     */
    resolveDispute(disputeId: string, resolution: 'RESOLVED_BUYER' | 'RESOLVED_SELLER', notes: string, adminId: string): Promise<unknown>;
    /**
     * Create campus
     */
    createCampus(input: CampusInput): Promise<unknown>;
    /**
     * Update campus
     */
    updateCampus(campusId: string, input: Partial<CampusInput>): Promise<unknown>;
    /**
     * Create swap spot
     */
    createSwapSpot(input: SwapSpotInput): Promise<unknown>;
    /**
     * Get all campuses
     */
    getCampuses(): Promise<unknown[]>;
}
export declare const adminService: AdminService;
export default adminService;
//# sourceMappingURL=admin.service.d.ts.map