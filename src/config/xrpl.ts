import { Client, Wallet, dropsToXrp } from "xrpl";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

/**
 * CONFIG
 */
const XRPL_NODE_URL =
  process.env.XRPL_NODE_URL || "wss://s.altnet.rippletest.net:51233";

const PLATFORM_SEED = process.env.XRPL_PLATFORM_SEED;

const RLUSD_ISSUER =
  process.env.RLUSD_ISSUER || "rQhWct2fv4E4bR7YBQNv4rBc7E4d7c8w";

const RLUSD_CURRENCY = "RLUSD";

/**
 * XRPL SERVICE
 */
class XRPLService {
  private client: Client | null = null;
  private platformWallet: Wallet | null = null;
  private connected = false;

  constructor() {
    if (PLATFORM_SEED) {
      this.platformWallet = Wallet.fromSeed(PLATFORM_SEED);
      logger.info("XRPL platform wallet loaded");
    } else {
      logger.warn("XRPL_PLATFORM_SEED missing");
    }
  }

  /**
   * CONNECT
   */
  async connect() {
    if (this.connected && this.client) return;

    this.client = new Client(XRPL_NODE_URL);

    try {
      await this.client.connect();
      this.connected = true;
      logger.info("XRPL connected:", XRPL_NODE_URL);
    } catch (err) {
      console.error("❌ XRPL CONNECT FAILED:", err);
      throw err;
    }
  }

  /**
   * DISCONNECT
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect();
      this.connected = false;
      logger.info("XRPL disconnected");
    }
  }

  private async ensureClient() {
    if (!this.client || !this.connected) {
      await this.connect();
    }
    return this.client!;
  }

  /**
   * WALLET GENERATION
   */
  generateWallet() {
    const wallet = Wallet.generate();

    return {
      address: wallet.address,
      seed: wallet.seed!,
      publicKey: wallet.publicKey,
    };
  }

  getWallet(seed: string) {
    return Wallet.fromSeed(seed);
  }

  /**
   * FUND WALLET (TESTNET SAFE + TIMEOUT FIX)
   */
  async fundWallet(address: string) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(
        "https://faucet.altnet.rippletest.net/accounts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination: address }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(JSON.stringify(data));
      }

      logger.info("Wallet funded:", address);
      return data;
    } catch (err) {
      console.error("❌ FUND WALLET ERROR:", err);
      throw err;
    }
  }

  /**
   * TRUSTLINE (SAFE)
   */
  async setTrustLine(wallet: Wallet, limit = "100000") {
    const client = await this.ensureClient();

    const tx = {
      TransactionType: "TrustSet",
      Account: wallet.address,
      LimitAmount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: limit,
      },
    };

    try {
      const prepared = await client.autofill(tx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(
          `TrustLine failed: ${result.result.meta.TransactionResult}`
        );
      }

      logger.info("Trustline created:", wallet.address);
      return signed.hash;
    } catch (err) {
      console.error("❌ TRUSTLINE ERROR:", err);
      throw err;
    }
  }

  /**
   * RLUSD ISSUE (FIXED IOU FORMAT)
   */
  async issueRLUSD(destination: string, amount: string) {
    const client = await this.ensureClient();

    if (!this.platformWallet) {
      throw new Error("Platform wallet missing");
    }

    const tx = {
      TransactionType: "Payment",
      Account: this.platformWallet.address,
      Destination: destination,

      // IMPORTANT FIX: XRPL IOU format must include issuer ONLY here
      Amount: {
        currency: RLUSD_CURRENCY,
        issuer: RLUSD_ISSUER,
        value: amount,
      },
    };

    try {
      const prepared = await client.autofill(tx);
      const signed = this.platformWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(
          `RLUSD issuance failed: ${result.result.meta.TransactionResult}`
        );
      }

      logger.info("RLUSD sent:", destination);
      return signed.hash;
    } catch (err) {
      console.error("❌ RLUSD ERROR:", err);
      throw err;
    }
  }

  /**
   * ACCOUNT INFO
   */
  async getAccountInfo(address: string) {
    const client = await this.ensureClient();

    const res = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
    });

    return {
      balance: dropsToXrp(res.result.account_data.Balance),
      sequence: res.result.account_data.Sequence,
    };
  }


  async transferRLUSD(
  senderSeed: string,
  destination: string,
  amount: string
) {
  const client = await this.ensureClient();

  const wallet = Wallet.fromSeed(senderSeed);

  const tx = {
    TransactionType: "Payment",
    Account: wallet.address,
    Destination: destination,

    Amount: {
      currency: RLUSD_CURRENCY,
      issuer: RLUSD_ISSUER,
      value: amount,
    },
  };

  const prepared = await client.autofill(tx as any);

  const signed = wallet.sign(prepared);

  const result = await client.submitAndWait(signed.tx_blob);

  return {
    hash: signed.hash,
    result,
  };
}


async getRLUSDBalance(address: string) {
  const client = await this.ensureClient();

  const response = await client.request({
    command: "account_lines",
    account: address,
  });

  const line = response.result.lines.find(
    (l: any) =>
      l.currency === RLUSD_CURRENCY &&
      l.account === RLUSD_ISSUER
  );

  return line?.balance || "0";
}

async transferRLUSD(
  senderSeed: string,
  destination: string,
  amount: string
) {
  const client = await this.ensureClient();

  const wallet = Wallet.fromSeed(senderSeed);

  const tx = {
    TransactionType: "Payment",
    Account: wallet.address,
    Destination: destination,

    Amount: {
      currency: RLUSD_CURRENCY,
      issuer: RLUSD_ISSUER,
      value: amount,
    },
  };

  const prepared = await client.autofill(tx as any);

  const signed = wallet.sign(prepared);

  const result = await client.submitAndWait(signed.tx_blob);

  return {
    hash: signed.hash,
    result,
  };
}
}

/**
 * EXPORT SINGLETON
 */


export const xrplService = new XRPLService();
export { RLUSD_CURRENCY, RLUSD_ISSUER };
export default xrplService;