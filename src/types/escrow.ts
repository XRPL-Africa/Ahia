// src/types/escrow.ts
// Ahia — Campus Marketplace | XRPL Escrow Types

// ─── Escrow State Machine ─────────────────────────────────────────────────────

export type EscrowState =
  | "created"       // Buyer initiated, funds locked on XRPL
  | "pending"       // Awaiting seller confirmation
  | "active"        // Both parties confirmed, in progress
  | "item_sent"     // Seller marked as dispatched
  | "testing"       // Buyer received item, 14-day testing period active
  | "completed"     // Buyer confirmed receipt → funds released
  | "disputed"      // Either party raised dispute
  | "refunded"      // Dispute resolved in buyer's favour
  | "cancelled"     // Cancelled before activation
  | "expired";      // Time-locked escrow expired

// ─── Parties ──────────────────────────────────────────────────────────────────

export interface EscrowParty {
  id: string;
  displayName: string;
  avatarUrl?: string;
  xrplAddress: string;
  campus: string;
  rating: number;
  completedTransactions: number;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface EscrowTimelineEvent {
  state: EscrowState;
  timestamp: Date;
  actorId: string;
  note?: string;
  xrplTxHash?: string;
}

// ─── Testing Period (14-day countdown) ────────────────────────────────────────

export interface TestingPeriod {
  startedAt: Date;
  expiresAt: Date;
  originalDurationDays: number;
  extensionDays: number;           // Additional days granted
  extensionApproved: boolean;
  extensionRequestedAt?: Date;
  authenticityVerified: boolean;
  authenticityVerifiedAt?: Date;
}

// ─── Authenticity Verification ────────────────────────────────────────────────

export interface AuthenticityVerification {
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;             // User ID of verifier (buyer)
  notes?: string;
}

// ─── Main Escrow Transaction ──────────────────────────────────────────────────

export interface EscrowTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl?: string;
  listingCategory?: string;
  buyer: EscrowParty;
  seller: EscrowParty;
  currentUserId: string;

  // Financials
  amountXRP: number;
  platformFeeXRP: number;
  totalXRP: number;
  amountNaira?: string;           // Naira equivalent display string

  // XRPL
  escrowSequence?: number;
  escrowCondition?: string;
  escrowFulfillment?: string;
  xrplCreateTxHash?: string;
  xrplFinishTxHash?: string;
  xrplCancelTxHash?: string;
  escrowExpiry?: Date;

  // State & History
  state: EscrowState;
  timeline: EscrowTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;

  // Delivery
  meetupLocation?: string;
  deliveryMethod: "meetup" | "delivery";
  notes?: string;

  // Dispute
  disputeReason?: string;
  disputeResolution?: string;

  // Testing Period (14-day)
  testingPeriod?: TestingPeriod;

  // Authenticity
  authenticity?: AuthenticityVerification;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type EscrowFilter = "all" | "buying" | "selling" | "active" | "completed" | "disputed";

// ─── State Display Config ─────────────────────────────────────────────────────

export interface EscrowStateConfig {
  label: string;
  color: string;
  bg: string;
  icon: string;
  description: string;
}

export const STATE_CONFIG: Record<EscrowState, EscrowStateConfig> = {
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
  testing: {
    label: "Testing Period",
    color: "#EA580C",
    bg: "#FFF7ED",
    icon: "🔍",
    description: "14-day inspection window active",
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

// ─── Stepper Steps ────────────────────────────────────────────────────────────

export const ESCROW_STEPS: { state: EscrowState; label: string }[] = [
  { state: "created", label: "Payment" },
  { state: "active", label: "Confirmed" },
  { state: "item_sent", label: "Dispatched" },
  { state: "testing", label: "Testing" },
  { state: "completed", label: "Complete" },
];

export const STATE_STEP_INDEX: Partial<Record<EscrowState, number>> = {
  created: 0,
  pending: 0,
  active: 1,
  item_sent: 2,
  testing: 3,
  completed: 4,
};
