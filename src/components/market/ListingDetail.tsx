"use client";

import { useState, useEffect, useCallback } from "react";
import { FiArrowLeft, FiMessageCircle, FiDollarSign, FiClock, FiTag } from "react-icons/fi";
import { Listing } from "@/types/listing";
import { fetchListingById, fetchListings } from "@/services/listing.service";
import ImageCarousel from "./ImageCarousel";
import SellerInfo from "./SellerInfo";
import ListingCard from "./ListingCard";
import ListingSkeleton from "./ListingSkeleton";

interface ListingDetailProps {
  listingId: string;
  onBack: () => void;
  onNavigate: (listing: Listing) => void;
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

export default function ListingDetail({ listingId, onBack, onNavigate }: ListingDetailProps) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListingById(listingId);
      if (!data) {
        setError("Listing not found.");
        return;
      }
      setListing(data);

      // Fetch similar listings (same category, exclude current)
      const res = await fetchListings({
        campus_id: data.campus_id,
        category: data.category,
      });
      setSimilar(res.listings.filter((l) => l.id !== data.id).slice(0, 4));
    } catch {
      setError("Failed to load listing.");
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-card border-b border-border">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center justify-center size-9 rounded-full bg-secondary hover:bg-accent transition-colors"
          >
            <FiArrowLeft size={18} className="text-secondary-foreground" />
          </button>
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </header>
        <div className="mx-auto w-full max-w-3xl">
          <div className="aspect-square bg-muted animate-pulse" />
          <div className="p-4 flex flex-col gap-3">
            <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-20 w-full rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-card border-b border-border">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center justify-center size-9 rounded-full bg-secondary hover:bg-accent transition-colors"
          >
            <FiArrowLeft size={18} className="text-secondary-foreground" />
          </button>
          <span className="text-sm font-medium text-card-foreground">Back</span>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">{error || "Listing not found."}</p>
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-primary hover:underline"
            >
              Return to marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 sm:px-6 py-3 bg-card border-b border-border">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center justify-center size-9 rounded-full bg-secondary hover:bg-accent transition-colors"
        >
          <FiArrowLeft size={18} className="text-secondary-foreground" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-card-foreground truncate font-serif">
          {listing.title}
        </h1>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl">
          {/* Image Carousel */}
          <ImageCarousel images={listing.images} alt={listing.title} />

          {/* Listing details */}
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            {/* Price and condition */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {formatPrice(listing.price)}
                </p>
                <h2 className="text-base sm:text-lg font-semibold text-foreground mt-1 leading-tight font-serif">
                  {listing.title}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${
                  listing.condition === "New"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {listing.condition}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FiTag size={13} />
                {listing.category}
              </span>
              <span className="flex items-center gap-1">
                <FiClock size={13} />
                {timeAgo(listing.created_at)}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Description</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </div>

            {/* Seller info */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Seller</h3>
              <SellerInfo seller={listing.seller} />
            </div>

            {/* Similar listings */}
            {similar.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Similar Listings</h3>
                <div className="grid grid-cols-2 gap-3">
                  {similar.map((item) => (
                    <ListingCard key={item.id} listing={item} onClick={onNavigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom spacer for sticky footer */}
            <div className="h-20" />
          </div>
        </div>
      </div>

      {/* Sticky action buttons */}
      <div className="sticky bottom-0 bg-card border-t border-border p-4 sm:px-6">
        <div className="mx-auto w-full max-w-3xl flex items-center gap-3">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 h-11 sm:h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
          >
            <FiDollarSign size={18} />
            Make Offer
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-border bg-card text-card-foreground font-semibold text-sm sm:text-base hover:bg-accent transition-colors"
          >
            <FiMessageCircle size={18} />
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}
