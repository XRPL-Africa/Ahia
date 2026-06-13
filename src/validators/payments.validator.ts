import { z } from "zod";

export const createEscrowSchema = z.object({
  listingId: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum([
    "FIAT_PAYSTACK",
    "CRYPTO_RLUSD"
  ])
});

export const confirmPaymentSchema = z.object({
  escrowId: z.string().uuid(),
  txHash: z.string().min(10)
});

export const refundSchema = z.object({
  escrowId: z.string().uuid()
});

export const offrampSchema = z.object({
  userId: z.string().uuid(),

  amountRLUSD: z.number().positive(),

  amountNGN: z.number().positive(),

  bankName: z.string(),

  accountName: z.string(),

  accountNumber: z.string().min(10)
});