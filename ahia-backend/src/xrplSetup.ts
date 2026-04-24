import { xrplService } from "./config/xrpl";

async function setup() {
  await xrplService.connect();

  const buyerSeed = "s...";
  const sellerSeed = "s...";

  const buyerWallet = xrplService.getWalletFromSeed(buyerSeed);
  const sellerWallet = xrplService.getWalletFromSeed(sellerSeed);

  // TRUSTLINES
  await xrplService.createTrustline(buyerSeed);
  await xrplService.createTrustline(sellerSeed);
  await xrplService.createTrustline(process.env.XRPL_PLATFORM_SEED!);

  // ISSUE RLUSD
  await xrplService.issueRLUSD(buyerWallet.classicAddress, "100");

  console.log("✅ XRPL setup complete");

  await xrplService.disconnect();
}

setup().catch(console.error);