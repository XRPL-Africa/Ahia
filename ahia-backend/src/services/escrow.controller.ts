import prisma from "@/config/database";
import { ApiError } from "@/middleware";
import { xrplService } from "./xrpl.service";

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