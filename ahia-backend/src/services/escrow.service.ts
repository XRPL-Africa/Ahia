import { prisma } from '../config/database.js';
import { xrplService } from '../config/xrpl.js';
import { notificationService } from './notification.service.js';
import logger from '../config/logger.js';
import { ApiError, Errors } from '../middleware/errorHandler.js';
import { calculatePlatformFee, calculateEscrowReleaseDate, canFreezeEscrow } from '../utils/helpers.js';
import { EscrowStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import type { CreateEscrowInput, EscrowActionInput, FreezeEscrowInput } from '../types/index.js';

export class EscrowService {
  private readonly ESCROW_DURATION_DAYS = 14;
  private readonly ESCROW_EXTENSION_DAYS = 7;
  private readonly MAX_EXTENSIONS = 1;
  private readonly PLATFORM_FEE_PERCENTAGE = 2.5;

  /**
   * Create a new escrow
   */
  async createEscrow(buyerId: string, input: CreateEscrowInput): Promise<unknown> {
    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { seller: true },
    });

    if (!listing) {
      throw Errors.NOT_FOUND('Listing');
    }

    if (listing.status !== 'ACTIVE') {
      throw new ApiError(400, 'LISTING_NOT_ACTIVE', 'Listing is not active');
    }

    if (listing.sellerId === buyerId) {
      throw new ApiError(400, 'CANNOT_BUY_OWN_LISTING', 'Cannot buy your own listing');
    }

    // Determine amount
    let amount: number;
    if (input.bidId) {
      const bid = await prisma.bid.findUnique({
        where: { id: input.bidId },
      });
      if (!bid || bid.status !== 'ACCEPTED') {
        throw new ApiError(400, 'INVALID_BID', 'Bid not found or not accepted');
      }
      amount = Number(bid.amount);
    } else {
      if (!listing.buyNowPrice) {
        throw new ApiError(400, 'NO_BUY_NOW_PRICE', 'Listing does not have a buy now price');
      }
      amount = Number(listing.buyNowPrice);
    }

    // Calculate platform fee
    const { fee: platformFee, netAmount } = calculatePlatformFee(amount, this.PLATFORM_FEE_PERCENTAGE);

    // Create escrow in database
    const escrow = await prisma.$transaction(async (tx) => {
      // Create escrow
      const newEscrow = await tx.escrow.create({
        data: {
          listingId: input.listingId,
          bidId: input.bidId,
          buyerId,
          sellerId: listing.sellerId,
          amount: new Prisma.Decimal(amount),
          platformFee: new Prisma.Decimal(platformFee),
          paymentMethod: input.paymentMethod as PaymentMethod,
          status: EscrowStatus.COMMITTED,
        },
      });

      // Update listing status
      await tx.listing.update({
        where: { id: input.listingId },
        data: { status: 'RESERVED' },
      });

      // If bid exists, update its status
      if (input.bidId) {
        await tx.bid.update({
          where: { id: input.bidId },
          data: { status: 'ACCEPTED' },
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          escrowId: newEscrow.id,
          buyerId,
          sellerId: listing.sellerId,
          type: 'ESCROW_LOCK',
          amount: new Prisma.Decimal(amount),
          currency: input.paymentMethod === 'CRYPTO_RLUSD' ? 'RLUSD' : 'NGN',
          status: PaymentStatus.PENDING,
          paymentMethod: input.paymentMethod as PaymentMethod,
        },
      });

      return newEscrow;
    });

    // Create XRPL escrow for crypto payments
 if (input.paymentMethod === 'CRYPTO_RLUSD') {
  try {
    const xrplResult = await xrplService.commitFunds(
      amount.toString(),
      process.env.XRPL_PLATFORM_ADDRESS! // 🔥 IMPORTANT
    );

    await prisma.escrow.update({
      where: { id: escrow.id },
      data: {
        escrowTxHash: xrplResult.hash,
      },
    });

  } catch (error) {
    logger.error('Failed to commit XRPL funds:', error);
    throw new ApiError(500, 'XRPL_ERROR', 'Blockchain payment failed');
  }
}

    // Notify seller
    await notificationService.notifyEscrowStatus(
      listing.sellerId,
      'COMMITTED',
      listing.title
    );

    logger.info(`Escrow created: ${escrow.id} for listing ${input.listingId}`);

    return this.getEscrowById(escrow.id);
  }

  /**
   * Get escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<unknown> {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          include: { images: true },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        transactions: true,
        dispute: true,
      },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    return escrow;
  }

  /**
   * Get user's escrows
   */
  async getUserEscrows(
    userId: string,
    role: 'buyer' | 'seller' | 'all' = 'all',
    status?: EscrowStatus
  ): Promise<unknown[]> {
    const where: Prisma.EscrowWhereInput = {
      ...(role === 'buyer' && { buyerId: userId }),
      ...(role === 'seller' && { sellerId: userId }),
      ...(role === 'all' && { OR: [{ buyerId: userId }, { sellerId: userId }] }),
      ...(status && { status }),
    };

    return prisma.escrow.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: { take: 1 },
          },
        },
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark item as handed over (seller action)
   */
  async markHandover(escrowId: string, sellerId: string): Promise<unknown> {
    const escrow = await prisma.escrow.findFirst({
      where: { id: escrowId, sellerId },
      include: { listing: true },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    if (escrow.status !== EscrowStatus.COMMITTED) {
      throw new ApiError(400, 'INVALID_ESCROW_STATE', 'Escrow is not in COMMITTED state');
    }

    const inspectionEndsAt = calculateEscrowReleaseDate(
      new Date(),
      this.ESCROW_DURATION_DAYS
    );

    const updatedEscrow = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.PENDING_INSPECTION,
        handoverAt: new Date(),
        inspectionEndsAt,
      },
      include: { listing: true },
    });

    // Notify buyer
    await notificationService.notifyEscrowStatus(
      escrow.buyerId,
      'PENDING_INSPECTION',
      escrow.listing.title
    );

    logger.info(`Escrow ${escrowId} marked as handed over`);

    return updatedEscrow;
  }

  /**
   * Verify authenticity and release funds (buyer action)
   */
  async verifyAndRelease(escrowId: string, buyerId: string): Promise<unknown> {
    const escrow = await prisma.escrow.findFirst({
      where: { id: escrowId, buyerId },
      include: { listing: true },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    if (escrow.status !== EscrowStatus.PENDING_INSPECTION && 
        escrow.status !== EscrowStatus.FROZEN) {
      throw new ApiError(400, 'INVALID_ESCROW_STATE', 'Escrow cannot be released at this stage');
    }

    // Release funds on XRPL if crypto
    if (escrow.paymentMethod === 'CRYPTO_RLUSD' && escrow.escrowSequence) {
      try {
 const seller = await prisma.user.findUnique({
  where: { id: escrow.sellerId },
});

if (!seller?.walletAddress) {
  throw new ApiError(400, "SELLER_WALLET_MISSING", "Seller has no wallet");
}

await xrplService.releaseFunds(
  seller.walletAddress,
  escrow.amount.toString()
);
      } catch (error) {
        logger.error('Failed to finish XRPL escrow:', error);
        throw new ApiError(500, 'XRPL_ERROR', 'Failed to release funds on blockchain');
      }
    }

    const updatedEscrow = await prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update transaction status
      await tx.transaction.updateMany({
        where: { escrowId },
        data: { status: PaymentStatus.COMPLETED, completedAt: new Date() },
      });

      // Update listing status
      await tx.listing.update({
        where: { id: escrow.listingId },
        data: { status: 'SOLD' },
      });

      // Update seller stats
      await tx.user.update({
        where: { id: escrow.sellerId },
        data: {
          successfulTrades: { increment: 1 },
          totalTrades: { increment: 1 },
        },
      });

      // Update buyer stats
      await tx.user.update({
        where: { id: buyerId },
        data: {
          totalTrades: { increment: 1 },
        },
      });

      // Update wallet balance for seller
      const netAmount = Number(escrow.amount) - Number(escrow.platformFee);
      await tx.walletBalance.upsert({
        where: { userId: escrow.sellerId },
        update: {
          pending: { increment: netAmount },
        },
        create: {
          userId: escrow.sellerId,
          pending: netAmount,
        },
      });

      return updated;
    });

    // Notify seller
    await notificationService.notifyPaymentReceived(
      escrow.sellerId,
      Number(escrow.amount) - Number(escrow.platformFee),
      escrow.listing.title
    );

    logger.info(`Escrow ${escrowId} completed and funds released`);

    return updatedEscrow;
  }

  /**
   * Freeze escrow (buyer requests extension)
   */
  async freezeEscrow(
    escrowId: string,
    buyerId: string,
    input: FreezeEscrowInput
  ): Promise<unknown> {
    const escrow = await prisma.escrow.findFirst({
      where: { id: escrowId, buyerId },
      include: { listing: true },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    if (escrow.status !== EscrowStatus.PENDING_INSPECTION) {
      throw new ApiError(400, 'INVALID_ESCROW_STATE', 'Escrow cannot be frozen at this stage');
    }

    if (!escrow.inspectionEndsAt) {
      throw new ApiError(400, 'INVALID_STATE', 'Inspection end date not set');
    }

    // Check if within freeze window
    if (!canFreezeEscrow(escrow.inspectionEndsAt)) {
      throw new ApiError(400, 'FREEZE_WINDOW_CLOSED', 'Freeze window has closed');
    }

    if (escrow.extensionCount >= this.MAX_EXTENSIONS) {
      throw new ApiError(400, 'MAX_EXTENSIONS_REACHED', 'Maximum extensions reached');
    }

    const frozenExpiryAt = new Date();
    frozenExpiryAt.setDate(frozenExpiryAt.getDate() + this.ESCROW_EXTENSION_DAYS);

    const updatedEscrow = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.FROZEN,
        frozenAt: new Date(),
        frozenReason: input.reason,
        frozenExpiryAt,
        extensionCount: { increment: 1 },
      },
    });

    // Notify seller
    await notificationService.createNotification({
      userId: escrow.sellerId,
      type: 'ESCROW',
      title: 'Escrow Frozen',
      message: `Buyer requested an extension for "${escrow.listing.title}". Reason: ${input.reason}`,
      data: { escrowId, reason: input.reason },
    });

    logger.info(`Escrow ${escrowId} frozen by buyer`);

    return updatedEscrow;
  }

  /**
   * Open dispute
   */
  async openDispute(
    escrowId: string,
    raisedById: string,
    reason: string,
    description: string,
    evidenceUrls?: string[]
  ): Promise<unknown> {
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: escrowId,
        OR: [{ buyerId: raisedById }, { sellerId: raisedById }],
      },
      include: { listing: true },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    if (escrow.status === EscrowStatus.COMPLETED || 
        escrow.status === EscrowStatus.REFUNDED ||
        escrow.status === EscrowStatus.DISPUTED) {
      throw new ApiError(400, 'INVALID_ESCROW_STATE', 'Cannot dispute this escrow');
    }

    const updatedEscrow = await prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrow.update({
        where: { id: escrowId },
        data: { status: EscrowStatus.DISPUTED },
      });

      // Create dispute record
      await tx.dispute.create({
        data: {
          escrowId,
          raisedById,
          reason,
          description,
          evidenceUrls: evidenceUrls || [],
          status: 'OPEN',
        },
      });

      return updated;
    });

    // Notify both parties
    const otherPartyId = escrow.buyerId === raisedById ? escrow.sellerId : escrow.buyerId;
    await notificationService.notifyEscrowStatus(
      otherPartyId,
      'DISPUTED',
      escrow.listing.title
    );

    logger.info(`Dispute opened for escrow ${escrowId}`);

    return updatedEscrow;
  }

  /**
   * Cancel escrow (before payment or by mutual agreement)
   */
  async cancelEscrow(escrowId: string, userId: string): Promise<unknown> {
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: escrowId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: { listing: true },
    });

    if (!escrow) {
      throw Errors.NOT_FOUND('Escrow');
    }

    // Can only cancel if in COMMITTED state (before handover)
    if (escrow.status !== EscrowStatus.COMMITTED) {
      throw new ApiError(400, 'INVALID_ESCROW_STATE', 'Escrow cannot be cancelled at this stage');
    }
