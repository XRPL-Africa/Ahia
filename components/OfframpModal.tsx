import { useState, useEffect } from "react";

interface OfframpModalProps {
  open: boolean;
  liveRate: number;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

export default function OfframpModal({ open, liveRate, onClose, onSubmit }: OfframpModalProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(false);
  const [nairaPreview, setNairaPreview] = useState("₦0.00");

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setError(false);
    const n = parseFloat(val) || 0;
    setNairaPreview(
      n > 0
        ? "₦" + (n * liveRate).toLocaleString("en-NG", { minimumFractionDigits: 2 })
        : "₦0.00"
    );
  };

  const handleSubmit = () => {
    const n = parseFloat(amount);
    if (!amount || n <= 0) {
      setError(true);
      return;
    }
    onSubmit(n);
    setAmount("");
    setNairaPreview("₦0.00");
    setError(false);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className={`modal-overlay ${open ? "open" : ""}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-top">
          <div className="modal-title">Convert RLUSD → Naira</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-input-wrap">
          <label className="modal-label">Amount to Convert (RLUSD)</label>
          <input
            className={`modal-input modal-input-with-suffix ${error ? "error" : ""}`}
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
          />
          <div className="modal-input-suffix">RLUSD</div>
        </div>

        <div className="rate-preview">
          <div>
            <div className="rate-preview-label">You will receive (est.)</div>
            <div className="rate-preview-detail">
              Rate: ₦{liveRate.toLocaleString("en-NG")} / RLUSD · ~3min
            </div>
          </div>
          <div className="rate-preview-value">{nairaPreview}</div>
        </div>

        <div className="modal-input-wrap">
          <label className="modal-label">Bank Account</label>
          <input
            className="modal-input modal-input-readonly"
            type="text"
            placeholder="Bank Account"
            value="UBA — 0123****4402 (Adebayo U.)"
            readOnly
          />
        </div>

        <button className="modal-submit" onClick={handleSubmit}>
          Confirm & Send to Bank Account
        </button>
      </div>
    </div>
  );
}
