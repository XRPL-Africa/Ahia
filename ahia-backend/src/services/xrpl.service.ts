import xrpl from "xrpl";
import logger from "../config/logger.js";

class XRPLService {
  private client: xrpl.Client;
  private wallet!: xrpl.Wallet;

  constructor() {
    this.client = new xrpl.Client(process.env.XRPL_NODE_URL!);

    if (!process.env.XRPL_PLATFORM_SEED) {
      logger.warn("XRPL seed missing");
      return;
    }

    this.wallet = xrpl.Wallet.fromSeed(process.env.XRPL_PLATFORM_SEED);
  }

  async connect() {
    await this.client.connect();
    logger.info("Connected to XRPL");
  }

  async disconnect() {
    await this.client.disconnect();
  }

  private async sendPayment(destination: string, amount: string) {
    if (!this.wallet) throw new Error("XRPL wallet not initialized");

    const tx: xrpl.Payment = {
      TransactionType: "Payment",
      Account: this.wallet.classicAddress,
      Destination: destination,
      Amount: xrpl.xrpToDrops(amount), // ✅ XRP for now
    };

    const prepared = await this.client.autofill(tx);
    const signed = this.wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return {
      hash: result.result.hash,
      success: result.result.meta.TransactionResult === "tesSUCCESS",
    };
  }

  async commitFunds(amount: string) {
    // Buyer → platform wallet (simulated)
    return {
      hash: "internal-lock",
      success: true,
    };
  }

  async releaseFunds(destination: string, amount: string) {
    return this.sendPayment(destination, amount);
  }

  async refundFunds(destination: string, amount: string) {
    return this.sendPayment(destination, amount);
  }
}

export const xrplService = new XRPLService();