if (escrow.paymentMethod === 'CRYPTO_RLUSD') {
  try {
    const buyer = await prisma.user.findUnique({
      where: { id: escrow.buyerId },
    });

    if (!buyer?.walletAddress) {
      throw new ApiError(400, "BUYER_WALLET_MISSING", "Buyer has no wallet");
    }

    await xrplService.refundFunds(
      buyer.walletAddress,
      escrow.amount.toString()
    );

  } catch (error) {
    logger.error('XRPL refund error:', error);
    throw new ApiError(500, 'XRPL_ERROR', 'Failed to refund funds');
  }
}

    const updatedEscrow = await prisma.$transaction(async (tx) => {
      // Update escrow status
      const updated = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: EscrowStatus.CANCELLED,
          refundedAt: new Date(),
        },
      });

      // Update transaction status
      await tx.transaction.updateMany({
        where: { escrowId },
        data: { status: PaymentStatus.REFUNDED },
      });

      // Update listing status back to active
      await tx.listing.update({
        where: { id: escrow.listingId },
        data: { status: 'ACTIVE' },
      });

      return updated;
    });

    // Notify other party
    const otherPartyId = escrow.buyerId === userId ? escrow.sellerId : escrow.buyerId;
    await notificationService.createNotification({
      userId: otherPartyId,
      type: 'ESCROW',
      title: 'Escrow Cancelled',
      message: `The escrow for "${escrow.listing.title}" has been cancelled.`,
      data: { escrowId },
    });

    logger.info(`Escrow ${escrowId} cancelled`);

    return updatedEscrow;
  }

  /**
   * Process expired escrows (auto-release)
   */
  async processExpiredEscrows(): Promise<number> {
    const now = new Date();

    // Find escrows that have passed inspection period
    const expiredEscrows = await prisma.escrow.findMany({
      where: {
        status: EscrowStatus.PENDING_INSPECTION,
        inspectionEndsAt: { lt: now },
      },
      include: { listing: true },
    });

    for (const escrow of expiredEscrows) {
      try {
        // Auto-release funds
        await this.verifyAndRelease(escrow.id, escrow.buyerId);
        logger.info(`Auto-released escrow ${escrow.id}`);
      } catch (error) {
        logger.error(`Failed to auto-release escrow ${escrow.id}:`, error);
      }
    }

    // Find frozen escrows that have passed extension period
    const expiredFrozenEscrows = await prisma.escrow.findMany({
      where: {
        status: EscrowStatus.FROZEN,
        frozenExpiryAt: { lt: now },
      },
      include: { listing: true },
    });

    for (const escrow of expiredFrozenEscrows) {
      try {
        // Auto-release funds after extension period
        await this.verifyAndRelease(escrow.id, escrow.buyerId);
        logger.info(`Auto-released frozen escrow ${escrow.id}`);
      } catch (error) {
        logger.error(`Failed to auto-release frozen escrow ${escrow.id}:`, error);
      }
    }

    return expiredEscrows.length + expiredFrozenEscrows.length;
  }
}

export const escrowService = new EscrowService();
export default escrowService;
