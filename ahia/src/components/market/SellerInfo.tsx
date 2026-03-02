"use client";

import { Seller } from "@/src/types/listing";
import { FiStar, FiShield } from "react-icons/fi";

interface SellerInfoProps {
  seller: Seller;
}

function getTrustLabel(score: number): string {
  if (score >= 4.5) return "Highly Trusted";
  if (score >= 4.0) return "Trusted";
  if (score >= 3.0) return "Good";
  return "New Seller";
}

export default function SellerInfo({ seller }: SellerInfoProps) {
  const trustLabel = getTrustLabel(seller.trust_score);

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card">
      {/* Avatar */}
      <span className="flex items-center justify-center size-10 sm:size-12 rounded-full bg-primary/10 text-sm sm:text-base font-bold text-primary shrink-0">
        {seller.name.charAt(0)}
      </span>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-semibold text-card-foreground truncate">
          {seller.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <FiShield size={12} className="text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">{trustLabel}</span>
        </div>
      </div>

      {/* Trust score */}
      <div className="flex items-center gap-1 shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5">
        <FiStar size={14} className="text-primary" />
        <span className="text-sm font-bold text-primary">{seller.trust_score}</span>
      </div>
    </div>
  );
}
