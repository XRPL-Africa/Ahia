
import xrpl from "xrpl";
import logger from "../config/logger.js";

class XRPLService {
  private client: xrpl.Client;
  private platformWallet!: xrpl.Wallet;
  private issuerWallet!: xrpl.Wallet;

  constructor() {
    this.client = new xrpl.Client(process.env.XRPL_NODE_URL!);

    // Platform wallet
    if (process.env.XRPL_PLATFORM_SEED) {
      this.platformWallet = xrpl.Wallet.fromSeed(
        process.env.XRPL_PLATFORM_SEED
      );
    } else {
      logger.warn("Platform seed missing");
    }

    // Issuer wallet
    if (process.env.XRPL_ISSUER_SEED) {
      this.issuerWallet = xrpl.Wallet.fromSeed(
        process.env.XRPL_ISSUER_SEED
      );
    } else {
      logger.warn("Issuer seed missing");
    }
  }

  async connect() {
    await this.client.connect();
    logger.info("Connected to XRPL");
  }

  async disconnect() {
    await this.client.disconnect();
    logger.info("Disconnected from XRPL");
  }

  // 🔥 GENERIC TX HANDLER
  private async submitTransaction(
    wallet: xrpl.Wallet,
    tx: xrpl.Transaction
  ) {
    const prepared = await this.client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return {
      hash: result.result.hash,
      success: result.result.meta.TransactionResult === "tesSUCCESS",
    };
  }

  // 🔥 CREATE TRUSTLINE
  async createTrustline(walletSeed: string) {
    const wallet = xrpl.Wallet.fromSeed(walletSeed);

    const tx: xrpl.TrustSet = {
      TransactionType: "TrustSet",
      Account: wallet.classicAddress,
      LimitAmount: {
        currency: process.env.XRPL_CURRENCY!,
        issuer: process.env.XRPL_ISSUER_ADDRESS!,
        value: "1000000",
      },
    };

    return this.submitTransaction(wallet, tx);
  }

  // 🔥 SEND XRP
  private async sendXRP(destination: string, amount: string) {
    if (!this.platformWallet)
      throw new Error("Platform wallet not initialized");

    const tx: xrpl.Payment = {
      TransactionType: "Payment",
      Account: this.platformWallet.classicAddress,
      Destination: destination,
      Amount: {
  currency: "RLUSD",
  issuer: process.env.XRPL_ISSUER_ADDRESS!,
  value: amount
}
    };

    return this.submitTransaction(this.platformWallet, tx);
  }

  // 🔥 ISSUE RLUSD (issuer → user/platform)
  async issueRLUSD(destination: string, amount: string) {
    if (!this.issuerWallet)
      throw new Error("Issuer wallet not initialized");

    const tx: xrpl.Payment = {
      TransactionType: "Payment",
      Account: this.issuerWallet.classicAddress,
      Destination: destination,
      Amount: {
        currency: process.env.XRPL_CURRENCY!,
        issuer: this.issuerWallet.classicAddress,
        value: amount,
      },
    };

    return this.submitTransaction(this.issuerWallet, tx);
  }

  // 🔥 TRANSFER RLUSD (platform → user)
  async transferRLUSD(destination: string, amount: string) {
    if (!this.platformWallet)
      throw new Error("Platform wallet not initialized");

    const tx: xrpl.Payment = {
      TransactionType: "Payment",
      Account: this.platformWallet.classicAddress,
      Destination: destination,
      Amount: {
        currency: process.env.XRPL_CURRENCY!,
        issuer: process.env.XRPL_ISSUER_ADDRESS!,
        value: amount,
      },
    };

    return this.submitTransaction(this.platformWallet, tx);
  }

  // 🔒 ESCROW-LIKE LOGIC (APP LEVEL)

  async commitFunds(amount: string) {
    return {
      hash: "internal-lock",
      success: true,
      amount,
    };
  }

  async releaseFunds(destination: string, amount: string) {
    return this.sendXRP(destination, amount);
  }

  async refundFunds(destination: string, amount: string) {
    return this.sendXRP(destination, amount);
  }
}

export const xrplService = new XRPLService();

