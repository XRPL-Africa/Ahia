declare class XRPLService {
    private client;
    private platformWallet;
    private issuerWallet;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private submitTransaction;
    createTrustline(walletSeed: string): Promise<{
        hash: string;
        success: boolean;
    }>;
    private sendXRP;
    issueRLUSD(destination: string, amount: string): Promise<{
        hash: string;
        success: boolean;
    }>;
    transferRLUSD(destination: string, amount: string): Promise<{
        hash: string;
        success: boolean;
    }>;
    commitFunds(amount: string): Promise<{
        hash: string;
        success: boolean;
        amount: string;
    }>;
    releaseFunds(destination: string, amount: string): Promise<{
        hash: string;
        success: boolean;
    }>;
    refundFunds(destination: string, amount: string): Promise<{
        hash: string;
        success: boolean;
    }>;
}
export declare const xrplService: XRPLService;
export {};
//# sourceMappingURL=xrpl.service.d.ts.map