"use client";
// src/components/escrow/TransactionCard.tsx
// Ahia — Transaction Card for Order List

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { EscrowTransaction } from "@/types/escrow";
import { STATE_CONFIG } from "@/types/escrow";

interface TransactionCardProps {
  transaction: EscrowTransaction;
  currentUserId: string;
  onClick: (txId: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Electronics: "💻",
  Books: "📚",
  Clothing: "👕",
  Furniture: "🪑",
  Services: "🔧",
  Food: "🍛",
  Accessories: "⌚",
  Stationery: "✏️",
};

function formatRelativeDate(date: Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 86400) return "Today";
  if (diff < 172800) return "Yesterday";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function TransactionCard({
  transaction: tx,
  currentUserId,
  onClick,
}: TransactionCardProps) {
  const cfg = STATE_CONFIG[tx.state];
  const isBuyer = tx.buyer.id === currentUserId;
  const counterparty = isBuyer ? tx.seller : tx.buyer;
  const roleText = isBuyer
    ? `Buying from ${counterparty.displayName}`
    : `Selling to ${counterparty.displayName}`;

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onClick(tx.id)}
      className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 text-left transition-shadow hover:shadow-md cursor-pointer group"
    >
      {/* Thumbnail / Fallback */}
      {tx.listingImageUrl ? (
        <img
          src={tx.listingImageUrl}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
          {CATEGORY_EMOJI[tx.listingCategory || ""] || "📦"}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">
          {tx.listingTitle}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{roleText}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-sm font-bold text-blue-700">
            {tx.totalXRP} XRP
          </span>
        </div>
      </div>

      {/* Date + Chevron */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[11px] text-gray-400">
          {formatRelativeDate(tx.updatedAt)}
        </span>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-gray-500 transition-colors"
        />
      </div>
    </motion.button>
  );
}
