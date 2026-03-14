import type { Bid } from "../types";

interface BidCardProps {
  bid: Bid;
  onAccept: (id: number) => void;
  onRelease: (id: number) => void;
}

export default function BidCard({ bid, onAccept, onRelease }: BidCardProps) {
  return (
    <div className="bid-card">
      <div className="bid-img" style={{ background: bid.bgGradient }}>
        {bid.emoji}
        <div className={`bid-status-tag ${bid.statusClass}`}>{bid.statusTag}</div>
      </div>

      <div className="bid-body">
        <div className="bid-category">{bid.category}</div>
        <div className="bid-name">{bid.name}</div>

        <div className="bid-price-row">
          <div className="bid-price-block">
            <div className="bid-price-label">{bid.priceLabel}</div>
            <div className="bid-price">
              {bid.price} <span className="unit">RLUSD</span>
            </div>
            <div className="bid-naira">{bid.naira}</div>
          </div>

          {bid.timer && (
            <div className="bid-timer">
              <div className="timer-dot" />
              {bid.timer}
            </div>
          )}

          {bid.escrowSecured && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--ahia-text-3)", fontWeight: 600 }}>
                ESCROW
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--ahia-trust)", fontWeight: 700 }}>
                🔒 Secured
              </div>
            </div>
          )}
        </div>

        {(bid.actionState === "accept-decline" || bid.actionState === "counter") && (
          <div className="bid-action-row">
            <button className="bid-btn accept" onClick={() => onAccept(bid.id)}>
              Accept ✓
            </button>
            <button className="bid-btn decline">
              {bid.actionState === "counter" ? "Counter" : "Decline"}
            </button>
          </div>
        )}

        {(bid.actionState === "release" || bid.actionState === "accepted") && (
          <div className="bid-action-row full">
            <button className="bid-btn release" onClick={() => onRelease(bid.id)}>
              Release Escrow 🔓
            </button>
          </div>
        )}

        {bid.actionState === "released" && (
          <div className="bid-action-row full">
            <button className="bid-btn accept" disabled style={{ background: "var(--ahia-success)" }}>
              ✓ Funds Released!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
