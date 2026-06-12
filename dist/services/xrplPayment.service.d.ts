declare class XRPLPaymentService {
    private client;
    private wallet;
    private connected;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getClient;
    /**
     * 💰 SEND XRP PAYMENT (REAL FUNCTION YOU NEED NOW)
     */
    sendXRPPayment(destination: string, amountXRP: string): Promise<string>;
    /**
     * 💳 CHECK BALANCE
     */
    getBalance(address: string): Promise<{
        balance: number;
        sequence: number;
    }>;
    /**
     * 🧪 VALID ADDRESS
     */
    isValidAddress(address: string): boolean;
}
export declare const xrplPaymentService: XRPLPaymentService;
export default xrplPaymentService;
//# sourceMappingURL=xrplPayment.service.d.ts.map