// src/components/escrow/EscrowStatus.tsx
// Ahia - Campus Marketplace | XRPL Escrow Management
// Task 3: Transaction/Escrow Screens

import React, { useState, useEffect, useCallback } from "react";
import NotificationService from "@/services/notification.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscrowState =
  | "created"       // Buyer initiated, funds locked
  | "pending"       // Awaiting seller confirmation
  | "active"        // Both parties confirmed, in progress
  | "item_sent"     // Seller marked as dispatched
  | "completed"     // Buyer confirmed receipt → funds released
  | "disputed"      // Either party raised dispute
  | "refunded"      // Dispute resolved in buyer's favour
  | "cancelled"     // Cancelled before activation
  | "expired";      // Time-locked escrow expired

export interface EscrowParty {
  id: string;
  displayName: string;
  avatarUrl?: string;
  xrplAddress: string;
  campus: string;
  rating: number;
  completedTransactions: number;
}

export interface EscrowTimeline {
  state: EscrowState;
  timestamp: Date;
  actorId: string;
  note?: string;
  xrplTxHash?: string;
}

export interface EscrowTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
  buyer: EscrowParty;
  seller: EscrowParty;
  currentUserId: string;

  // Financials
  amountXRP: number;
  platformFeeXRP: number;
  totalXRP: number;

  // XRPL
  escrowSequence?: number;
  escrowCondition?: string;
  escrowFulfillment?: string;
  xrplCreateTxHash?: string;
  xrplFinishTxHash?: string;
  xrplCancelTxHash?: string;
  escrowExpiry?: Date;

  // Metadata
  state: EscrowState;
  timeline: EscrowTimeline[];
  createdAt: Date;
  updatedAt: Date;
  meetupLocation?: string;
  deliveryMethod: "meetup" | "delivery";
  notes?: string;
  disputeReason?: string;
  disputeResolution?: string;
}

// ─── Escrow Service ────────────────────────────────────────────────────────────

