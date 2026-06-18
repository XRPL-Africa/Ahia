import { prisma } from "../config/database.js";
import { xrplService } from "../config/xrpl.js";
import xrplPaymentService from "./xrplPayment.service.js";
import { notificationService } from "./notification.service.js";
import logger from "../config/logger.js";
import { ApiError, Errors } from "../middleware/errorHandler.js";
import {
  calculatePlatformFee,
  calculateEscrowReleaseDate,
  canFreezeEscrow,
} from "../utils/helpers.js";

import {
  EscrowStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import type {
  CreateEscrowInput,
  FreezeEscrowInput,
} from "../types/index.js";

export class EscrowService {
  private ESCROW_DURATION_DAYS = 14;
  private ESCROW_EXTENSION_DAYS = 7;
  private MAX_EXTENSIONS = 1;
  private PLATFORM_FEE_PERCENTAGE = 2.5;

  // =============================
  // CREATE ESCROW
  // =============================
  async createEscrow(buyerId: string, input: CreateEscrowInput) {
    const listing = await prisma.listing.findUnique({
      where: { id: input.listingId },
      include: { seller: true },
    });

    if (!listing) throw Errors.NOT_FOUND("Listing");

    if (listing.sellerId === buyerId) {
      throw new ApiError(400, "INVALID", "Cannot buy your own listing");
    }

    const amount = Number(listing.buyNowPrice);

    const { fee } = calculatePlatformFee(
      amount,
      this.PLATFORM_FEE_PERCENTAGE
    );

    const escrow = await prisma.escrow.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        amount: new Prisma.Decimal(amount),
        platformFee: new Prisma.Decimal(fee),
        paymentMethod: input.paymentMethod as PaymentMethod,
        status: EscrowStatus.PENDING,
      },
    });

    return escrow;
  }

  // =============================
  // INITIATE PAYMENT
  // =============================
  async initiatePayment(escrowId: string, userId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: { buyer: true },
    });

    if (!escrow) throw Errors.NOT_FOUND("Escrow");

    if (escrow.buyerId !== userId) {
      throw new ApiError(403, "UNAUTHORIZED", "Not your escrow");
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new ApiError(400, "INVALID_STATE", "Already processed");
    }

    // ================= PAYSTACK =================
    if (escrow.paymentMethod === "FIAT_PAYSTACK") {
      const paystackService = (await import("./paystack.service.js")).default;

      const payment = await paystackService.initializePayment({
        email: escrow.buyer.email,
        amount: Number(escrow.amount) * 100,
        metadata: { escrowId },
      });

      return {
        type: "paystack",
        authorizationUrl: payment.authorization_url,
      };
    }

    // ================= CRYPTO =================
    if (escrow.paymentMethod === "CRYPTO_XRP") {
      return {
        type: "crypto",
        address: process.env.XRPL_PLATFORM_ADDRESS,
        amount: escrow.amount,
      };
    }

    throw new ApiError(400, "INVALID_METHOD", "Unsupported payment");
  }

  // =============================
  // VERIFY CRYPTO PAYMENT
  // =============================
  async verifyCryptoPayment(escrowId: string) {
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) throw Errors.NOT_FOUND("Escrow");

    const isPaid = await xrplPaymentService.getBalance(
      process.env.XRPL_PLATFORM_ADDRESS!
    );

    if (isPaid.balance < Number(escrow.amount)) {
      throw new ApiError(400, "NOT_PAID", "Payment not detected");
    }

    await prisma.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.COMMITTED },
    });

    return true;
  }

  // =============================
  // MARK HANDOVER
  // =============================
  async markHandover(escrowId: string, sellerId: string) {
    const escrow = await prisma.escrow.findFirst({
      where: { id: escrowId, sellerId },
    });

    if (!escrow) throw Errors.NOT_FOUND("Escrow");

    const inspectionEndsAt = calculateEscrowReleaseDate(
      new Date(),
      this.ESCROW_DURATION_DAYS
    );

    return prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.PENDING_INSPECTION,
        handoverAt: new Date(),
        inspectionEndsAt,
      },
    });
  }

  // =============================
  // RELEASE FUNDS
  // =============================
  async verifyAndRelease(escrowId: string, buyerId: string) {
    const escrow = await prisma.escrow.findFirst({
      where: { id: escrowId, buyerId },
    });

    if (!escrow) throw Errors.NOT_FOUND("Escrow");

    // XRPL TRANSFER
    if (escrow.paymentMethod === "CRYPTO_XRP") {
      const seller = await prisma.user.findUnique({
        where: { id: escrow.sellerId },
      });

      if (!seller?.walletAddress) {
        throw new ApiError(400, "NO_WALLET", "Seller wallet missing");
      }

      await xrplPaymentService.sendXRPPayment(
        seller.walletAddress,
        escrow.amount.toString()
      );
    }

    return prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: EscrowStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  // =============================
  // CANCEL ESCROW
  // =============================
  async cancelEscrow(escrowId: string, userId: string) {
    const escrow = await prisma.escrow.findFirst({
      where: {
        id: escrowId,
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    });

    if (!escrow) throw Errors.NOT_FOUND("Escrow");

    return prisma.escrow.update({
      where: { id: escrowId },
      data: { status: EscrowStatus.CANCELLED },
    });
  }
}

export const escrowService = new EscrowService();
export default escrowService;