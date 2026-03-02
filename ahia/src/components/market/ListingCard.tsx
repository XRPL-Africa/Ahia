"use client";

import { Listing } from "@/src/types/listing";
import { FiStar } from "react-icons/fi";

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });
}

export default function ListingCard({ listing, onClick }: ListingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(listing)}
      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full"
      aria-label={`View ${listing.title} - ${formatPrice(listing.price)}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={listing.images[0]}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-2 left-2 rounded-md bg-card/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-card-foreground">
          {listing.condition}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 sm:gap-1.5 p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-semibold text-card-foreground leading-tight line-clamp-2 font-serif">
          {listing.title}
        </h3>
        <p className="text-sm sm:text-base font-bold text-primary">
          {formatPrice(listing.price)}
        </p>

        {/* Seller row */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
          <span className="flex items-center justify-center size-4 sm:size-5 rounded-full bg-primary/10 text-[9px] sm:text-[10px] font-bold text-primary">
            {listing.seller.name.charAt(0)}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {listing.seller.name}
          </span>
          <span className="flex items-center gap-0.5 ml-auto shrink-0">
            <FiStar size={10} className="text-primary sm:hidden" />
            <FiStar size={12} className="text-primary hidden sm:block" />
            <span className="text-[10px] sm:text-xs font-medium text-card-foreground">
              {listing.seller.trust_score}
            </span>
          </span>
        </div>

        <span className="text-[10px] sm:text-[11px] text-muted-foreground">
          {timeAgo(listing.created_at)}
        </span>
      </div>
    </button>
  );
}
