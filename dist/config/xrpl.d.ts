import { Wallet } from "xrpl";
declare const RLUSD_ISSUER: string;
declare const RLUSD_CURRENCY = "RLUSD";
/**
 * XRPL SERVICE
 */
declare class XRPLService {
    private client;
    private platformWallet;
    private connected;
    constructor();
    /**
     * CONNECT
     */
    connect(): Promise<void>;
    /**
     * DISCONNECT
     */
    disconnect(): Promise<void>;
    private ensureClient;
    /**
     * WALLET GENERATION
     */
    generateWallet(): {
        address: string;
        seed: string;
        publicKey: string;
    };
    getWallet(seed: string): Wallet;
    /**
     * FUND WALLET (TESTNET SAFE + TIMEOUT FIX)
     */
    fundWallet(address: string): Promise<unknown>;
    /**
     * TRUSTLINE (SAFE)
     */
    setTrustLine(wallet: Wallet, limit?: string): Promise<string>;
    /**
     * RLUSD ISSUE (FIXED IOU FORMAT)
     */
    issueRLUSD(destination: string, amount: string): Promise<string>;
    /**
     * ACCOUNT INFO
     */
    getAccountInfo(address: string): Promise<{
        balance: number;
        sequence: number;
    }>;
    getRLUSDBalance(address: string): Promise<string>;
}
/**
 * EXPORT SINGLETON
 */
export declare const xrplService: XRPLService;
export { RLUSD_CURRENCY, RLUSD_ISSUER };
export default xrplService;
//# sourceMappingURL=xrpl.d.ts.map