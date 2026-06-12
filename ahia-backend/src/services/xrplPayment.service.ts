import { Client, Wallet, xrpToDrops } from "xrpl";
import dotenv from "dotenv";
import logger from "../config/logger.js";

dotenv.config();

const XRPL_NODE_URL =
  process.env.XRPL_NODE_URL || "wss://s.altnet.rippletest.net:51233";

const PLATFORM_SEED = process.env.XRPL_PLATFORM_SEED;

class XRPLPaymentService {
  private client: Client | null = null;
  private wallet: Wallet | null = null;
  private connected = false;

  constructor() {
    if (PLATFORM_SEED) {
      this.wallet = Wallet.fromSeed(PLATFORM_SEED);
      logger.info("Platform wallet loaded");
    } else {
      logger.warn("Missing PLATFORM_SEED");
    }
  }

  async connect() {
    if (this.connected && this.client) return;

    this.client = new Client(XRPL_NODE_URL);
    await this.client.connect();

    this.connected = true;
    logger.info("XRPL connected");
  }

  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect();
      this.connected = false;
    }
  }

  private async getClient() {
    if (!this.client || !this.connected) {
      await this.connect();
    }
    return this.client!;
  }

  /**
   * 💰 SEND XRP PAYMENT (REAL FUNCTION YOU NEED NOW)
   */
  async sendXRPPayment(
    destination: string,
    amountXRP: string
  ): Promise<string> {
    const client = await this.getClient();

    if (!this.wallet) {
      throw new Error("Platform wallet not configured");
    }

    const tx = {
      TransactionType: "Payment",
      Account: this.wallet.address,
      Destination: destination,
      Amount: xrpToDrops(amountXRP), // ✔ CORRECT FORMAT
    };

    const prepared = await client.autofill(tx);
    const signed = this.wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    if (result.result.meta.TransactionResult !== "tesSUCCESS") {
      throw new Error(
        `Payment failed: ${result.result.meta.TransactionResult}`
      );
    }

    logger.info("Payment successful:", signed.hash);
    return signed.hash;
  }

  /**
   * 💳 CHECK BALANCE
   */
  async getBalance(address: string) {
    const client = await this.getClient();

    const res = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });

    return {
      balance: Number(res.result.account_data.Balance) / 1_000_000,
      sequence: res.result.account_data.Sequence,
    };
  }

  /**
   * 🧪 VALID ADDRESS
   */
  isValidAddress(address: string) {
    return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
  }


  async verifyTransaction(hash:string)
{
   const client = await this.getClient();

   const tx = await client.request({
      command:"tx",
      transaction: hash
   });

   return tx.result;
}
}

export const xrplPaymentService = new XRPLPaymentService();
export default xrplPaymentService;