// src/services/mock/escrow.service.mock.ts
// Ahia — Rich mock data for development

import type { EscrowTransaction, EscrowTimelineEvent, EscrowParty } from "@/types/escrow";

// ─── Mock Parties ─────────────────────────────────────────────────────────────

const MOCK_CURRENT_USER: EscrowParty = {
  id: "user-001",
  displayName: "@chidi_m",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=chidi",
  xrplAddress: "rN7n3HbKLVoB9hceR2d2M4o4R9xUfw93X2",
  campus: "UNILAG",
  rating: 4.8,
  completedTransactions: 23,
};

const MOCK_PARTIES: EscrowParty[] = [
  {
    id: "user-002",
    displayName: "@adeoye_k",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=adeoye",
    xrplAddress: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    campus: "UNILAG",
    rating: 4.6,
    completedTransactions: 15,
  },
  {
    id: "user-003",
    displayName: "@tolu_a",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tolu",
    xrplAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    campus: "OAU",
    rating: 4.9,
    completedTransactions: 31,
  },
  {
    id: "user-004",
    displayName: "@emeka_c",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emeka",
    xrplAddress: "r9cZA1mLK5R5Am25ArfXFmqgNwjZgnfk59",
    campus: "UNN",
    rating: 4.3,
    completedTransactions: 8,
  },
  {
    id: "user-005",
    displayName: "@ngozi_w",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ngozi",
    xrplAddress: "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh",
    campus: "UNILAG",
    rating: 5.0,
    completedTransactions: 42,
  },
  {
    id: "user-006",
    displayName: "@femi_o",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=femi",
    xrplAddress: "rGWrZyQqhTp9Xu7G5iFQFkBH8Rm3mCPNHi",
    campus: "UI",
    rating: 4.1,
    completedTransactions: 5,
  },
];

// ─── Helper: Create dates relative to now ─────────────────────────────────────

const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const hoursAgo = (hours: number): Date => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
};

// ─── Mock Transactions ────────────────────────────────────────────────────────

