import { useState } from "react";
import { PlusIcon, CashIcon, HistoryIcon } from "../icons";

interface WalletCardProps {
  rlusdBalance: number;
  liveRate: number;
  nairaBalance: string;
  onAddFunds: () => void;
  onCashOut: () => void;
}

export default function WalletCard({
  rlusdBalance,
  liveRate,
  nairaBalance,
  onAddFunds,
  onCashOut,
}: WalletCardProps) {
  const [copyText, setCopyText] = useState("Copy");

  const handleCopy = () => {
    setCopyText("✓ Copied");
    setTimeout(() => setCopyText("Copy"), 2000);
  };

  return (
    <div className="wallet-card">
      <div className="wallet-chip">
        <div className="wallet-chip-badge">
          <div className="chip-dot" />
          Embedded Wallet · Privy
        </div>
        <div className="privy-badge">Gasless ✦</div>
      </div>

      <div className="wallet-balance-label">RLUSD Balance</div>
      <div className="wallet-balance-main">
        <span className="currency">$</span>
        {rlusdBalance.toFixed(2)}
      </div>
      <div className="wallet-balance-converted">
        ≈ <strong>{nairaBalance}</strong> at ₦{liveRate.toLocaleString("en-NG")}/RLUSD
      </div>

      <div className="wallet-actions">
        <button className="wallet-btn primary" onClick={onAddFunds}>
          <PlusIcon /> Add Funds
        </button>
        <button className="wallet-btn ghost" onClick={onCashOut}>
          <CashIcon /> Cash Out
        </button>
        <button className="wallet-btn ghost">
          <HistoryIcon /> History
        </button>
      </div>

      <div className="wallet-address">
        <span className="wallet-address-text">0x8f3a...c4b2 · No private keys needed</span>
        <button className="copy-btn" onClick={handleCopy}>{copyText}</button>
      </div>
    </div>
  );
}
