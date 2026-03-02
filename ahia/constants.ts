import type { Bid, Transaction, ToastType } from "./types";

export const RATE_BASE = 1638;

export const TOAST_CONFIGS: Record<ToastType, {
  bar: string;
  icon: string;
  emoji: string;
  title: string;
  sub: string;
  haptic: number[];
}> = {
  success: {
    bar: "success",
    icon: "success",
    emoji: "🎉",
    title: "Bid Accepted!",
    sub: "18.50 RLUSD locked in escrow. Delivery pending.",
    haptic: [80, 40, 80],
  },
  escrow: {
    bar: "escrow",
    icon: "escrow",
    emoji: "🔓",
    title: "Escrow Released!",
    sub: "15.00 RLUSD sent to your wallet. Deal complete.",
    haptic: [40, 20, 40, 20, 160],
  },
  warning: {
    bar: "warning",
    icon: "success",
    emoji: "⚡",
    title: "Listing Posted!",
    sub: "Your item is now live on the marketplace.",
    haptic: [60, 30, 60],
  },
};

export const INITIAL_BIDS: Bid[] = [
  {
    id: 1,
    emoji: "📚",
    bgGradient: "linear-gradient(135deg, #FFF3E0, #FFE0B2)",
    statusTag: "Bid Received",
    statusClass: "pending",
    category: "Textbook",
    name: "Engineering Thermodynamics — 5th Ed.",
    priceLabel: "Bidder's Offer",
    price: "22.00",
    naira: "≈ ₦36,036",
    timer: "4h 22m",
    actionState: "accept-decline",
  },
  {
    id: 2,
    emoji: "💻",
    bgGradient: "linear-gradient(135deg, #E8F0FF, #D4E5FF)",
    statusTag: "In Escrow",
    statusClass: "escrow",
    category: "Electronics",
    name: "TI-84 Plus CE Graphing Calculator",
    priceLabel: "Locked Amount",
    price: "18.50",
    naira: "≈ ₦30,303",
    escrowSecured: true,
    actionState: "release",
  },
  {
    id: 3,
    emoji: "👕",
    bgGradient: "linear-gradient(135deg, #E8FFF0, #D0F5E0)",
    statusTag: "2 Bids",
    statusClass: "active",
    category: "Clothing",
    name: "UNILAG Hoodies — L/XL, Limited Edition",
    priceLabel: "Highest Bid",
    price: "12.00",
    naira: "≈ ₦19,656",
    timer: "11h 08m",
    actionState: "counter",
  },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    iconEmoji: "💸",
    iconBg: "rgba(0,200,83,0.08)",
    name: "Escrow Release — Chemistry Textbook",
    meta: "Today · 08:32 · @tolu_a confirmed delivery",
    valueClass: "credit",
    valueText: "+15.00 RLUSD",
    fiatText: "+₦24,570",
  },
  {
    id: 2,
    iconEmoji: "🔒",
    iconBg: "rgba(255,122,0,0.08)",
    name: "Escrow Locked — TI-84 Calculator",
    meta: "Today · 10:14 · #ESC-0082 · Buyer confirmed",
    valueClass: "debit",
    valueText: "Held: 18.50 RLUSD",
    fiatText: "₦30,303 secured",
  },
  {
    id: 3,
    iconEmoji: "🏦",
    iconBg: "rgba(0,98,255,0.07)",
    name: "Off-Ramp to UBA — ****4402",
    meta: "Yesterday · 16:41 · YellowCard · 3min settlement",
    valueClass: "debit",
    valueText: "-50.00 RLUSD",
    fiatText: "₦81,900 received",
  },
  {
    id: 4,
    iconEmoji: "💸",
    iconBg: "rgba(0,200,83,0.08)",
    name: "Bid Won — MTN Airtime Bundle",
    meta: "Mon 10 Feb · Sold by @emeka_c",
    valueClass: "credit",
    valueText: "+8.00 RLUSD",
    fiatText: "+₦13,104",
  },
  {
    id: 5,
    iconEmoji: "⚡",
    iconBg: "rgba(255,179,0,0.1)",
    name: "Gasless Tx Fee Waived — Privy Wallet",
    meta: "Mon 10 Feb · Network fee absorbed by platform",
    valueClass: "credit",
    valueText: "Fee: FREE",
    fiatText: "₦0.00 gas",
  },
];
