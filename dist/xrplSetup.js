import dotenv from "dotenv";
dotenv.config();
import { xrplService } from "./config/xrpl.js";
async function setup() {
    await xrplService.connect();
    const buyer = xrplService.generateWallet();
    const seller = xrplService.generateWallet();
    await xrplService.fundWallet(buyer.address);
    await xrplService.fundWallet(seller.address);
    const buyerWallet = xrplService.getWallet(buyer.seed);
    const sellerWallet = xrplService.getWallet(seller.seed);
    // STEP 1: trustlines FIRST
    await xrplService.setTrustLine(buyerWallet);
    await xrplService.setTrustLine(sellerWallet);
    // STEP 2: THEN issue RLUSD
    await xrplService.issueRLUSD(buyer.address, "100");
    console.log("✅ XRPL setup complete");
    await xrplService.disconnect();
}
setup().catch(console.error);
//# sourceMappingURL=xrplSetup.js.map