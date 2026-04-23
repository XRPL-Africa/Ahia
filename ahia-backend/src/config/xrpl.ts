import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';
import logger from './logger.js';

// XRPL Configuration
const XRPL_NODE_URL = process.env.XRPL_NODE_URL || 'wss://s.altnet.rippletest.net:51233';
const PLATFORM_SEED = process.env.XRPL_PLATFORM_SEED;
const RLUSD_ISSUER = process.env.RLUSD_ISSUER || 'rQhWct2fv4E4bR7YBQNv4rBc7E4d7c8w';

// RLUSD Currency Code (hex)
const RLUSD_CURRENCY = '524C555344000000000000000000000000000000';

class XRPLService {
  private client: Client | null = null;
  private platformWallet: Wallet | null = null;
  private isConnected = false;

  constructor() {
    if (PLATFORM_SEED) {
      this.platformWallet = Wallet.fromSeed(PLATFORM_SEED);
      logger.info('XRPL Platform wallet initialized');
    } else {
      logger.warn('XRPL_PLATFORM_SEED not set - XRPL features will be disabled');
    }
  }

  /**
   * Connect to XRPL node
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = new Client(XRPL_NODE_URL);
      await this.client.connect();
      this.isConnected = true;
      logger.info('Connected to XRPL node:', XRPL_NODE_URL);
    } catch (error) {
      logger.error('Failed to connect to XRPL:', error);
      throw new Error('XRPL connection failed');
    }
  }

  /**
   * Disconnect from XRPL node
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Disconnected from XRPL node');
    }
  }

  /**
   * Ensure connection is active
   */
  private async ensureConnection(): Promise<Client> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client!;
  }

  /**
   * Generate a new wallet for user
   */
  generateWallet(): { address: string; seed: string; publicKey: string } {
    const wallet = Wallet.generate();
    return {
      address: wallet.address,
      seed: wallet.seed!,
      publicKey: wallet.publicKey,
    };
  }

  /**
   * Get wallet from seed
   */
  getWalletFromSeed(seed: string): Wallet {
    return Wallet.fromSeed(seed);
  }

  /**
   * Get account info
   */
  async getAccountInfo(address: string): Promise<{
    balance: string;
    sequence: number;
    ownerCount: number;
  }> {
    const client = await this.ensureConnection();
    
    try {
      const response = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });

      return {
        balance: dropsToXrp(response.result.account_data.Balance),
        sequence: response.result.account_data.Sequence,
        ownerCount: response.result.account_data.OwnerCount,
      };
    } catch (error) {
      logger.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Get RLUSD balance for an account
   */
  async getRLUSDBalance(address: string): Promise<string> {
    const client = await this.ensureConnection();
    
    try {
      const response = await client.request({
        command: 'account_lines',
        account: address,
        peer: RLUSD_ISSUER,
      });

      const rlusdLine = response.result.lines.find(
        (line: { currency: string }) => line.currency === RLUSD_CURRENCY
      );

      return rlusdLine ? rlusdLine.balance : '0';
    } catch (error) {
      logger.error('Error getting RLUSD balance:', error);
      throw error;
    }
  }

  /**
   * Create escrow (Safety-Lock)
   */
  async createEscrow(
    buyerAddress: string,
    amount: string,
    condition?: string,
    finishAfter?: number
  ): Promise<{
    txHash: string;
    sequence: number;
  }> {
    const client = await this.ensureConnection();
    
    if (!this.platformWallet) {
      throw new Error('Platform wallet not configured');
    }

    try {
      // Prepare escrow create transaction
      const escrowTx = {
        TransactionType: 'EscrowCreate',
        Account: buyerWallet.address,
        Amount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: amount,
        },
        Destination: sellerAddress,
        ...(finishAfter && { FinishAfter: finishAfter }),
        ...(condition && { Condition: condition }),
      };

      const prepared = await client.autofill(escrowTx);
      const signed = this.platformWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Escrow creation failed: ${result.result.meta.TransactionResult}`);
      }

      logger.info('Escrow created:', {
        txHash: signed.hash,
        sequence: prepared.Sequence,
      });

      return {
        txHash: signed.hash,
        sequence: prepared.Sequence!,
      };
    } catch (error) {
      logger.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Finish escrow (release funds to seller)
   */
  async finishEscrow(
    owner: string,
    sequence: number,
    condition?: string,
    fulfillment?: string
  ): Promise<string> {
    const client = await this.ensureConnection();
    
    if (!this.platformWallet) {
      throw new Error('Platform wallet not configured');
    }

    try {
      const finishTx = {
        TransactionType: 'EscrowFinish',
        Account: this.platformWallet.address,
        Owner: owner,
        OfferSequence: sequence,
        ...(condition && { Condition: condition }),
        ...(fulfillment && { Fulfillment: fulfillment }),
      };

      const prepared = await client.autofill(finishTx);
      const signed = this.platformWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Escrow finish failed: ${result.result.meta.TransactionResult}`);
      }

      logger.info('Escrow finished:', { txHash: signed.hash });
      return signed.hash;
    } catch (error) {
      logger.error('Error finishing escrow:', error);
      throw error;
    }
  }

  /**
   * Cancel escrow (return funds to buyer)
   */
  async cancelEscrow(owner: string, sequence: number): Promise<string> {
    const client = await this.ensureConnection();
    
    if (!this.platformWallet) {
      throw new Error('Platform wallet not configured');
    }

    try {
      const cancelTx = {
        TransactionType: 'EscrowCancel',
        Account: this.platformWallet.address,
        Owner: owner,
        OfferSequence: sequence,
      };

      const prepared = await client.autofill(cancelTx);
      const signed = this.platformWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Escrow cancel failed: ${result.result.meta.TransactionResult}`);
      }

      logger.info('Escrow cancelled:', { txHash: signed.hash });
      return signed.hash;
    } catch (error) {
      logger.error('Error cancelling escrow:', error);
      throw error;
    }
  }

  /**
   * Send RLUSD payment
   */
  async sendPayment(
    destination: string,
    amount: string,
    destinationTag?: number
  ): Promise<string> {
    const client = await this.ensureConnection();
    
    if (!this.platformWallet) {
      throw new Error('Platform wallet not configured');
    }

    try {
      const paymentTx = {
        TransactionType: 'Payment',
        Account: this.platformWallet.address,
        Destination: destination,
        Amount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: amount,
        },
        ...(destinationTag && { DestinationTag: destinationTag }),
      };

      const prepared = await client.autofill(paymentTx);
      const signed = this.platformWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`Payment failed: ${result.result.meta.TransactionResult}`);
      }

      logger.info('Payment sent:', { txHash: signed.hash, destination, amount });
      return signed.hash;
    } catch (error) {
      logger.error('Error sending payment:', error);
      throw error;
    }
  }

  /**
   * Set trust line for RLUSD
   */
  async setTrustLine(wallet: Wallet, limit: string = '100000'): Promise<string> {
    const client = await this.ensureConnection();

    try {
      const trustSetTx = {
        TransactionType: 'TrustSet',
        Account: wallet.address,
        LimitAmount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: limit,
        },
      };

      const prepared = await client.autofill(trustSetTx);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult !== 'tesSUCCESS') {
        throw new Error(`TrustSet failed: ${result.result.meta.TransactionResult}`);
      }

      logger.info('Trust line set:', { txHash: signed.hash });
      return signed.hash;
    } catch (error) {
      logger.error('Error setting trust line:', error);
      throw error;
    }
  }

  /**
   * Fund wallet with test XRP (testnet only)
   */
  async fundWallet(address: string): Promise<void> {
    if (!XRPL_NODE_URL.includes('test')) {
      throw new Error('Can only fund wallets on testnet');
    }

    const client = await this.ensureConnection();

    try {
      await client.fundWallet({ address });
      logger.info('Wallet funded:', { address });
    } catch (error) {
      logger.error('Error funding wallet:', error);
      throw error;
    }
  }

  /**
   * Validate XRP address
   */
  isValidAddress(address: string): boolean {
    try {
      // Basic validation - XRPL addresses start with 'r' and are 25-35 chars
      return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
    } catch {
      return false;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<unknown> {
    const client = await this.ensureConnection();

    try {
      const response = await client.request({
        command: 'tx',
        transaction: txHash,
      });

      return response.result;
    } catch (error) {
      logger.error('Error getting transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const xrplService = new XRPLService();
export { RLUSD_CURRENCY, RLUSD_ISSUER };
export default xrplService;
