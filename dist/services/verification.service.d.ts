import type { VerificationInput, VerificationReviewInput } from '../types/index.js';
export declare class VerificationService {
    /**
     * Submit verification documents
     */
    submitVerification(userId: string, input: VerificationInput): Promise<unknown>;
    /**
     * Review verification (admin action)
     */
    reviewVerification(verificationId: string, adminId: string, input: VerificationReviewInput): Promise<unknown>;
    /**
     * Get pending verifications
     */
    getPendingVerifications(page?: number, limit?: number): Promise<{
        verifications: unknown[];
        total: number;
    }>;
    /**
     * Get verification by user ID
     */
    getVerificationByUserId(userId: string): Promise<unknown>;
    /**
     * Get verification statistics
     */
    getVerificationStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
        averageReviewTime: number | null;
    }>;
}
export declare const verificationService: VerificationService;
export default verificationService;
//# sourceMappingURL=verification.service.d.ts.map