const MOCK_TRANSACTIONS: EscrowTransaction[] = [
  // 1. TESTING period — buyer testing a calculator (14-day countdown active)
  {
    id: "esc-001-testing",
    listingId: "lst-042",
    listingTitle: "TI-84 Plus CE Graphing Calculator",
    listingImageUrl: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=200&q=80",
    listingCategory: "Electronics",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[0],
    currentUserId: "user-001",
    amountXRP: 18.5,
    platformFeeXRP: 0.37,
    totalXRP: 18.87,
    amountNaira: "≈ ₦30,303",
    escrowSequence: 82,
    xrplCreateTxHash: "A3F2B8C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1",
    escrowExpiry: daysFromNow(21),
    state: "testing",
    testingPeriod: {
      startedAt: daysAgo(5),
      expiresAt: daysFromNow(9),
      originalDurationDays: 14,
      extensionDays: 0,
      extensionApproved: false,
      authenticityVerified: false,
    },
    authenticity: {
      verified: false,
    },
    timeline: [
      { state: "created", timestamp: daysAgo(8), actorId: "user-001", xrplTxHash: "A3F2B8..." },
      { state: "active", timestamp: daysAgo(8), actorId: "user-002", note: "Seller confirmed order" },
      { state: "item_sent", timestamp: daysAgo(6), actorId: "user-002", note: "Meeting at Faculty of Engineering" },
      { state: "testing", timestamp: daysAgo(5), actorId: "user-001", note: "Item received, testing period started" },
    ],
    createdAt: daysAgo(8),
    updatedAt: daysAgo(5),
    meetupLocation: "Faculty of Engineering, UNILAG Main Gate",
    deliveryMethod: "meetup",
    notes: "Please bring original receipt",
  },

  // 2. ACTIVE — seller needs to dispatch (current user is SELLER)
  {
    id: "esc-002-active",
    listingId: "lst-087",
    listingTitle: "Engineering Thermodynamics — 5th Ed.",
    listingImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&q=80",
    listingCategory: "Books",
    buyer: MOCK_PARTIES[1],
    seller: MOCK_CURRENT_USER,
    currentUserId: "user-001",
    amountXRP: 22.0,
    platformFeeXRP: 0.44,
    totalXRP: 22.44,
    amountNaira: "≈ ₦36,036",
    escrowSequence: 95,
    xrplCreateTxHash: "B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4",
    escrowExpiry: daysFromNow(28),
    state: "active",
    timeline: [
      { state: "created", timestamp: daysAgo(2), actorId: "user-003", xrplTxHash: "B4C5D6..." },
      { state: "active", timestamp: daysAgo(2), actorId: "user-001", note: "Seller confirmed order" },
    ],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    meetupLocation: "SUB Building, OAU Campus",
    deliveryMethod: "meetup",
  },

  // 3. ITEM_SENT — awaiting buyer confirmation (current user is BUYER)
  {
    id: "esc-003-sent",
    listingId: "lst-123",
    listingTitle: "UNILAG Hoodies — L/XL Limited Edition",
    listingImageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&q=80",
    listingCategory: "Clothing",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[2],
    currentUserId: "user-001",
    amountXRP: 12.0,
    platformFeeXRP: 0.24,
    totalXRP: 12.24,
    amountNaira: "≈ ₦19,656",
    escrowSequence: 103,
    xrplCreateTxHash: "C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5",
    escrowExpiry: daysFromNow(25),
    state: "item_sent",
    timeline: [
      { state: "created", timestamp: daysAgo(4), actorId: "user-001", xrplTxHash: "C5D6E7..." },
      { state: "active", timestamp: daysAgo(4), actorId: "user-004", note: "Seller confirmed" },
      { state: "item_sent", timestamp: daysAgo(1), actorId: "user-004", note: "Sent via campus delivery" },
    ],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    deliveryMethod: "delivery",
    notes: "Will deliver to Moremi Hall",
  },

  // 4. COMPLETED — successful transaction
  {
    id: "esc-004-done",
    listingId: "lst-056",
    listingTitle: "Chemistry Organic Textbook — Morrison & Boyd",
    listingImageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200&q=80",
    listingCategory: "Books",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[3],
    currentUserId: "user-001",
    amountXRP: 15.0,
    platformFeeXRP: 0.30,
    totalXRP: 15.30,
    amountNaira: "≈ ₦24,570",
    escrowSequence: 71,
    xrplCreateTxHash: "D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6",
    xrplFinishTxHash: "E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7",
    state: "completed",
    testingPeriod: {
      startedAt: daysAgo(20),
      expiresAt: daysAgo(6),
      originalDurationDays: 14,
      extensionDays: 0,
      extensionApproved: false,
      authenticityVerified: true,
      authenticityVerifiedAt: daysAgo(12),
    },
    authenticity: {
      verified: true,
      verifiedAt: daysAgo(12),
      verifiedBy: "user-001",
      notes: "Book is original, all pages intact",
    },
    timeline: [
      { state: "created", timestamp: daysAgo(25), actorId: "user-001", xrplTxHash: "D6E7F8..." },
      { state: "active", timestamp: daysAgo(25), actorId: "user-005", note: "Seller confirmed" },
      { state: "item_sent", timestamp: daysAgo(22), actorId: "user-005", note: "Meetup at library" },
      { state: "testing", timestamp: daysAgo(20), actorId: "user-001", note: "Testing period started" },
      { state: "completed", timestamp: daysAgo(6), actorId: "user-001", note: "Buyer confirmed receipt", xrplTxHash: "E7F8A9..." },
    ],
    createdAt: daysAgo(25),
    updatedAt: daysAgo(6),
    meetupLocation: "University Library, Ground Floor",
    deliveryMethod: "meetup",
  },

  // 5. DISPUTED — buyer raised a dispute
  {
    id: "esc-005-disputed",
    listingId: "lst-201",
    listingTitle: "iPhone 13 Pro — 128GB Space Grey",
    listingImageUrl: "https://images.unsplash.com/photo-1632633173522-47456de71b68?w=200&q=80",
    listingCategory: "Electronics",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[4],
    currentUserId: "user-001",
    amountXRP: 85.0,
    platformFeeXRP: 1.70,
    totalXRP: 86.70,
    amountNaira: "≈ ₦139,230",
    escrowSequence: 156,
    xrplCreateTxHash: "F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8",
    state: "disputed",
    disputeReason: "Screen has visible scratches not shown in listing photos. Seller described condition as 'Like New' but it's clearly used with wear marks.",
    timeline: [
      { state: "created", timestamp: daysAgo(10), actorId: "user-001", xrplTxHash: "F8A9B0..." },
      { state: "active", timestamp: daysAgo(10), actorId: "user-006", note: "Seller confirmed" },
      { state: "item_sent", timestamp: daysAgo(8), actorId: "user-006", note: "Meetup at main gate" },
      { state: "testing", timestamp: daysAgo(7), actorId: "user-001", note: "Testing started" },
      { state: "disputed", timestamp: daysAgo(5), actorId: "user-001", note: "Item not as described" },
    ],
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
    meetupLocation: "UNILAG Main Gate",
    deliveryMethod: "meetup",
  },

  // 6. TESTING with LOW time remaining (urgency!)
  {
    id: "esc-006-urgent",
    listingId: "lst-310",
    listingTitle: "Sony WH-1000XM4 Headphones",
    listingImageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=200&q=80",
    listingCategory: "Electronics",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[0],
    currentUserId: "user-001",
    amountXRP: 35.0,
    platformFeeXRP: 0.70,
    totalXRP: 35.70,
    amountNaira: "≈ ₦57,330",
    escrowSequence: 178,
    xrplCreateTxHash: "A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1",
    escrowExpiry: daysFromNow(16),
    state: "testing",
    testingPeriod: {
      startedAt: daysAgo(12),
      expiresAt: daysFromNow(2),
      originalDurationDays: 14,
      extensionDays: 0,
      extensionApproved: false,
      authenticityVerified: false,
    },
    authenticity: {
      verified: false,
    },
    timeline: [
      { state: "created", timestamp: daysAgo(16), actorId: "user-001", xrplTxHash: "A1B2C3..." },
      { state: "active", timestamp: daysAgo(16), actorId: "user-002" },
      { state: "item_sent", timestamp: daysAgo(13), actorId: "user-002", note: "Delivered to hostel" },
      { state: "testing", timestamp: daysAgo(12), actorId: "user-001", note: "Testing started" },
    ],
    createdAt: daysAgo(16),
    updatedAt: daysAgo(12),
    deliveryMethod: "delivery",
    notes: "Delivered to Jaja Hall, Room 204",
  },

  // 7. CREATED — just created, awaiting seller (buyer perspective)
  {
    id: "esc-007-created",
    listingId: "lst-415",
    listingTitle: "HP Pavilion Laptop Charger — 65W USB-C",
    listingImageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&q=80",
    listingCategory: "Electronics",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[3],
    currentUserId: "user-001",
    amountXRP: 8.0,
    platformFeeXRP: 0.16,
    totalXRP: 8.16,
    amountNaira: "≈ ₦13,104",
    escrowSequence: 199,
    xrplCreateTxHash: "B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2",
    escrowExpiry: daysFromNow(30),
    state: "created",
    timeline: [
      { state: "created", timestamp: hoursAgo(3), actorId: "user-001", xrplTxHash: "B2C3D4...", note: "Payment locked in escrow" },
    ],
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
    meetupLocation: "Computer Science Dept, UNN",
    deliveryMethod: "meetup",
  },

  // 8. REFUNDED — dispute resolved in buyer's favour
  {
    id: "esc-008-refund",
    listingId: "lst-089",
    listingTitle: "Samsung Galaxy Buds Pro — White",
    listingImageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=200&q=80",
    listingCategory: "Electronics",
    buyer: MOCK_CURRENT_USER,
    seller: MOCK_PARTIES[4],
    currentUserId: "user-001",
    amountXRP: 20.0,
    platformFeeXRP: 0.40,
    totalXRP: 20.40,
    amountNaira: "≈ ₦32,760",
    state: "refunded",
    xrplCreateTxHash: "C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3",
    xrplCancelTxHash: "D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4",
    timeline: [
      { state: "created", timestamp: daysAgo(30), actorId: "user-001" },
      { state: "active", timestamp: daysAgo(30), actorId: "user-006" },
      { state: "item_sent", timestamp: daysAgo(28), actorId: "user-006" },
      { state: "disputed", timestamp: daysAgo(25), actorId: "user-001", note: "Left earbud not working" },
      { state: "refunded", timestamp: daysAgo(22), actorId: "system", note: "Dispute resolved — full refund issued", xrplTxHash: "D4E5F6..." },
    ],
    createdAt: daysAgo(30),
    updatedAt: daysAgo(22),
    deliveryMethod: "meetup",
    meetupLocation: "UNILAG Sports Centre",
    disputeReason: "Left earbud completely non-functional. Seller claimed both working.",
    disputeResolution: "Refund granted — item defective as buyer described.",
  },
];

// ─── Mock Service Implementation ──────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const MockEscrowService = {
  getTransaction: async (id: string): Promise<EscrowTransaction> => {
    await delay(400 + Math.random() * 300);
    const tx = MOCK_TRANSACTIONS.find((t) => t.id === id);
    if (!tx) throw new Error(`Transaction ${id} not found`);
    return { ...tx };
  },

  getUserTransactions: async (_userId: string): Promise<EscrowTransaction[]> => {
    await delay(500 + Math.random() * 400);
    return MOCK_TRANSACTIONS.map((t) => ({ ...t }));
  },

  confirmReceipt: async (_id: string, _fulfillment: string): Promise<void> => {
    await delay(800);
  },

  markItemSent: async (_id: string, _trackingNote?: string): Promise<void> => {
    await delay(600);
  },

  raiseDispute: async (_id: string, _reason: string): Promise<void> => {
    await delay(700);
  },

  cancelEscrow: async (_id: string): Promise<void> => {
    await delay(500);
  },

  verifyAuthenticity: async (_id: string, _notes?: string): Promise<void> => {
    await delay(600);
  },

  extendTesting: async (_id: string, _additionalDays: number): Promise<void> => {
    await delay(700);
  },
};
