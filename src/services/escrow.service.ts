// src/services/escrow.service.ts
// Ahia — Campus Marketplace | XRPL Escrow Service

import type { EscrowTransaction } from "@/types/escrow";

const IS_DEV = process.env.NODE_ENV === "development";

// Lazy-load mock service in development
const getMockService = async () => {
  const mod = await import("@/services/mock/escrow.service.mock");
  return mod.MockEscrowService;
};

export const EscrowService = {
  /**
   * Fetch a single escrow transaction by ID.
   */
  getTransaction: async (id: string): Promise<EscrowTransaction> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.getTransaction(id);
    }
    const res = await fetch(`/api/escrow/${id}`);
    if (!res.ok) throw new Error("Failed to fetch transaction");
    return res.json();
  },

  /**
   * Fetch all transactions for a user.
   */
  getUserTransactions: async (userId: string): Promise<EscrowTransaction[]> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.getUserTransactions(userId);
    }
    const res = await fetch(`/api/users/${userId}/transactions`);
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return res.json();
  },

  /**
   * Buyer confirms receipt — triggers XRPL EscrowFinish.
   */
  confirmReceipt: async (id: string, fulfillment: string): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.confirmReceipt(id, fulfillment);
    }
    await fetch(`/api/escrow/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({ fulfillment }),
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Seller marks item as dispatched.
   */
  markItemSent: async (id: string, trackingNote?: string): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.markItemSent(id, trackingNote);
    }
    await fetch(`/api/escrow/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ note: trackingNote }),
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Either party raises a dispute.
   */
  raiseDispute: async (id: string, reason: string): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.raiseDispute(id, reason);
    }
    await fetch(`/api/escrow/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Cancel escrow — calls XRPL EscrowCancel after expiry.
   */
  cancelEscrow: async (id: string): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.cancelEscrow(id);
    }
    await fetch(`/api/escrow/${id}/cancel`, { method: "POST" });
  },

  /**
   * Buyer verifies item authenticity during testing period.
   */
  verifyAuthenticity: async (id: string, notes?: string): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.verifyAuthenticity(id, notes);
    }
    await fetch(`/api/escrow/${id}/verify-authenticity`, {
      method: "POST",
      body: JSON.stringify({ notes }),
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Buyer requests additional testing time.
   */
  extendTesting: async (id: string, additionalDays: number): Promise<void> => {
    if (IS_DEV) {
      const mock = await getMockService();
      return mock.extendTesting(id, additionalDays);
    }
    await fetch(`/api/escrow/${id}/extend-testing`, {
      method: "POST",
      body: JSON.stringify({ additionalDays }),
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Get XRPL Explorer URL for a transaction hash.
   */
  getXRPLTransactionUrl: (txHash: string): string =>
    `https://livenet.xrpl.org/transactions/${txHash}`,
};

export default EscrowService;