export const EscrowService = {
  getTransaction: async (id: string): Promise<EscrowTransaction> => {
    // In production: fetch from Ahia backend which wraps XRPL
    const res = await fetch(`/api/escrow/${id}`);
    return res.json();
  },

  confirmReceipt: async (id: string, fulfillment: string): Promise<void> => {
    // Calls XRPL EscrowFinish with fulfillment condition
    await fetch(`/api/escrow/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({ fulfillment }),
      headers: { "Content-Type": "application/json" },
    });
  },

  markItemSent: async (id: string, trackingNote?: string): Promise<void> => {
    await fetch(`/api/escrow/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ note: trackingNote }),
      headers: { "Content-Type": "application/json" },
    });
  },

  raiseDispute: async (id: string, reason: string): Promise<void> => {
    await fetch(`/api/escrow/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
      headers: { "Content-Type": "application/json" },
    });
  },

  cancelEscrow: async (id: string): Promise<void> => {
    // Calls XRPL EscrowCancel after expiry
    await fetch(`/api/escrow/${id}/cancel`, { method: "POST" });
  },

  getXRPLTransactionUrl: (txHash: string): string =>
    `https://livenet.xrpl.org/transactions/${txHash}`,
};

// ─── State Config ──────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<
  EscrowState,
  { label: string; color: string; bg: string; icon: string; description: string }
> = {
  created: {
    label: "Payment Locked",
    color: "#2563EB",
    bg: "#EFF6FF",
    icon: "🔒",
    description: "Funds secured in XRPL escrow",
  },
  pending: {
    label: "Awaiting Seller",
    color: "#D97706",
    bg: "#FFFBEB",
    icon: "⏳",
    description: "Seller needs to confirm the order",
  },
  active: {
    label: "In Progress",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: "✅",
    description: "Transaction is active",
  },
  item_sent: {
    label: "Item Dispatched",
    color: "#0891B2",
    bg: "#ECFEFF",
    icon: "🚚",
    description: "Seller has dispatched the item",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#ECFDF5",
    icon: "🎉",
    description: "Transaction completed & funds released",
  },
  disputed: {
    label: "Under Review",
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: "⚠️",
    description: "Dispute raised — Ahia team reviewing",
  },
  refunded: {
    label: "Refunded",
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "↩️",
    description: "Funds returned to buyer",
  },
  cancelled: {
    label: "Cancelled",
    color: "#6B7280",
    bg: "#F3F4F6",
    icon: "✕",
    description: "Transaction cancelled",
  },
  expired: {
    label: "Expired",
    color: "#9CA3AF",
    bg: "#F9FAFB",
    icon: "⌛",
    description: "Escrow lock period expired",
  },
};

const STEPS: { state: EscrowState; label: string }[] = [
  { state: "created", label: "Payment" },
  { state: "active", label: "Confirmed" },
  { state: "item_sent", label: "Dispatched" },
  { state: "completed", label: "Received" },
];

const STATE_STEP_INDEX: Partial<Record<EscrowState, number>> = {
  created: 0,
  pending: 0,
  active: 1,
  item_sent: 2,
  completed: 3,
};

// ─── EscrowStatus Component ───────────────────────────────────────────────────

export interface EscrowStatusProps {
  transactionId: string;
  onBack: () => void;
  onChat: (chatId: string, recipientId: string) => void;
  onViewListing: (listingId: string) => void;
}

export const EscrowStatus: React.FC<EscrowStatusProps> = ({
  transactionId,
  onBack,
  onChat,
  onViewListing,
}) => {
  const [tx, setTx] = useState<EscrowTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    loadTransaction();
    // Poll for status updates every 15s
    const interval = setInterval(loadTransaction, 15000);
    return () => clearInterval(interval);
  }, [transactionId]);

  const loadTransaction = useCallback(async () => {
    try {
      const data = await EscrowService.getTransaction(transactionId);
      setTx(data);
      // Schedule a local browser reminder 2 hours before escrow expires
      if (data.escrowExpiry && !["completed","refunded","cancelled","expired"].includes(data.state)) {
        NotificationService.showBrowserNotification(
          "⏰ Escrow Expiring Soon",
          `Your order "${data.listingTitle}" escrow expires soon`,
          { category: "escrow", transactionId: data.id, notificationId: `expiry-${data.id}`, sentAt: new Date().toISOString() }
        );
      }
    } catch (e) {
      setError("Failed to load transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  const handleConfirmReceipt = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      // In production: trigger XRPL wallet signing flow for EscrowFinish
      await EscrowService.confirmReceipt(tx.id, tx.escrowFulfillment || "");
      await loadTransaction();
    } catch {
      alert("Failed to confirm receipt. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSent = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      await EscrowService.markItemSent(tx.id);
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!tx || !disputeReason.trim()) return;
    setActionLoading(true);
    try {
      await EscrowService.raiseDispute(tx.id, disputeReason);
      setShowDispute(false);
      setDisputeReason("");
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error || !tx) return <ErrorState message={error || "Not found"} onBack={onBack} />;

  const isBuyer = tx.currentUserId === tx.buyer.id;
  const isSeller = tx.currentUserId === tx.seller.id;
  const statusCfg = STATE_CONFIG[tx.state];
  const currentStep = STATE_STEP_INDEX[tx.state] ?? -1;
  const counterparty = isBuyer ? tx.seller : tx.buyer;
  const isTerminal = ["completed", "refunded", "cancelled", "expired"].includes(tx.state);

  // Derive available actions
  const canConfirmReceipt = isBuyer && tx.state === "item_sent";
  const canMarkSent = isSeller && tx.state === "active";
  const canDispute = !isTerminal && tx.state !== "disputed" && tx.state !== "created";
  const canCancel =
    (isBuyer && tx.state === "created") ||
    (tx.state === "expired" && isBuyer);

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>←</button>
        <div style={s.headerMid}>
          <span style={s.headerTitle}>Order #{tx.id.slice(-6).toUpperCase()}</span>
        </div>
        <button
          onClick={() => onChat("", counterparty.id)}
          style={s.chatBtn}
          title="Chat with counterparty"
        >
          💬
        </button>
      </div>

      <div style={s.scroll}>
        {/* Status Banner */}
        <div style={{ ...s.statusBanner, background: statusCfg.bg }}>
          <span style={s.statusIcon}>{statusCfg.icon}</span>
          <div>
            <div style={{ ...s.statusLabel, color: statusCfg.color }}>
              {statusCfg.label}
            </div>
            <div style={s.statusDesc}>{statusCfg.description}</div>
          </div>
        </div>

        {/* Progress Stepper (only for active flows) */}
        {!["disputed", "refunded", "cancelled", "expired"].includes(tx.state) && (
          <div style={s.stepper}>
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <React.Fragment key={step.state}>
                  <div style={s.stepItem}>
                    <div
                      style={{
                        ...s.stepDot,
                        background: done ? "#1D4ED8" : "#E5E7EB",
                        border: active ? "2px solid #1D4ED8" : "2px solid transparent",
                        transform: active ? "scale(1.2)" : "scale(1)",
                      }}
                    >
                      {done && i < currentStep && (
                        <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
                      )}
                    </div>
                    <span
                      style={{
                        ...s.stepLabel,
                        color: done ? "#1D4ED8" : "#9CA3AF",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        ...s.stepLine,
                        background: i < currentStep ? "#1D4ED8" : "#E5E7EB",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Listing Info */}
        <button
          onClick={() => onViewListing(tx.listingId)}
          style={s.listingCard}
        >
          {tx.listingImageUrl && (
            <img src={tx.listingImageUrl} alt="" style={s.listingImg} />
          )}
          <div style={s.listingInfo}>
            <div style={s.listingTitle}>{tx.listingTitle}</div>
            <div style={s.listingAction}>View listing ›</div>
          </div>
        </button>

        {/* Payment Breakdown */}
        <div style={s.card}>
          <div style={s.cardTitle}>Payment Details</div>
          <div style={s.row}>
            <span style={s.rowLabel}>Item price</span>
            <span style={s.rowValue}>{tx.amountXRP} XRP</span>
          </div>
          <div style={s.row}>
            <span style={s.rowLabel}>Platform fee (2%)</span>
            <span style={s.rowValue}>{tx.platformFeeXRP.toFixed(4)} XRP</span>
          </div>
          <div style={{ ...s.row, borderTop: "1px solid #E5E7EB", paddingTop: 10, marginTop: 4 }}>
            <span style={{ ...s.rowLabel, fontWeight: 700, color: "#111827" }}>Total locked</span>
            <span style={{ ...s.rowValue, fontWeight: 700, color: "#1D4ED8" }}>
              {tx.totalXRP} XRP
            </span>
          </div>

          {/* XRPL Links */}
          {tx.xrplCreateTxHash && (
            <a
              href={EscrowService.getXRPLTransactionUrl(tx.xrplCreateTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              style={s.xrplLink}
            >
              🔗 View escrow on XRPL Explorer
            </a>
          )}
          {tx.xrplFinishTxHash && (
            <a
              href={EscrowService.getXRPLTransactionUrl(tx.xrplFinishTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              style={s.xrplLink}
            >
              🔗 View release tx on XRPL Explorer
            </a>
          )}
        </div>

        {/* Parties */}
        <div style={s.card}>
          <div style={s.cardTitle}>Parties</div>
          <PartyRow party={tx.buyer} role="Buyer" isSelf={isBuyer} />
          <PartyRow party={tx.seller} role="Seller" isSelf={isSeller} />
        </div>

        {/* Delivery Info */}
        {(tx.meetupLocation || tx.notes) && (
          <div style={s.card}>
            <div style={s.cardTitle}>
              {tx.deliveryMethod === "meetup" ? "📍 Meetup Details" : "📦 Delivery Details"}
            </div>
            {tx.meetupLocation && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Location</span>
                <span style={s.infoValue}>{tx.meetupLocation}</span>
              </div>
            )}
            {tx.notes && (
              <div style={s.infoRow}>
                <span style={s.infoLabel}>Notes</span>
                <span style={s.infoValue}>{tx.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Escrow Expiry */}
        {tx.escrowExpiry && !isTerminal && (
          <div style={s.expiryCard}>
            <span>⏰</span>
            <span style={{ fontSize: 13, color: "#B45309" }}>
              Escrow expires {formatDateTime(tx.escrowExpiry)}
            </span>
          </div>
        )}

        {/* Dispute Info */}
        {tx.state === "disputed" && (
          <div style={{ ...s.card, borderLeft: "4px solid #DC2626" }}>
            <div style={s.cardTitle}>⚠️ Dispute Under Review</div>
            <p style={{ fontSize: 13, color: "#374151", margin: "8px 0" }}>
              {tx.disputeReason}
            </p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>
              Our team is reviewing this dispute and will respond within 24 hours.
            </p>
          </div>
        )}

        {/* Actions */}
        {!isTerminal && (
          <div style={s.actionsSection}>
            {/* BUYER: Confirm Receipt */}
            {canConfirmReceipt && (
              <button
                onClick={handleConfirmReceipt}
                disabled={actionLoading}
                style={{ ...s.primaryBtn, background: "#059669" }}
              >
                {actionLoading ? "Processing..." : "✓ Confirm I Received It"}
              </button>
            )}
            <p style={s.actionHint}>
              {canConfirmReceipt
                ? "This releases funds to the seller. Only confirm when you have the item."
                : ""}
            </p>

            {/* SELLER: Mark Item Sent */}
            {canMarkSent && (
              <button
                onClick={handleMarkSent}
                disabled={actionLoading}
                style={s.primaryBtn}
              >
                {actionLoading ? "Updating..." : "🚚 Mark Item as Dispatched"}
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={() => EscrowService.cancelEscrow(tx.id)}
                style={s.secondaryBtn}
              >
                Cancel Transaction
              </button>
            )}

            {/* Dispute */}
            {canDispute && !showDispute && (
              <button
                onClick={() => setShowDispute(true)}
                style={s.dangerBtn}
              >
                ⚠️ Raise a Dispute
              </button>
            )}

            {/* Dispute Form */}
            {showDispute && (
              <div style={s.disputeForm}>
                <div style={s.cardTitle}>Raise a Dispute</div>
                <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 12px" }}>
                  Describe the issue. Our team will review and mediate.
                </p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="What's the problem? e.g. Item not as described, seller unresponsive..."
                  rows={4}
                  style={s.disputeTextarea}
                />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => setShowDispute(false)}
                    style={s.secondaryBtn}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispute}
                    disabled={!disputeReason.trim() || actionLoading}
                    style={{ ...s.dangerBtn, flex: 1 }}
                  >
                    {actionLoading ? "Submitting..." : "Submit Dispute"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Toggle */}
        <button
          onClick={() => setShowTimeline((v) => !v)}
          style={s.timelineToggle}
        >
          {showTimeline ? "Hide" : "Show"} transaction history{" "}
          {showTimeline ? "▲" : "▼"}
        </button>

        {showTimeline && (
          <div style={s.card}>
            <div style={s.cardTitle}>Timeline</div>
            {tx.timeline.map((event, i) => (
              <div key={i} style={s.timelineItem}>
                <div style={s.timelineDot} />
                <div style={s.timelineContent}>
                  <div style={s.timelineState}>
                    {STATE_CONFIG[event.state]?.icon}{" "}
                    {STATE_CONFIG[event.state]?.label || event.state}
                  </div>
                  <div style={s.timelineTime}>
                    {formatDateTime(event.timestamp)}
                  </div>
                  {event.note && (
                    <div style={s.timelineNote}>{event.note}</div>
                  )}
                  {event.xrplTxHash && (
                    <a
                      href={EscrowService.getXRPLTransactionUrl(event.xrplTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={s.xrplLink}
                    >
                      View on XRPL ›
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
};

// ─── Party Row ─────────────────────────────────────────────────────────────────

const PartyRow: React.FC<{ party: EscrowParty; role: string; isSelf: boolean }> = ({
  party,
  role,
  isSelf,
}) => (
  <div style={s.partyRow}>
    <div style={s.avatarSmall}>
      {party.avatarUrl ? (
        <img src={party.avatarUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%" }} />
      ) : (
        <div style={s.avatarFallback}>{party.displayName[0]}</div>
      )}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
          {party.displayName}
        </span>
        {isSelf && (
          <span style={s.youBadge}>You</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280" }}>
        {role} · {party.campus} · ⭐ {party.rating.toFixed(1)}
      </div>
      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
        {party.xrplAddress.slice(0, 8)}...{party.xrplAddress.slice(-6)}
      </div>
    </div>
  </div>
);

// ─── Stub Screens ─────────────────────────────────────────────────────────────

const LoadingState: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 80, color: "#9CA3AF" }}>
    Loading transaction...
  </div>
);

const ErrorState: React.FC<{ message: string; onBack: () => void }> = ({ message, onBack }) => (
  <div style={{ padding: 40, textAlign: "center" }}>
    <div style={{ color: "#EF4444", marginBottom: 16 }}>{message}</div>
    <button onClick={onBack} style={s.secondaryBtn}>Go Back</button>
  </div>
);

// ─── Escrow List Screen ────────────────────────────────────────────────────────

export interface EscrowListProps {
  currentUserId: string;
  onSelectTransaction: (txId: string) => void;
  onBack: () => void;
}

export type EscrowFilter = "all" | "buying" | "selling" | "active" | "completed";

export const EscrowListScreen: React.FC<EscrowListProps> = ({
  currentUserId,
  onSelectTransaction,
  onBack,
}) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<EscrowFilter>("all");

  useEffect(() => {
    loadTransactions();
  }, [currentUserId]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${currentUserId}/transactions`);
      const data = await res.json();
      setTransactions(data);
    } finally {
      setIsLoading(false);
    }
  };

  const FILTERS: { value: EscrowFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "buying", label: "Buying" },
    { value: "selling", label: "Selling" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Done" },
  ];

  const filtered = transactions.filter((tx) => {
    switch (filter) {
      case "buying": return tx.buyer.id === currentUserId;
      case "selling": return tx.seller.id === currentUserId;
      case "active": return ["created", "pending", "active", "item_sent"].includes(tx.state);
      case "completed": return ["completed", "refunded", "cancelled"].includes(tx.state);
      default: return true;
    }
  });

  return (
    <div style={s.screen}>
      <div style={s.header}>
        <button onClick={onBack} style={s.backBtn}>←</button>
        <span style={s.headerTitle}>My Orders</span>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              ...s.filterChip,
              background: filter === f.value ? "#1D4ED8" : "#F3F4F6",
              color: filter === f.value ? "#fff" : "#374151",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={s.scroll}>
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div>No transactions yet</div>
          </div>
        ) : (
          filtered.map((tx) => {
            const cfg = STATE_CONFIG[tx.state];
            const isBuyer = tx.buyer.id === currentUserId;
            const counterparty = isBuyer ? tx.seller : tx.buyer;
            return (
              <button
                key={tx.id}
                onClick={() => onSelectTransaction(tx.id)}
                style={s.txCard}
              >
                {tx.listingImageUrl && (
                  <img src={tx.listingImageUrl} alt="" style={s.txThumb} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.txTitle}>{tx.listingTitle}</div>
                  <div style={s.txMeta}>
                    {isBuyer ? "Buying from" : "Selling to"} {counterparty.displayName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <span
                      style={{
                        ...s.txStatusChip,
                        background: cfg.bg,
                        color: cfg.color,
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                    <span style={s.txAmount}>{tx.totalXRP} XRP</span>
                  </div>
                </div>
                <div style={s.txDate}>
                  {formatRelativeDate(tx.updatedAt)}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  screen: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#F9FAFB",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    background: "#fff",
    borderBottom: "1px solid #E5E7EB",
    gap: 12,
  },
  headerMid: { flex: 1 },
  headerTitle: { fontWeight: 700, fontSize: 17, color: "#111827" },
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#1D4ED8",
    padding: "4px 8px 4px 0",
  },
  chatBtn: {
    background: "none",
    border: "none",
    fontSize: 22,
    cursor: "pointer",
    padding: 4,
  },
  scroll: { flex: 1, overflowY: "auto", padding: "0 16px" },
  statusBanner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 16px",
    borderRadius: 14,
    margin: "16px 0 12px",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  statusIcon: { fontSize: 32 },
  statusLabel: { fontWeight: 700, fontSize: 17 },
  statusDesc: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  stepper: {
    display: "flex",
    alignItems: "center",
    padding: "16px 4px",
    marginBottom: 4,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s",
  },
  stepLabel: { fontSize: 11, whiteSpace: "nowrap" },
  stepLine: { flex: 1, height: 2, margin: "0 6px", marginTop: -18 },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: "16px",
    marginBottom: 12,
    border: "1px solid #E5E7EB",
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  rowLabel: { fontSize: 14, color: "#6B7280" },
  rowValue: { fontSize: 14, color: "#111827", fontWeight: 500 },
  xrplLink: {
    display: "block",
    marginTop: 10,
    fontSize: 12,
    color: "#2563EB",
    textDecoration: "none",
  },
  listingCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 12,
    width: "100%",
    cursor: "pointer",
    marginBottom: 12,
    textAlign: "left",
  },
  listingImg: { width: 56, height: 56, borderRadius: 10, objectFit: "cover" },
  listingInfo: { flex: 1 },
  listingTitle: { fontWeight: 600, fontSize: 15, color: "#111827" },
  listingAction: { fontSize: 12, color: "#2563EB", marginTop: 4 },
  partyRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatarSmall: { flexShrink: 0 },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#DBEAFE",
    color: "#1D4ED8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
  },
  youBadge: {
    fontSize: 10,
    background: "#EFF6FF",
    color: "#1D4ED8",
    padding: "1px 7px",
    borderRadius: 20,
    fontWeight: 600,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: "1px solid #F3F4F6",
  },
  infoLabel: { fontSize: 13, color: "#9CA3AF" },
  infoValue: { fontSize: 13, color: "#111827", fontWeight: 500, maxWidth: "60%", textAlign: "right" },
  expiryCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#FFFBEB",
    border: "1px solid #FDE68A",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 12,
  },
  actionsSection: { marginBottom: 12 },
  primaryBtn: {
    width: "100%",
    padding: "15px",
    background: "#1D4ED8",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 8,
  },
  secondaryBtn: {
    width: "100%",
    padding: "13px",
    background: "#F3F4F6",
    color: "#374151",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 8,
  },
  dangerBtn: {
    width: "100%",
    padding: "13px",
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 8,
  },
  actionHint: { fontSize: 12, color: "#9CA3AF", textAlign: "center", margin: "4px 0 12px" },
  disputeForm: {
    background: "#fff",
    border: "1px solid #FECACA",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  disputeTextarea: {
    width: "100%",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
  },
  timelineToggle: {
    background: "none",
    border: "none",
    color: "#6B7280",
    fontSize: 13,
    cursor: "pointer",
    padding: "8px 0",
    display: "block",
    margin: "0 auto 12px",
  },
  timelineItem: {
    display: "flex",
    gap: 12,
    paddingBottom: 16,
    position: "relative",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#1D4ED8",
    flexShrink: 0,
    marginTop: 3,
  },
  timelineContent: { flex: 1 },
  timelineState: { fontWeight: 600, fontSize: 14, color: "#111827" },
  timelineTime: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  timelineNote: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  // List styles
  filterRow: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    overflowX: "auto",
    background: "#fff",
    borderBottom: "1px solid #E5E7EB",
  },
  filterChip: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  txCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    cursor: "pointer",
    marginBottom: 10,
    textAlign: "left",
  },
  txThumb: { width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  txTitle: { fontWeight: 600, fontSize: 14, color: "#111827", marginBottom: 2 },
  txMeta: { fontSize: 12, color: "#6B7280" },
  txStatusChip: {
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
  },
  txAmount: { fontSize: 13, fontWeight: 700, color: "#1D4ED8" },
  txDate: { fontSize: 11, color: "#9CA3AF", flexShrink: 0, alignSelf: "flex-start" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatDateTime = (date: Date): string =>
  new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelativeDate = (date: Date): string => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 86400) return "Today";
  if (diff < 172800) return "Yesterday";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export default EscrowStatus;
