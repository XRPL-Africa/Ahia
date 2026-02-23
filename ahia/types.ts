export type ToastType = "success" | "escrow" | "warning";
export type BidStatus = "pending" | "escrow" | "active" | "complete" | "accepted";
export type BidActionState = "accept-decline" | "release" | "accepted" | "released" | "counter";

// App-level routing
export type AppPage = "welcome" | "login" | "signup" | "dashboard";

export interface Bid {
  id: number;
  emoji: string;
  bgGradient: string;
  statusTag: string;
  statusClass: BidStatus;
  category: string;
  name: string;
  priceLabel: string;
  price: string;
  naira: string;
  timer?: string;
  escrowSecured?: boolean;
  actionState: BidActionState;
}

export interface Transaction {
  id: number;
  iconEmoji: string;
  iconBg: string;
  name: string;
  meta: string;
  valueClass: "credit" | "debit";
  valueText: string;
  fiatText: string;
}

export interface ToastState {
  show: boolean;
  vibrate: boolean;
  bar: string;
  icon: string;
  emoji: string;
  title: string;
  sub: string;
}
