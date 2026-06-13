import prisma from "../config/database.js";
import xrplService from "../config/xrpl.js";
import xrplPaymentService
  from "./xrplPayment.service.js";

  
export class PaymentsService {

  async createEscrow(data: any) {

    const platformFee =
      Number(data.amount) * 0.05;

    return prisma.escrow.create({
      data: {
        listingId: data.listingId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,

        amount: data.amount,

        platformFee,

        paymentMethod: data.paymentMethod,

        status: "COMMITTED"
      }
    });
  }

 async confirmPayment(
  escrowId: string,
  txHash: string
) {
  const escrow =
    await prisma.escrow.findUnique({
      where: { id: escrowId }
    });

  if (!escrow) {
    throw new Error("Escrow not found");
  }

  // Prevent double confirmation
  if (escrow.escrowTxHash) {
    throw new Error(
      "Escrow already funded"
    );
  }

  const tx =
    await xrplPaymentService.verifyTransaction(
      txHash
    );

  // ------------------------------------------------
  // 1. VALIDATED
  // ------------------------------------------------

  if (!tx.validated) {
    throw new Error(
      "Transaction not validated"
    );
  }

  // ------------------------------------------------
  // 2. SUCCESSFUL
  // ------------------------------------------------

  if (
    tx.meta?.TransactionResult !==
    "tesSUCCESS"
  ) {
    throw new Error(
      "Payment failed"
    );
  }

  // ------------------------------------------------
  // 3. DESTINATION CHECK
  // ------------------------------------------------

  if (
    tx.Destination !==
    process.env.XRPL_PLATFORM_ADDRESS
  ) {
    throw new Error(
      "Invalid destination wallet"
    );
  }

  // ------------------------------------------------
  // 4. BUYER WALLET CHECK
  // ------------------------------------------------

  const buyer =
    await prisma.user.findUnique({
      where: {
        id: escrow.buyerId
      }
    });

  if (!buyer) {
    throw new Error(
      "Buyer not found"
    );
  }

  if (!buyer.walletAddress) {
    throw new Error(
      "Buyer wallet not linked"
    );
  }

  if (
    tx.Account !==
    buyer.walletAddress
  ) {
    throw new Error(
      "Sender wallet mismatch"
    );
  }

  // ------------------------------------------------
  // 5. AMOUNT CHECK
  // ------------------------------------------------

  const expected =
    Number(escrow.amount);

  const actual =
    Number(tx.Amount) / 1000000;

  if (
    Math.abs(expected - actual) >
    0.000001
  ) {
    throw new Error(
      "Amount mismatch"
    );
  }

  // ------------------------------------------------
  // 6. SAVE TRANSACTION
  // ------------------------------------------------

  await prisma.transaction.create({
    data: {
      escrowId,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,

      amount: escrow.amount,

      currency: "RLUSD",

      xrplTxHash: txHash,

      type: "ESCROW_LOCK",

      status: "COMPLETED"
    }
  });

  // ------------------------------------------------
  // 7. UPDATE ESCROW
  // ------------------------------------------------

  return prisma.escrow.update({
    where: {
      id: escrowId
    },
    data: {
      escrowTxHash: txHash,
      status:
        "PENDING_INSPECTION"
    }
  });
}

  async getStatus(id: string) {
    return prisma.escrow.findUnique({
      where: { id }
    });
  }

  async refundEscrow(id: string) {

    const escrow =
      await prisma.escrow.findUnique({
        where: { id }
      });

    if (!escrow)
      throw new Error("Escrow not found");

    await prisma.transaction.create({
      data: {
        escrowId: escrow.id,
        buyerId: escrow.buyerId,
        sellerId: escrow.sellerId,

        amount: escrow.amount,

        currency: "RLUSD",

        type: "ESCROW_REFUND",

        status: "COMPLETED"
      }
    });

    return prisma.escrow.update({
      where: { id },

      data: {
        status: "REFUNDED",
        refundedAt: new Date()
      }
    });
  }

  async getBalance(address: string) {

    const account =
      await xrplService.getAccountInfo(address);

    return account;
  }

  async createOfframp(data: any) {

    return prisma.offrampRequest.create({
      data: {
        userId: data.userId,

        amountRLUSD: data.amountRLUSD,

        amountNGN: data.amountNGN,

        bankName: data.bankName,

        accountName: data.accountName,

        accountNumber: data.accountNumber,

        status: "PENDING"
      }
    });
  }

  async approveOfframp(
  id: string
) {
  return prisma.offrampRequest.update({
    where: { id },

    data: {
      status: "APPROVED"
    }
  });
}

async completeOfframp(
  id: string
) {
  return prisma.offrampRequest.update({
    where: { id },

    data: {
      status: "COMPLETED"
    }
  });
}




  async getHistory(userId:string) {
   return prisma.transaction.findMany({
      where:{
         OR:[
           { buyerId:userId },
           { sellerId:userId }
         ]
      },
      orderBy:{
         createdAt:"desc"
      }
   });
}
}

export const paymentsService =
  new PaymentsService();