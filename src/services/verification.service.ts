import { prisma } from '../config/database.js';
import { notificationService } from './notification.service.js';
import logger from '../config/logger.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { UserStatus, VerificationStatus } from '@prisma/client';
import type { VerificationInput, VerificationReviewInput } from '../types/index.js';

export class VerificationService {
  /**
   * Submit verification documents
   */
  async submitVerification(userId: string, input: VerificationInput): Promise<unknown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { verification: true },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    if (user.status === UserStatus.VERIFIED) {
      throw new ApiError(400, 'ALREADY_VERIFIED', 'User is already verified');
    }

    if (user.verification?.status === VerificationStatus.PENDING) {
      throw new ApiError(400, 'VERIFICATION_PENDING', 'Verification is already pending');
    }

    // Create or update verification
    const verification = await prisma.verification.upsert({
      where: { userId },
      update: {
        idCardUrl: input.idCardUrl,
        idCardPublicId: input.idCardPublicId,
        portalScreenshotUrl: input.portalScreenshotUrl,
        studentIdNumber: input.studentIdNumber,
        status: VerificationStatus.PENDING,
        submittedAt: new Date(),
        rejectionReason: null,
        reviewedAt: null,
        reviewedBy: null,
      },
      create: {
        userId,
        idCardUrl: input.idCardUrl,
        idCardPublicId: input.idCardPublicId,
        portalScreenshotUrl: input.portalScreenshotUrl,
        studentIdNumber: input.studentIdNumber,
        status: VerificationStatus.PENDING,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.RESTRICTED },
    });

    logger.info(`Verification submitted for user ${userId}`);

    return verification;
  }

  /**
   * Review verification (admin action)
   */
  async reviewVerification(
    verificationId: string,
    adminId: string,
    input: VerificationReviewInput
  ): Promise<unknown> {
    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      throw Errors.NOT_FOUND('Verification');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new ApiError(400, 'ALREADY_REVIEWED', 'Verification has already been reviewed');
    }

    const updatedVerification = await prisma.$transaction(async (tx) => {
      // Update verification
      const updated = await tx.verification.update({
        where: { id: verificationId },
        data: {
          status: input.status as VerificationStatus,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: input.rejectionReason,
        },
      });

      // Update user status
      await tx.user.update({
        where: { id: verification.userId },
        data: {
          status:
            input.status === 'APPROVED'
              ? UserStatus.VERIFIED
              : UserStatus.RESTRICTED,
        },
      });

      return updated;
    });

    // Notify user
    await notificationService.notifyVerification(
      verification.userId,
      input.status,
      input.rejectionReason
    );

    logger.info(`Verification ${verificationId} ${input.status.toLowerCase()} by admin ${adminId}`);

    return updatedVerification;
  }

  /**
   * Get pending verifications
   */
  async getPendingVerifications(
    page: number = 1,
    limit: number = 20
  ): Promise<{ verifications: unknown[]; total: number }> {
    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where: { status: VerificationStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              campusId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { submittedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.verification.count({ where: { status: VerificationStatus.PENDING } }),
    ]);

    return { verifications, total };
  }

  /**
   * Get verification by user ID
   */
  async getVerificationByUserId(userId: string): Promise<unknown> {
    const verification = await prisma.verification.findUnique({
      where: { userId },
    });

    if (!verification) {
      throw Errors.NOT_FOUND('Verification');
    }

    return verification;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    averageReviewTime: number | null;
  }> {
    const [pending, approved, rejected, total, reviewed] = await Promise.all([
      prisma.verification.count({ where: { status: VerificationStatus.PENDING } }),
      prisma.verification.count({ where: { status: VerificationStatus.APPROVED } }),
      prisma.verification.count({ where: { status: VerificationStatus.REJECTED } }),
      prisma.verification.count(),
      prisma.verification.findMany({
        where: {
          status: { in: [VerificationStatus.APPROVED, VerificationStatus.REJECTED] },
          reviewedAt: { not: null },
        },
        select: {
          submittedAt: true,
          reviewedAt: true,
        },
      }),
    ]);

    // Calculate average review time
    let averageReviewTime: number | null = null;
    if (reviewed.length > 0) {
      const totalTime = reviewed.reduce((sum, v) => {
        if (v.reviewedAt) {
          return sum + (v.reviewedAt.getTime() - v.submittedAt.getTime());
        }
        return sum;
      }, 0);
      averageReviewTime = Math.round(totalTime / reviewed.length / 1000 / 60); // in minutes
    }

    return {
      pending,
      approved,
      rejected,
      total,
      averageReviewTime,
    };
  }
}

export const verificationService = new VerificationService();
export default verificationService;
